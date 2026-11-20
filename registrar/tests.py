import calendar
import re
import shutil
import tempfile
import threading
from datetime import date, timedelta
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.db import close_old_connections, transaction
from django.test import Client, TestCase, TransactionTestCase, override_settings, skipUnlessDBFeature
from django.urls import reverse
from django.utils import dateformat, timezone

from accounts.testing import activate
from clergy.models import ClergyChild, ClergyEducation, ClergyProfile, Notification

from . import archive, reports
from .forms import DocumentUploadForm
from .models import ClergyDeployment, ClergyRecord, Deanery, Document, DocumentType, GeneratedReport, IdCounter, Parish, save_document

User = get_user_model()

PDF = b'%PDF-1.4\n%fake but correctly-headed pdf\n'
PNG = b'\x89PNG\r\n\x1a\n' + b'\x00' * 20


class RecordIdTests(TestCase):
    def test_ids_are_sequential_and_start_after_existing(self):
        ClergyRecord.objects.create(id='CLG-009', name='Existing')
        IdCounter.objects.update_or_create(name='clergy_record', defaults={'last_value': 9})
        self.assertEqual(ClergyRecord.next_id(), 'CLG-010')
        self.assertEqual(ClergyRecord.allocate_id(), 'CLG-010')
        self.assertEqual(ClergyRecord.allocate_id(), 'CLG-011')

    def test_allocate_skips_ids_that_already_exist(self):
        # e.g. inserted by hand / the seeder without going through the counter
        for n in (1, 2, 3):
            ClergyRecord.objects.create(id=f'CLG-{n:03d}', name=f'R{n}')
        self.assertEqual(ClergyRecord.allocate_id(), 'CLG-004')

    def test_preview_does_not_reserve(self):
        self.assertEqual(ClergyRecord.next_id(), 'CLG-001')
        self.assertEqual(ClergyRecord.next_id(), 'CLG-001')

    def test_ids_past_999_still_work(self):
        IdCounter.objects.update_or_create(name='clergy_record', defaults={'last_value': 999})
        self.assertEqual(ClergyRecord.allocate_id(), 'CLG-1000')


class CreateRecordTests(TestCase):
    def setUp(self):
        self.registrar = activate(User.objects.create_user('reg', password='pw12345!x', is_staff=True))
        self.client.force_login(self.registrar)
        self.payload = {'name': 'Fr. Test', 'status': 'Active', 'rank': 'priest'}

    def test_creates_record_user_and_profile_together_and_returns_the_slip(self):
        r = self.client.post(reverse('registrar:create_record'), self.payload)
        record = ClergyRecord.objects.get(name='Fr. Test')
        self.assertEqual(record.id, 'CLG-001')
        # The username is the record ID, not something the registrar typed.
        self.assertTrue(ClergyProfile.objects.filter(user__username='CLG-001', record=record).exists())
        self.assertEqual(r['Content-Type'], 'application/pdf')
        self.assertTrue(r.content.startswith(b'%PDF'))
        self.assertEqual(r['Cache-Control'], 'no-store')

    def test_creates_record_returns_html_slips_with_iframe_protection(self):
        r = self.client.post(
            reverse('registrar:create_record'),
            self.payload,
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
            HTTP_X_SLIP_FORMAT='html',
        )
        self.assertEqual(r.status_code, 200)
        self.assertIn('text/html', r['Content-Type'])
        self.assertContains(r, 'class="actions no-print"')
        self.assertContains(r, 'window.self !== window.top')
        self.assertContains(r, 'in-iframe')
        self.assertContains(r, 'window.self === window.top')

    def test_dashboard_includes_create_record_modal_directly(self):
        r = self.client.get(reverse('registrar:dashboard'))
        self.assertEqual(r.status_code, 200)
        self.assertContains(r, 'id="newRecordButton"')
        self.assertContains(r, 'id="recordModal"')
        self.assertContains(r, 'id="deaneries-data"')

    def test_failure_midway_leaves_nothing_behind_and_returns_the_id(self):
        with mock.patch.object(User.objects, 'create_user', side_effect=IntegrityError):
            self.client.post(reverse('registrar:create_record'), self.payload)
        self.assertFalse(ClergyRecord.objects.exists())
        self.assertFalse(IdCounter.objects.filter(last_value__gt=0).exists())  # rolled back with it
        self.client.post(reverse('registrar:create_record'), self.payload)
        self.assertEqual(ClergyRecord.objects.get().id, 'CLG-001')

    def test_username_race_shows_friendly_error_not_a_crash(self):
        with mock.patch.object(User.objects, 'create_user', side_effect=IntegrityError):
            r = self.client.post(reverse('registrar:create_record'), self.payload, follow=True)
        self.assertEqual(r.status_code, 200)
        self.assertContains(r, 'already in use')

    def test_slip_failure_rolls_everything_back(self):
        # If the PDF can't be produced, no account may survive whose password
        # was never printed.
        with mock.patch('registrar.views.slips.render_slips_pdf', side_effect=RuntimeError('pango missing')):
            with self.assertRaises(RuntimeError):
                self.client.post(reverse('registrar:create_record'), self.payload)
        self.assertFalse(ClergyRecord.objects.exists())
        self.assertFalse(User.objects.filter(username='CLG-001').exists())


class DocumentTests(TestCase):
    def setUp(self):
        self.media = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.media, ignore_errors=True)
        override = override_settings(MEDIA_ROOT=self.media)
        override.enable()
        self.addCleanup(override.disable)
        self.record = ClergyRecord.objects.create(id='CLG-001', name='Fr. A')
        self.doc_type, _ = DocumentType.objects.get_or_create(name='Baptismal Certificate')

    def _form(self, name, content):
        return DocumentUploadForm({'document_type': self.doc_type.pk, 'notes': ''},
                                  {'file': SimpleUploadedFile(name, content)})

    def test_replacing_a_document_deletes_the_old_file(self):
        with self.captureOnCommitCallbacks(execute=True):
            first = save_document(self.record, self.doc_type, SimpleUploadedFile('a.pdf', PDF), '')
        old_path = first.file.path
        with self.captureOnCommitCallbacks(execute=True):
            second = save_document(self.record, self.doc_type, SimpleUploadedFile('b.pdf', PDF), '')
        self.assertEqual(Document.objects.count(), 1)
        self.assertNotEqual(old_path, second.file.path)
        import os
        self.assertFalse(os.path.exists(old_path))
        self.assertTrue(os.path.exists(second.file.path))

    def test_accepts_real_pdf_and_png(self):
        self.assertTrue(self._form('scan.pdf', PDF).is_valid())
        self.assertTrue(self._form('photo.PNG', PNG).is_valid())

    def test_rejects_disguised_or_disallowed_files(self):
        self.assertFalse(self._form('evil.pdf', b'<html><script>alert(1)</script></html>').is_valid())
        self.assertFalse(self._form('evil.html', b'<html></html>').is_valid())
        self.assertFalse(self._form('logo.svg', b'<svg onload="x()"/>').is_valid())
        self.assertFalse(self._form('macro.docx', b'PK\x03\x04').is_valid())

    def test_rejects_files_over_10mb(self):
        self.assertFalse(self._form('big.pdf', PDF + b'0' * (10 * 1024 * 1024)).is_valid())

    def test_a_file_gone_from_the_server_is_a_404_not_a_server_error(self):
        # What a redeploy leaves when uploads aren't on a persistent volume: the rows, no files.
        self.client.force_login(activate(User.objects.create_user('reg', password='pw12345!x', is_staff=True)))
        document = Document.objects.create(record=self.record, document_type=self.doc_type,
                                           file='clergy_documents/CLG-001/gone.pdf', submitted_date=date.today())
        report = GeneratedReport.objects.create(report_type='status_report', title='Status Report',
                                                file='generated_reports/gone.pdf')
        for url in (reverse('registrar:view_document', args=[document.id]),
                    reverse('registrar:download_document', args=[document.id]),
                    reverse('registrar:view_generated_report', args=[report.id]),
                    reverse('registrar:download_generated_report', args=[report.id])):
            self.assertEqual(self.client.get(url).status_code, 404, url)


