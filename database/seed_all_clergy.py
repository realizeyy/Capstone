"""Fill in complete, random-but-valid data for bulk-created clergy accounts.

Works on any database (local or Railway) regardless of which CLG-### IDs exist.
It finds clergy records that have no personal data yet (no birth date or no
assignment) and fills the record, the profile, deployments, education and
children. Safe to re-run: records that are already filled are skipped.

Usage (from the project root, inside the web container or the venv):
    python database/seed_all_clergy.py            # fill unseeded records
    python database/seed_all_clergy.py --dry-run  # do everything, then roll back
    python database/seed_all_clergy.py --force    # also overwrite filled records
"""
import os
import sys
import random
import zlib
from datetime import date, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ednp.settings')
import django
django.setup()

from django.core.management import call_command
from django.db import transaction
from django.db.models import Q

from registrar.models import ClergyRecord, ClergyDeployment, Deanery, Parish
from clergy.models import ClergyChild, ClergyEducation

TODAY = date(2026, 11, 1)

FEMALE_FIRST_NAMES = {
    'maria', 'angelica', 'jasmine', 'patricia', 'katrina', 'sofia', 'bianca', 'isabella',
    'chloe', 'alyssa', 'camille', 'hannah', 'nicole', 'trisha', 'erika', 'danica', 'leah',
    'mariel', 'rhea', 'samantha', 'olivia', 'emma', 'ava', 'mia', 'charlotte', 'amelia',
    'harper', 'evelyn', 'abigail', 'ella', 'grace', 'lily', 'zoe', 'nora', 'hazel', 'aria',
    'ruby', 'stella', 'violet', 'maya', 'naomi', 'elena', 'clara', 'lara', 'yuki',
    'seo-yeon', 'priya', 'fatima', 'amara', 'adeline', 'mary',
}

TOWNS = [
    'Bontoc, Mountain Province', 'Sagada, Mountain Province', 'Besao, Mountain Province',
    'Bauko, Mountain Province', 'Tadian, Mountain Province', 'Tinglayan, Kalinga',
    'Tabuk City, Kalinga', 'Baguio City', 'La Trinidad, Benguet', 'Cervantes, Ilocos Sur',
]
COMMITTEE_ROLES = [
    'Diocesan Youth Ministry Coordinator', 'Episcopal Church Women Spiritual Adviser',
    'Commission on Liturgy and Music Member', 'Stewardship and Finance Committee Member',
    'Indigenous Peoples Ministry Liaison', 'Diocesan Christian Education Coordinator',
    'Ecumenical and Inter-Faith Relations Officer', 'Disaster Preparedness and Response Coordinator',
    'Deanery Secretary', 'Deanery Representative to Diocesan Council', 'Assistant Dean of Deanery',
    'Curate / Assistant Priest',
]
SEMINARIES = [
    ('Master of Divinity', "St. Andrew's Theological Seminary", 'Quezon City'),
    ('Bachelor of Theology', "St. Andrew's Theological Seminary", 'Quezon City'),
    ('Master of Arts in Theological Studies', "St. Andrew's Theological Seminary", 'Quezon City'),
    ('Master in Ministry', 'Trinity Theological College', 'Quezon City'),
    ('Diploma in Episcopal Studies', "St. Andrew's Theological Seminary", 'Quezon City'),
]
FIRST_DEGREES = [
    ('Bachelor of Arts in Philosophy', 'Saint Louis University', 'Baguio City'),
    ('Bachelor of Science in Education', 'University of the Cordilleras', 'Baguio City'),
    ('Bachelor of Science in Community Development', 'Saint Louis University', 'Baguio City'),
    ('Bachelor of Arts in Social Science', 'Mountain Province State Polytechnic College', 'Bontoc, Mountain Province'),
    ('Bachelor of Science in Social Work', 'University of the Philippines Baguio', 'Baguio City'),
]
ROLES = ['Curate', 'Associate Priest', 'Priest-in-Charge', 'Vicar', 'Rector']
MALE_SPOUSE = ['Eduardo', 'Robert', 'Renato', 'Danilo', 'Ferdinand', 'Lito', 'Nestor', 'Manuel', 'Rogelio', 'Jaime']
FEMALE_SPOUSE = ['Lorna', 'Marilou', 'Rosario', 'Corazon', 'Imelda', 'Divina', 'Fe', 'Carmelita', 'Grace', 'Leonora']
CHILD_MALE = ['Joshua', 'Daniel', 'Mark', 'Samuel', 'Caleb', 'Elijah', 'Nathan', 'Luke']
CHILD_FEMALE = ['Hannah', 'Abigail', 'Ruth', 'Esther', 'Naomi', 'Leah', 'Grace', 'Joy']
SPOUSE_SURNAMES = ['Santos', 'Dela Cruz', 'Reyes', 'Pekas', 'Bawas', 'Codiamat', 'Baluyan', 'Ngilangil', 'Alawas', 'Kidang']


