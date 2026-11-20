"""Report data-building and PDF rendering for the registrar's Generate Report page.

Every report is normalized into the same shape (a title plus a list of
sections, each with its own columns/rows, plus summary KPIs) so the HTML
preview and the PDF export walk the same structure instead of maintaining
separate per-report templates.
"""

from datetime import date

from django.utils import timezone
from django.utils.html import escape
from django.utils.safestring import mark_safe

from .models import ClergyRecord, DocumentType, Parish

REPORT_TYPES = {
    'clerical_directory': 'Clerical Directory',
    'status_report': 'Status Report',
    'per_deanery': 'Per-Deanery Report',
    'ordination_documents': 'Ordination Documents Report (Registrar)',
}

REPORT_SUBTITLES = {
    'clerical_directory': 'Comprehensive Diocesan Clergy Directory & Service Dossier',
    'status_report': 'Ministry Status, Leave Tracking & Active Station Roster',
    'per_deanery': 'Clergy Distribution Grouped by Ecclesiastical Deanery',
    'ordination_documents': 'Canonical Ordination & Registry Document Filing Audit',
}

# Baseline WeasyPrint render profiles (base seconds, seconds per clergy record,
# minimum seconds) calibrated against the diocesan dataset so the Generate Report
# countdown starts close to reality before per-browser self-calibration takes over.
REPORT_DURATION_ESTIMATE_PROFILE = {
    'clerical_directory': (3.0, 0.115, 6),
    'ordination_documents': (3.0, 0.125, 6),
    'status_report': (2.5, 0.025, 4),
    'per_deanery': (2.5, 0.022, 4),
}


def estimate_generation_seconds(report_type, clergy_count):
    """Estimate PDF generation duration in whole seconds for a report type."""
    base, per_record, min_seconds = REPORT_DURATION_ESTIMATE_PROFILE.get(
        report_type, (3.0, 0.05, 5)
    )
    count = max(0, int(clergy_count or 0))
    estimated = round(base + count * per_record)
    return max(min_seconds, min(300, estimated))


def estimate_all_generation_seconds(clergy_count):
    """Return a mapping of every report_type to its estimated duration in seconds."""
    return {
        report_type: estimate_generation_seconds(report_type, clergy_count)
        for report_type in REPORT_TYPES
    }

UNASSIGNED_DEANERY_LABEL = 'Unassigned / Not Matched to a Parish'


def _assignment_to_deanery_map():
    """Fallback for older records where `deanery` FK wasn't set yet: maps the
    parish dropdown label ('St. Peter - Alab') back to its deanery name."""
    mapping = {}
    for parish in Parish.objects.select_related('deanery'):
        label = f"{parish.parish_name} - {parish.place_name}" if parish.place_name else parish.parish_name
        mapping[label] = parish.deanery.name
    return mapping


def _fmt_date(value):
    return value.strftime('%b %d, %Y') if value else '—'


def _sync_loaded_records(records, today=None):
    """Lazily transition any loaded records whose retirement_date or contract_end has passed,
    adding zero extra queries when every record is already up to date."""
    today = today or date.today()
    for r in records:
        if r.status != 'Retired' and r.retirement_date and r.retirement_date <= today:
            r.sync_retirement_status(today=today)
            if hasattr(r, '_prefetched_objects_cache'):
                r._prefetched_objects_cache.pop('deployments', None)
        elif (
            r.status != 'Retired'
            and not r.is_archived
            and r.contract_end
            and r.contract_end < today
            and (r.assignment or '').strip()
        ):
            if r.record_expired_contract(today=today) and hasattr(r, '_prefetched_objects_cache'):
                r._prefetched_objects_cache.pop('deployments', None)


