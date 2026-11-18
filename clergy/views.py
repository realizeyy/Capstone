from datetime import date
import urllib.parse

from django.contrib import messages
from django.core.paginator import Paginator
from django.http import HttpResponse, JsonResponse
from django.db import transaction
from django.shortcuts import get_object_or_404, redirect, render
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils import timezone

from accounts.views import security_context
from registrar.forms import ClergyDeploymentForm, DocumentUploadForm, ProfilePictureForm, first_error
from registrar.models import ClergyDeployment, delete_profile_picture, save_document, save_profile_picture
from registrar.views import build_ember_context, handle_ember_upload, _build_deaneries_map

from .decorators import clergy_required
from .forms import ClergyProfileForm, ClergyRecordSelfServiceForm
from .models import ClergyProfile, Notification, ClergyChild, ClergyEducation
from .notifications import (ago, attention, document_uploaded, mark_all_read, mark_read, profile_updated,
                            sync_reminders)


def _get_or_create_profile(user):
    profile, _ = ClergyProfile.objects.get_or_create(user=user)
    return profile


def _build_portal_search_catalog(profile, user):
    """Compile a cross-portal search catalog for the Clergy Dashboard.
    Enables instant jumping to document requirements, profile sections,
    notifications, and self-service actions with zero latency."""
    catalog = []
    record = profile.record if profile else None

    # 1. Documents & Requirements Checklist
    if record:
        try:
            checklist = record.document_checklist()
            for item in checklist:
                doc_type = item.get('document_type')
                if not doc_type:
                    continue
                doc_name = doc_type.name
                status = item.get('status', 'Not Uploaded')
                badge_class = 'green' if status == 'Submitted' else ('blue' if status == 'Not Uploaded' else 'red')

                stage_name = 'Document Requirement'
                req_rank = getattr(doc_type, 'required_from_rank', '')
                if req_rank == 'postulancy':
                    stage_name = 'Postulancy Formation'
                elif req_rank == 'deacon':
                    stage_name = 'Diaconate Ordination'
                elif req_rank == 'priest':
                    stage_name = 'Priesthood Ordination'
                elif req_rank == 'vital':
                    stage_name = 'Vital & Canonical Records'
                elif getattr(doc_type, 'uploaded_by', '') == 'registrar':
                    stage_name = 'Official Diocesan Filings'

                catalog.append({
                    'category': 'Requirements & Documents',
                    'icon': 'fa-solid fa-file-lines',
                    'title': doc_name,
                    'subtitle': f'{stage_name} : Document requirement ({status})',
                    'badge': status,
                    'badge_class': badge_class,
                    'keywords': f'{doc_name} {stage_name} {status} checklist requirement document upload file attachment'.lower(),
                    'url': reverse('clergy:my_requirements') + '?q=' + urllib.parse.quote(doc_name),
                })
        except Exception:
            pass

    # 2. Ember Letters
    catalog.append({
        'category': 'Requirements & Documents',
        'icon': 'fa-solid fa-envelope-open-text',
        'title': 'Ember Letters',
        'subtitle': 'Quarterly canonical reflection letters to the Bishop (Spring, Summer, Fall, Winter)',
        'badge': 'Letters',
        'badge_class': 'blue',
        'keywords': 'ember letters quarterly reflection bishop pastoral spring summer fall winter ember week'.lower(),
        'url': reverse('clergy:my_requirements') + '?tab=ember',
    })

    # 3. Profile Information Sections
    full_name = profile.full_name if profile else (user.get_full_name() or user.username)
    rank_disp = record.get_rank_display() if (record and hasattr(record, 'get_rank_display')) else 'Clergy'
    assignment = record.assignment if (record and record.assignment) else 'Not assigned'

    catalog.append({
        'category': 'Profile & Information',
        'icon': 'fa-solid fa-id-card',
        'title': 'Personal Information & Identity',
        'subtitle': f'{full_name} : Civil status, date of birth, contact details, residence',
        'badge': 'Biodata',
        'badge_class': 'slate',
        'keywords': f'personal information identity biodata name birth date place address contact residence civil status gender {full_name}'.lower(),
        'url': reverse('clergy:my_profile') + '?q=identity#sec-identity',
    })

    catalog.append({
        'category': 'Profile & Information',
        'icon': 'fa-solid fa-cross',
        'title': 'Holy Orders & Sacraments',
        'subtitle': f'Baptism, Confirmation, Diaconate & Priesthood ordinations ({rank_disp})',
        'badge': 'Sacraments',
        'badge_class': 'slate',
        'keywords': f'sacraments holy orders baptism confirmation deacon priest ordination ordaining bishop church parish {rank_disp}'.lower(),
        'url': reverse('clergy:my_profile') + '?q=sacraments#sec-sacraments',
    })

    spouse_desc = f'Spouse: {profile.spouse_name}' if (profile and profile.spouse_name) else 'Spouse and children records'
    catalog.append({
        'category': 'Profile & Information',
        'icon': 'fa-solid fa-people-roof',
        'title': 'Marriage & Family Record',
        'subtitle': spouse_desc,
        'badge': 'Family',
        'badge_class': 'slate',
        'keywords': f'marriage family spouse children dependents wedding civil status {profile.spouse_name if profile and profile.spouse_name else ""}'.lower(),
        'url': reverse('clergy:my_profile') + '?q=family#marriageFamilyCard',
    })

    if profile:
        try:
            for child in profile.children.all():
                if child.name:
                    catalog.append({
                        'category': 'Profile & Information',
                        'icon': 'fa-solid fa-child',
                        'title': f'Child: {child.name}',
                        'subtitle': f'Family Record (Born: {child.birth_date or "on file"})',
                        'badge': 'Dependent',
                        'badge_class': 'slate',
                        'keywords': f'child dependent family {child.name}'.lower(),
                        'url': reverse('clergy:my_profile') + '?q=family#marriageFamilyCard',
                    })
        except Exception:
            pass

    edu_count = profile.educations.count() if profile else 0
    edu_desc = f'{edu_count} academic degree(s) and seminary training on file' if edu_count > 0 else 'Seminary and academic degree records'
    catalog.append({
        'category': 'Profile & Information',
        'icon': 'fa-solid fa-user-graduate',
        'title': 'Educational Background',
        'subtitle': edu_desc,
        'badge': 'Education',
        'badge_class': 'slate',
        'keywords': 'education degree seminary college university bachelor master theology study graduation school'.lower(),
        'url': reverse('clergy:my_profile') + '?q=education#sec-education',
    })

    if profile:
        try:
            for edu in profile.educations.all():
                if edu.degree or edu.institution:
                    title_str = f'{edu.degree or "Degree"} : {edu.institution or "Institution"}'
                    catalog.append({
                        'category': 'Profile & Information',
                        'icon': 'fa-solid fa-graduation-cap',
                        'title': title_str,
                        'subtitle': f'Academic Record ({edu.year_graduated or "Completed"})',
                        'badge': 'Degree',
                        'badge_class': 'slate',
                        'keywords': f'education degree school seminary {edu.degree} {edu.institution} {edu.year_graduated}'.lower(),
                        'url': reverse('clergy:my_profile') + '?q=' + urllib.parse.quote(edu.degree or edu.institution or 'education') + '#sec-education',
                    })
        except Exception:
            pass

    catalog.append({
        'category': 'Profile & Information',
        'icon': 'fa-solid fa-church',
        'title': 'Deployments & Ministry Assignments',
        'subtitle': f'Current assignment: {assignment}',
        'badge': 'Deployments',
        'badge_class': 'slate',
        'keywords': f'deployment ministry assignment parish transfer appointment rector vicar priest {assignment}'.lower(),
        'url': reverse('clergy:my_profile') + '?q=deployment#sec-deployments',
    })

    if record:
        try:
            for dep in record.deployments.all():
                if dep.station_name:
                    catalog.append({
                        'category': 'Profile & Information',
                        'icon': 'fa-solid fa-church',
                        'title': f'{dep.role or "Clergy Assignment"} : {dep.station_name}',
                        'subtitle': f'Deployment Record ({dep.start_date or "Assigned"})',
                        'badge': 'Parish',
                        'badge_class': 'slate',
                        'keywords': f'{dep.role} {dep.station_name} deployment assignment parish {dep.place_name or ""}'.lower(),
                        'url': reverse('clergy:my_profile') + '?q=' + urllib.parse.quote(dep.station_name) + '#sec-deployments',
                    })
        except Exception:
            pass

    catalog.append({
        'category': 'Profile & Information',
        'icon': 'fa-solid fa-address-card',
        'title': 'Government IDs & Tax Numbers',
        'subtitle': 'TIN, SSS, PhilHealth, Pag-IBIG identification numbers',
        'badge': 'Gov IDs',
        'badge_class': 'slate',
        'keywords': 'government ids tax numbers tin sss philhealth pagibig pag-ibig registration'.lower(),
        'url': reverse('clergy:my_profile') + '?q=government#sec-government',
    })

    catalog.append({
        'category': 'Profile & Information',
        'icon': 'fa-solid fa-shield-halved',
        'title': 'Account Security & Password',
        'subtitle': 'Change password, verified mobile phone number, trusted devices & sessions',
        'badge': 'Security',
        'badge_class': 'slate',
        'keywords': 'security password change pin phone mobile sms devices session login credentials'.lower(),
        'url': reverse('clergy:my_profile') + '?tab=security',
    })

    # 4. Notifications & Alerts
    catalog.append({
        'category': 'Notifications & Alerts',
        'icon': 'fa-solid fa-bell',
        'title': 'Notifications & Reminders',
        'subtitle': 'System alerts, expiry reminders, and account activity log',
        'badge': 'Activity',
        'badge_class': 'blue',
        'keywords': 'notifications activity reminders alerts deadlines expiry sign-in unread'.lower(),
        'url': reverse('clergy:notifications'),
    })

    # 5. Quick Actions & Self-Service
    catalog.append({
        'category': 'Quick Actions',
        'icon': 'fa-solid fa-print',
        'title': 'Print Own Records',
        'subtitle': 'Generate and download an official clergy summary sheet (PDF)',
        'badge': 'PDF Print',
        'badge_class': 'blue',
        'keywords': 'print record pdf summary official sheet download export'.lower(),
        'url': reverse('clergy:print_own_record'),
    })

    return catalog