def rdate(rng, year, month=None):
    return date(year, month or rng.randint(1, 12), rng.randint(1, 28))


def add_years(d, years, rng):
    return date(d.year + years, d.month, min(d.day, 28)) + timedelta(days=rng.randint(0, 20))


def station_label(parish):
    return f"{parish.parish_name} - {parish.place_name}" if parish.place_name else parish.parish_name


def build_deployments(rng, parishes, start_after, assignment, status, retirement_date):
    """Chronological deployments: 1-3 finished ones, then the current one."""
    out = []
    cursor = start_after + timedelta(days=rng.randint(15, 120))
    past_target = rng.randint(1, 3)
    for _ in range(past_target):
        length = rng.randint(18, 40)
        end = cursor + timedelta(days=length * 30)
        if end > TODAY - timedelta(days=200):
            break
        p = rng.choice(parishes)
        out.append({'station': p.parish_name, 'place': p.place_name, 'role': rng.choice(ROLES[:4]),
                    'start': cursor, 'end': end, 'current': False})
        cursor = end + timedelta(days=1)
    if cursor > TODAY - timedelta(days=60):
        cursor = TODAY - timedelta(days=60)
    # Current (or last) assignment
    if ' - ' in assignment:
        st, pl = assignment.split(' - ', 1)
    else:
        st, pl = assignment, None
    if status in ('Active', 'Missionary to Other Diocese'):
        out.append({'station': st, 'place': pl, 'role': rng.choice(ROLES[2:]), 'start': cursor,
                    'end': None, 'current': True})
    else:
        end = retirement_date or min(cursor + timedelta(days=700), TODAY)
        out.append({'station': st, 'place': pl, 'role': rng.choice(ROLES[2:]), 'start': cursor,
                    'end': max(end, cursor), 'current': False})
    return out


