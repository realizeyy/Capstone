import io
from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import Client, TestCase
from django.urls import reverse

from accounts.testing import activate
from clergy import notifications
from clergy.models import ClergyProfile, Notification

from . import reports
from .models import ClergyDeployment, ClergyRecord, Deanery, Parish, sync_expired_contracts

User = get_user_model()


class LifecycleBaseTestCase(TestCase):
    def setUp(self):
        self.registrar = activate(User.objects.create_user('reg_life', password='pw12345!x', is_staff=True))
        self.registrar.first_name = 'Maria Santos'
        self.registrar.save()
        self.client.force_login(self.registrar)

        self.deanery_baguio = Deanery.objects.create(name='Baguio')
        self.deanery_central = Deanery.objects.create(name='Central')
        Parish.objects.create(deanery=self.deanery_baguio, parish_name='St. Luke Parish', place_name='Baguio')
        Parish.objects.create(deanery=self.deanery_central, parish_name='All Saints Cathedral', place_name='Bontoc')
        Parish.objects.create(deanery=self.deanery_central, parish_name='St. Barnabas Parish', place_name='Alab')

    def _link_clergy(self, record):
        user = activate(User.objects.create_user(record.id, password='pw12345!x'))
        profile = ClergyProfile.objects.create(user=user, record=record)
        return user, profile