@clergy_required
def dashboard(request):
    profile = _get_or_create_profile(request.user)
    if profile.record:
        profile.record.record_expired_contract()
    sync_reminders(request.user, profile.record)   # every sign-in lands here
    days_left = None
    if profile.record and profile.record.contract_end:
        days_left = (profile.record.contract_end - date.today()).days

    # Only show the welcome onboarding banner during the first 14 days of account activation
    show_welcome = False
    try:
        activated_at = None
        if hasattr(request.user, 'security') and request.user.security and request.user.security.activated_at:
            activated_at = request.user.security.activated_at
        elif request.user.date_joined:
            activated_at = request.user.date_joined
        if activated_at:
            account_age_days = (timezone.now() - activated_at).days
            show_welcome = (account_age_days <= 14)
    except Exception:
        show_welcome = False

    portal_catalog = _build_portal_search_catalog(profile, request.user)

    return render(request, 'clergy/dashboard.html', {
        'active_page': 'dashboard',
        'profile': profile,
        'days_left': days_left,
        'show_welcome': show_welcome,
        'portal_catalog': portal_catalog,
    })


MEDICAL_PSYCH_DOCUMENT_NAMES = (
    'Medical Exam Result',
    'Psychiatric Evaluation Result',
    'Medical Exam Result (Priest)',
    'Psychiatric Evaluation Result (Priest)',
)