@skipUnlessDBFeature('has_select_for_update')
class ConcurrentIdAllocationTests(TransactionTestCase):
    """Real simultaneous creators (separate DB connections). Skipped on SQLite,
    which has no row locking — run against MySQL to exercise this."""

    def setUp(self):
        IdCounter.objects.get_or_create(name=ClergyRecord.COUNTER_NAME, defaults={'last_value': 0})

    def test_simultaneous_creates_never_share_an_id(self):
        n = 12
        ids, errors = [], []
        barrier = threading.Barrier(n)

        def create():
            try:
                barrier.wait()
                with transaction.atomic():
                    new_id = ClergyRecord.allocate_id()
                    ClergyRecord.objects.create(id=new_id, name='Concurrent')
                ids.append(new_id)
            except Exception as exc:  # noqa: BLE001 - surface any failure in the assert
                errors.append(exc)
            finally:
                close_old_connections()

        threads = [threading.Thread(target=create) for _ in range(n)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(errors, [])
        self.assertEqual(len(set(ids)), n)
        self.assertEqual(ClergyRecord.objects.count(), n)


class UploadFeedbackTests(TestCase):
    """A rejected upload must surface its reason in the page's flash messages
    (#flash-messages in base.html), which ui.js shows as an error toast."""

    def setUp(self):
        self.record = ClergyRecord.objects.create(id='CLG-001', name='Fr. A')
        self.doc_type, _ = DocumentType.objects.get_or_create(name='Baptismal Certificate')
        self.bad = {'document_type': self.doc_type.pk, 'file': SimpleUploadedFile('x.html', b'<b>hi</b>')}

    def test_clergy_sees_rejection_toast(self):
        user = activate(User.objects.create_user('c', password='pw12345!x'))
        ClergyProfile.objects.create(user=user, record=self.record)
        self.client.force_login(user)
        r = self.client.post(reverse('clergy:my_requirements'), self.bad, follow=True)
        self.assertContains(r, '<span data-level="error">Only PDF, JPG and PNG files are allowed.</span>')

    def test_registrar_sees_rejection_toast(self):
        self.client.force_login(activate(User.objects.create_user('r', password='pw12345!x', is_staff=True)))
        r = self.client.post(reverse('registrar:record_detail', args=[self.record.id]), self.bad, follow=True)
        self.assertContains(r, '<span data-level="error">Only PDF, JPG and PNG files are allowed.</span>')


class BlankFieldTests(TestCase):
    """An empty field on the record page is shown empty, not as the word "None": the
    browser refused "None" as an email address, so a record without one couldn't be
    saved, and in the other fields "None" was saved as text."""

    def setUp(self):
        self.client.force_login(activate(User.objects.create_user('reg', password='pw12345!x', is_staff=True)))
        # Like a bulk-created record: only the name is filled in.
        self.record = ClergyRecord.objects.create(id='CLG-001', name='Fr. New')

    def test_empty_fields_are_shown_empty(self):
        page = self.client.get(reverse('registrar:record_detail', args=[self.record.id]))
        self.assertNotContains(page, 'value="None"')
        self.assertNotContains(page, '>None</textarea>')

    def test_saving_the_page_as_shown_stores_no_text_none(self):
        # What the browser now sends for the untouched empty fields: empty strings.
        blanks = dict.fromkeys(['email', 'address', 'ordination_place', 'bishop_name',
                                'previous_assignment', 'service_history', 'leave_reason'], '')
        self.client.post(reverse('registrar:record_detail', args=[self.record.id]),
                         {'name': 'Fr. New', 'status': 'Active', 'rank': 'deacon', **blanks})
        self.record.refresh_from_db()
        for field in blanks:
            self.assertIn(getattr(self.record, field), (None, ''), field)

    def test_saving_valid_gmail_address(self):
        res = self.client.post(reverse('registrar:record_detail', args=[self.record.id]), {
            'name': 'Fr. New',
            'status': 'Active',
            'rank': 'deacon',
            'email': 'Fr.New@GMAIL.COM',
        })
        self.record.refresh_from_db()
        self.assertEqual(self.record.email, 'Fr.New@gmail.com')

    def test_saving_non_gmail_address_rejected(self):
        res = self.client.post(reverse('registrar:record_detail', args=[self.record.id]), {
            'name': 'Fr. New',
            'status': 'Active',
            'rank': 'deacon',
            'email': 'fr.new@yahoo.com',
        }, follow=True)
        self.assertContains(res, 'Only Gmail addresses (@gmail.com) are accepted.')
        self.record.refresh_from_db()
        self.assertNotEqual(self.record.email, 'fr.new@yahoo.com')


class PerDeaneryReportTests(TestCase):
    def test_uses_record_deanery_fk_and_falls_back_to_parish_mapping_when_unset(self):
        central = Deanery.objects.create(name='Central Deanery')
        southern = Deanery.objects.create(name='Southern Deanery')
        Parish.objects.create(deanery=southern, parish_name='St. Luke', place_name='Baguio')

        # Has real deanery FK set (even with a custom assignment text not matching a parish)
        ClergyRecord.objects.create(id='CLG-001', name='Fr. Central', deanery=central, assignment='Diocesan Office')
        # Legacy record with no deanery FK, matched via parish label
        ClergyRecord.objects.create(id='CLG-002', name='Fr. Southern', assignment='St. Luke - Baguio')
        # Neither
        ClergyRecord.objects.create(id='CLG-003', name='Fr. Unassigned')

        sections = reports.build_report('per_deanery')['sections']
        by_heading = {s['heading']: [r[0] for r in s['rows']] for s in sections}
        self.assertEqual(by_heading['Central Deanery'], ['Fr. Central'])
        self.assertEqual(by_heading['Southern Deanery'], ['Fr. Southern'])
        self.assertEqual(by_heading['Unassigned / Not Matched to a Parish'], ['Fr. Unassigned'])


class PaginationAndQueryCountTests(TestCase):
    def setUp(self):
        self.registrar = activate(User.objects.create_user('reg', password='pw12345!x', is_staff=True))
        self.client.force_login(self.registrar)
        self.doc_type, _ = DocumentType.objects.get_or_create(name='Baptismal Certificate', defaults={'is_required': True})

    def test_clergy_records_and_document_checklist_do_not_run_n_plus_one_queries(self):
        for i in range(1, 15):
            r = ClergyRecord.objects.create(id=f'CLG-{i:03d}', name=f'Fr. {i}')
            Document.objects.create(record=r, document_type=self.doc_type, file='a.pdf', submitted_date=date.today())
        # 14 records on the page, but the query count stays flat (no per-record checklist queries;
        # includes 1 combined lifecycle sync query for scheduled retirements and expired contracts)
        with self.assertNumQueries(16):
            res = self.client.get(reverse('registrar:clergy_records'))
        self.assertEqual(len(res.context['records']), 14)
        self.assertEqual(res.context['records'][0].doc_summary['submitted'], 1)

        with self.assertNumQueries(11):
            res2 = self.client.get(reverse('registrar:clergy_document_checklist'))
        self.assertEqual(len(res2.context['rows']), 14)

    def test_clergy_document_checklist_paginates_and_preserves_filters(self):
        for i in range(1, 32):
            ClergyRecord.objects.create(
                id=f'DOC-{i:03d}',
                name=f'Fr. Doc {i:03d}',
                rank='priest' if i <= 28 else 'deacon',
            )
        page1 = self.client.get(reverse('registrar:clergy_document_checklist'), {'q': 'Doc', 'rank': 'priest'})
        self.assertEqual(len(page1.context['rows']), 25)
        self.assertTrue(page1.context['page'].has_next())
        self.assertContains(page1, 'q=Doc&amp;rank=priest&amp;page=2')
        self.assertContains(page1, 'id="clergyBottomPager"')
        self.assertContains(page1, 'id="clergyPagerSentinel"')

        page1_10 = self.client.get(
            reverse('registrar:clergy_document_checklist'),
            {'q': 'Doc', 'rank': 'priest', 'per_page': 10},
        )
        self.assertEqual(len(page1_10.context['rows']), 10)
        self.assertContains(page1_10, 'per_page=10&amp;page=2')

        page2_10 = self.client.get(
            reverse('registrar:clergy_document_checklist'),
            {'q': 'Doc', 'rank': 'priest', 'per_page': 10, 'page': 3},
        )
        self.assertEqual(len(page2_10.context['rows']), 8)

    def test_clergy_document_checklist_page_title_and_old_url_redirect(self):
        url = reverse('registrar:clergy_document_checklist')
        res = self.client.get(url)
        self.assertTemplateUsed(res, 'registrar/clergy-document-checklist.html')
        self.assertContains(res, '<title>EDNP - Clergy Document Checklist</title>', html=False)
        self.assertEqual(res.context['active_page'], 'clergy_document_checklist')
        old = self.client.get('/registrar/documents/?q=Doc')
        self.assertRedirects(old, url + '?q=Doc', status_code=301)

    def test_centered_pager_structure_shared_across_registrar_tables(self):
        future = date.today() + timedelta(days=90)
        for i in range(1, 14):
            ClergyRecord.objects.create(
                id=f'PAG-{i:03d}',
                name=f'Fr. Pager {i:03d}',
                contract_end=future + timedelta(days=i),
            )
        for url_name in ('registrar:clergy_records', 'registrar:clergy_document_checklist', 'registrar:contract_review'):
            res = self.client.get(reverse(url_name), {'per_page': 10})
            html = res.content.decode('utf-8')
            self.assertRegex(
                html,
                re.compile(
                    r'<div class="table-meta-bar top">.*?<div class="meta-count">.*?'
                    r'<nav class="pager-mini"[^>]*aria-label="Top pagination">.*?</nav>\s*'
                    r'<div class="meta-controls">',
                    re.S,
                ),
            )
            self.assertRegex(
                html,
                re.compile(
                    r'<div class="table-meta-bar bottom" id="clergyBottomPager">.*?<div class="meta-count">.*?'
                    r'<nav class="pager-mini"[^>]*aria-label="Bottom pagination">.*?</nav>\s*'
                    r'<div class="meta-controls">',
                    re.S,
                ),
            )

    def test_clergy_records_paginates_at_100_per_page_preserving_filters(self):
        for i in range(1, 106):
            ClergyRecord.objects.create(id=f'CLG-{i:03d}', name=f'Fr. {i:03d}', status='Active')
        page1 = self.client.get(reverse('registrar:clergy_records'), {'status': 'Active'})
        self.assertEqual(len(page1.context['records']), 25)
        self.assertTrue(page1.context['page'].has_next())
        self.assertContains(page1, 'status=Active')
        self.assertContains(page1, 'page=2')

        # Supports custom per_page=100
        page_100 = self.client.get(reverse('registrar:clergy_records'), {'status': 'Active', 'per_page': 100})
        self.assertEqual(len(page_100.context['records']), 100)
        self.assertTrue(page_100.context['page'].has_next())
        self.assertContains(page_100, 'per_page=100')
        self.assertContains(page_100, 'page=2')

        page2 = self.client.get(reverse('registrar:clergy_records'), {'status': 'Active', 'per_page': 100, 'page': 2})
        self.assertEqual(len(page2.context['records']), 5)

    def test_generated_reports_paginates_at_10_per_page(self):
        for i in range(12):
            GeneratedReport.objects.create(report_type='status_report', title=f'Report {i}', file='r.pdf',
                                           generated_by=self.registrar)
        page1 = self.client.get(reverse('registrar:generate_report'))
        self.assertEqual(len(page1.context['generated_reports']), 10)
        self.assertTrue(page1.context['page'].has_next())

        page2 = self.client.get(reverse('registrar:generate_report'), {'page': 2})
        self.assertEqual(len(page2.context['generated_reports']), 2)


class ClergyRecordsFilterTests(TestCase):
    def setUp(self):
        self.registrar = activate(User.objects.create_user('reg_filter', password='pw12345!x', is_staff=True))
        self.client.force_login(self.registrar)
        self.deanery_central = Deanery.objects.create(name='Central Deanery')
        self.deanery_bauko = Deanery.objects.create(name='Bauko Deanery')
        self.parish_central = Parish.objects.create(deanery=self.deanery_central, parish_name='St. Barnabas', place_name='Alab')
        self.parish_bauko = Parish.objects.create(deanery=self.deanery_bauko, parish_name='Holy Apostle', place_name='Abatan')

        self.r1 = ClergyRecord.objects.create(
            id='CLG-101', name='Fr. Juan', deanery=self.deanery_central,
            assignment=str(self.parish_central), rank='priest', status='Active'
        )
        self.r2 = ClergyRecord.objects.create(
            id='CLG-102', name='Fr. Pedro', deanery=None,
            assignment=str(self.parish_bauko), rank='deacon', status='Active'
        )
        self.r3 = ClergyRecord.objects.create(
            id='CLG-103', name='Bp. Marco', deanery=self.deanery_central,
            assignment='Cathedral', rank='bishop', status='On Leave'
        )

    def test_filter_by_deanery_fk(self):
        res = self.client.get(reverse('registrar:clergy_records'), {'deanery': self.deanery_central.id})
        ids = [r.id for r in res.context['records']]
        self.assertIn(self.r1.id, ids)
        self.assertIn(self.r3.id, ids)
        self.assertNotIn(self.r2.id, ids)
        self.assertContains(res, 'Central Deanery')

    def test_filter_by_deanery_fallback_parish(self):
        res = self.client.get(reverse('registrar:clergy_records'), {'deanery': self.deanery_bauko.id})
        ids = [r.id for r in res.context['records']]
        self.assertIn(self.r2.id, ids)
        self.assertNotIn(self.r1.id, ids)
        self.assertNotIn(self.r3.id, ids)

    def test_filter_by_rank(self):
        res = self.client.get(reverse('registrar:clergy_records'), {'rank': 'priest'})
        ids = [r.id for r in res.context['records']]
        self.assertEqual(ids, [self.r1.id])

        res_deacon = self.client.get(reverse('registrar:clergy_records'), {'rank': 'deacon'})
        self.assertEqual([r.id for r in res_deacon.context['records']], [self.r2.id])

    def test_filter_by_deanery_and_rank_combined(self):
        res = self.client.get(reverse('registrar:clergy_records'), {
            'deanery': self.deanery_central.id,
            'rank': 'bishop',
        })
        ids = [r.id for r in res.context['records']]
        self.assertEqual(ids, [self.r3.id])

    def test_filter_preserves_in_pagination_and_renders_selects(self):
        res = self.client.get(reverse('registrar:clergy_records'), {
            'deanery': self.deanery_central.id,
            'rank': 'priest',
            'status': 'Active',
        })
        self.assertContains(res, '<select name="deanery"')
        self.assertContains(res, '<select name="rank"')
        self.assertContains(res, '<select name="status"')
        self.assertEqual(res.context['deanery_filter'], str(self.deanery_central.id))
        self.assertEqual(res.context['rank_filter'], 'priest')


from clergy.models import ClergyChild, ClergyEducation
from .models import ClergyDeployment


class ClergyRecordEnhancementRegistrarTests(TestCase):
    def setUp(self):
        self.registrar = activate(User.objects.create_user('reg_enh', password='pw12345!x', is_staff=True))
        self.client.force_login(self.registrar)
        self.record = ClergyRecord.objects.create(
            id='CLG-301',
            name='Fr. Timothy',
            status='Active',
            rank='priest',
            diaconate_date=date(2010, 5, 1),
            diaconate_place='Bontoc Cathedral',
            ordination_date=date(2011, 5, 1),
            ordination_place='Baguio Cathedral',
        )
        self.clergy_user = activate(User.objects.create_user('CLG-301', password='pw12345!x'))
        self.profile = ClergyProfile.objects.create(
            user=self.clergy_user,
            record=self.record,
            place_of_birth='Bontoc',
            marriage_place='St. Paul Church',
            spouse_name='Sarah Timothy',
            spouse_birth_date=date(1985, 8, 20),
            marriage_date=date(2012, 6, 15),
        )
        ClergyChild.objects.create(
            profile=self.profile,
            name='Hannah Timothy',
            birth_date=date(2015, 3, 10),
            gender='Female',
        )
        ClergyEducation.objects.create(
            profile=self.profile,
            degree='Master of Divinity',
            institution="St. Andrew's Seminary",
            place='Quezon City',
            year_graduated=2009,
        )

    def test_registrar_can_save_diaconate_place(self):
        res = self.client.post(reverse('registrar:record_detail', args=[self.record.id]), {
            'name': 'Fr. Timothy',
            'status': 'Active',
            'rank': 'priest',
            'diaconate_date': '2010-05-01',
            'diaconate_place': 'Cathedral of Saint Mary & Saint John',
            'ordination_date': '2011-05-01',
            'ordination_place': 'Baguio Cathedral',
        }, follow=True)
        self.assertEqual(res.status_code, 200)
        self.record.refresh_from_db()
        self.assertEqual(self.record.diaconate_place, 'Cathedral of Saint Mary & Saint John')

    def test_api_parishes_returns_deaneries_and_parishes(self):
        d = Deanery.objects.create(name='Central Deanery')
        Parish.objects.create(deanery=d, parish_name='All Saints Cathedral', place_name='Bontoc')
        res = self.client.get(reverse('registrar:api_parishes'))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn('deaneries', data)
        self.assertIn(str(d.id), data['deaneries'])
        first_deanery = data['deaneries'][str(d.id)]
        self.assertEqual(first_deanery['name'], 'Central Deanery')
        self.assertIn('All Saints Cathedral - Bontoc', first_deanery['parishes'])
        self.assertEqual(first_deanery['parish_items'][0]['name'], 'All Saints Cathedral')

    def test_registrar_can_add_and_delete_deployment(self):
        # Add deployment
        add_res = self.client.post(reverse('registrar:record_detail', args=[self.record.id]), {
            'action': 'add_deployment',
            'station_name': 'St. Peter Parish',
            'place_name': 'Sagada',
            'role': 'Rector',
            'start_date': '2018-01-01',
            'is_current': '1',
        }, follow=True)
        self.assertEqual(add_res.status_code, 200)

        dep = ClergyDeployment.objects.get(record=self.record, station_name='St. Peter Parish')
        self.assertEqual(dep.place_name, 'Sagada')
        self.assertTrue(dep.is_current)

        # Delete deployment
        del_res = self.client.post(reverse('registrar:record_detail', args=[self.record.id]), {
            'action': 'delete_deployment',
            'deployment_id': dep.id,
        }, follow=True)
        self.assertEqual(del_res.status_code, 200)
        self.assertFalse(ClergyDeployment.objects.filter(id=dep.id).exists())

    def test_registrar_view_renders_read_only_family_and_education(self):
        res = self.client.get(reverse('registrar:record_detail', args=[self.record.id]))
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Sarah Timothy')
        self.assertContains(res, 'St. Paul Church')
        self.assertContains(res, 'Hannah Timothy')
        self.assertContains(res, 'Master of Divinity')
        self.assertContains(res, 'Filed by Clergy')



class ContractExpiryDeploymentTests(TestCase):
    def setUp(self):
        self.registrar = activate(User.objects.create_user('reg_exp', password='pw12345!x', is_staff=True))
        self.client.force_login(self.registrar)
        self.record = ClergyRecord.objects.create(
            id='CLG-401',
            name='Fr. Barnaby',
            status='Active',
            rank='priest',
            assignment='St. Barnabas Parish - Alab',
            contract_end=date.today() - timedelta(days=10),
        )

    def test_expired_contract_automatically_recorded_in_deployments(self):
        # Visiting contract review automatically syncs expired contracts
        res = self.client.get(reverse('registrar:contract_review'))
        self.assertEqual(res.status_code, 200)

        dep = self.record.deployments.filter(end_date=self.record.contract_end).first()
        self.assertIsNotNone(dep)
        self.assertEqual(dep.station_name, 'St. Barnabas Parish')
        self.assertEqual(dep.place_name, 'Alab')
        self.assertEqual(dep.role, 'Priest-in-Charge')
        self.assertFalse(dep.is_current)

    def test_deployments_are_sorted_from_latest_to_oldest(self):
        # 1. Very old deployment (2012-2015)
        d_old = ClergyDeployment.objects.create(
            record=self.record, station_name='First Parish',
            start_date=date(2012, 1, 1), end_date=date(2015, 12, 31), is_current=False
        )
        # 2. Mid deployment (2016-2020)
        d_mid = ClergyDeployment.objects.create(
            record=self.record, station_name='Second Parish',
            start_date=date(2016, 1, 1), end_date=date(2020, 12, 31), is_current=False
        )
        # 3. Recently ended contract (2026)
        d_recent = ClergyDeployment.objects.create(
            record=self.record, station_name='Recent Station',
            end_date=date(2026, 1, 15), is_current=False
        )
        # 4. Current deployment
        d_current = ClergyDeployment.objects.create(
            record=self.record, station_name='Current Mission',
            start_date=date(2026, 2, 1), is_current=True
        )

        deps = list(self.record.deployments.all())
        self.assertEqual(len(deps), 4)
        # Ordered latest to oldest: Current first, then Recent (2026), then Mid (2020), then Old (2015)
        self.assertEqual(deps[0].id, d_current.id)
        self.assertEqual(deps[1].id, d_recent.id)
        self.assertEqual(deps[2].id, d_mid.id)
        self.assertEqual(deps[3].id, d_old.id)

    def test_no_duplicate_deployment_on_repeated_checks(self):
        self.record.record_expired_contract()
        self.record.record_expired_contract()
        self.assertEqual(self.record.deployments.filter(end_date=self.record.contract_end).count(), 1)

    def test_active_deployment_updated_when_contract_expires(self):
        active_dep = ClergyDeployment.objects.create(
            record=self.record, station_name='St. Barnabas Parish',
            role='Rector', is_current=True
        )
        self.assertTrue(active_dep.is_current)

        # Trigger expiration sync
        self.record.record_expired_contract()
        active_dep.refresh_from_db()
        self.assertFalse(active_dep.is_current)
        self.assertEqual(active_dep.end_date, self.record.contract_end)

    def test_future_contract_not_recorded_as_expired(self):
        future_record = ClergyRecord.objects.create(
            id='CLG-402',
            name='Fr. Future',
            status='Active',
            rank='priest',
            assignment='Epiphany Cathedral',
            contract_end=date.today() + timedelta(days=90),
        )
        result = future_record.record_expired_contract()
        self.assertFalse(result)
        self.assertFalse(future_record.deployments.exists())

    def test_management_command_sync_expired_contracts(self):
        from django.core.management import call_command
        import io
        out = io.StringIO()
        call_command('sync_expired_contracts', stdout=out)
        self.assertIn('Successfully synchronized', out.getvalue())


class ClericalDirectoryReportTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('fr_john', 'john@example.com', 'Pass1234!')
        self.record = ClergyRecord.objects.create(
            id='CLG-501',
            name='The Rev. Fr. John Doe, M.Div.',
            rank='priest',
            status='Active',
            date_of_birth=date(1980, 5, 15),
            diaconate_date=date(2005, 6, 24),
            diaconate_place='Cathedral of All Saints, Bontoc',
            ordination_date=date(2006, 12, 8),
            ordination_place='Church of the Epiphany, La Trinidad',
            assignment='Cathedral of All Saints',
        )
        self.profile = ClergyProfile.objects.create(
            user=self.user,
            record=self.record,
            place_of_birth='Bontoc, Mountain Province',
            spouse_name='Jane Doe',
            spouse_birth_date=date(1982, 8, 20),
            marriage_date=date(2008, 1, 18),
            marriage_place='St. Paul Church, Sagada',
        )
        ClergyEducation.objects.create(
            profile=self.profile,
            degree='BA Philosophy',
            institution='University of the Philippines',
            place='Baguio',
            year_graduated=2001,
        )
        ClergyEducation.objects.create(
            profile=self.profile,
            degree='Master of Divinity',
            institution="St. Andrew's Theological Seminary",
            place='Quezon City',
            year_graduated=2005,
        )
        ClergyChild.objects.create(profile=self.profile, name='Mark Doe', birth_date=date(2010, 3, 10))
        ClergyChild.objects.create(profile=self.profile, name='Luke Doe', birth_date=date(2013, 7, 22))

        # Deployments: oldest to newest created, but manager / query must order latest to oldest
        ClergyDeployment.objects.create(
            record=self.record,
            station_name='St. Matthew Mission',
            place_name='Besao',
            role='Deacon',
            start_date=date(2007, 1, 1),
            end_date=date(2012, 12, 31),
            is_current=False,
        )
        ClergyDeployment.objects.create(
            record=self.record,
            station_name='St. Paul Church',
            place_name='Sagada',
            role='Priest-in-Charge',
            start_date=date(2013, 1, 1),
            end_date=date(2020, 12, 31),
            is_current=False,
        )
        ClergyDeployment.objects.create(
            record=self.record,
            station_name='Cathedral of All Saints',
            place_name='Bontoc',
            role='Dean',
            start_date=date(2021, 1, 1),
            is_current=True,
        )

    def test_clerical_directory_data_mapping_and_order(self):
        report = reports.build_report('clerical_directory')
        self.assertEqual(report['title'], 'Clerical Directory')
        self.assertEqual(len(report['entries']), 1)

        entry = report['entries'][0]
        self.assertEqual(entry['name'], 'The Rev. Fr. John Doe, M.Div.')
        self.assertEqual(entry['dob'], 'May 15, 1980 — Bontoc, Mountain Province')
        self.assertIn('2001 — University of the Philippines, Baguio (BA Philosophy)', entry['grad'])
        self.assertIn("2005 — St. Andrew's Theological Seminary, Quezon City (Master of Divinity)", entry['grad'])
        self.assertEqual(entry['od'], 'Jun 24, 2005 — Cathedral of All Saints, Bontoc')
        self.assertEqual(entry['op'], 'Dec 08, 2006 — Church of the Epiphany, La Trinidad')

        # Deployments: exactly 3, sorted latest to oldest
        self.assertEqual(len(entry['deployments']), 3)
        self.assertIn('Cathedral of All Saints', entry['deployments'][0])
        self.assertIn('Present', entry['deployments'][0])
        self.assertIn('St. Paul Church', entry['deployments'][1])
        self.assertIn('St. Matthew Mission', entry['deployments'][2])

        self.assertEqual(entry['spouse'], 'Jane Doe (b. Aug 20, 1982)')
        self.assertEqual(entry['marriage'], 'Jan 18, 2008 — St. Paul Church, Sagada')
        self.assertEqual(entry['children'], 'Mark Doe (b. Mar 10, 2010); Luke Doe (b. Jul 22, 2013)')

    def test_clerical_directory_html_and_pdf_rendering(self):
        from django.template.loader import render_to_string
        report = reports.build_report('clerical_directory')
        html = render_to_string('registrar/report_pdf.html', {'report': report})

        # Bolds name and full field labels inside structured directory tables
        self.assertIn('directory-entry-table', html)
        self.assertIn('<b>The Rev. Fr. John Doe, M.Div.</b>', html)
        self.assertIn('<b>Date &amp; Place of Birth</b>', html)
        self.assertIn('<b>Education</b>', html)
        self.assertIn('<b>Ordination to the Diaconate</b>', html)
        self.assertIn('<b>Ordination to the Priesthood</b>', html)
        self.assertIn('<b>Deployments</b>', html)
        self.assertIn('<b>Spouse</b>', html)
        self.assertIn('<b>Date &amp; Place of Marriage</b>', html)
        self.assertIn('<b>Children</b>', html)

        # PDF generation produces valid binary
        pdf = reports.render_pdf(report)
        self.assertTrue(pdf.startswith(b'%PDF'))

    def test_all_report_types_render_kpis_badges_and_valid_pdfs(self):
        from django.template.loader import render_to_string
        deanery = Deanery.objects.create(name='Northern Deanery')
        DocumentType.objects.get_or_create(name='Declaration of Conformity', defaults={'is_required': True})
        ClergyRecord.objects.create(
            id='CLG-509',
            name='Fr. Missionary Sample',
            rank='priest',
            status='Missionary to Other Diocese',
            deanery=deanery,
            assignment='Diocesan Mission',
        )

        for rtype in ('clerical_directory', 'status_report', 'per_deanery', 'ordination_documents'):
            report = reports.build_report(rtype)
            self.assertTrue(report.get('summary'), f'{rtype} should include summary KPIs')
            html = render_to_string('registrar/report_pdf.html', {'report': report})
            self.assertIn('kpi-strip', html)
            self.assertIn('closing-block', html)
            self.assertIn('stamp-ring', html)
            self.assertIn('badge-info', html)
            if rtype == 'ordination_documents':
                self.assertIn('doc-progress-track', html)
                self.assertIn('missing-tag', html)
            if rtype == 'per_deanery':
                self.assertIn('section-count-pill', html)
            pdf = reports.render_pdf(report)
            self.assertTrue(pdf.startswith(b'%PDF'), f'{rtype} failed PDF render')

    def test_clerical_directory_fallbacks_for_empty_fields(self):
        minimal = ClergyRecord.objects.create(id='CLG-502', name='Fr. Minimal', rank='deacon')
        report = reports.build_report('clerical_directory')
        entry = [e for e in report['entries'] if e['id'] == 'CLG-502'][0]

        self.assertEqual(entry['dob'], '—')
        self.assertEqual(entry['grad'], '—')
        self.assertEqual(entry['od'], '—')
        self.assertEqual(entry['op'], '—')
        self.assertEqual(entry['deployments'], [])
        self.assertEqual(entry['spouse'], '—')
        self.assertEqual(entry['marriage'], '—')
        self.assertEqual(entry['children'], '—')

    def test_clerical_directory_query_count_flat(self):
        # Adding 10 more records should not increase queries linearly
        for i in range(10):
            r = ClergyRecord.objects.create(id=f'CLG-6{i:02d}', name=f'Fr. Batch {i}')
            u = User.objects.create_user(f'batch_{i}', f'b{i}@example.com', 'Pass1234!')
            p = ClergyProfile.objects.create(user=u, record=r, place_of_birth='Bontoc')
            ClergyDeployment.objects.create(record=r, station_name=f'Parish {i}', is_current=True)
            ClergyEducation.objects.create(profile=p, degree='B.Th.', institution='SATS', year_graduated=2010)
            ClergyChild.objects.create(profile=p, name=f'Child {i}', birth_date=date(2015, 1, 1))

        # Flat query count: 1 for ClergyRecord + Deanery + ClergyProfile (joined),
        # 1 for ClergyDeployment, 1 for ClergyChild, 1 for ClergyEducation
        with self.assertNumQueries(4):
            report = reports.build_report('clerical_directory')
        self.assertEqual(len(report['entries']), 11)


class RegistrarDashboardSearchTests(TestCase):
    def setUp(self):
        self.staff_user = activate(User.objects.create_user(
            username='staff_reg',
            email='staff_reg@example.com',
            password='TestPassword123!',
            is_staff=True,
            first_name='Maria',
        ))
        self.client.force_login(self.staff_user)
        self.record = ClergyRecord.objects.create(
            id='EDNP-TEST-01',
            name='The Rev. Fr. John Doe',
            rank='priest',
            status='Active',
            assignment='Cathedral of All Saints',
        )

    def test_dashboard_renders_search_and_welcome(self):
        r = self.client.get(reverse('registrar:dashboard'))
        self.assertEqual(r.status_code, 200)
        self.assertContains(r, 'portalSearchCatalogData')
        self.assertContains(r, 'id="dashboardSearchInput"')
        self.assertContains(r, 'id="registrarWelcomeBanner"')
        self.assertContains(r, 'Welcome, Maria')

        catalog = r.context.get('portal_catalog')
        self.assertIsNotNone(catalog)
        self.assertTrue(len(catalog) > 0)

        # Confirm sample record is present in catalog
        titles = [item['title'] for item in catalog]
        self.assertIn('The Rev. Fr. John Doe', titles)
        self.assertIn('Create New Clergy Account', titles)
        self.assertIn('Clergy Records Directory', titles)
        self.assertIn('Clergy Document Checklist', titles)


class RegistrarRecordDetailModernizationTests(TestCase):
    def setUp(self):
        self.staff_user = activate(User.objects.create_user(
            username='registrar_tester',
            email='reg_tester@example.com',
            password='TestPassword123!',
            is_staff=True,
            first_name='Gabriel',
        ))
        self.client.force_login(self.staff_user)
        self.record = ClergyRecord.objects.create(
            id='EDNP-TEST-02',
            name='The Rev. Fr. Matthew Mark',
            rank='priest',
            status='Active',
            assignment='St. Barnabas Parish',
        )
        self.user = User.objects.create_user(
            username='EDNP-TEST-02',
            email='matthew@example.com',
            password='TestPassword123!',
        )
        self.profile = ClergyProfile.objects.create(
            user=self.user,
            record=self.record,
            place_of_birth='Bontoc',
        )

    def test_record_detail_renders_inline_modals_and_edge_navigation(self):
        url = reverse('registrar:record_detail', args=[self.record.id])
        r = self.client.get(url)
        self.assertEqual(r.status_code, 200)

        # Single-modal-at-a-time inline Documents workspace with edge navigation
        self.assertNotContains(r, 'id="stagesSummaryHub"')
        self.assertNotContains(r, 'id="stageFloatingElevator"')
        self.assertNotContains(r, 'id="docFloatingNavBtn"')
        self.assertContains(r, 'id="stageDocumentsModal"')
        self.assertContains(r, 'id="stageEdgePrevBtn"')
        self.assertContains(r, 'id="stageEdgeNextBtn"')
        self.assertContains(r, 'id="stageSectionsRepository"')
        self.assertContains(r, 'id="stageStepperControl"')
        self.assertContains(r, 'id="stageStepIndicator"')
        self.assertContains(r, 'id="stageSearchEmpty"')

        # Single-modal-at-a-time inline Personal Information workspace with edge navigation
        self.assertNotContains(r, 'id="registrarSummaryHub"')
        self.assertContains(r, 'id="sectionQuickEditModal"')
        self.assertContains(r, 'id="sectionEdgePrevBtn"')
        self.assertContains(r, 'id="sectionEdgeNextBtn"')
        self.assertContains(r, 'id="sectionQuickEditStepBadge"')
        self.assertContains(r, 'id="sectionDraftRestoredBadge"')
        self.assertContains(r, 'id="sectionQuickEditStepIndicator"')
        self.assertContains(r, 'id="profileStepperControl"')
        self.assertContains(r, 'id="profileSearchInput"')
        self.assertContains(r, 'id="profileSearchEmpty"')
        self.assertContains(r, 'ednp_active_section_')
        self.assertContains(r, 'ednp_active_stage_')
        self.assertContains(r, 'ednp_doc_filters_')
        self.assertContains(r, 'ednp:draft-restored')

        # Single-year inline Ember Letters workspace markers
        self.assertContains(r, 'id="emberSectionNav"')
        self.assertContains(r, 'id="emberNavPills"')
        self.assertContains(r, 'id="emberYearModal"')
        self.assertContains(r, 'id="emberEdgePrevBtn"')
        self.assertContains(r, 'id="emberEdgeNextBtn"')
        self.assertContains(r, 'id="emberYearTrigger"')
        self.assertContains(r, 'id="emberYearListbox"')
        self.assertContains(r, 'id="emberSearchInput"')
        self.assertContains(r, 'id="emberStepperControl"')
        self.assertContains(r, 'id="emberStepIndicator"')
        ember_chunk = r.content.decode('utf-8').split('id="emberLettersRoot"', 1)[1].split('id="ember-config-data"', 1)[0]
        self.assertNotIn('<select', ember_chunk)

        # Check parish, deployment station, place of birth, and address picker integration
        self.assertContains(r, 'data-picker-mode="parish"')
        self.assertContains(r, 'data-ph-picker-target="baptismPlaceInputRegistrar"')
        self.assertContains(r, 'data-ph-picker-target="confirmationPlaceInputRegistrar"')
        self.assertContains(r, 'data-ph-picker-target="depStationInputRegistrar"')
        self.assertContains(r, 'data-ph-picker-target="placeOfBirthInputRegistrar"')
        self.assertContains(r, '<textarea name="address" id="addressInput" rows="2">')

        html = r.content.decode('utf-8')
        identity_chunk = html.split('id="sec-reg-identity"', 1)[1].split('id="sec-reg-contact"', 1)[0]
        family_chunk = html.split('id="sec-reg-family"', 1)[1].split('id="tabDocuments"', 1)[0]
        self.assertIn('name="place_of_birth"', identity_chunk)
        self.assertNotIn('Place of Birth', family_chunk)

    def test_record_detail_ajax_save(self):
        url = reverse('registrar:record_detail', args=[self.record.id])
        payload = {
            'action': 'save_record',
            'name': 'The Rev. Fr. Matthew Mark Updated',
            'place_of_birth': 'Sagada, Mountain Province',
            'address': 'Poblacion, Bontoc, Mountain Province',
            'rank': 'priest',
            'status': 'Active',
            'assignment': 'St. Barnabas Parish',
        }
        r = self.client.post(url, payload, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertTrue(data.get('ok'))
        self.record.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertEqual(self.record.name, 'The Rev. Fr. Matthew Mark Updated')
        self.assertEqual(self.record.address, 'Poblacion, Bontoc, Mountain Province')
        self.assertEqual(self.profile.place_of_birth, 'Sagada, Mountain Province')


class PostulancyRemovalAndReportsTests(TestCase):
    def setUp(self):
        super().setUp()
        self.registrar = activate(User.objects.create_user(
            username='reg_test',
            email='reg_test@example.com',
            password='TestPassword123!',
            is_staff=True,
            first_name='Registrar',
        ))
        self.client.force_login(self.registrar)
        self.deacon = ClergyRecord.objects.create(
            id='CLG-D01', name='Rev. Deacon John', rank='deacon', status='Active',
        )
        self.priest = ClergyRecord.objects.create(
            id='CLG-P01', name='Rev. Fr. Peter', rank='priest', status='Active',
        )
        self.postulant = ClergyRecord.objects.create(
            id='CLG-X01', name='Postulant Mark', rank='postulancy', status='Active',
        )

    def test_rank_choices_exclude_postulancy(self):
        from registrar.models import RANK_CHOICES, RANK_ORDER
        ranks = [c[0] for c in RANK_CHOICES]
        self.assertEqual(ranks, ['deacon', 'priest', 'bishop'])
        self.assertNotIn('postulancy', RANK_ORDER)

    def test_ranks_selection_in_templates_exclude_postulancy(self):
        res_records = self.client.get(reverse('registrar:clergy_records'))
        self.assertEqual(res_records.status_code, 200)
        self.assertNotContains(res_records, '<option value="postulancy"')

        res_detail = self.client.get(reverse('registrar:record_detail', args=[self.deacon.id]))
        self.assertEqual(res_detail.status_code, 200)
        self.assertNotContains(res_detail, '<option value="postulancy"')

    def test_ordination_documents_report_excludes_postulancy_records_and_documents(self):
        DocumentType.objects.get_or_create(
            name='Letter of Intention (Postulancy)',
            defaults={'required_from_rank': 'postulancy', 'is_required': True},
        )
        DocumentType.objects.get_or_create(
            name='Declaration of Conformity',
            defaults={'required_from_rank': 'deacon', 'is_required': True},
        )
        report = reports.build_report('ordination_documents')
        rows = report['sections'][0]['rows']
        names = [r[0] for r in rows]
        ranks = [r[1] for r in rows]

        self.assertNotIn('Postulant Mark', names)
        self.assertNotIn('Postulancy', ranks)
        self.assertIn('Rev. Deacon John', names)
        self.assertIn('Rev. Fr. Peter', names)

        # Ensure postulancy document types are excluded from missing list
        for r in rows:
            missing_str = r[5]
            self.assertNotIn('Letter of Intention (Postulancy)', missing_str)

    def test_status_report_excludes_postulancy_records(self):
        report = reports.build_report('status_report')
        rows = report['sections'][0]['rows']
        names = [r[0] for r in rows]
        self.assertNotIn('Postulant Mark', names)
        self.assertIn('Rev. Deacon John', names)
        self.assertIn('Rev. Fr. Peter', names)

    def test_ordination_requirements_catalog_includes_postulancy(self):
        DocumentType.objects.get_or_create(
            name='Letter of Intention (Postulancy)',
            defaults={'required_from_rank': 'postulancy', 'is_required': True},
        )
        res = self.client.get(reverse('registrar:ordination_requirements'))
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, '<h4><i class="fa-solid fa-clipboard-check"></i> Postulancy</h4>')
        self.assertContains(res, '<h4><i class="fa-solid fa-clipboard-check"></i> Holy Order</h4>')
        self.assertContains(res, 'Letter of Intention (Postulancy)')
        self.assertContains(res, 'Date admitted as Holy Order')

    def test_ordination_requirements_preserves_read_only_req_grid_layout(self):
        DocumentType.objects.get_or_create(
            name='Letter of Intention (Postulancy)',
            defaults={'required_from_rank': 'postulancy', 'uploaded_by': 'clergy', 'is_required': True},
        )
        DocumentType.objects.get_or_create(
            name='Declaration of Conformity',
            defaults={'required_from_rank': 'deacon', 'uploaded_by': 'clergy', 'is_required': True},
        )
        res = self.client.get(reverse('registrar:ordination_requirements'))
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'class="req-grid"')
        self.assertContains(res, 'class="req-card"')
        self.assertNotContains(res, 'id="reqSectionNav"')
        self.assertNotContains(res, 'id="reqRankModal"')