class AssignmentDeploymentSyncTests(LifecycleBaseTestCase):
    def test_create_record_with_assignment_creates_current_deployment(self):
        res = self.client.post(
            reverse('registrar:create_record'),
            {
                'name': 'Fr. Mateo',
                'deanery': str(self.deanery_baguio.id),
                'assignment': 'St. Luke Parish - Baguio',
                'status': 'Active',
                'rank': 'priest',
                'contract_end': (date.today() + timedelta(days=365)).isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
            HTTP_X_SLIP_FORMAT='html',
        )
        self.assertEqual(res.status_code, 200)
        record = ClergyRecord.objects.get(name='Fr. Mateo')
        deps = list(record.deployments.all())
        self.assertEqual(len(deps), 1)
        self.assertEqual(deps[0].station_name, 'St. Luke Parish')
        self.assertEqual(deps[0].place_name, 'Baguio')
        self.assertEqual(deps[0].role, 'Priest-in-Charge')
        self.assertEqual(deps[0].start_date, date.today())
        self.assertIsNone(deps[0].end_date)
        self.assertTrue(deps[0].is_current)

    def test_changing_assignment_on_record_detail_closes_old_and_opens_new_deployment(self):
        record = ClergyRecord.objects.create(
            id='CLG-701',
            name='Fr. Lucas',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=date.today() + timedelta(days=120),
        )
        old_start = date.today() - timedelta(days=400)
        old_dep = ClergyDeployment.objects.create(
            record=record,
            station_name='St. Luke Parish',
            place_name='Baguio',
            role='Priest-in-Charge',
            start_date=old_start,
            is_current=True,
        )

        res = self.client.post(
            reverse('registrar:record_detail', args=[record.id]),
            {
                'name': record.name,
                'rank': 'priest',
                'status': 'Active',
                'deanery': str(self.deanery_central.id),
                'assignment': 'All Saints Cathedral - Bontoc',
                'contract_end': (date.today() + timedelta(days=365)).isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)

        old_dep.refresh_from_db()
        self.assertFalse(old_dep.is_current)
        self.assertEqual(old_dep.end_date, date.today())

        current_deps = list(record.deployments.filter(is_current=True))
        self.assertEqual(len(current_deps), 1)
        self.assertEqual(current_deps[0].station_name, 'All Saints Cathedral')
        self.assertEqual(current_deps[0].place_name, 'Bontoc')
        self.assertEqual(current_deps[0].start_date, date.today())
        self.assertIsNone(current_deps[0].end_date)
        # Old service duration must remain intact after closing
        self.assertGreaterEqual(record.total_service_days, 400)

    def test_changing_assignment_on_contract_modal_closes_old_and_opens_new_deployment(self):
        record = ClergyRecord.objects.create(
            id='CLG-702',
            name='Fr. Tomas',
            status='Active',
            rank='deacon',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=date.today() + timedelta(days=30),
        )
        old_dep = ClergyDeployment.objects.create(
            record=record,
            station_name='St. Luke Parish',
            place_name='Baguio',
            role='Deacon',
            start_date=date.today() - timedelta(days=200),
            is_current=True,
        )

        res = self.client.post(
            reverse('registrar:update_contract_status', args=[record.id]),
            {
                'rank': 'priest',
                'status': 'Active',
                'deanery': str(self.deanery_central.id),
                'assignment': 'St. Barnabas Parish - Alab',
                'contract_end': (date.today() + timedelta(days=365)).isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)

        old_dep.refresh_from_db()
        self.assertFalse(old_dep.is_current)
        self.assertEqual(old_dep.end_date, date.today())

        new_dep = record.deployments.get(is_current=True)
        self.assertEqual(new_dep.station_name, 'St. Barnabas Parish')
        self.assertEqual(new_dep.place_name, 'Alab')
        self.assertEqual(new_dep.role, 'Priest-in-Charge')
        self.assertEqual(new_dep.start_date, date.today())

    def test_clearing_assignment_closes_current_deployment_without_creating_blank_row(self):
        record = ClergyRecord.objects.create(
            id='CLG-703',
            name='Fr. Andres',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
        )
        old_dep = ClergyDeployment.objects.create(
            record=record,
            station_name='St. Luke Parish',
            start_date=date.today() - timedelta(days=100),
            is_current=True,
        )

        res = self.client.post(
            reverse('registrar:record_detail', args=[record.id]),
            {
                'name': record.name,
                'rank': 'priest',
                'status': 'On Leave',
                'leave_reason': 'Sabbatical',
                'deanery': '',
                'assignment': '',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)

        old_dep.refresh_from_db()
        self.assertFalse(old_dep.is_current)
        self.assertEqual(old_dep.end_date, date.today())
        self.assertEqual(record.deployments.count(), 1)

    def test_editing_unrelated_fields_does_not_create_spurious_deployment(self):
        record = ClergyRecord.objects.create(
            id='CLG-704',
            name='Fr. Felipe',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
        )
        res = self.client.post(
            reverse('registrar:record_detail', args=[record.id]),
            {
                'name': 'Fr. Felipe Updated',
                'email': 'felipe@gmail.com',
                'rank': 'priest',
                'status': 'Active',
                'deanery': str(self.deanery_baguio.id),
                'assignment': 'St. Luke Parish - Baguio',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(record.deployments.count(), 0)

    def test_clergy_adding_deployment_does_not_overwrite_official_assignment_and_preserves_old_end_date(self):
        record = ClergyRecord.objects.create(
            id='CLG-705',
            name='Fr. Simon',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
        )
        user, _ = self._link_clergy(record)
        old_start = date.today() - timedelta(days=500)
        old_dep = ClergyDeployment.objects.create(
            record=record,
            station_name='St. Luke Parish',
            place_name='Baguio',
            start_date=old_start,
            is_current=True,
        )

        clergy_client = Client()
        clergy_client.force_login(user)
        new_start = date.today() - timedelta(days=10)
        res = clergy_client.post(
            reverse('clergy:my_profile'),
            {
                'action': 'add_deployment',
                'station_name': 'Mission Chapel',
                'place_name': 'Sagada',
                'role': 'Visiting Priest',
                'start_date': new_start.isoformat(),
                'is_current': '1',
            },
        )
        self.assertEqual(res.status_code, 302)

        record.refresh_from_db()
        self.assertEqual(record.assignment, 'St. Luke Parish - Baguio')
        self.assertEqual(record.deanery, self.deanery_baguio)

        old_dep.refresh_from_db()
        self.assertFalse(old_dep.is_current)
        self.assertEqual(old_dep.end_date, new_start)
        self.assertGreaterEqual(record.total_service_days, 500)

    def test_renewing_expired_contract_for_same_assignment_opens_new_current_deployment(self):
        past_end = date.today() - timedelta(days=10)
        record = ClergyRecord.objects.create(
            id='CLG-706',
            name='Fr. Bartolome',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=past_end,
        )
        record.record_expired_contract()
        self.assertFalse(record.deployments.filter(is_current=True).exists())

        res = self.client.post(
            reverse('registrar:update_contract_status', args=[record.id]),
            {
                'rank': 'priest',
                'status': 'Active',
                'deanery': str(self.deanery_baguio.id),
                'assignment': 'St. Luke Parish - Baguio',
                'contract_end': (date.today() + timedelta(days=365)).isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)
        current_dep = record.deployments.filter(is_current=True).first()
        self.assertIsNotNone(current_dep)
        self.assertEqual(current_dep.station_name, 'St. Luke Parish')
        self.assertEqual(current_dep.start_date, date.today())

    def test_retired_clergy_cannot_add_current_deployment_but_can_add_past_deployment(self):
        record = ClergyRecord.objects.create(
            id='CLG-707',
            name='Fr. Retirado',
            status='Retired',
            rank='priest',
            retirement_date=date.today() - timedelta(days=30),
        )
        user, _ = self._link_clergy(record)

        # Registrar blocked from adding is_current=True on Retired record
        reg_res = self.client.post(
            reverse('registrar:record_detail', args=[record.id]),
            {
                'action': 'add_deployment',
                'station_name': 'St. Luke Parish',
                'start_date': '2020-01-01',
                'is_current': '1',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(reg_res.status_code, 400)
        self.assertFalse(record.deployments.exists())

        # Clergy also blocked from adding is_current=True on Retired record
        clergy_client = Client()
        clergy_client.force_login(user)
        clergy_res = clergy_client.post(
            reverse('clergy:my_profile'),
            {
                'action': 'add_deployment',
                'station_name': 'St. Luke Parish',
                'start_date': '2020-01-01',
                'is_current': '1',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(clergy_res.status_code, 400)
        self.assertFalse(record.deployments.exists())

        # Past deployment (is_current omitted) is still allowed
        past_res = clergy_client.post(
            reverse('clergy:my_profile'),
            {
                'action': 'add_deployment',
                'station_name': 'St. Luke Parish',
                'start_date': '2015-01-01',
                'end_date': '2020-12-31',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(past_res.status_code, 200)
        self.assertEqual(record.deployments.count(), 1)
        self.assertFalse(record.deployments.get().is_current)


class CleanRetirementTests(LifecycleBaseTestCase):
    def test_retiring_via_record_detail_closes_deployments_clears_active_fields_and_defaults_date(self):
        record = ClergyRecord.objects.create(
            id='CLG-711',
            name='Fr. Bernardo',
            status='On Leave',
            leave_reason='Medical recovery',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=date.today() + timedelta(days=90),
        )
        dep = ClergyDeployment.objects.create(
            record=record,
            station_name='St. Luke Parish',
            place_name='Baguio',
            start_date=date.today() - timedelta(days=600),
            is_current=True,
        )

        res = self.client.post(
            reverse('registrar:record_detail', args=[record.id]),
            {
                'name': record.name,
                'rank': 'priest',
                'status': 'Retired',
                'deanery': str(self.deanery_baguio.id),
                'assignment': 'St. Luke Parish - Baguio',
                'contract_end': (date.today() + timedelta(days=90)).isoformat(),
                'retirement_date': '',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)

        record.refresh_from_db()
        self.assertEqual(record.status, 'Retired')
        self.assertEqual(record.retirement_date, date.today())
        self.assertIsNone(record.deanery)
        self.assertEqual(record.assignment, '')
        self.assertIsNone(record.contract_end)
        self.assertEqual(record.leave_reason, '')

        dep.refresh_from_db()
        self.assertFalse(dep.is_current)
        self.assertEqual(dep.end_date, date.today())

    def test_retiring_via_contract_modal_cleans_up_and_removes_from_contract_review(self):
        ret_date = date.today() - timedelta(days=2)
        record = ClergyRecord.objects.create(
            id='CLG-712',
            name='Fr. Miguel',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=date.today() + timedelta(days=15),
        )
        dep = ClergyDeployment.objects.create(
            record=record,
            station_name='St. Luke Parish',
            place_name='Baguio',
            start_date=date.today() - timedelta(days=365),
            is_current=True,
        )

        res = self.client.post(
            reverse('registrar:update_contract_status', args=[record.id]),
            {
                'rank': 'priest',
                'status': 'Retired',
                'deanery': str(self.deanery_baguio.id),
                'assignment': 'St. Luke Parish - Baguio',
                'contract_end': (date.today() + timedelta(days=15)).isoformat(),
                'retirement_date': ret_date.isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)

        record.refresh_from_db()
        self.assertEqual(record.status, 'Retired')
        self.assertEqual(record.retirement_date, ret_date)
        self.assertIsNone(record.deanery)
        self.assertEqual(record.assignment, '')
        self.assertIsNone(record.contract_end)

        dep.refresh_from_db()
        self.assertFalse(dep.is_current)
        self.assertEqual(dep.end_date, ret_date)

        cr_res = self.client.get(reverse('registrar:contract_review'))
        self.assertEqual([row['record'].id for row in cr_res.context['rows']], [])

    def test_retiring_preserves_unlogged_last_assignment_in_deployment_history(self):
        ret_date = date.today() - timedelta(days=5)
        record = ClergyRecord.objects.create(
            id='CLG-713',
            name='Fr. Rafael',
            status='Active',
            rank='priest',
            deanery=self.deanery_central,
            assignment='All Saints Cathedral - Bontoc',
            contract_end=date.today() + timedelta(days=30),
        )

        res = self.client.post(
            reverse('registrar:record_detail', args=[record.id]),
            {
                'name': record.name,
                'rank': 'priest',
                'status': 'Retired',
                'deanery': str(self.deanery_central.id),
                'assignment': 'All Saints Cathedral - Bontoc',
                'retirement_date': ret_date.isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)

        record.refresh_from_db()
        self.assertEqual(record.assignment, '')
        dep = record.deployments.first()
        self.assertIsNotNone(dep)
        self.assertEqual(dep.station_name, 'All Saints Cathedral')
        self.assertEqual(dep.place_name, 'Bontoc')
        self.assertEqual(dep.end_date, ret_date)
        self.assertFalse(dep.is_current)

    def test_create_retired_record_without_assignment_succeeds_and_defaults_retirement_date(self):
        res = self.client.post(
            reverse('registrar:create_record'),
            {
                'name': 'Fr. Senior',
                'status': 'Retired',
                'rank': 'priest',
                'contract_end': (date.today() + timedelta(days=60)).isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
            HTTP_X_SLIP_FORMAT='html',
        )
        self.assertEqual(res.status_code, 200)
        record = ClergyRecord.objects.get(name='Fr. Senior')
        self.assertEqual(record.status, 'Retired')
        self.assertEqual(record.retirement_date, date.today())
        self.assertIsNone(record.deanery)
        self.assertEqual(record.assignment, '')
        self.assertIsNone(record.contract_end)
        self.assertFalse(record.deployments.filter(is_current=True).exists())

    def test_unarchived_retired_record_excluded_from_contract_review_dashboard_expiry_and_sync(self):
        past_end = date.today() - timedelta(days=15)
        retired = ClergyRecord.objects.create(
            id='CLG-714',
            name='Fr. Legacy Retired',
            status='Retired',
            rank='priest',
            assignment='St. Luke Parish - Baguio',
            contract_end=past_end,
            retirement_date=date.today() - timedelta(days=40),
        )
        # sync_expired_contracts skips Retired records
        self.assertEqual(sync_expired_contracts(), 0)
        self.assertFalse(retired.deployments.exists())

        # Contract Review excludes Retired records and omits Retired from filter dropdown
        cr_res = self.client.get(reverse('registrar:contract_review'))
        self.assertEqual([row['record'].id for row in cr_res.context['rows']], [])
        filter_values = [val for val, _ in cr_res.context['filter_status_choices']]
        self.assertNotIn('Retired', filter_values)
        modal_values = [val for val, _ in cr_res.context['status_choices']]
        self.assertIn('Retired', modal_values)

        # Dashboard expiry stat excludes Retired records
        dash_res = self.client.get(reverse('registrar:dashboard'))
        self.assertEqual(dash_res.context['stats']['expiry'], 0)

    def test_clergy_dashboard_and_print_show_retirement_instead_of_contract_end_when_retired(self):
        ret_date = date(2025, 6, 15)
        record = ClergyRecord.objects.create(
            id='CLG-715',
            name='Fr. Emeritus',
            status='Retired',
            rank='priest',
            retirement_date=ret_date,
        )
        user, _ = self._link_clergy(record)
        clergy_client = Client()
        clergy_client.force_login(user)

        dash = clergy_client.get(reverse('clergy:dashboard'))
        self.assertEqual(dash.status_code, 200)
        self.assertContains(dash, 'Retirement Date')
        self.assertContains(dash, 'Jun 15, 2025')
        self.assertContains(dash, 'Retired from active ministry')
        self.assertNotContains(dash, 'No expiry notice yet')
        self.assertNotContains(dash, 'Contract ended')
        self.assertNotContains(dash, '<span class="badge green">Retired</span>')

        print_res = clergy_client.get(reverse('clergy:print_own_record'))
        self.assertEqual(print_res.status_code, 200)
        self.assertContains(print_res, 'Jun 2025')
        self.assertContains(print_res, 'Retired')
        self.assertNotContains(print_res, '>Permanent<')


class RetirementDateInteractionTests(LifecycleBaseTestCase):
    def test_future_retirement_date_keeps_active_status_until_date_arrives(self):
        future_ret = date.today() + timedelta(days=400)
        record = ClergyRecord.objects.create(
            id='CLG-721',
            name='Fr. Future Retire',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=date.today() + timedelta(days=100),
        )
        res = self.client.post(
            reverse('registrar:update_contract_status', args=[record.id]),
            {
                'rank': 'priest',
                'status': 'Active',
                'deanery': str(self.deanery_baguio.id),
                'assignment': 'St. Luke Parish - Baguio',
                'contract_end': (date.today() + timedelta(days=100)).isoformat(),
                'retirement_date': future_ret.isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)
        record.refresh_from_db()
        self.assertEqual(record.status, 'Active')
        self.assertEqual(record.retirement_date, future_ret)
        self.assertEqual(record.assignment, 'St. Luke Parish - Baguio')
        self.assertIsNotNone(record.contract_end)

    def test_past_or_today_retirement_date_on_save_auto_retires_cleanly(self):
        record = ClergyRecord.objects.create(
            id='CLG-722',
            name='Fr. Auto Retire Save',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=date.today() + timedelta(days=60),
        )
        user, _ = self._link_clergy(record)
        dep = ClergyDeployment.objects.create(
            record=record,
            station_name='St. Luke Parish',
            start_date=date.today() - timedelta(days=400),
            is_current=True,
        )

        res = self.client.post(
            reverse('registrar:record_detail', args=[record.id]),
            {
                'name': record.name,
                'rank': 'priest',
                'status': 'Active',
                'deanery': str(self.deanery_baguio.id),
                'assignment': 'St. Luke Parish - Baguio',
                'contract_end': (date.today() + timedelta(days=60)).isoformat(),
                'retirement_date': date.today().isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)
        record.refresh_from_db()
        self.assertEqual(record.status, 'Retired')
        self.assertEqual(record.retirement_date, date.today())
        self.assertIsNone(record.deanery)
        self.assertEqual(record.assignment, '')
        self.assertIsNone(record.contract_end)

        dep.refresh_from_db()
        self.assertFalse(dep.is_current)
        self.assertEqual(dep.end_date, date.today())

        note = Notification.objects.get(user=user, kind='record_updated')
        self.assertIn('Status (now Retired)', note.message)
        self.assertIn('Contract end (cleared)', note.message)

    def test_scheduled_retirement_auto_transitions_lazily_on_views_reports_and_command(self):
        # 1. Via clergy_records page
        rec1 = ClergyRecord.objects.create(
            id='CLG-723',
            name='Fr. Due Roster',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=date.today() + timedelta(days=30),
            retirement_date=date.today(),
        )
        dep1 = ClergyDeployment.objects.create(
            record=rec1,
            station_name='St. Luke Parish',
            start_date=date.today() - timedelta(days=300),
            is_current=True,
        )
        self.client.get(reverse('registrar:clergy_records'))
        rec1.refresh_from_db()
        dep1.refresh_from_db()
        self.assertEqual(rec1.status, 'Retired')
        self.assertEqual(rec1.assignment, '')
        self.assertIsNone(rec1.contract_end)
        self.assertFalse(dep1.is_current)
        self.assertEqual(dep1.end_date, date.today())

        # 2. Via clergy dashboard (clergy user opening portal on retirement day)
        rec2 = ClergyRecord.objects.create(
            id='CLG-724',
            name='Fr. Due Clergy Portal',
            status='Active',
            rank='priest',
            deanery=self.deanery_central,
            assignment='All Saints Cathedral - Bontoc',
            contract_end=date.today() + timedelta(days=10),
            retirement_date=date.today() - timedelta(days=1),
        )
        user2, _ = self._link_clergy(rec2)
        clergy_client = Client()
        clergy_client.force_login(user2)
        dash = clergy_client.get(reverse('clergy:dashboard'))
        self.assertEqual(dash.status_code, 200)
        rec2.refresh_from_db()
        self.assertEqual(rec2.status, 'Retired')
        self.assertIsNone(rec2.contract_end)
        self.assertContains(dash, 'Retirement Date')

        # 3. Via report builder
        rec3 = ClergyRecord.objects.create(
            id='CLG-725',
            name='Fr. Due Report',
            status='Active',
            rank='priest',
            retirement_date=date.today(),
        )
        report = reports.build_report('status_report')
        rec3.refresh_from_db()
        self.assertEqual(rec3.status, 'Retired')
        rows_by_name = {row[0]: row[1] for row in report['sections'][0]['rows']}
        self.assertEqual(rows_by_name['Fr. Due Report'], 'Retired')

        # 4. Via management command
        rec4 = ClergyRecord.objects.create(
            id='CLG-726',
            name='Fr. Due Command',
            status='Active',
            rank='priest',
            assignment='St. Luke Parish - Baguio',
            retirement_date=date.today(),
        )
        out = io.StringIO()
        call_command('sync_expired_contracts', stdout=out)
        rec4.refresh_from_db()
        self.assertEqual(rec4.status, 'Retired')
        self.assertIn('Successfully synchronized', out.getvalue())

    def test_future_retirement_date_rejected_when_status_is_retired(self):
        record = ClergyRecord.objects.create(
            id='CLG-727',
            name='Fr. Invalid Future Retired',
            status='Active',
            rank='priest',
        )
        res = self.client.post(
            reverse('registrar:update_contract_status', args=[record.id]),
            {
                'rank': 'priest',
                'status': 'Retired',
                'retirement_date': (date.today() + timedelta(days=30)).isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn('retirement_date', res.json()['errors'])
        record.refresh_from_db()
        self.assertEqual(record.status, 'Active')

    def test_unretiring_a_record_clears_past_retirement_date_and_allows_reactivation(self):
        record = ClergyRecord.objects.create(
            id='CLG-728',
            name='Fr. Reactivated',
            status='Retired',
            rank='priest',
            retirement_date=date.today() - timedelta(days=10),
        )
        res = self.client.post(
            reverse('registrar:record_detail', args=[record.id]),
            {
                'name': record.name,
                'rank': 'priest',
                'status': 'Active',
                'deanery': str(self.deanery_baguio.id),
                'assignment': 'St. Luke Parish - Baguio',
                'contract_end': (date.today() + timedelta(days=180)).isoformat(),
                'retirement_date': record.retirement_date.isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)
        record.refresh_from_db()
        self.assertEqual(record.status, 'Active')
        self.assertIsNone(record.retirement_date)
        self.assertEqual(record.assignment, 'St. Luke Parish - Baguio')
        self.assertTrue(record.deployments.filter(is_current=True, station_name='St. Luke Parish').exists())

    def test_scheduled_retirement_takes_precedence_over_contract_expiry_when_both_passed(self):
        past = date.today() - timedelta(days=5)
        record = ClergyRecord.objects.create(
            id='CLG-729',
            name='Fr. Both Passed',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=past,
            retirement_date=past,
        )
        dep = ClergyDeployment.objects.create(
            record=record,
            station_name='St. Luke Parish',
            start_date=date.today() - timedelta(days=500),
            is_current=True,
        )

        self.client.get(reverse('registrar:contract_review'))
        record.refresh_from_db()
        dep.refresh_from_db()
        self.assertEqual(record.status, 'Retired')
        self.assertIsNone(record.contract_end)
        self.assertEqual(record.assignment, '')
        self.assertFalse(dep.is_current)
        self.assertEqual(dep.end_date, past)
        self.assertIn('retirement', (dep.notes or '').lower())


class ContractExpiryBoundaryTests(LifecycleBaseTestCase):
    def test_contract_ending_today_is_not_expired_yet(self):
        today = date.today()
        record = ClergyRecord.objects.create(
            id='CLG-731',
            name='Fr. Ends Today',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=today,
        )
        user, _ = self._link_clergy(record)
        dep = ClergyDeployment.objects.create(
            record=record,
            station_name='St. Luke Parish',
            start_date=today - timedelta(days=365),
            is_current=True,
        )

        # Must not expire on the exact end date
        self.assertFalse(record.record_expired_contract(today=today))
        self.assertEqual(sync_expired_contracts(today=today), 0)
        dep.refresh_from_db()
        self.assertTrue(dep.is_current)
        self.assertIsNone(dep.end_date)

        # Contract Review puts it under expiring_soon (not expired)
        res_expired = self.client.get(reverse('registrar:contract_review'), {'expiry': 'expired'})
        self.assertNotIn(record.id, [r['record'].id for r in res_expired.context['rows']])
        res_soon = self.client.get(reverse('registrar:contract_review'), {'expiry': 'expiring_soon'})
        self.assertIn(record.id, [r['record'].id for r in res_soon.context['rows']])
        self.assertContains(res_soon, 'Ends today')

        # Clergy notifications send contract_reminder (ends today), not contract_ended
        notifications.sync_reminders(user, record, today=today)
        note = Notification.objects.get(user=user)
        self.assertEqual(note.kind, 'contract_reminder')
        self.assertIn('ends today', note.message)

    def test_contract_ended_yesterday_closes_deployment_and_stays_on_contract_review(self):
        today = date.today()
        yesterday = today - timedelta(days=1)
        start = today - timedelta(days=400)
        record = ClergyRecord.objects.create(
            id='CLG-732',
            name='Fr. Expired Yesterday',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=yesterday,
        )
        dep = ClergyDeployment.objects.create(
            record=record,
            station_name='St. Luke Parish',
            place_name='Baguio',
            start_date=start,
            is_current=True,
        )

        res = self.client.get(reverse('registrar:contract_review'), {'expiry': 'expired'})
        self.assertEqual(res.status_code, 200)
        self.assertIn(record.id, [r['record'].id for r in res.context['rows']])
        self.assertContains(res, 'Expired (1d overdue)')

        record.refresh_from_db()
        # Status and assignment stay visible for registrar decision
        self.assertEqual(record.status, 'Active')
        self.assertEqual(record.assignment, 'St. Luke Parish - Baguio')

        dep.refresh_from_db()
        self.assertFalse(dep.is_current)
        self.assertEqual(dep.start_date, start)
        self.assertEqual(dep.end_date, yesterday)
        self.assertEqual(record.total_service_days, (yesterday - start).days)

    def test_retire_then_unretire_and_set_contract_reappears_on_contract_review(self):
        today = date.today()
        record = ClergyRecord.objects.create(
            id='CLG-733',
            name='Fr. Return Active',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=today + timedelta(days=30),
        )
        # 1. Retire via Contract Review modal -> removed from Contract Review
        retire_res = self.client.post(
            reverse('registrar:update_contract_status', args=[record.id]),
            {
                'rank': 'priest',
                'status': 'Retired',
                'deanery': '',
                'assignment': '',
                'contract_end': '',
                'retirement_date': '',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(retire_res.status_code, 200)
        cr_after_retire = self.client.get(reverse('registrar:contract_review'), {'q': record.id})
        self.assertEqual([r['record'].id for r in cr_after_retire.context['rows']], [])

        # 2. Unretire and set a new contract via Record Detail AJAX
        new_end = today + timedelta(days=90)
        unretire_res = self.client.post(
            reverse('registrar:record_detail', args=[record.id]),
            {
                'name': record.name,
                'rank': 'priest',
                'status': 'Active',
                'deanery': str(self.deanery_central.id),
                'assignment': 'All Saints Cathedral - Bontoc',
                'contract_end': new_end.isoformat(),
                'retirement_date': '',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(unretire_res.status_code, 200)
        payload = unretire_res.json()
        self.assertTrue(payload['ok'])
        self.assertTrue(payload['lifecycle_changed'])
        self.assertEqual(payload['record']['status'], 'Active')
        self.assertEqual(payload['record']['contract_end'], new_end.isoformat())
        self.assertEqual(payload['record']['retirement_date'], '')

        # 3. Contract immediately reappears on Contract Review
        cr_after_unretire = self.client.get(reverse('registrar:contract_review'), {'q': record.id})
        rows = cr_after_unretire.context['rows']
        self.assertEqual([r['record'].id for r in rows], [record.id])
        self.assertEqual(rows[0]['record'].contract_end, new_end)

    def test_unretire_then_set_contract_in_two_separate_saves_reappears_on_contract_review(self):
        today = date.today()
        record = ClergyRecord.objects.create(
            id='CLG-734',
            name='Fr. Two Step Reactivate',
            status='Retired',
            rank='priest',
            retirement_date=today,
        )
        # Step 1: Unretire only (leaving assignment and contract blank)
        res1 = self.client.post(
            reverse('registrar:record_detail', args=[record.id]),
            {
                'name': record.name,
                'rank': 'priest',
                'status': 'Active',
                'deanery': '',
                'assignment': '',
                'contract_end': '',
                'retirement_date': today.isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res1.status_code, 200)
        p1 = res1.json()
        self.assertTrue(p1['lifecycle_changed'])
        self.assertEqual(p1['record']['status'], 'Active')
        self.assertEqual(p1['record']['retirement_date'], '')

        record.refresh_from_db()
        self.assertEqual(record.assignment, '')
        self.assertIsNone(record.retirement_date)

        # Step 2: Set new assignment and contract_end
        new_end = today + timedelta(days=120)
        res2 = self.client.post(
            reverse('registrar:record_detail', args=[record.id]),
            {
                'name': record.name,
                'rank': 'priest',
                'status': 'Active',
                'deanery': str(self.deanery_baguio.id),
                'assignment': 'St. Luke Parish - Baguio',
                'contract_end': new_end.isoformat(),
                'retirement_date': '',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res2.status_code, 200)
        p2 = res2.json()
        self.assertTrue(p2['lifecycle_changed'])
        self.assertEqual(p2['record']['contract_end'], new_end.isoformat())

        cr_res = self.client.get(reverse('registrar:contract_review'), {'q': record.id})
        self.assertEqual([r['record'].id for r in cr_res.context['rows']], [record.id])

    def test_auto_retire_via_date_returns_authoritative_record_state_and_lifecycle_flag(self):
        today = date.today()
        record = ClergyRecord.objects.create(
            id='CLG-735',
            name='Fr. Auto Retire Ajax',
            status='Active',
            rank='priest',
            deanery=self.deanery_baguio,
            assignment='St. Luke Parish - Baguio',
            contract_end=today + timedelta(days=60),
        )
        res = self.client.post(
            reverse('registrar:record_detail', args=[record.id]),
            {
                'name': record.name,
                'rank': 'priest',
                'status': 'Active',
                'deanery': str(self.deanery_baguio.id),
                'assignment': 'St. Luke Parish - Baguio',
                'contract_end': (today + timedelta(days=60)).isoformat(),
                'retirement_date': today.isoformat(),
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )
        self.assertEqual(res.status_code, 200)
        payload = res.json()
        self.assertTrue(payload['ok'])
        self.assertTrue(payload['lifecycle_changed'])
        self.assertEqual(payload['record']['status'], 'Retired')
        self.assertEqual(payload['record']['contract_end'], '')
        self.assertEqual(payload['record']['assignment'], '')
        self.assertEqual(payload['record']['retirement_date'], today.isoformat())