def _build_clerical_directory():
    records = list(
        ClergyRecord.objects.exclude(rank='postulancy')
        .select_related('profile', 'deanery')
        .prefetch_related('deployments', 'profile__children', 'profile__educations')
        .order_by('name')
    )
    _sync_loaded_records(records)
    entries = []
    columns = ['No.', 'Name', 'Deployment / Assignment', 'Date of Ordination', 'Status']
    rows = []
    rank_counts = {'bishop': 0, 'priest': 0, 'deacon': 0}
    active_count = 0

    for i, r in enumerate(records, start=1):
        if r.rank in rank_counts:
            rank_counts[r.rank] += 1
        if r.status == 'Active':
            active_count += 1

        profile = getattr(r, 'profile', None)

        # DOB: Date of birth + place
        dob_parts = []
        if r.date_of_birth:
            dob_parts.append(r.date_of_birth.strftime('%b %d, %Y'))
        if profile and profile.place_of_birth:
            dob_parts.append(profile.place_of_birth.strip())
        dob_display = ' — '.join(dob_parts) if dob_parts else '—'

        # Grad: year graduated + place + degree
        grad_items = []
        if profile:
            edus = sorted(profile.educations.all(), key=lambda e: (e.year_graduated or 0, e.id or 0))
            for edu in edus:
                parts = []
                if edu.year_graduated:
                    parts.append(str(edu.year_graduated))
                loc = ', '.join(p.strip() for p in [edu.institution, edu.place] if p and p.strip())
                if loc:
                    parts.append(loc)
                summary = ' — '.join(parts) if parts else ''
                if edu.degree:
                    summary = f"{summary} ({edu.degree})" if summary else edu.degree
                if summary:
                    grad_items.append(summary)
        if not grad_items and profile and profile.education:
            grad_items.append(profile.education.strip())
        grad_display = '; '.join(grad_items) if grad_items else '—'

        # OD: ordination to the diaconate (date and place)
        od_parts = []
        if r.diaconate_date:
            od_parts.append(r.diaconate_date.strftime('%b %d, %Y'))
        if r.diaconate_place:
            od_parts.append(r.diaconate_place.strip())
        od_display = ' — '.join(od_parts) if od_parts else '—'

        # OP: ordination to the priesthood (date and place)
        op_parts = []
        if r.ordination_date:
            op_parts.append(r.ordination_date.strftime('%b %d, %Y'))
        if r.ordination_place:
            op_parts.append(r.ordination_place.strip())
        op_display = ' — '.join(op_parts) if op_parts else '—'

        # Dep: deployments (date and place of each deployment, latest to oldest)
        deployments = []
        for dep in r.deployments.all():
            summary = dep.summary_display
            if summary:
                deployments.append(summary)
        if not deployments and r.assignment:
            deployments.append(f"Current: {r.assignment}")

        # S: Spouse name and birth date
        spouse_parts = []
        if profile and profile.spouse_name:
            spouse_parts.append(profile.spouse_name.strip())
        if profile and profile.spouse_birth_date:
            bdate_str = f"b. {profile.spouse_birth_date.strftime('%b %d, %Y')}"
            if spouse_parts:
                spouse_parts[0] = f"{spouse_parts[0]} ({bdate_str})"
            else:
                spouse_parts.append(bdate_str)
        spouse_display = spouse_parts[0] if spouse_parts else '—'

        # M: Date and place of marriage
        m_parts = []
        if profile and profile.marriage_date:
            m_parts.append(profile.marriage_date.strftime('%b %d, %Y'))
        if profile and profile.marriage_place:
            m_parts.append(profile.marriage_place.strip())
        marriage_display = ' — '.join(m_parts) if m_parts else '—'

        # C: Children names and birth dates
        children_items = []
        if profile:
            kids = sorted(profile.children.all(), key=lambda c: (c.birth_date or date.min, c.id or 0))
            for child in kids:
                if child.birth_date:
                    children_items.append(f"{child.name.strip()} (b. {child.birth_date.strftime('%b %d, %Y')})")
                else:
                    children_items.append(child.name.strip())
        if not children_items and profile and profile.children_names:
            children_items.append(profile.children_names.strip())
        children_display = '; '.join(children_items) if children_items else '—'

        has_family = (
            spouse_display != '—'
            or marriage_display != '—'
            or children_display != '—'
        )

        entries.append({
            'id': r.id,
            'name': r.name,
            'rank_display': r.get_rank_display(),
            'status': r.status,
            'assignment': r.assignment or '',
            'deanery': r.deanery.name if r.deanery else '',
            'dob': dob_display,
            'grad': grad_display,
            'od': od_display,
            'op': op_display,
            'deployments': deployments,
            'spouse': spouse_display,
            'marriage': marriage_display,
            'children': children_display,
            'has_dob': bool(dob_parts),
            'has_grad': bool(grad_items),
            'has_od': bool(od_parts),
            'has_op': bool(op_parts),
            'has_spouse': bool(spouse_parts),
            'has_marriage': bool(m_parts),
            'has_children': bool(children_items),
            'has_family': has_family,
        })

        name_cell = mark_safe(f'<b>{escape(r.name)}</b><span class="record-id">{escape(r.id)}</span>')
        rows.append([str(i), name_cell, r.assignment or '—', _fmt_date(r.ordination_date), r.status])

    summary = [
        {'label': 'Total Clergy', 'value': str(len(entries)), 'lead': True},
        {'label': 'Bishops', 'value': str(rank_counts['bishop'])},
        {'label': 'Priests', 'value': str(rank_counts['priest'])},
        {'label': 'Deacons', 'value': str(rank_counts['deacon'])},
        {'label': 'Active Ministry', 'value': str(active_count)},
    ]

    return {
        'sections': [{'heading': None, 'columns': columns, 'rows': rows}],
        'entries': entries,
        'summary': summary,
    }


