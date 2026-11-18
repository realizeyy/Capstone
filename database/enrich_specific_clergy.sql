-- ==============================================================================
-- Enrichment Data for:
-- CLG-012 (Rev. Mo. Angelica Reyes)
-- CLG-015 (Rev. Fr. Carlo Mendoza)
-- CLG-021 (Rev. Fr. Daniel Navarro)
-- CLG-022 (Rev. Mo. Bianca Torres)
-- CLG-026 (Rev. Mo. Chloe Rivera)
-- CLG-028 (Rev. Mo. Alyssa Pascual)
--
-- Includes:
-- - Full sacraments, deaneries, and contact info (clergy_records)
-- - Spouses, civil status, government IDs, and bio (clergy_profiles)
-- - Children records with dates of birth (clergy_children)
-- - Degrees and seminaries (clergy_educations)
-- - Sequential historical and current deployments (clergy_deployments)
-- ==============================================================================

START TRANSACTION;

-- ------------------------------------------------------------------------------
-- 1. CLG-012: Rev. Mo. Angelica Reyes
-- ------------------------------------------------------------------------------
UPDATE clergy_records SET
  name = 'Rev. Mo. Angelica Reyes',
  gender = 'Female',
  date_of_birth = '1988-11-05',
  baptism_date = '1988-12-11',
  confirmation_date = '2000-06-18',
  diaconate_date = '2017-05-20',
  diaconate_place = 'All Saints Cathedral - Bontoc',
  ordination_date = '2018-05-20',
  ordination_place = 'All Saints Cathedral - Bontoc',
  phone = '0919-456-7890',
  email = 'angelica.reyes@gmail.com',
  address = 'Kin-iway, Besao, Mountain Province',
  assignment = 'St. Anne',
  rank = 'priest',
  status = 'Active',
  deanery_id = 3,
  contract_end = '2028-05-31'
WHERE id = 'CLG-012';

UPDATE clergy_profiles SET
  place_of_birth = 'Besao, Mountain Province',
  civil_status = 'Married',
  spouse_name = 'Marc Reyes',
  spouse_birth_date = '1986-07-21',
  marriage_date = '2016-10-15',
  marriage_place = 'Besao, Mountain Province',
  children_names = 'Lucas Reyes, Sophia Reyes',
  sss_number = '02-8472910-3',
  philhealth_number = '12-059281746-1',
  pagibig_number = '1210-9482-1745',
  education = 'Master of Divinity, St. Andrew\'s Theological Seminary (2016)',
  other_information = 'ECW Spiritual Director, Besao Deanery'
WHERE record_id = 'CLG-012';

