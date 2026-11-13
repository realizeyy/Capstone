"""Enriches profiles for CLG-012, CLG-015, CLG-021, CLG-022, CLG-026, and CLG-028.

Adds complete family background (spouse, children), government IDs,
theological and higher education, and 3-4 historical deployments each.
Safe to re-run: uses update_or_create / get_or_create.
"""

import os
import sys
from datetime import date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ednp.settings')
import django
django.setup()

from registrar.models import ClergyRecord, ClergyDeployment, Parish, Deanery
from clergy.models import ClergyProfile, ClergyChild, ClergyEducation
from django.db import transaction


CLERGY_DATA = [
    {
        'id': 'CLG-012',
        'name': 'Rev. Mo. Angelica Reyes',
        'gender': 'Female',
        'dob': date(1988, 11, 5),
        'baptism_date': date(1988, 12, 11),
        'confirmation_date': date(2000, 6, 18),
        'diaconate_date': date(2017, 5, 20),
        'diaconate_place': 'All Saints Cathedral - Bontoc',
        'ordination_date': date(2018, 5, 20),
        'ordination_place': 'All Saints Cathedral - Bontoc',
        'phone': '0919-456-7890',
        'email': 'angelica.reyes@gmail.com',
        'address': 'Kin-iway, Besao, Mountain Province',
        'assignment': 'St. Anne',
        'rank': 'priest',
        'status': 'Active',
        'deanery_id': 3,
        'contract_end': date(2028, 5, 31),
        'profile': {
            'place_of_birth': 'Besao, Mountain Province',
            'civil_status': 'Married',
            'spouse_name': 'Marc Reyes',
            'spouse_birth_date': date(1986, 7, 21),
            'marriage_date': date(2016, 10, 15),
            'marriage_place': 'Besao, Mountain Province',
            'children_names': 'Lucas Reyes, Sophia Reyes',
            'sss_number': '02-8472910-3',
            'philhealth_number': '12-059281746-1',
            'pagibig_number': '1210-9482-1745',
            'education': 'Master of Divinity, St. Andrew\'s Theological Seminary (2016)',
            'other_information': 'ECW Spiritual Director, Besao Deanery',
            'verification': 'Verified',
        },
        'children': [
            {'name': 'Lucas Reyes', 'gender': 'Male', 'birth_date': date(2018, 2, 14)},
            {'name': 'Sophia Reyes', 'gender': 'Female', 'birth_date': date(2022, 6, 9)},
        ],
        'educations': [
            {'degree': 'Master of Divinity', 'institution': 'St. Andrew\'s Theological Seminary', 'place': 'Quezon City', 'year': 2016},
            {'degree': 'Bachelor of Arts in Philosophy', 'institution': 'Saint Louis University', 'place': 'Baguio City', 'year': 2009},
        ],
        'deployments': [
            {'station': 'St. Augustine Parish', 'place': 'Agawa, Besao', 'role': 'Deacon-in-Charge', 'start': date(2017, 6, 1), 'end': date(2018, 5, 31), 'current': False},
            {'station': 'All Saints Cathedral', 'place': 'Bontoc', 'role': 'Associate Priest', 'start': date(2018, 6, 1), 'end': date(2021, 12, 31), 'current': False},
            {'station': 'St. Anne Parish', 'place': 'Besao', 'role': 'Priest-in-Charge', 'start': date(2022, 1, 1), 'end': None, 'current': True},
        ],
    },
    {
        'id': 'CLG-015',
        'name': 'Rev. Fr. Carlo Mendoza',
        'gender': 'Male',
        'dob': date(1983, 12, 8),
        'baptism_date': date(1984, 1, 15),
        'confirmation_date': date(1995, 11, 26),
        'diaconate_date': date(2013, 6, 20),
        'diaconate_place': 'All Saints Cathedral - Bontoc',
        'ordination_date': date(2014, 6, 20),
        'ordination_place': 'All Saints Cathedral - Bontoc',
        'phone': '0927-789-0123',
        'email': 'carlo.mendoza@gmail.com',
        'address': 'Samoki, Bontoc, Mountain Province',
        'assignment': 'St. Paul',
        'rank': 'priest',
        'status': 'Active',
        'deanery_id': 1,
        'contract_end': date(2027, 12, 31),
        'profile': {
            'place_of_birth': 'Bontoc, Mountain Province',
            'civil_status': 'Married',
            'spouse_name': 'Rowena Mendoza',
            'spouse_birth_date': date(1985, 9, 12),
            'marriage_date': date(2012, 4, 14),
            'marriage_place': 'Bontoc, Mountain Province',
            'children_names': 'Joshua Mendoza, Beatrice Mendoza, Caleb Mendoza',
            'sss_number': '02-7391824-6',
            'philhealth_number': '12-048291038-2',
            'pagibig_number': '1211-8392-0194',
            'education': 'Master in Ministry, Trinity Theological College (2018)',
            'other_information': 'Central Deanery Council Member and Youth Mentor',
            'verification': 'Verified',
        },
        'children': [
            {'name': 'Joshua Mendoza', 'gender': 'Male', 'birth_date': date(2014, 3, 10)},
            {'name': 'Beatrice Mendoza', 'gender': 'Female', 'birth_date': date(2017, 8, 22)},
            {'name': 'Caleb Mendoza', 'gender': 'Male', 'birth_date': date(2021, 1, 15)},
        ],
        'educations': [
            {'degree': 'Master in Ministry', 'institution': 'Trinity Theological College', 'place': 'Singapore', 'year': 2018},
            {'degree': 'Bachelor of Theology', 'institution': 'St. Andrew\'s Theological Seminary', 'place': 'Quezon City', 'year': 2012},
            {'degree': 'Bachelor of Secondary Education', 'institution': 'Mountain Province State Polytechnic College', 'place': 'Bontoc', 'year': 2005},
        ],
        'deployments': [
            {'station': 'St. Peter\'s Parish', 'place': 'Sabangan', 'role': 'Assistant Deacon', 'start': date(2013, 7, 1), 'end': date(2014, 6, 30), 'current': False},
            {'station': 'St. Barnabas Parish', 'place': 'Alab, Bontoc', 'role': 'Priest-in-Charge', 'start': date(2014, 7, 1), 'end': date(2017, 12, 31), 'current': False},
            {'station': 'St. Thomas Parish', 'place': 'Balili, Bontoc', 'role': 'Rector', 'start': date(2018, 1, 1), 'end': date(2021, 12, 31), 'current': False},
            {'station': 'St. Paul Parish', 'place': 'Samoki, Bontoc', 'role': 'Rector', 'start': date(2022, 1, 1), 'end': None, 'current': True},
        ],
    },
    {
        'id': 'CLG-021',
        'name': 'Rev. Fr. Daniel Navarro',
        'gender': 'Male',
        'dob': date(1980, 1, 28),
        'baptism_date': date(1980, 3, 2),
        'confirmation_date': date(1992, 5, 17),
        'diaconate_date': date(2009, 6, 11),
        'diaconate_place': 'All Saints Cathedral - Bontoc',
        'ordination_date': date(2010, 6, 11),
        'ordination_place': 'All Saints Cathedral - Bontoc',
        'phone': '0926-345-6789',
        'email': 'daniel.navarro@gmail.com',
        'address': 'Dalikan, Bontoc, Mountain Province',
        'assignment': 'Holy Trinity',
        'rank': 'priest',
        'status': 'Active',
        'deanery_id': 1,
        'contract_end': date(2027, 6, 30),
        'profile': {
            'place_of_birth': 'Bontoc, Mountain Province',
            'civil_status': 'Married',
            'spouse_name': 'Clarissa Navarro',
            'spouse_birth_date': date(1982, 11, 4),
            'marriage_date': date(2008, 8, 8),
            'marriage_place': 'Bontoc, Mountain Province',
            'children_names': 'Ethan Navarro, Hannah Navarro',
            'sss_number': '02-6192847-1',
            'philhealth_number': '12-039182745-9',
            'pagibig_number': '1210-7482-9103',
            'education': 'Master of Divinity, St. Andrew\'s Theological Seminary (2008)',
            'other_information': 'Diocesan Disaster Preparedness and Response Coordinator',
            'verification': 'Verified',
        },
        'children': [
            {'name': 'Ethan Navarro', 'gender': 'Male', 'birth_date': date(2010, 5, 16)},
            {'name': 'Hannah Navarro', 'gender': 'Female', 'birth_date': date(2015, 11, 20)},
        ],
        'educations': [
            {'degree': 'Master of Divinity', 'institution': 'St. Andrew\'s Theological Seminary', 'place': 'Quezon City', 'year': 2008},
            {'degree': 'Bachelor of Arts in Sociology', 'institution': 'University of the Philippines Baguio', 'place': 'Baguio City', 'year': 2001},
        ],
        'deployments': [
            {'station': 'All Saints Cathedral', 'place': 'Bontoc', 'role': 'Deacon', 'start': date(2009, 7, 1), 'end': date(2010, 6, 30), 'current': False},
            {'station': 'St. Timothy\'s Parish', 'place': 'Dantay', 'role': 'Priest-in-Charge', 'start': date(2010, 7, 1), 'end': date(2015, 6, 30), 'current': False},
            {'station': 'Diocesan Office', 'place': 'Bontoc', 'role': 'Youth Ministry Director', 'start': date(2015, 7, 1), 'end': date(2020, 12, 31), 'current': False},
            {'station': 'Holy Trinity Parish', 'place': 'Dalikan, Bontoc', 'role': 'Rector', 'start': date(2021, 1, 1), 'end': None, 'current': True},
        ],
    },
    {
        'id': 'CLG-022',
        'name': 'Rev. Mo. Bianca Torres',
        'gender': 'Female',
        'dob': date(1989, 7, 11),
        'baptism_date': date(1989, 8, 20),
        'confirmation_date': date(2001, 10, 14),
        'diaconate_date': date(2018, 9, 29),
        'diaconate_place': 'All Saints Cathedral - Bontoc',
        'ordination_date': date(2019, 9, 29),
        'ordination_place': 'All Saints Cathedral - Bontoc',
        'phone': '0935-456-7890',
        'email': 'bianca.torres@gmail.com',
        'address': 'Cabunagan, Tadian, Mountain Province',
        'assignment': 'St. Martha',
        'rank': 'priest',
        'status': 'Active',
        'deanery_id': 7,
        'contract_end': date(2028, 9, 30),
        'profile': {
            'place_of_birth': 'Tadian, Mountain Province',
            'civil_status': 'Married',
            'spouse_name': 'Anthony Torres',
            'spouse_birth_date': date(1987, 4, 19),
            'marriage_date': date(2017, 1, 20),
            'marriage_place': 'Tadian, Mountain Province',
            'children_names': 'Gabriel Torres',
            'sss_number': '02-9182746-5',
            'philhealth_number': '12-068192837-4',
            'pagibig_number': '1212-0394-8271',
            'education': 'Master of Divinity, St. Andrew\'s Theological Seminary (2017)',
            'other_information': 'Sunday School Curriculum Committee Member',
            'verification': 'Verified',
        },
        'children': [
            {'name': 'Gabriel Torres', 'gender': 'Male', 'birth_date': date(2020, 9, 5)},
        ],
        'educations': [
            {'degree': 'Master of Divinity', 'institution': 'St. Andrew\'s Theological Seminary', 'place': 'Quezon City', 'year': 2017},
            {'degree': 'Bachelor of Science in Social Work', 'institution': 'Saint Louis University', 'place': 'Baguio City', 'year': 2010},
        ],
        'deployments': [
            {'station': 'St. Francis Parish', 'place': 'New Lubon, Tadian', 'role': 'Deacon-in-Charge', 'start': date(2018, 10, 1), 'end': date(2019, 9, 30), 'current': False},
            {'station': 'St. Michael & all angels', 'place': 'Tadian', 'role': 'Assistant Priest', 'start': date(2019, 10, 1), 'end': date(2022, 12, 31), 'current': False},
            {'station': 'St. Martha Parish', 'place': 'Cabunagan, Tadian', 'role': 'Priest-in-Charge', 'start': date(2023, 1, 1), 'end': None, 'current': True},
        ],
    },
    {
        'id': 'CLG-026',
        'name': 'Rev. Mo. Chloe Rivera',
        'gender': 'Female',
        'dob': date(1991, 1, 19),
        'baptism_date': date(1991, 2, 24),
        'confirmation_date': date(2003, 4, 27),
        'diaconate_date': date(2019, 10, 18),
        'diaconate_place': 'All Saints Cathedral - Bontoc',
        'ordination_date': date(2020, 10, 18),
        'ordination_place': 'All Saints Cathedral - Bontoc',
        'phone': '0920-890-1234',
        'email': 'chloe.rivera@gmail.com',
        'address': 'Kin-iway, Besao, Mountain Province',
        'assignment': 'St. Benidict',
        'rank': 'priest',
        'status': 'Active',
        'deanery_id': 3,
        'contract_end': date(2028, 10, 31),
        'profile': {
            'place_of_birth': 'Besao, Mountain Province',
            'civil_status': 'Married',
            'spouse_name': 'Mark Rivera',
            'spouse_birth_date': date(1989, 10, 30),
            'marriage_date': date(2019, 12, 28),
            'marriage_place': 'Besao, Mountain Province',
            'children_names': 'Mia Rivera',
            'sss_number': '02-9481726-0',
            'philhealth_number': '12-079283741-5',
            'pagibig_number': '1213-9182-7364',
            'education': 'Master of Divinity, St. Andrew\'s Theological Seminary (2018)',
            'other_information': 'Curate and Youth Ministry Counselor',
            'verification': 'Verified',
        },
        'children': [
            {'name': 'Mia Rivera', 'gender': 'Female', 'birth_date': date(2023, 4, 12)},
        ],
        'educations': [
            {'degree': 'Master of Divinity', 'institution': 'St. Andrew\'s Theological Seminary', 'place': 'Quezon City', 'year': 2018},
            {'degree': 'Bachelor of Arts in English Language', 'institution': 'Benguet State University', 'place': 'La Trinidad, Benguet', 'year': 2012},
        ],
        'deployments': [
            {'station': 'St. Clement Parish', 'place': 'Payeo, Besao', 'role': 'Curate', 'start': date(2019, 11, 1), 'end': date(2020, 10, 31), 'current': False},
            {'station': 'St. Philip Parish', 'place': 'Gueday, Besao', 'role': 'Vicar', 'start': date(2020, 11, 1), 'end': date(2023, 6, 30), 'current': False},
            {'station': 'St. Benidict Parish', 'place': 'Kin-iway, Besao', 'role': 'Priest-in-Charge', 'start': date(2023, 7, 1), 'end': None, 'current': True},
        ],
    },
    {
        'id': 'CLG-028',
        'name': 'Rev. Mo. Alyssa Pascual',
        'gender': 'Female',
        'dob': date(1987, 3, 8),
        'baptism_date': date(1987, 4, 12),
        'confirmation_date': date(1999, 9, 19),
        'diaconate_date': date(2017, 3, 25),
        'diaconate_place': 'All Saints Cathedral - Bontoc',
        'ordination_date': date(2018, 3, 25),
        'ordination_place': 'All Saints Cathedral - Bontoc',
        'phone': '0927-012-3456',
        'email': 'alyssa.pascual@gmail.com',
        'address': 'Otucan, Bauko, Mountain Province',
        'assignment': 'St. Paul',
        'rank': 'priest',
        'status': 'Active',
        'deanery_id': 4,
        'contract_end': date(2028, 3, 31),
        'profile': {
            'place_of_birth': 'Bauko, Mountain Province',
            'civil_status': 'Married',
            'spouse_name': 'Michael Pascual',
            'spouse_birth_date': date(1985, 3, 15),
            'marriage_date': date(2015, 6, 20),
            'marriage_place': 'Bauko, Mountain Province',
            'children_names': 'Dominic Pascual, Clara Pascual',
            'sss_number': '02-8392019-4',
            'philhealth_number': '12-058291047-3',
            'pagibig_number': '1211-9283-7401',
            'education': 'Master of Divinity, St. Andrew\'s Theological Seminary (2016)',
            'other_information': 'Diocesan Communications Officer',
            'verification': 'Verified',
        },
        'children': [
            {'name': 'Dominic Pascual', 'gender': 'Male', 'birth_date': date(2017, 1, 18)},
            {'name': 'Clara Pascual', 'gender': 'Female', 'birth_date': date(2021, 7, 30)},
        ],
        'educations': [
            {'degree': 'Certificate in Pastoral Counseling', 'institution': 'Ateneo de Manila University', 'place': 'Quezon City', 'year': 2021},
            {'degree': 'Master of Divinity', 'institution': 'St. Andrew\'s Theological Seminary', 'place': 'Quezon City', 'year': 2016},
            {'degree': 'Bachelor of Science in Community Development', 'institution': 'Saint Louis University', 'place': 'Baguio City', 'year': 2008},
        ],
        'deployments': [
            {'station': 'St. Mary Parish', 'place': 'Mount Data, Bauko', 'role': 'Curate', 'start': date(2017, 4, 1), 'end': date(2018, 3, 31), 'current': False},
            {'station': 'St. John Parish', 'place': 'Bila, Bauko', 'role': 'Priest-in-Charge', 'start': date(2018, 4, 1), 'end': date(2020, 12, 31), 'current': False},
            {'station': 'Holy Apostle Parish', 'place': 'Abatan, Bauko', 'role': 'Associate Priest', 'start': date(2021, 1, 1), 'end': date(2023, 6, 30), 'current': False},
            {'station': 'St. Paul Parish', 'place': 'Otucan, Bauko', 'role': 'Rector', 'start': date(2023, 7, 1), 'end': None, 'current': True},
        ],
    },
]