def seed_one(index, r, parishes, special, used_emails, force):
    rng = random.Random(zlib.crc32(r.id.encode()))
    base = r.name
    for prefix in ('Rev. Fr. ', 'Rev. Mo. ', 'Rev. '):
        if base.startswith(prefix):
            base = base[len(prefix):]
    base = base.strip()
    words = base.split()
    first = words[0].lower()
    last = words[-1].lower() if len(words) > 1 else 'clergy'
    gender = 'Female' if first in FEMALE_FIRST_NAMES else 'Male'
    new_name = f"{'Rev. Mo.' if gender == 'Female' else 'Rev. Fr.'} {base}"

    birth_year = rng.randint(1962, 1997)
    b_date = rdate(rng, birth_year)
    age = 2026 - birth_year
    bap = b_date + timedelta(days=rng.randint(30, 90))
    conf = b_date + timedelta(days=365 * rng.randint(12, 14) + rng.randint(0, 30))

    roll = rng.random()
    if roll < 0.05:
        status, rank, assignment, deanery = 'On Leave', 'priest', 'Former Parish', special
        contract_end = None
    elif roll < 0.10:
        status, rank, assignment, deanery = 'Missionary to Other Diocese', 'priest', 'Overseas Mission', special
        contract_end = date(2027, 12, 31)
    else:
        status = 'Active'
        rank = 'deacon' if rng.random() < 0.15 else 'priest'
        p = parishes[(index * 3 + 7) % len(parishes)]
        assignment, deanery = station_label(p), p.deanery
        contract_end = rng.choice([date(2027, 3, 31), date(2027, 6, 30), date(2027, 9, 30), date(2027, 12, 31),
                                   date(2028, 3, 31), date(2028, 6, 30), date(2028, 9, 30), date(2028, 12, 31)])
    prev = station_label(parishes[(index * 5 + 13) % len(parishes)])

    diac_year = min(2024, birth_year + rng.randint(26, 30))
    diaconate = rdate(rng, diac_year)
    diac_place = 'All Saints Cathedral - Bontoc' if index % 2 == 0 else 'St. Mary the Virgin - Sagada'
    if rank == 'priest':
        ordination = diaconate + timedelta(days=rng.randint(180, 400))
        if ordination > TODAY - timedelta(days=30):
            ordination = diaconate
        ord_place = diac_place
    else:
        ordination, ord_place = None, ''

    email = f"{first}.{last}".replace(' ', '').replace("'", '') + '@gmail.com'
    n = 2
    while email in used_emails:
        email = f"{first}.{last}{n}".replace(' ', '').replace("'", '') + '@gmail.com'
        n += 1
    used_emails.add(email)
    phone = f"09{rng.choice([17, 18, 19, 20, 21, 27, 28, 35, 39, 47])}-{rng.randint(100, 999)}-{rng.randint(1000, 9999)}"
    town = TOWNS[index % len(TOWNS)]

    r.name, r.gender = new_name, gender
    r.date_of_birth, r.baptism_date, r.confirmation_date = b_date, bap, conf
    r.phone, r.email, r.address = phone, email, f"Poblacion, {town}"
    r.deanery, r.assignment, r.previous_assignment = deanery, assignment, prev
    r.status, r.rank, r.contract_end, r.retirement_date = status, rank, contract_end, None
    r.diaconate_date, r.diaconate_place = diaconate, diac_place
    r.ordination_date, r.ordination_place = ordination, ord_place
    r.holy_orders_date = diaconate
    r.save()

    profile = r.profile
    profile.place_of_birth = town
    profile.baptism_place = 'All Saints Cathedral, Bontoc' if index % 2 == 0 else 'St. Mary the Virgin, Sagada'
    profile.confirmation_place = diac_place
    profile.other_information = COMMITTEE_ROLES[index % len(COMMITTEE_ROLES)]
    profile.diocese = 'Episcopal Diocese of Northern Philippines'
    profile.spouse_birth_date = None
    profile.children_names = ''
    children = []
    if age > 36 and rng.random() < 0.65:
        profile.civil_status = 'Married'
        sp_first = rng.choice(MALE_SPOUSE if gender == 'Female' else FEMALE_SPOUSE)
        sp_last = last.capitalize() if gender == 'Male' else rng.choice(SPOUSE_SURNAMES)
        profile.spouse_name = f"{sp_first} {sp_last}"
        m_year = min(2022, birth_year + rng.randint(24, 30))
        profile.marriage_date = rdate(rng, m_year)
        profile.marriage_place = town
        profile.spouse_birth_date = rdate(rng, birth_year + rng.randint(-3, 3))
        for _ in range(rng.randint(1, 3)):
            cg = rng.choice(['Male', 'Female'])
            c_birth = rdate(rng, min(2024, m_year + rng.randint(1, 8)))
            children.append({'name': f"{rng.choice(CHILD_MALE if cg == 'Male' else CHILD_FEMALE)} {last.capitalize()}",
                             'gender': cg, 'birth': c_birth})
        children.sort(key=lambda c: c['birth'])
        profile.children_names = ', '.join(c['name'] for c in children)
    else:
        profile.civil_status = 'Single'
        profile.spouse_name = ''
        profile.marriage_date = None
        profile.marriage_place = ''
    profile.sss_number = f"{rng.randint(10, 99)}-{rng.randint(1000000, 9999999)}-{rng.randint(0, 9)}"
    profile.philhealth_number = f"{rng.randint(10, 99)}-{rng.randint(100000000, 999999999)}-{rng.randint(0, 9)}"
    profile.pagibig_number = f"{rng.randint(1000, 9999)}-{rng.randint(1000, 9999)}-{rng.randint(1000, 9999)}"

    deg, inst, place = SEMINARIES[index % len(SEMINARIES)]
    fdeg, finst, fplace = FIRST_DEGREES[index % len(FIRST_DEGREES)]
    educations = [
        {'degree': fdeg, 'institution': finst, 'place': fplace, 'year': birth_year + 22},
        {'degree': deg, 'institution': inst, 'place': place, 'year': diac_year - 1},
    ]
    profile.education = f"{deg}, {inst} ({diac_year - 1})"
    profile.save()

    profile.children.all().delete()
    for c in children:
        ClergyChild.objects.create(profile=profile, name=c['name'], gender=c['gender'], birth_date=c['birth'])
    profile.educations.all().delete()
    for e in educations:
        ClergyEducation.objects.create(profile=profile, degree=e['degree'], institution=e['institution'],
                                       place=e['place'], year_graduated=e['year'])

    r.deployments.all().delete()
    start_after = ordination or diaconate
    for d in build_deployments(rng, parishes, start_after, assignment, status, None):
        ClergyDeployment.objects.create(record=r, station_name=d['station'], place_name=d['place'],
                                        role=d['role'], start_date=d['start'], end_date=d['end'],
                                        is_current=d['current'])
    return (f"{r.id}: {new_name} | {status} | {assignment} | {r.deployments.count()} deployments, "
            f"{len(children)} children, {len(educations)} degrees")