DELETE FROM clergy_children WHERE profile_id = (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-012');
INSERT INTO clergy_children (name, gender, birth_date, profile_id) VALUES
  ('Lucas Reyes', 'Male', '2018-02-14', (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-012')),
  ('Sophia Reyes', 'Female', '2022-06-09', (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-012'));

DELETE FROM clergy_educations WHERE profile_id = (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-012');
INSERT INTO clergy_educations (degree, institution, place, year_graduated, profile_id) VALUES
  ('Master of Divinity', 'St. Andrew\'s Theological Seminary', 'Quezon City', 2016, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-012')),
  ('Bachelor of Arts in Philosophy', 'Saint Louis University', 'Baguio City', 2009, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-012'));

DELETE FROM clergy_deployments WHERE record_id = 'CLG-012';
INSERT INTO clergy_deployments (station_name, place_name, role, start_date, end_date, is_current, notes, record_id) VALUES
  ('St. Augustine Parish', 'Agawa, Besao', 'Deacon-in-Charge', '2017-06-01', '2018-05-31', 0, NULL, 'CLG-012'),
  ('All Saints Cathedral', 'Bontoc', 'Associate Priest', '2018-06-01', '2021-12-31', 0, NULL, 'CLG-012'),
  ('St. Anne Parish', 'Besao', 'Priest-in-Charge', '2022-01-01', NULL, 1, NULL, 'CLG-012');


-- ------------------------------------------------------------------------------
-- 2. CLG-015: Rev. Fr. Carlo Mendoza
-- ------------------------------------------------------------------------------
UPDATE clergy_records SET
  name = 'Rev. Fr. Carlo Mendoza',
  gender = 'Male',
  date_of_birth = '1983-12-08',
  baptism_date = '1984-01-15',
  confirmation_date = '1995-11-26',
  diaconate_date = '2013-06-20',
  diaconate_place = 'All Saints Cathedral - Bontoc',
  ordination_date = '2014-06-20',
  ordination_place = 'All Saints Cathedral - Bontoc',
  phone = '0927-789-0123',
  email = 'carlo.mendoza@gmail.com',
  address = 'Samoki, Bontoc, Mountain Province',
  assignment = 'St. Paul',
  rank = 'priest',
  status = 'Active',
  deanery_id = 1,
  contract_end = '2027-12-31'
WHERE id = 'CLG-015';

UPDATE clergy_profiles SET
  place_of_birth = 'Bontoc, Mountain Province',
  civil_status = 'Married',
  spouse_name = 'Rowena Mendoza',
  spouse_birth_date = '1985-09-12',
  marriage_date = '2012-04-14',
  marriage_place = 'Bontoc, Mountain Province',
  children_names = 'Joshua Mendoza, Beatrice Mendoza, Caleb Mendoza',
  sss_number = '02-7391824-6',
  philhealth_number = '12-048291038-2',
  pagibig_number = '1211-8392-0194',
  education = 'Master in Ministry, Trinity Theological College (2018)',
  other_information = 'Central Deanery Council Member and Youth Mentor'
WHERE record_id = 'CLG-015';

DELETE FROM clergy_children WHERE profile_id = (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-015');
INSERT INTO clergy_children (name, gender, birth_date, profile_id) VALUES
  ('Joshua Mendoza', 'Male', '2014-03-10', (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-015')),
  ('Beatrice Mendoza', 'Female', '2017-08-22', (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-015')),
  ('Caleb Mendoza', 'Male', '2021-01-15', (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-015'));

DELETE FROM clergy_educations WHERE profile_id = (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-015');
INSERT INTO clergy_educations (degree, institution, place, year_graduated, profile_id) VALUES
  ('Master in Ministry', 'Trinity Theological College', 'Singapore', 2018, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-015')),
  ('Bachelor of Theology', 'St. Andrew\'s Theological Seminary', 'Quezon City', 2012, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-015')),
  ('Bachelor of Secondary Education', 'Mountain Province State Polytechnic College', 'Bontoc', 2005, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-015'));

DELETE FROM clergy_deployments WHERE record_id = 'CLG-015';
INSERT INTO clergy_deployments (station_name, place_name, role, start_date, end_date, is_current, notes, record_id) VALUES
  ('St. Peter\'s Parish', 'Sabangan', 'Assistant Deacon', '2013-07-01', '2014-06-30', 0, NULL, 'CLG-015'),
  ('St. Barnabas Parish', 'Alab, Bontoc', 'Priest-in-Charge', '2014-07-01', '2017-12-31', 0, NULL, 'CLG-015'),
  ('St. Thomas Parish', 'Balili, Bontoc', 'Rector', '2018-01-01', '2021-12-31', 0, NULL, 'CLG-015'),
  ('St. Paul Parish', 'Samoki, Bontoc', 'Rector', '2022-01-01', NULL, 1, NULL, 'CLG-015');


-- ------------------------------------------------------------------------------
-- 3. CLG-021: Rev. Fr. Daniel Navarro
-- ------------------------------------------------------------------------------
UPDATE clergy_records SET
  name = 'Rev. Fr. Daniel Navarro',
  gender = 'Male',
  date_of_birth = '1980-01-28',
  baptism_date = '1980-03-02',
  confirmation_date = '1992-05-17',
  diaconate_date = '2009-06-11',
  diaconate_place = 'All Saints Cathedral - Bontoc',
  ordination_date = '2010-06-11',
  ordination_place = 'All Saints Cathedral - Bontoc',
  phone = '0926-345-6789',
  email = 'daniel.navarro@gmail.com',
  address = 'Dalikan, Bontoc, Mountain Province',
  assignment = 'Holy Trinity',
  rank = 'priest',
  status = 'Active',
  deanery_id = 1,
  contract_end = '2027-06-30'
WHERE id = 'CLG-021';

UPDATE clergy_profiles SET
  place_of_birth = 'Bontoc, Mountain Province',
  civil_status = 'Married',
  spouse_name = 'Clarissa Navarro',
  spouse_birth_date = '1982-11-04',
  marriage_date = '2008-08-08',
  marriage_place = 'Bontoc, Mountain Province',
  children_names = 'Ethan Navarro, Hannah Navarro',
  sss_number = '02-6192847-1',
  philhealth_number = '12-039182745-9',
  pagibig_number = '1210-7482-9103',
  education = 'Master of Divinity, St. Andrew\'s Theological Seminary (2008)',
  other_information = 'Diocesan Disaster Preparedness and Response Coordinator'
WHERE record_id = 'CLG-021';

DELETE FROM clergy_children WHERE profile_id = (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-021');
INSERT INTO clergy_children (name, gender, birth_date, profile_id) VALUES
  ('Ethan Navarro', 'Male', '2010-05-16', (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-021')),
  ('Hannah Navarro', 'Female', '2015-11-20', (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-021'));

DELETE FROM clergy_educations WHERE profile_id = (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-021');
INSERT INTO clergy_educations (degree, institution, place, year_graduated, profile_id) VALUES
  ('Master of Divinity', 'St. Andrew\'s Theological Seminary', 'Quezon City', 2008, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-021')),
  ('Bachelor of Arts in Sociology', 'University of the Philippines Baguio', 'Baguio City', 2001, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-021'));

DELETE FROM clergy_deployments WHERE record_id = 'CLG-021';
INSERT INTO clergy_deployments (station_name, place_name, role, start_date, end_date, is_current, notes, record_id) VALUES
  ('All Saints Cathedral', 'Bontoc', 'Deacon', '2009-07-01', '2010-06-30', 0, NULL, 'CLG-021'),
  ('St. Timothy\'s Parish', 'Dantay', 'Priest-in-Charge', '2010-07-01', '2015-06-30', 0, NULL, 'CLG-021'),
  ('Diocesan Office', 'Bontoc', 'Youth Ministry Director', '2015-07-01', '2020-12-31', 0, NULL, 'CLG-021'),
  ('Holy Trinity Parish', 'Dalikan, Bontoc', 'Rector', '2021-01-01', NULL, 1, NULL, 'CLG-021');


-- ------------------------------------------------------------------------------
-- 4. CLG-022: Rev. Mo. Bianca Torres
-- ------------------------------------------------------------------------------
UPDATE clergy_records SET
  name = 'Rev. Mo. Bianca Torres',
  gender = 'Female',
  date_of_birth = '1989-07-11',
  baptism_date = '1989-08-20',
  confirmation_date = '2001-10-14',
  diaconate_date = '2018-09-29',
  diaconate_place = 'All Saints Cathedral - Bontoc',
  ordination_date = '2019-09-29',
  ordination_place = 'All Saints Cathedral - Bontoc',
  phone = '0935-456-7890',
  email = 'bianca.torres@gmail.com',
  address = 'Cabunagan, Tadian, Mountain Province',
  assignment = 'St. Martha',
  rank = 'priest',
  status = 'Active',
  deanery_id = 7,
  contract_end = '2028-09-30'
WHERE id = 'CLG-022';

UPDATE clergy_profiles SET
  place_of_birth = 'Tadian, Mountain Province',
  civil_status = 'Married',
  spouse_name = 'Anthony Torres',
  spouse_birth_date = '1987-04-19',
  marriage_date = '2017-01-20',
  marriage_place = 'Tadian, Mountain Province',
  children_names = 'Gabriel Torres',
  sss_number = '02-9182746-5',
  philhealth_number = '12-068192837-4',
  pagibig_number = '1212-0394-8271',
  education = 'Master of Divinity, St. Andrew\'s Theological Seminary (2017)',
  other_information = 'Sunday School Curriculum Committee Member'
WHERE record_id = 'CLG-022';

DELETE FROM clergy_children WHERE profile_id = (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-022');
INSERT INTO clergy_children (name, gender, birth_date, profile_id) VALUES
  ('Gabriel Torres', 'Male', '2020-09-05', (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-022'));

DELETE FROM clergy_educations WHERE profile_id = (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-022');
INSERT INTO clergy_educations (degree, institution, place, year_graduated, profile_id) VALUES
  ('Master of Divinity', 'St. Andrew\'s Theological Seminary', 'Quezon City', 2017, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-022')),
  ('Bachelor of Science in Social Work', 'Saint Louis University', 'Baguio City', 2010, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-022'));

DELETE FROM clergy_deployments WHERE record_id = 'CLG-022';
INSERT INTO clergy_deployments (station_name, place_name, role, start_date, end_date, is_current, notes, record_id) VALUES
  ('St. Francis Parish', 'New Lubon, Tadian', 'Deacon-in-Charge', '2018-10-01', '2019-09-30', 0, NULL, 'CLG-022'),
  ('St. Michael & all angels', 'Tadian', 'Assistant Priest', '2019-10-01', '2022-12-31', 0, NULL, 'CLG-022'),
  ('St. Martha Parish', 'Cabunagan, Tadian', 'Priest-in-Charge', '2023-01-01', NULL, 1, NULL, 'CLG-022');


-- ------------------------------------------------------------------------------
-- 5. CLG-026: Rev. Mo. Chloe Rivera
-- ------------------------------------------------------------------------------
UPDATE clergy_records SET
  name = 'Rev. Mo. Chloe Rivera',
  gender = 'Female',
  date_of_birth = '1991-01-19',
  baptism_date = '1991-02-24',
  confirmation_date = '2003-04-27',
  diaconate_date = '2019-10-18',
  diaconate_place = 'All Saints Cathedral - Bontoc',
  ordination_date = '2020-10-18',
  ordination_place = 'All Saints Cathedral - Bontoc',
  phone = '0920-890-1234',
  email = 'chloe.rivera@gmail.com',
  address = 'Kin-iway, Besao, Mountain Province',
  assignment = 'St. Benidict',
  rank = 'priest',
  status = 'Active',
  deanery_id = 3,
  contract_end = '2028-10-31'
WHERE id = 'CLG-026';

UPDATE clergy_profiles SET
  place_of_birth = 'Besao, Mountain Province',
  civil_status = 'Married',
  spouse_name = 'Mark Rivera',
  spouse_birth_date = '1989-10-30',
  marriage_date = '2019-12-28',
  marriage_place = 'Besao, Mountain Province',
  children_names = 'Mia Rivera',
  sss_number = '02-9481726-0',
  philhealth_number = '12-079283741-5',
  pagibig_number = '1213-9182-7364',
  education = 'Master of Divinity, St. Andrew\'s Theological Seminary (2018)',
  other_information = 'Curate and Youth Ministry Counselor'
WHERE record_id = 'CLG-026';

DELETE FROM clergy_children WHERE profile_id = (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-026');
INSERT INTO clergy_children (name, gender, birth_date, profile_id) VALUES
  ('Mia Rivera', 'Female', '2023-04-12', (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-026'));

DELETE FROM clergy_educations WHERE profile_id = (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-026');
INSERT INTO clergy_educations (degree, institution, place, year_graduated, profile_id) VALUES
  ('Master of Divinity', 'St. Andrew\'s Theological Seminary', 'Quezon City', 2018, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-026')),
  ('Bachelor of Arts in English Language', 'Benguet State University', 'La Trinidad, Benguet', 2012, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-026'));

DELETE FROM clergy_deployments WHERE record_id = 'CLG-026';
INSERT INTO clergy_deployments (station_name, place_name, role, start_date, end_date, is_current, notes, record_id) VALUES
  ('St. Clement Parish', 'Payeo, Besao', 'Curate', '2019-11-01', '2020-10-31', 0, NULL, 'CLG-026'),
  ('St. Philip Parish', 'Gueday, Besao', 'Vicar', '2020-11-01', '2023-06-30', 0, NULL, 'CLG-026'),
  ('St. Benidict Parish', 'Kin-iway, Besao', 'Priest-in-Charge', '2023-07-01', NULL, 1, NULL, 'CLG-026');


-- ------------------------------------------------------------------------------
-- 6. CLG-028: Rev. Mo. Alyssa Pascual
-- ------------------------------------------------------------------------------
UPDATE clergy_records SET
  name = 'Rev. Mo. Alyssa Pascual',
  gender = 'Female',
  date_of_birth = '1987-03-08',
  baptism_date = '1987-04-12',
  confirmation_date = '1999-09-19',
  diaconate_date = '2017-03-25',
  diaconate_place = 'All Saints Cathedral - Bontoc',
  ordination_date = '2018-03-25',
  ordination_place = 'All Saints Cathedral - Bontoc',
  phone = '0927-012-3456',
  email = 'alyssa.pascual@gmail.com',
  address = 'Otucan, Bauko, Mountain Province',
  assignment = 'St. Paul',
  rank = 'priest',
  status = 'Active',
  deanery_id = 4,
  contract_end = '2028-03-31'
WHERE id = 'CLG-028';

UPDATE clergy_profiles SET
  place_of_birth = 'Bauko, Mountain Province',
  civil_status = 'Married',
  spouse_name = 'Michael Pascual',
  spouse_birth_date = '1985-03-15',
  marriage_date = '2015-06-20',
  marriage_place = 'Bauko, Mountain Province',
  children_names = 'Dominic Pascual, Clara Pascual',
  sss_number = '02-8392019-4',
  philhealth_number = '12-058291047-3',
  pagibig_number = '1211-9283-7401',
  education = 'Master of Divinity, St. Andrew\'s Theological Seminary (2016)',
  other_information = 'Diocesan Communications Officer'
WHERE record_id = 'CLG-028';

DELETE FROM clergy_children WHERE profile_id = (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-028');
INSERT INTO clergy_children (name, gender, birth_date, profile_id) VALUES
  ('Dominic Pascual', 'Male', '2017-01-18', (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-028')),
  ('Clara Pascual', 'Female', '2021-07-30', (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-028'));

DELETE FROM clergy_educations WHERE profile_id = (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-028');
INSERT INTO clergy_educations (degree, institution, place, year_graduated, profile_id) VALUES
  ('Certificate in Pastoral Counseling', 'Ateneo de Manila University', 'Quezon City', 2021, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-028')),
  ('Master of Divinity', 'St. Andrew\'s Theological Seminary', 'Quezon City', 2016, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-028')),
  ('Bachelor of Science in Community Development', 'Saint Louis University', 'Baguio City', 2008, (SELECT id FROM clergy_profiles WHERE record_id = 'CLG-028'));

DELETE FROM clergy_deployments WHERE record_id = 'CLG-028';
INSERT INTO clergy_deployments (station_name, place_name, role, start_date, end_date, is_current, notes, record_id) VALUES
  ('St. Mary Parish', 'Mount Data, Bauko', 'Curate', '2017-04-01', '2018-03-31', 0, NULL, 'CLG-028'),
  ('St. John Parish', 'Bila, Bauko', 'Priest-in-Charge', '2018-04-01', '2020-12-31', 0, NULL, 'CLG-028'),
  ('Holy Apostle Parish', 'Abatan, Bauko', 'Associate Priest', '2021-01-01', '2023-06-30', 0, NULL, 'CLG-028'),
  ('St. Paul Parish', 'Otucan, Bauko', 'Rector', '2023-07-01', NULL, 1, NULL, 'CLG-028');

COMMIT;