@clergy_required
def my_profile(request):
    """My Record & Profile :  one merged page: the Registrar-controlled
    Clergy Record + Ordination history (view-only here, edited from the
    Registrar's record-detail page), alongside the clergy-editable Personal
    Information, Marriage/Family, Government ID and Account sections."""
    profile = _get_or_create_profile(request.user)

    if not profile.record:
        messages.error(request, 'Your account is not yet linked to an official clergy record :  ask the Registrar to link one before editing your profile.')
        return redirect('clergy:dashboard')

    profile.record.record_expired_contract()
    days_left = None
    if profile.record.contract_end:
        days_left = (profile.record.contract_end - date.today()).days

    medical_psych = [
        c for c in profile.record.document_checklist()
        if c['document_type'].name in MEDICAL_PSYCH_DOCUMENT_NAMES
    ]

    # Username, password, mobile number and trusted devices are on the Security
    # tab; their actions live in accounts.views.my_security.
    active_tab = 'security' if request.GET.get('tab') == 'security' else 'personal'

    # Backfill legacy children string into structured ClergyChild records if needed
    if profile.children_names and profile.children.count() == 0:
        for raw_name in profile.children_names.split(','):
            clean_name = raw_name.strip()
            if clean_name:
                ClergyChild.objects.create(profile=profile, name=clean_name)

    is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'

    if request.method == 'POST' and request.POST.get('action') == 'add_deployment':
        dep_form = ClergyDeploymentForm(request.POST)
        if dep_form.is_valid():
            dep = dep_form.save(commit=False)
            dep.record = profile.record
            if dep.is_current:
                dep.end_date = None
                profile.record.deployments.filter(is_current=True).update(is_current=False)
            dep.save()
            msg = f'Deployment at {dep.station_name} added successfully.'
            if is_ajax:
                return JsonResponse({'ok': True, 'message': msg})
            messages.success(request, msg)
        else:
            err = first_error(dep_form) or 'Please check the deployment details and try again.'
            if is_ajax:
                return JsonResponse({'ok': False, 'error': err, 'errors': dep_form.errors}, status=400)
            messages.error(request, err)
        return redirect('clergy:my_profile')

    if request.method == 'POST' and request.POST.get('action') == 'delete_deployment':
        dep_id = request.POST.get('deployment_id')
        get_object_or_404(ClergyDeployment, id=dep_id, record=profile.record).delete()
        messages.success(request, 'Deployment removed.')
        return redirect('clergy:my_profile')

    if request.method == 'POST' and request.POST.get('action') == 'upload_attachment':
        form = DocumentUploadForm(request.POST, request.FILES)
        if form.is_valid() and form.cleaned_data['document_type'].is_noted_only:
            err = 'That requirement does not accept document uploads :  it is noted directly by the Registrar.'
            if is_ajax:
                return JsonResponse({'ok': False, 'error': err}, status=400)
            messages.error(request, err)
        elif form.is_valid() and form.cleaned_data['document_type'].uploaded_by == 'registrar':
            err = 'That document is provided by the Registrar :  you cannot upload it yourself.'
            if is_ajax:
                return JsonResponse({'ok': False, 'error': err}, status=400)
            messages.error(request, err)
        elif form.is_valid():
            document = save_document(
                profile.record,
                form.cleaned_data['document_type'],
                form.cleaned_data['file'],
                form.cleaned_data.get('notes', ''),
            )
            document_uploaded(document)
            msg = f"{form.cleaned_data['document_type'].name} uploaded successfully."
            if is_ajax:
                return JsonResponse({
                    'ok': True,
                    'document_id': document.id,
                    'document_type_id': document.document_type_id,
                    'document_name': document.document_type.name,
                    'view_url': reverse('registrar:view_document', args=[document.id]),
                    'download_url': reverse('registrar:download_document', args=[document.id]),
                    'submitted_date': str(document.submitted_date),
                    'notes': document.notes or '',
                    'message': msg,
                })
            messages.success(request, msg)
        else:
            err = first_error(form) or 'Please choose a valid document file (PDF, PNG, JPG).'
            if is_ajax:
                return JsonResponse({'ok': False, 'error': err}, status=400)
            messages.error(request, err)
        return redirect('clergy:my_profile')

    if request.method == 'POST' and 'remove_profile_picture' in request.POST:
        if profile.record.profile_picture:
            delete_profile_picture(profile.record)
            if is_ajax:
                return JsonResponse({'ok': True, 'removed': True, 'initials': profile.initials, 'message': 'Profile picture removed.'})
            messages.success(request, 'Profile picture removed.')
        elif is_ajax:
            return JsonResponse({'ok': True, 'removed': True, 'initials': profile.initials, 'message': 'Profile picture removed.'})
        return redirect('clergy:my_profile')

    if request.method == 'POST' and 'upload_profile_picture' in request.POST:
        pic_form = ProfilePictureForm(request.POST, request.FILES)
        if pic_form.is_valid():
            save_profile_picture(profile.record, pic_form.cleaned_data['profile_picture'])
            if is_ajax:
                return JsonResponse({
                    'ok': True,
                    'picture_url': f"{reverse('registrar:view_profile_picture', args=[profile.record.id])}?t={int(timezone.now().timestamp())}",
                    'message': 'Profile picture updated successfully.',
                })
            messages.success(request, 'Profile picture updated successfully.')
        else:
            err = first_error(pic_form) or 'Please choose a JPG or PNG image.'
            if is_ajax:
                return JsonResponse({'ok': False, 'error': err}, status=400)
            messages.error(request, err)
        return redirect('clergy:my_profile')

    if request.method == 'POST':
        form = ClergyProfileForm(request.POST, instance=profile)
        record_form = ClergyRecordSelfServiceForm(request.POST, instance=profile.record)
        pic_form = ProfilePictureForm(request.POST, request.FILES) if 'profile_picture' in request.FILES else None
        if pic_form is not None and not pic_form.is_valid():
            err = first_error(pic_form) or 'Please choose a valid JPG or PNG image.'
            if is_ajax:
                return JsonResponse({'ok': False, 'error': err}, status=400)
            messages.error(request, err)
        elif form.is_valid() and record_form.is_valid():
            with transaction.atomic():
                saved_profile = form.save()
                record_form.save()

                # Process Children list (only applicable if Married or Widowed)
                if saved_profile.civil_status == 'Single':
                    saved_profile.children.all().delete()
                    if saved_profile.children_names:
                        saved_profile.children_names = ''
                        saved_profile.save(update_fields=['children_names'])
                elif 'child_name' in request.POST:
                    profile.children.all().delete()
                    child_names = request.POST.getlist('child_name')
                    child_dobs = request.POST.getlist('child_dob')
                    child_genders = request.POST.getlist('child_gender')
                    new_children = []
                    for c_name, c_dob, c_gender in zip(child_names, child_dobs, child_genders):
                        c_name = c_name.strip()
                        if c_name:
                            b_date = None
                            if c_dob:
                                try:
                                    parsed_date = date.fromisoformat(c_dob)
                                    if parsed_date <= date.today():
                                        b_date = parsed_date
                                except ValueError:
                                    pass
                            new_children.append(ClergyChild(
                                profile=profile,
                                name=c_name,
                                birth_date=b_date,
                                gender=c_gender or ''
                            ))
                    if new_children:
                        ClergyChild.objects.bulk_create(new_children)
                    profile.children_names = ", ".join(c.name for c in new_children)
                    profile.save(update_fields=['children_names'])

                # Process Education list
                if 'edu_degree' in request.POST or 'edu_institution' in request.POST:
                    profile.educations.all().delete()
                    edu_degrees = request.POST.getlist('edu_degree')
                    edu_institutions = request.POST.getlist('edu_institution')
                    edu_places = request.POST.getlist('edu_place')
                    edu_years = request.POST.getlist('edu_year')
                    new_edus = []
                    current_year = date.today().year
                    for deg, inst, plc, yr in zip(edu_degrees, edu_institutions, edu_places, edu_years):
                        deg = deg.strip()
                        inst = inst.strip()
                        plc = plc.strip()
                        grad_yr = int(yr.strip()) if yr and yr.strip().isdigit() else None
                        if grad_yr and (grad_yr < 1900 or grad_yr > current_year + 10):
                            grad_yr = None
                        if deg or inst:
                            new_edus.append(ClergyEducation(
                                profile=profile,
                                degree=deg or 'Degree',
                                institution=inst,
                                place=plc,
                                year_graduated=grad_yr
                            ))
                    if new_edus:
                        ClergyEducation.objects.bulk_create(new_edus)

                if pic_form is not None:
                    save_profile_picture(profile.record, pic_form.cleaned_data['profile_picture'])
                profile_updated(request.user, (record_form, form))
            if is_ajax:
                return JsonResponse({'ok': True, 'message': 'Changes saved successfully.'})
            messages.success(request, 'Profile updated successfully.')
            return redirect('clergy:my_profile')
        else:
            err = first_error(record_form) or first_error(form) or 'Please check the form and try again.'
            if is_ajax:
                combined_errors = {**record_form.errors, **form.errors}
                return JsonResponse({'ok': False, 'error': err, 'errors': combined_errors}, status=400)
            messages.error(request, err)
    else:
        form = ClergyProfileForm(instance=profile)
        record_form = ClergyRecordSelfServiceForm(instance=profile.record)

    context = {
        'active_page': 'my_profile',
        'active_tab': active_tab,
        'profile': profile,
        'form': form,
        'record_form': record_form,
        'days_left': days_left,
        'medical_psych': medical_psych,
        'deaneries_map': _build_deaneries_map(),
    }
    if active_tab == 'security':
        context.update(security_context(request))
    return render(request, 'clergy/my-profile.html', context)


