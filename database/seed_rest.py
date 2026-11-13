import os
import sys
import random
from datetime import date, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ednp.settings')
import django
django.setup()

from registrar.models import ClergyRecord, Parish, Deanery
from clergy.models import ClergyProfile
from django.db import transaction
from django.db.models import Q

random.seed(42)

FEMALE_FIRST_NAMES = {
    'camille', 'hannah', 'nicole', 'trisha', 'erika', 'danica', 'leah', 'mariel', 'rhea',
    'samantha', 'olivia', 'emma', 'ava', 'mia', 'charlotte', 'amelia', 'harper', 'evelyn',
    'abigail', 'ella', 'grace', 'lily', 'zoe', 'nora', 'hazel', 'aria', 'ruby', 'stella',
    'violet', 'maya', 'naomi', 'elena', 'clara', 'lara', 'yuki', 'seo-yeon', 'priya',
    'fatima', 'amara', 'ada', 'adeline', 'mary', 'catherine', 'patricia', 'katrina',
    'sofia', 'bianca', 'isabella', 'chloe', 'alyssa'
}

RENAME_MAP = {
    'CLG-007': ('Rev. Fr. Harold Garcia', 'Male'),
    'CLG-009': ('Rev. Fr. William Bang-as', 'Male'),
    'CLG-110': ('Rev. Fr. Fabian Kidang', 'Male'),
    'CLG-111': ('Rev. Fr. Arthur Sano', 'Male'),
    'CLG-112': ('Rev. Mo. Adeline Baluyan', 'Female'),
}

TOWNS = [
    'Bontoc, Mountain Province', 'Sagada, Mountain Province', 'Besao, Mountain Province',
    'Bauko, Mountain Province', 'Tadian, Mountain Province', 'Tinglayan, Kalinga',
    'Tabuk City, Kalinga', 'Baguio City', 'La Trinidad, Benguet', 'Cervantes, Ilocos Sur'
]

COMMITTEE_ROLES = [
    'Diocesan Youth Ministry Coordinator',
    'Episcopal Church Women Spiritual Adviser',
    'Commission on Liturgy and Music Member',
    'Stewardship and Finance Committee Member',
    'Indigenous Peoples Ministry Liaison',
    'Diocesan Christian Education Coordinator',
    'Ecumenical and Inter-Faith Relations Officer',
    'Disaster Preparedness and Response Coordinator',
    'Deanery Secretary',
    'Deanery Representative to Diocesan Council',
    'Assistant Dean of Deanery',
    'Curate / Assistant Priest'
]

SEMINARIES = [
    ('Master of Divinity', "St. Andrew's Theological Seminary"),
    ('Bachelor of Theology', "St. Andrew's Theological Seminary"),
    ('Master of Arts in Theological Studies', "St. Andrew's Theological Seminary"),
    ('Master in Ministry', 'Trinity Theological College'),
    ('Diploma in Episcopal Studies', "St. Andrew's Theological Seminary"),
]

MALE_SPOUSE_NAMES = ['Eduardo', 'Robert', 'Renato', 'Danilo', 'Ferdinand', 'Lito', 'Nestor', 'Manuel', 'Rogelio', 'Jaime']
FEMALE_SPOUSE_NAMES = ['Lorna', 'Marilou', 'Rosario', 'Corazon', 'Imelda', 'Divina', 'Fe', 'Carmelita', 'Grace', 'Leonora']
LAST_NAMES = ['Santos', 'Dela Cruz', 'Reyes', 'Pekas', 'Bawas', 'Codiamat', 'Baluyan', 'Ngilangil', 'Alawas', 'Kidang', 'Bang-as', 'Caligtan', 'Fagyan']

parishes = list(Parish.objects.filter(deanery_id__lte=7))

unseeded = list(ClergyRecord.objects.filter(Q(date_of_birth__isnull=True) | Q(assignment__in=['', None])).order_by('id'))
print(f"Populating {len(unseeded)} records in the database...")

sql_lines = []
sql_lines.append("START TRANSACTION;\n")