def run():
    dry = '--dry-run' in sys.argv
    force = '--force' in sys.argv
    limit = 0
    for a in sys.argv:
        if a.startswith('--limit='):
            limit = int(a.split('=', 1)[1])

    # Make sure the lookup data (deaneries, parishes, document types) exists.
    call_command('seed_deaneries')
    call_command('seed_document_types')

    special, _ = Deanery.objects.get_or_create(name='Special Assignments')
    parishes = list(Parish.objects.exclude(deanery=special).select_related('deanery').order_by('id'))
    if not parishes:
        sys.exit('No parishes found. Run: python manage.py seed_deaneries')

    qs = ClergyRecord.objects.all()
    if not force:
        qs = qs.filter(Q(date_of_birth__isnull=True) | Q(assignment__isnull=True) | Q(assignment=''))
    records = list(qs.order_by('id'))
    print(f"{len(records)} clergy record(s) to fill{' (dry run)' if dry else ''}.")

    used_emails = set(ClergyRecord.objects.exclude(email__isnull=True).exclude(email='')
                      .exclude(id__in=[r.id for r in records]).values_list('email', flat=True))
    skipped = filled = 0
    # Each record commits on its own, so a dropped console loses at most one record and
    # a re-run continues where it stopped. --limit N fills only N records per run (a batch).
    for i, r in enumerate(records):
        if limit and filled >= limit:
            break
        if not hasattr(r, 'profile'):
            print(f"SKIP {r.id} {r.name}: no clergy profile/login account linked yet")
            skipped += 1
            continue
        with transaction.atomic():
            print(seed_one(i, r, parishes, special, used_emails, force), flush=True)
            filled += 1
            if dry:
                transaction.set_rollback(True)
    if dry:
        print('Dry run: rolled back, nothing saved.')
    remaining = len(records) - filled - skipped
    print(f"Done. Filled {filled}, skipped {skipped}, still unseeded {remaining if limit else 0}.")


if __name__ == '__main__':
    run()