def _build_status_report():
    records = list(ClergyRecord.objects.exclude(rank='postulancy').select_related('deanery').order_by('name'))
    _sync_loaded_records(records)
    columns = ['Name', 'Status', 'Leave Reason', 'Current Deployment']
    rows = []
    rich_rows = []
    counts = {'Active': 0, 'On Leave': 0, 'Missionary to Other Diocese': 0, 'Retired': 0}

    for r in records:
        if r.status in counts:
            counts[r.status] += 1
        reason = r.leave_reason if r.status == 'On Leave' else ''
        rows.append([r.name, r.status, reason or '—', r.assignment or '—'])
        rich_rows.append({
            'id': r.id,
            'name': r.name,
            'rank': r.get_rank_display(),
            'status': r.status,
            'leave_reason': reason,
            'assignment': r.assignment or '',
            'deanery': r.deanery.name if r.deanery else '',
        })

    summary = [
        {'label': 'Total Clergy', 'value': str(len(records)), 'lead': True},
        {'label': 'Active', 'value': str(counts['Active'])},
        {'label': 'On Leave', 'value': str(counts['On Leave'])},
        {'label': 'Missionary', 'value': str(counts['Missionary to Other Diocese'])},
        {'label': 'Retired', 'value': str(counts['Retired'])},
    ]

    return {
        'sections': [{'heading': None, 'columns': columns, 'rows': rows, 'rich_rows': rich_rows}],
        'summary': summary,
    }


def _build_per_deanery_report():
    mapping = _assignment_to_deanery_map()
    records = list(ClergyRecord.objects.exclude(rank='postulancy').select_related('deanery').order_by('name'))
    _sync_loaded_records(records)
    groups = {}
    unassigned_count = 0
    for r in records:
        deanery = (
            r.deanery.name if r.deanery
            else mapping.get(r.assignment, UNASSIGNED_DEANERY_LABEL)
        )
        if deanery == UNASSIGNED_DEANERY_LABEL:
            unassigned_count += 1
        groups.setdefault(deanery, []).append(r)

    columns = ['Name', 'Rank', 'Current Deployment', 'Status']
    sections = []
    for deanery in sorted(groups):
        group_records = groups[deanery]
        rows = [[r.name, r.get_rank_display(), r.assignment or '—', r.status] for r in group_records]
        rich_rows = [
            {
                'id': r.id,
                'name': r.name,
                'rank': r.get_rank_display(),
                'assignment': r.assignment or '',
                'status': r.status,
            }
            for r in group_records
        ]
        sections.append({
            'heading': deanery,
            'count': len(rows),
            'columns': columns,
            'rows': rows,
            'rich_rows': rich_rows,
        })

    assigned_deaneries = len([d for d in groups if d != UNASSIGNED_DEANERY_LABEL])
    summary = [
        {'label': 'Total Clergy', 'value': str(len(records)), 'lead': True},
        {'label': 'Deaneries Represented', 'value': str(assigned_deaneries)},
        {'label': 'Assigned Clergy', 'value': str(len(records) - unassigned_count)},
        {'label': 'Unassigned', 'value': str(unassigned_count)},
    ]

    return {
        'sections': sections,
        'summary': summary,
    }