class GeneratedReportsSearchTests(TestCase):
    def setUp(self):
        self.registrar = activate(User.objects.create_user(
            'reg_search', password='pw12345!x', is_staff=True, first_name='Ana', last_name='Reyes'
        ))
        self.other_registrar = activate(User.objects.create_user(
            'reg_other', password='pw12345!x', is_staff=True, first_name='Mark', last_name='Santos'
        ))
        self.client.force_login(self.registrar)

        self.r1 = GeneratedReport.objects.create(
            report_type='clerical_directory',
            title='Clerical Directory',
            file='generated_reports/clerical_directory_20260101.pdf',
            generated_by=self.registrar,
        )
        self.r2 = GeneratedReport.objects.create(
            report_type='status_report',
            title='Status Report',
            file='generated_reports/status_report_20260102.pdf',
            generated_by=self.other_registrar,
        )
        self.r3 = GeneratedReport.objects.create(
            report_type='per_deanery',
            title='Per-Deanery Report',
            file='generated_reports/per_deanery_20260103.pdf',
            generated_by=self.registrar,
        )
        self.archived = GeneratedReport.objects.create(
            report_type='status_report',
            title='Archived Status Report',
            file='generated_reports/status_report_old.pdf',
            generated_by=self.registrar,
            archived_at=timezone.now(),
            archived_by=self.registrar,
        )

    def test_search_by_title_and_generated_by(self):
        res = self.client.get(reverse('registrar:generate_report'), {'q': 'Directory'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(list(res.context['generated_reports']), [self.r1])

        res_by_user = self.client.get(reverse('registrar:generate_report'), {'q': 'Santos'})
        self.assertEqual(res_by_user.status_code, 200)
        self.assertEqual(list(res_by_user.context['generated_reports']), [self.r2])

    def test_filter_by_report_type(self):
        res = self.client.get(reverse('registrar:generate_report'), {'report_type': 'per_deanery'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(list(res.context['generated_reports']), [self.r3])

        res_invalid = self.client.get(reverse('registrar:generate_report'), {'report_type': 'nonexistent'})
        self.assertEqual(res_invalid.status_code, 200)
        self.assertEqual(list(res_invalid.context['generated_reports']), [])
        self.assertContains(res_invalid, 'No generated reports match your search.')

    def test_search_pagination_preserves_query_params(self):
        for i in range(12):
            GeneratedReport.objects.create(
                report_type='status_report',
                title=f'Status Report {i}',
                file=f'generated_reports/status_{i}.pdf',
                generated_by=self.registrar,
            )
        page1 = self.client.get(reverse('registrar:generate_report'), {'q': 'Status', 'report_type': 'status_report'})
        self.assertEqual(len(page1.context['generated_reports']), 10)
        self.assertTrue(page1.context['page'].has_next())
        self.assertContains(page1, 'q=Status&amp;report_type=status_report&amp;page=2')

        page2 = self.client.get(
            reverse('registrar:generate_report'),
            {'q': 'Status', 'report_type': 'status_report', 'page': 2},
        )
        self.assertEqual(len(page2.context['generated_reports']), 3)

    def test_dashboard_search_catalog_includes_active_generated_reports(self):
        res = self.client.get(reverse('registrar:dashboard'))
        self.assertEqual(res.status_code, 200)
        report_items = [item for item in res.context['portal_catalog'] if item['category'] == 'Generated Reports']
        titles = [item['title'] for item in report_items]
        self.assertIn('Clerical Directory', titles)
        self.assertIn('Status Report', titles)
        self.assertNotIn('Archived Status Report', titles)


class ContractReviewSearchAndPaginationTests(TestCase):
    def setUp(self):
        self.registrar = activate(User.objects.create_user('reg_contracts', password='pw12345!x', is_staff=True))
        self.client.force_login(self.registrar)
        self.deanery = Deanery.objects.create(name='Baguio Vicariate')
        today = date.today()
        expiring_end = today + timedelta(days=45)
        soon_month = next(m for m in range(4, 13) if m != expiring_end.month)
        self.soon_date = date(today.year + 2, soon_month, 15)
        self.c_expired = ClergyRecord.objects.create(
            id='CLG-501',
            name='Fr. Expired Alpha',
            assignment='St. Mark Mission',
            status='Active',
            contract_end=date(2025, 1, 10),
        )
        self.c_soon = ClergyRecord.objects.create(
            id='CLG-502',
            name='Fr. Soon Beta',
            deanery=self.deanery,
            assignment='St. Luke Parish',
            status='Active',
            contract_end=self.soon_date,
        )
        self.c_expiring = ClergyRecord.objects.create(
            id='CLG-505',
            name='Fr. Expiring Delta',
            assignment='St. John Mission',
            status='Active',
            contract_end=expiring_end,
        )
        self.c_upcoming = ClergyRecord.objects.create(
            id='CLG-503',
            name='Fr. Upcoming Gamma',
            assignment='Holy Cross Mission',
            status='On Leave',
            contract_end=date(2031, 3, 20),
        )
        self.c_none = ClergyRecord.objects.create(
            id='CLG-504',
            name='Fr. No Contract',
            assignment='Cathedral Parish',
            status='Active',
            contract_end=None,
        )

    def _ids(self, response):
        return [row['record'].id for row in response.context['rows']]

    def test_search_matches_identity_deanery_status_and_contract_end_formats(self):
        self.assertEqual(self._ids(self.client.get(reverse('registrar:contract_review'), {'q': 'Alpha'})), ['CLG-501'])
        self.assertEqual(self._ids(self.client.get(reverse('registrar:contract_review'), {'q': 'CLG-502'})), ['CLG-502'])
        self.assertEqual(self._ids(self.client.get(reverse('registrar:contract_review'), {'q': 'St. Luke'})), ['CLG-502'])
        self.assertEqual(self._ids(self.client.get(reverse('registrar:contract_review'), {'q': 'Baguio'})), ['CLG-502'])
        self.assertEqual(self._ids(self.client.get(reverse('registrar:contract_review'), {'q': 'On Leave'})), ['CLG-503'])

        # Date search formats for self.soon_date
        for date_query in (
            self.soon_date.isoformat(),
            str(self.soon_date.year),
            calendar.month_name[self.soon_date.month],
            f'{calendar.month_abbr[self.soon_date.month]} {self.soon_date.year}',
            dateformat.format(self.soon_date, 'N j, Y'),
            self.soon_date.strftime('%m/%d/%Y'),
        ):
            self.assertEqual(
                self._ids(self.client.get(reverse('registrar:contract_review'), {'q': date_query})),
                ['CLG-502'],
                msg=f'Expected CLG-502 for contract query {date_query!r}',
            )

    def test_expiry_and_status_filters(self):
        res_expired = self.client.get(reverse('registrar:contract_review'), {'expiry': 'expired'})
        self.assertEqual(self._ids(res_expired), ['CLG-501'])

        res_soon = self.client.get(reverse('registrar:contract_review'), {'expiry': 'expiring_soon'})
        self.assertEqual(self._ids(res_soon), ['CLG-505'])

        res_upcoming = self.client.get(reverse('registrar:contract_review'), {'expiry': 'upcoming'})
        self.assertIn('CLG-502', self._ids(res_upcoming))
        self.assertIn('CLG-503', self._ids(res_upcoming))
        self.assertNotIn('CLG-501', self._ids(res_upcoming))
        self.assertNotIn('CLG-505', self._ids(res_upcoming))

        res_leave = self.client.get(reverse('registrar:contract_review'), {'status': 'On Leave'})
        self.assertEqual(self._ids(res_leave), ['CLG-503'])

        res_empty = self.client.get(reverse('registrar:contract_review'), {'q': 'NobodyMatches'})
        self.assertEqual(self._ids(res_empty), [])
        self.assertContains(res_empty, 'No contracts match your search criteria.')

    def test_contract_review_paginates_preserving_search_and_filters(self):
        base = date.today() + timedelta(days=30)
        for i in range(1, 14):
            ClergyRecord.objects.create(
                id=f'CTR-{i:03d}',
                name=f'Fr. Renewal {i:03d}',
                status='Active',
                contract_end=base + timedelta(days=i),
            )
        page1 = self.client.get(
            reverse('registrar:contract_review'),
            {'q': 'Renewal', 'status': 'Active', 'per_page': 10},
        )
        self.assertEqual(len(page1.context['rows']), 10)
        self.assertTrue(page1.context['page'].has_next())
        self.assertContains(page1, 'q=Renewal&amp;status=Active&amp;per_page=10&amp;page=2')
        self.assertContains(page1, 'data-base-query="q=Renewal&amp;status=Active"')

        page2 = self.client.get(
            reverse('registrar:contract_review'),
            {'q': 'Renewal', 'status': 'Active', 'per_page': 10, 'page': 2},
        )
        self.assertEqual(len(page2.context['rows']), 3)

    def test_dashboard_search_catalog_indexes_contract_end_dates(self):
        res = self.client.get(reverse('registrar:dashboard'))
        self.assertEqual(res.status_code, 200)
        catalog = res.context['portal_catalog']
        clergy_item = next(item for item in catalog if item['title'] == 'Fr. Soon Beta')
        self.assertIn(self.soon_date.isoformat(), clergy_item['keywords'])
        self.assertIn(dateformat.format(self.soon_date, 'N j, Y').lower(), clergy_item['keywords'])
        action_titles = [item['title'] for item in catalog if item['category'] == 'Administrative Actions']
        self.assertIn('Contract Review', action_titles)


class ContractReviewModalUpdateTests(TestCase):
    def setUp(self):
        self.registrar = activate(User.objects.create_user('reg_modal', password='pw12345!x', is_staff=True))
        self.registrar.first_name = 'Maria Santos'
        self.registrar.save()
        self.client.force_login(self.registrar)

        self.deanery_baguio = Deanery.objects.create(name='Baguio')
        self.deanery_central = Deanery.objects.create(name='Central')
        Parish.objects.create(deanery=self.deanery_baguio, parish_name='St. Luke Parish', place_name='Baguio')
        Parish.objects.create(deanery=self.deanery_central, parish_name='All Saints Cathedral', place_name='Bontoc')

        self.record = ClergyRecord.objects.create(
            id='CLG-601',
            name='Fr. Juan Santos',
            date_of_birth=date(1980, 5, 10),
            email='juan@gmail.com',
            rank='priest',
            status='Active',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=date.today() + timedelta(days=20),
        )
        self.clergy_user = activate(User.objects.create_user('CLG-601', password='pw12345!x'))
        ClergyProfile.objects.create(user=self.clergy_user, record=self.record)
        self.update_url = reverse('registrar:update_contract_status', args=[self.record.id])

    def test_contract_review_renders_modal_and_row_attributes(self):
        res = self.client.get(reverse('registrar:contract_review'))
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'id="contractStatusModal"')
        self.assertContains(res, 'id="contractStatusForm" data-async-submit="true"')
        self.assertContains(res, 'Deployment &amp; Official Status')
        self.assertContains(res, 'id="contractModalClergyName"')
        self.assertContains(res, 'id="contractModalClergyId"')
        self.assertContains(res, 'id="contractModalFullRecordLink"')
        self.assertContains(res, 'aria-haspopup="listbox"')
        self.assertContains(res, 'id="deaneries-data"')
        self.assertContains(res, 'contract-review.js')
        self.assertContains(res, f'data-update-url="{self.update_url}"')
        self.assertContains(res, 'data-record-name="Fr. Juan Santos"')
        self.assertContains(res, 'data-record-id="CLG-601"')

        html = res.content.decode('utf-8')
        modal_html = html.split('id="contractStatusModal"', 1)[1]
        self.assertNotIn('<select', modal_html)

    def test_update_contract_status_requires_registrar_and_post(self):
        get_res = self.client.get(self.update_url)
        self.assertRedirects(get_res, reverse('registrar:contract_review'), fetch_redirect_response=False)

        ajax_get = self.client.get(self.update_url, HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        self.assertEqual(ajax_get.status_code, 405)

        clergy_client = Client()
        clergy_client.force_login(self.clergy_user)
        clergy_res = clergy_client.post(self.update_url, {
            'rank': 'bishop',
            'status': 'Retired',
            'contract_end': '2030-01-01',
        })
        self.assertEqual(clergy_res.status_code, 302)
        self.record.refresh_from_db()
        self.assertEqual(self.record.rank, 'priest')
        self.assertEqual(self.record.status, 'Active')

    def test_ajax_update_saves_deployment_and_official_status_and_notifies_clergy(self):
        new_end = date(2028, 6, 30)
        new_retire = date(2045, 5, 10)
        res = self.client.post(
            self.update_url,
            {
                'rank': 'bishop',
                'status': 'On Leave',
                'leave_reason': 'Sabbatical study',
                'deanery': str(self.deanery_central.id),
                'assignment': 'All Saints Cathedral - Bontoc',
                'contract_end': new_end.isoformat(),
                'retirement_date': new_retire.isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)
        payload = res.json()
        self.assertTrue(payload['ok'])
        self.assertIn('Fr. Juan Santos', payload['message'])

        self.record.refresh_from_db()
        self.assertEqual(self.record.name, 'Fr. Juan Santos')
        self.assertEqual(self.record.email, 'juan@gmail.com')
        self.assertEqual(self.record.rank, 'bishop')
        self.assertEqual(self.record.status, 'On Leave')
        self.assertEqual(self.record.leave_reason, 'Sabbatical study')
        self.assertEqual(self.record.deanery, self.deanery_central)
        self.assertEqual(self.record.assignment, 'All Saints Cathedral - Bontoc')
        self.assertEqual(self.record.contract_end, new_end)
        self.assertEqual(self.record.retirement_date, new_retire)

        note = Notification.objects.get(user=self.clergy_user, kind='record_updated')
        self.assertIn('Maria Santos (Registrar) changed:', note.message)
        self.assertIn('Status (now On Leave)', note.message)
        self.assertIn('Rank (now Bishop)', note.message)
        self.assertIn('Deanery (now Central)', note.message)
        self.assertIn('Contract end (now Jun 30, 2028)', note.message)
        self.assertNotIn('Sabbatical', note.message)

    def test_non_ajax_redirect_preserves_safe_filters_and_rejects_external_next(self):
        safe_next = reverse('registrar:contract_review') + '?q=Juan&status=Active'
        res_safe = self.client.post(self.update_url, {
            'rank': 'priest',
            'status': 'Active',
            'deanery': str(self.deanery_baguio.id),
            'assignment': 'St. Luke Parish - Baguio',
            'contract_end': '2029-12-31',
            'next': safe_next,
        })
        self.assertRedirects(res_safe, safe_next, fetch_redirect_response=False)

        res_evil = self.client.post(self.update_url, {
            'rank': 'priest',
            'status': 'Active',
            'deanery': str(self.deanery_baguio.id),
            'assignment': 'St. Luke Parish - Baguio',
            'contract_end': '2030-01-15',
            'next': 'https://evil.example/registrar/contract-review/?q=hack',
        })
        self.assertRedirects(res_evil, reverse('registrar:contract_review'), fetch_redirect_response=False)

    def test_validation_errors_return_400_without_saving(self):
        orig_end = self.record.contract_end

        res_leave = self.client.post(
            self.update_url,
            {
                'rank': 'priest',
                'status': 'On Leave',
                'leave_reason': '   ',
                'contract_end': orig_end.isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res_leave.status_code, 400)
        self.assertIn('leave_reason', res_leave.json()['errors'])

        res_dob = self.client.post(
            self.update_url,
            {
                'rank': 'priest',
                'status': 'Active',
                'contract_end': '1975-01-01',
                'retirement_date': '1970-01-01',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res_dob.status_code, 400)
        errors = res_dob.json()['errors']
        self.assertIn('contract_end', errors)
        self.assertIn('retirement_date', errors)

        self.record.refresh_from_db()
        self.assertEqual(self.record.status, 'Active')
        self.assertEqual(self.record.contract_end, orig_end)

    def test_archived_record_cannot_leave_retired_status(self):
        self.record.status = 'Retired'
        self.record.archived_at = timezone.now()
        self.record.archived_by = self.registrar
        self.record.save()

        res = self.client.post(
            self.update_url,
            {
                'rank': 'priest',
                'status': 'Active',
                'contract_end': (date.today() + timedelta(days=30)).isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('status', res.json()['errors'])
        self.record.refresh_from_db()
        self.assertEqual(self.record.status, 'Retired')

    def test_moving_contract_end_to_past_records_expired_deployment(self):
        past_end = date.today() - timedelta(days=5)
        res = self.client.post(
            self.update_url,
            {
                'rank': 'priest',
                'status': 'Active',
                'deanery': str(self.deanery_baguio.id),
                'assignment': 'St. Luke Parish - Baguio',
                'contract_end': past_end.isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)
        dep = self.record.deployments.filter(end_date=past_end).first()
        self.assertIsNotNone(dep)
        self.assertEqual(dep.station_name, 'St. Luke Parish')
        self.assertFalse(dep.is_current)


class ReportGenerationProgressTests(TestCase):
    def setUp(self):
        self.tmp_media = tempfile.mkdtemp(prefix='ednp_report_progress_')
        self.addCleanup(shutil.rmtree, self.tmp_media, True)
        self.registrar = activate(User.objects.create_user('reg_report_prog', password='pw12345!x', is_staff=True))
        self.client.force_login(self.registrar)
        self.url = reverse('registrar:generate_report')
        ClergyRecord.objects.create(id='CLG-701', name='Fr. Report Alpha', rank='priest', status='Active')
        ClergyRecord.objects.create(id='CLG-702', name='Rev. Report Beta', rank='deacon', status='Active')
        ClergyRecord.objects.create(id='CLG-703', name='Postulant Excluded', rank='postulancy', status='Active')

    def test_get_renders_progress_modal_config_and_async_form(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'id="generateReportForm"')
        self.assertContains(res, 'data-async-submit="true"')
        self.assertContains(res, 'id="reportProgressModal"')
        self.assertContains(res, 'role="progressbar"')
        self.assertContains(res, 'id="reportProgressCountdownValue"')
        self.assertContains(res, 'id="reportProgressConfig"')
        self.assertContains(res, 'registrar/css/report-progress.css')

        cfg = res.context['report_progress_config']
        self.assertEqual(cfg['clergy_count'], 2)
        self.assertEqual(set(cfg['estimates'].keys()), set(reports.REPORT_TYPES.keys()))
        for sec in cfg['estimates'].values():
            self.assertIsInstance(sec, int)
            self.assertGreaterEqual(sec, 4)

    def test_estimate_generation_seconds_scales_and_bounds(self):
        self.assertGreaterEqual(reports.estimate_generation_seconds('clerical_directory', 0), 6)
        self.assertGreater(
            reports.estimate_generation_seconds('clerical_directory', 264),
            reports.estimate_generation_seconds('status_report', 264),
        )
        self.assertGreater(
            reports.estimate_generation_seconds('ordination_documents', 264),
            reports.estimate_generation_seconds('per_deanery', 264),
        )
        self.assertLessEqual(reports.estimate_generation_seconds('ordination_documents', 5000), 300)

    def test_ajax_post_generates_report_and_returns_json(self):
        with override_settings(MEDIA_ROOT=self.tmp_media):
            with mock.patch('registrar.reports.render_pdf', return_value=PDF) as mocked_render:
                res = self.client.post(
                    self.url,
                    {'type': 'status_report'},
                    HTTP_X_REQUESTED_WITH='XMLHttpRequest',
                    HTTP_ACCEPT='application/json',
                )
        self.assertEqual(res.status_code, 200)
        mocked_render.assert_called_once()
        payload = res.json()
        self.assertTrue(payload['ok'])
        self.assertEqual(payload['message'], 'Status Report generated.')
        self.assertGreaterEqual(payload['duration_seconds'], 0.0)
        self.assertEqual(payload['redirect_url'], self.url)
        self.assertEqual(payload['report']['report_type'], 'status_report')
        self.assertEqual(payload['report']['title'], 'Status Report')
        self.assertTrue(GeneratedReport.objects.filter(id=payload['report']['id']).exists())

    def test_ajax_post_invalid_type_returns_400_json(self):
        res = self.client.post(
            self.url,
            {'type': 'unknown_type'},
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 400)
        payload = res.json()
        self.assertFalse(payload['ok'])
        self.assertEqual(payload['message'], 'Please choose a report type first.')
        self.assertEqual(GeneratedReport.objects.count(), 0)

    def test_ajax_post_pdf_error_returns_500_json(self):
        from ednp.pdf import PdfGenerationError

        with mock.patch('registrar.reports.render_pdf', side_effect=PdfGenerationError('GTK runtime unavailable')):
            res = self.client.post(
                self.url,
                {'type': 'clerical_directory'},
                HTTP_X_REQUESTED_WITH='XMLHttpRequest',
            )
        self.assertEqual(res.status_code, 500)
        payload = res.json()
        self.assertFalse(payload['ok'])
        self.assertEqual(payload['message'], 'GTK runtime unavailable')
        self.assertEqual(GeneratedReport.objects.count(), 0)

    def test_non_ajax_post_keeps_redirect_and_flash_behavior(self):
        with override_settings(MEDIA_ROOT=self.tmp_media):
            with mock.patch('registrar.reports.render_pdf', return_value=PDF):
                res = self.client.post(self.url, {'type': 'per_deanery'})
        self.assertEqual(res.status_code, 302)
        self.assertEqual(res['Location'], self.url)
        self.assertEqual(GeneratedReport.objects.filter(report_type='per_deanery').count(), 1)