def run():
    print(f"Enriching records for {len(CLERGY_DATA)} clergy members...")
    with transaction.atomic():
        for item in CLERGY_DATA:
            record = ClergyRecord.objects.get(id=item['id'])
            record.name = item['name']
            record.gender = item['gender']
            record.date_of_birth = item['dob']
            record.baptism_date = item['baptism_date']
            record.confirmation_date = item['confirmation_date']
            record.diaconate_date = item['diaconate_date']
            record.diaconate_place = item['diaconate_place']
            record.ordination_date = item['ordination_date']
            record.ordination_place = item['ordination_place']
            record.phone = item['phone']
            record.email = item['email']
            record.address = item['address']
            record.assignment = item['assignment']
            record.rank = item['rank']
            record.status = item['status']
            record.contract_end = item['contract_end']
            record.deanery = Deanery.objects.get(id=item['deanery_id'])
            record.save()

            profile = record.profile
            p_data = item['profile']
            profile.place_of_birth = p_data['place_of_birth']
            profile.civil_status = p_data['civil_status']
            profile.spouse_name = p_data['spouse_name']
            profile.spouse_birth_date = p_data['spouse_birth_date']
            profile.marriage_date = p_data['marriage_date']
            profile.marriage_place = p_data['marriage_place']
            profile.children_names = p_data['children_names']
            profile.sss_number = p_data['sss_number']
            profile.philhealth_number = p_data['philhealth_number']
            profile.pagibig_number = p_data['pagibig_number']
            profile.education = p_data['education']
            profile.other_information = p_data['other_information']
            profile.verification = p_data['verification']
            profile.save()

            # Children
            profile.children.all().delete()
            for ch in item['children']:
                ClergyChild.objects.create(
                    profile=profile,
                    name=ch['name'],
                    gender=ch['gender'],
                    birth_date=ch['birth_date'],
                )

            # Education
            profile.educations.all().delete()
            for ed in item['educations']:
                ClergyEducation.objects.create(
                    profile=profile,
                    degree=ed['degree'],
                    institution=ed['institution'],
                    place=ed['place'],
                    year_graduated=ed['year'],
                )

            # Deployments
            record.deployments.all().delete()
            for dp in item['deployments']:
                ClergyDeployment.objects.create(
                    record=record,
                    station_name=dp['station'],
                    place_name=dp['place'],
                    role=dp['role'],
                    start_date=dp['start'],
                    end_date=dp['end'],
                    is_current=dp['current'],
                )

            print(f"Enriched {record.id}: {record.name} ({record.deployments.count()} deployments, {profile.children.count()} children, {profile.educations.count()} degrees)")

    print("Successfully completed enrichment for all 6 clergy profiles!")


if __name__ == '__main__':
    run()