def _include_attachments_from_request(request):
    """Parse the print-scope query parameter; defaults to including attachment status."""
    raw = (request.GET.get('include_attachments') or '').strip().lower()
    return raw not in ('0', 'false', 'no', 'off')


def _build_print_record_context(profile, include_attachments, *, include_urls=False):
    """Build template context shared by the printable preview and WeasyPrint PDF export."""
    context = {
        'profile': profile,
        'include_attachments': include_attachments,
        'generated_at': timezone.now(),
    }
    if include_attachments:
        checklist_grouped = profile.record.document_checklist_grouped()
        doc_summary = profile.record.document_summary()
        total_reqs = doc_summary.get('total', 0)
        submitted_reqs = doc_summary.get('submitted', 0)
        percent_complete = round((submitted_reqs / total_reqs * 100)) if total_reqs else 0
        context.update({
            'checklist': profile.record.document_checklist(),
            'checklist_grouped': checklist_grouped,
            'doc_summary': doc_summary,
            'percent_complete': percent_complete,
        })
    if include_urls:
        base_download_url = reverse('clergy:download_own_record')
        base_print_url = reverse('clergy:print_own_record')
        context.update({
            'download_url': base_download_url if include_attachments else f'{base_download_url}?include_attachments=0',
            'download_base_url': base_download_url,
            'include_attachments_url': base_print_url,
            'personal_only_url': f'{base_print_url}?include_attachments=0',
        })
    return context