def _build_ordination_documents_report():
    required_types = list(DocumentType.objects.filter(is_required=True).exclude(required_from_rank='postulancy'))
    records = list(
        ClergyRecord.objects.exclude(rank='postulancy')
        .prefetch_related('documents__document_type')
        .order_by('name')
    )
    _sync_loaded_records(records)
    columns = ['Name', 'Rank', 'Current Deployment', 'Status', 'Documents Submitted', 'Documents Missing']
    rows = []
    rich_rows = []

    complete_count = 0
    partial_count = 0
    zero_count = 0
    total_submitted_all = 0
    total_required_all = 0

    for r in records:
        checklist = r.document_checklist(required_types=required_types)
        checklist = [c for c in checklist if getattr(c.get('document_type'), 'required_from_rank', '') != 'postulancy']
        missing = [c['document_type'].name for c in checklist if c['status'] in ('Missing', 'Expired')]
        total_items = len(checklist)
        submitted_count = total_items - len(missing)
        pct = round((submitted_count / total_items) * 100) if total_items else 100

        total_submitted_all += submitted_count
        total_required_all += total_items
        if total_items == 0 or submitted_count == total_items:
            complete_count += 1
        elif submitted_count == 0:
            zero_count += 1
        else:
            partial_count += 1

        rows.append([
            r.name, r.get_rank_display(), r.assignment or '—', r.status,
            f"{submitted_count}/{total_items}", ', '.join(missing) or '—',
        ])
        rich_rows.append({
            'id': r.id,
            'name': r.name,
            'rank': r.get_rank_display(),
            'assignment': r.assignment or '',
            'status': r.status,
            'submitted': submitted_count,
            'total': total_items,
            'percent': pct,
            'missing_items': missing,
        })

    overall_pct = round((total_submitted_all / total_required_all) * 100) if total_required_all else 0
    summary = [
        {'label': 'Clergy Evaluated', 'value': str(len(records)), 'lead': True},
        {'label': 'Complete (100%)', 'value': str(complete_count)},
        {'label': 'Partial Filings', 'value': str(partial_count)},
        {'label': 'No Filings (0%)', 'value': str(zero_count)},
        {'label': 'Overall Compliance', 'value': f"{overall_pct}%"},
    ]

    return {
        'sections': [{'heading': None, 'columns': columns, 'rows': rows, 'rich_rows': rich_rows}],
        'summary': summary,
    }


_BUILDERS = {
    'clerical_directory': _build_clerical_directory,
    'status_report': _build_status_report,
    'per_deanery': _build_per_deanery_report,
    'ordination_documents': _build_ordination_documents_report,
}


def build_report(report_type, generated_by=None):
    if report_type not in REPORT_TYPES:
        raise ValueError(f"Unknown report type: {report_type}")
    result = _BUILDERS[report_type]()
    if isinstance(result, dict):
        sections = result.get('sections', [])
        entries = result.get('entries', [])
        summary = result.get('summary', [])
    else:
        sections = result
        entries = []
        summary = []
    return {
        'type': report_type,
        'title': REPORT_TYPES[report_type],
        'subtitle': REPORT_SUBTITLES.get(report_type, ''),
        'generated_at': timezone.now(),
        'generated_by': (generated_by.get_full_name() or generated_by.username) if generated_by else 'Registrar',
        'sections': sections,
        'entries': entries,
        'summary': summary,
    }


def render_pdf(report):
    """Renders the same registrar/report_pdf.html template used for the
    on-screen preview (see views.preview_generated_report) into a real PDF,
    so the letterhead design is written once in ordinary HTML/CSS instead of
    being built twice (once in a template, once in a PDF drawing API).
    WeasyPrint needs the GTK/Pango native libraries installed on the host."""
    from django.template.loader import render_to_string

    from ednp.pdf import html_to_pdf

    html = render_to_string('registrar/report_pdf.html', {'report': report})
    return html_to_pdf(html)