with transaction.atomic():
    for i, r in enumerate(unseeded):
        clean_base_name = r.name.replace('Rev. Fr. ', '').replace('Rev. Mo. ', '').strip()
        first_word = clean_base_name.split()[0].lower() if clean_base_name else ''

        if r.id in RENAME_MAP:
            new_name, gender = RENAME_MAP[r.id]
            clean_base_name = new_name.replace('Rev. Fr. ', '').replace('Rev. Mo. ', '').strip()
        else:
            gender = 'Female' if first_word in FEMALE_FIRST_NAMES else 'Male'
            title = 'Rev. Mo.' if gender == 'Female' else 'Rev. Fr.'
            new_name = f"{title} {clean_base_name}"

        birth_year = random.randint(1962, 1997)
        b_date = date(birth_year, random.randint(1, 12), random.randint(1, 28))
        age = 2026 - birth_year

        bap_date = b_date + timedelta(days=random.randint(30, 90))
        conf_date = b_date + timedelta(days=365 * random.randint(12, 14) + random.randint(0, 30))

        if age >= 65 and random.random() < 0.6:
            status = 'Retired'
            rank = 'priest'
            contract_end = None
            retirement_date = date(2020 + (birth_year % 6), random.randint(1, 12), random.randint(1, 28))
            assignment_str = 'Retired Clergy'
            deanery_obj = Deanery.objects.get(id=8)
        elif random.random() < 0.05:
            status = 'On Leave'
            rank = 'priest'
            contract_end = None
            retirement_date = None
            assignment_str = 'Former Parish'
            deanery_obj = Deanery.objects.get(id=8)
        elif random.random() < 0.05:
            status = 'Missionary to Other Diocese'
            rank = 'priest'
            contract_end = date(2027, 12, 31)
            retirement_date = None
            assignment_str = 'Overseas Mission'
            deanery_obj = Deanery.objects.get(id=8)
        else:
            status = 'Active'
            rank_roll = random.random()
            if rank_roll < 0.15:
                rank = 'deacon'
            elif rank_roll < 0.95:
                rank = 'priest'
            else:
                rank = 'bishop'
            contract_end = random.choice([
                date(2027, 3, 31), date(2027, 6, 30), date(2027, 9, 30), date(2027, 12, 31),
                date(2028, 3, 31), date(2028, 6, 30), date(2028, 9, 30), date(2028, 12, 31)
            ])
            retirement_date = None
            parish_choice = parishes[(i * 3 + 7) % len(parishes)]
            deanery_obj = parish_choice.deanery
            assignment_str = f"{parish_choice.parish_name} - {parish_choice.place_name}" if parish_choice.place_name else parish_choice.parish_name

        prev_parish = parishes[(i * 5 + 13) % len(parishes)]
        prev_assignment_str = f"{prev_parish.parish_name} - {prev_parish.place_name}" if prev_parish.place_name else prev_parish.parish_name

        diac_year = min(2024, birth_year + random.randint(26, 30))
        diaconate_date = date(diac_year, random.randint(1, 12), random.randint(1, 28))
        diaconate_place = 'All Saints Cathedral - Bontoc' if (i % 2 == 0) else 'St. Mary the Virgin - Sagada'

        if rank in ('priest', 'bishop'):
            ordination_date = diaconate_date + timedelta(days=random.randint(180, 400))
            ordination_place = diaconate_place
        else:
            ordination_date = None
            ordination_place = ''

        holy_orders_date = diaconate_date

        clean_first = clean_base_name.split()[0].lower()
        clean_last = clean_base_name.split()[-1].lower() if len(clean_base_name.split()) > 1 else 'clergy'
        phone = f"09{random.choice([17, 18, 19, 20, 21, 27, 28, 35, 39, 47])}-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
        email = f"{clean_first}.{clean_last}{random.randint(1, 99) if clean_first == 'juan' else ''}@gmail.com"
        town = TOWNS[i % len(TOWNS)]
        address = f"Poblacion, {town}"

        r.name = new_name
        r.gender = gender
        r.date_of_birth = b_date
        r.baptism_date = bap_date
        r.confirmation_date = conf_date
        r.phone = phone
        r.email = email
        r.address = address
        r.deanery = deanery_obj
        r.assignment = assignment_str
        r.previous_assignment = prev_assignment_str
        r.status = status
        r.rank = rank
        r.contract_end = contract_end
        r.retirement_date = retirement_date
        r.diaconate_date = diaconate_date
        r.diaconate_place = diaconate_place
        r.ordination_date = ordination_date
        r.ordination_place = ordination_place
        r.holy_orders_date = holy_orders_date
        r.save()

        profile = r.profile
        profile.place_of_birth = town
        profile.baptism_place = "All Saints Cathedral, Bontoc" if (i % 2 == 0) else "St. Mary the Virgin, Sagada"
        profile.confirmation_place = diaconate_place

        civ_roll = random.random()
        if age > 40 and civ_roll < 0.65:
            profile.civil_status = 'Married'
            spouse_first = random.choice(MALE_SPOUSE_NAMES if gender == 'Female' else FEMALE_SPOUSE_NAMES)
            spouse_last = clean_last.capitalize() if gender == 'Male' else random.choice(LAST_NAMES)
            profile.spouse_name = f"{spouse_first} {spouse_last}"
            profile.marriage_date = date(min(2025, birth_year + random.randint(24, 30)), random.randint(1, 12), random.randint(1, 28))
            profile.marriage_place = town
        elif age > 60 and civ_roll < 0.75:
            profile.civil_status = 'Widowed'
            profile.spouse_name = f"Late {random.choice(MALE_SPOUSE_NAMES if gender == 'Female' else FEMALE_SPOUSE_NAMES)} {clean_last.capitalize()}"
            profile.marriage_date = None
            profile.marriage_place = ''
        else:
            profile.civil_status = 'Single'
            profile.spouse_name = ''
            profile.marriage_date = None
            profile.marriage_place = ''

        deg, inst = SEMINARIES[i % len(SEMINARIES)]
        profile.education = f"{deg}, {inst} ({diac_year - 1})"
        profile.other_information = COMMITTEE_ROLES[i % len(COMMITTEE_ROLES)]
        profile.diocese = 'Episcopal Diocese of Northern Philippines'
        profile.verification = 'Verified'
        profile.save()

        # Build SQL line for export
        esc_name = new_name.replace("'", "''")
        esc_email = email.replace("'", "''")
        esc_address = address.replace("'", "''")
        esc_assign = assignment_str.replace("'", "''")
        esc_prev = prev_assignment_str.replace("'", "''")
        esc_diac_pl = diaconate_place.replace("'", "''")
        esc_ord_pl = ordination_place.replace("'", "''") if ordination_place else ""
        c_end_sql = f"'{contract_end}'" if contract_end else "NULL"
        ret_sql = f"'{retirement_date}'" if retirement_date else "NULL"
        ord_date_sql = f"'{ordination_date}'" if ordination_date else "NULL"
        ord_pl_sql = f"'{esc_ord_pl}'" if esc_ord_pl else "NULL"

        sql_lines.append(f"""UPDATE clergy_records SET
  name = '{esc_name}', gender = '{gender}', date_of_birth = '{b_date}', baptism_date = '{bap_date}',
  confirmation_date = '{conf_date}', ordination_date = {ord_date_sql}, phone = '{phone}', email = '{esc_email}',
  address = '{esc_address}', assignment = '{esc_assign}', status = '{status}', rank = '{rank}',
  contract_end = {c_end_sql}, retirement_date = {ret_sql}, deanery_id = {deanery_obj.id},
  diaconate_date = '{diaconate_date}', diaconate_place = '{esc_diac_pl}', ordination_place = {ord_pl_sql},
  previous_assignment = '{esc_prev}'
WHERE id = '{r.id}';""")

        esc_town = town.replace("'", "''")
        esc_bap_pl = profile.baptism_place.replace("'", "''")
        esc_conf_pl = profile.confirmation_place.replace("'", "''")
        esc_edu = profile.education.replace("'", "''")
        esc_other = profile.other_information.replace("'", "''")
        esc_spouse = profile.spouse_name.replace("'", "''") if profile.spouse_name else ""
        m_date_sql = f"'{profile.marriage_date}'" if profile.marriage_date else "NULL"
        m_pl_sql = f"'{profile.marriage_place.replace('\'', '\'\'')}'" if profile.marriage_place else "''"

        sql_lines.append(f"""UPDATE clergy_profiles SET
  place_of_birth = '{esc_town}', civil_status = '{profile.civil_status}',
  baptism_place = '{esc_bap_pl}', confirmation_place = '{esc_conf_pl}',
  education = '{esc_edu}', other_information = '{esc_other}',
  spouse_name = '{esc_spouse}', marriage_date = {m_date_sql}, marriage_place = {m_pl_sql},
  verification = 'Verified'
WHERE record_id = '{r.id}';\n""")

sql_lines.append("COMMIT;\n")

with open('database/seed_remaining_clergy.sql', 'w', encoding='utf-8') as f:
    f.writelines('\n'.join(sql_lines))

print(f"Successfully updated all {len(unseeded)} records in the database!")
print("Also exported database/seed_remaining_clergy.sql for backup/phpMyAdmin reference.")