@clergy_required
def print_own_record(request):
    """A letterhead-style printable copy of the clergy member's own record: 
    opened in a new tab, with its own Print button and a Download PDF link.
    Deliberately not persisted anywhere (unlike the Registrar's Generate
    Report history); it's a point-in-time personal copy, not an official
    archived document."""
    profile = _get_or_create_profile(request.user)
    if not profile.record:
        messages.error(request, 'Your account is not yet linked to an official clergy record: ask the Registrar to link one first.')
        return redirect('clergy:dashboard')
    profile.record.record_expired_contract()

    include_attachments = _include_attachments_from_request(request)
    return render(
        request,
        'clergy/print-record.html',
        _build_print_record_context(profile, include_attachments, include_urls=True),
    )


@clergy_required
def download_own_record(request):
    """Same template as print_own_record, rendered to a real PDF via
    WeasyPrint instead of the browser's print dialog: generated fresh on
    every request, not persisted, same point-in-time-copy philosophy."""
    profile = _get_or_create_profile(request.user)
    if not profile.record:
        messages.error(request, 'Your account is not yet linked to an official clergy record: ask the Registrar to link one first.')
        return redirect('clergy:dashboard')

    from ednp.pdf import PdfGenerationError, html_to_pdf

    include_attachments = _include_attachments_from_request(request)
    html = render_to_string(
        'clergy/print-record.html',
        _build_print_record_context(profile, include_attachments),
    )
    try:
        pdf_bytes = html_to_pdf(html)
    except PdfGenerationError as exc:
        messages.error(request, str(exc))
        return redirect('clergy:my_profile')
    base_id = profile.record.id or request.user.username
    suffix = '' if include_attachments else '_personal'
    filename = f"clergy_record_{base_id}{suffix}.pdf"
    response = HttpResponse(pdf_bytes, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


NOTIFICATION_TABS = [('all', 'All'), ('security', 'Security'), ('record', 'Record'), ('documents', 'Documents')]
NOTIFICATIONS_PER_PAGE = 20


@clergy_required
def notifications(request):
    """What needs attention right now (worked out fresh each time) above everything that
    has happened to the account and record (stored as it happened), newest first. Opening
    a page of notifications marks those as read; the ones that were new say so this once."""
    if request.method == 'POST':
        if request.POST.get('action') == 'mark_all_read':
            mark_all_read(request.user)
        return redirect('clergy:notifications')

    profile = _get_or_create_profile(request.user)
    sync_reminders(request.user, profile.record)

    tab = request.GET.get('tab')
    if tab not in dict(NOTIFICATION_TABS):
        tab = 'all'
    entries = Notification.objects.filter(user=request.user)
    if tab != 'all':
        entries = entries.filter(kind__in=Notification.kinds_under(tab))
    page = Paginator(entries, NOTIFICATIONS_PER_PAGE).get_page(request.GET.get('page'))

    links = {
        'security': (reverse('clergy:my_profile') + '?tab=security', 'Security settings'),
        'record': (reverse('clergy:my_profile'), 'My record'),
        'documents': (reverse('clergy:my_requirements'), 'My requirements'),
    }
    now = timezone.now()
    items = list(page.object_list)
    for item in items:
        item.is_new = item.read_at is None
        item.ago = ago(item.created_at, now)
        item.link, item.link_text = links[item.tab]
    mark_read(items)

    return render(request, 'clergy/notifications.html', {
        'active_page': 'notifications',
        'profile': profile,
        'attention': attention(profile.record),
        'tabs': NOTIFICATION_TABS,
        'tab': tab,
        'items': items,
        'page': page,
    })


@clergy_required
def my_requirements(request):
    profile = _get_or_create_profile(request.user)

    if not profile.record:
        messages.error(request, 'Your account is not yet linked to an official clergy record :  ask the Registrar to link one before uploading documents.')
        return redirect('clergy:dashboard')

    is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest'

    if request.method == 'POST':
        form = DocumentUploadForm(request.POST, request.FILES)
        if form.is_valid() and form.cleaned_data['document_type'].is_noted_only:
            err = 'That requirement does not accept document uploads :  it is noted directly by the Registrar.'
            if is_ajax:
                return JsonResponse({'ok': False, 'error': err}, status=400)
            messages.error(request, err)
        elif form.is_valid() and form.cleaned_data['document_type'].uploaded_by == 'registrar':
            err = 'That document is provided by the Registrar :  you cannot upload it yourself.'
            if is_ajax:
                return JsonResponse({'ok': False, 'error': err}, status=400)
            messages.error(request, err)
        elif form.is_valid():
            document = save_document(
                profile.record,
                form.cleaned_data['document_type'],
                form.cleaned_data['file'],
                form.cleaned_data['notes'],
            )
            document_uploaded(document)
            msg = f"{form.cleaned_data['document_type'].name} uploaded successfully."
            if is_ajax:
                summary = profile.record.document_summary()
                return JsonResponse({
                    'ok': True,
                    'document_id': document.id,
                    'document_type_id': document.document_type_id,
                    'document_name': document.document_type.name,
                    'view_url': reverse('registrar:view_document', args=[document.id]),
                    'download_url': reverse('registrar:download_document', args=[document.id]),
                    'submitted_date': document.submitted_date.strftime('%b %d, %Y') if hasattr(document.submitted_date, 'strftime') else str(document.submitted_date),
                    'notes': document.notes or '',
                    'summary_submitted': summary['submitted'],
                    'summary_total': summary['total'],
                    'message': msg,
                })
            messages.success(request, msg)
            return redirect('clergy:my_requirements')
        else:
            err = first_error(form) or 'Please choose a document type and a file.'
            if is_ajax:
                return JsonResponse({'ok': False, 'error': err}, status=400)
            messages.error(request, err)

    ember_upload_url = reverse('clergy:upload_ember_letter')
    return render(request, 'clergy/my-requirements.html', {
        'active_page': 'my_requirements',
        'profile': profile,
        'checklist': profile.record.document_checklist_grouped(),
        'active_tab': request.GET.get('tab', 'checklist') if request.GET.get('tab') in ('checklist', 'ember') else 'checklist',
        **build_ember_context(profile.record, ember_upload_url),
    })


@clergy_required
def upload_ember_letter(request):
    profile = _get_or_create_profile(request.user)
    if not profile.record:
        return JsonResponse({
            'ok': False,
            'error': 'Your account is not yet linked to an official clergy record.',
        }, status=400)
    return handle_ember_upload(request, profile.record)
