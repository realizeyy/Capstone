START TRANSACTION;

UPDATE clergy_records SET
  name = 'Rev. Fr. Harold Garcia', gender = 'Male', date_of_birth = '1969-01-24', baptism_date = '1969-03-12',
  confirmation_date = '1981-01-28', ordination_date = '2000-01-05', phone = '0918-323-4811', email = 'harold.garcia@gmail.com',
  address = 'Poblacion, Bontoc, Mountain Province', assignment = 'St. Michael''s - Guina-ang', status = 'Active', rank = 'priest',
  contract_end = '2027-06-30', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '1999-07-02', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Paul - Samoki'
WHERE id = 'CLG-007';
UPDATE clergy_profiles SET
  place_of_birth = 'Bontoc, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (1998)', other_information = 'Diocesan Youth Ministry Coordinator',
  spouse_name = 'Lorna Garcia', marriage_date = '1997-04-23', marriage_place = 'Bontoc, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-007';

UPDATE clergy_records SET
  name = 'Rev. Fr. William Bang-as', gender = 'Male', date_of_birth = '1996-07-08', baptism_date = '1996-09-04',
  confirmation_date = '2010-07-13', ordination_date = '2024-09-06', phone = '0921-259-4527', email = 'william.bang-as@gmail.com',
  address = 'Poblacion, Sagada, Mountain Province', assignment = 'Overseas Mission', status = 'Missionary to Other Diocese', rank = 'priest',
  contract_end = '2027-12-31', retirement_date = NULL, deanery_id = 8,
  diaconate_date = '2023-12-14', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'Mission - Talubin'
WHERE id = 'CLG-009';
UPDATE clergy_profiles SET
  place_of_birth = 'Sagada, Mountain Province', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2022)', other_information = 'Episcopal Church Women Spiritual Adviser',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-009';

UPDATE clergy_records SET
  name = 'Rev. Mo. Camille Mercado', gender = 'Female', date_of_birth = '1983-02-03', baptism_date = '1983-03-29',
  confirmation_date = '1995-02-11', ordination_date = '2013-09-01', phone = '0939-400-6925', email = 'camille.mercado@gmail.com',
  address = 'Poblacion, Besao, Mountain Province', assignment = 'St. Paul - Samoki', status = 'Active', rank = 'priest',
  contract_end = '2028-12-31', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '2013-02-13', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. James - Loccong'
WHERE id = 'CLG-030';
UPDATE clergy_profiles SET
  place_of_birth = 'Besao, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (2012)', other_information = 'Commission on Liturgy and Music Member',
  spouse_name = 'Robert Santos', marriage_date = '2012-04-25', marriage_place = 'Besao, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-030';

UPDATE clergy_records SET
  name = 'Rev. Fr. Lucas Santiago', gender = 'Male', date_of_birth = '1980-02-28', baptism_date = '1980-04-12',
  confirmation_date = '1992-03-08', ordination_date = '2008-12-26', phone = '0918-723-3803', email = 'lucas.santiago@gmail.com',
  address = 'Poblacion, Bauko, Mountain Province', assignment = 'Mission - Barlig', status = 'Active', rank = 'priest',
  contract_end = '2028-06-30', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '2008-04-22', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'Transfiguration church - Maswa'
WHERE id = 'CLG-031';
UPDATE clergy_profiles SET
  place_of_birth = 'Bauko, Mountain Province', civil_status = 'Married',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master in Ministry, Trinity Theological College (2007)', other_information = 'Stewardship and Finance Committee Member',
  spouse_name = 'Corazon Santiago', marriage_date = '2005-08-13', marriage_place = 'Bauko, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-031';

UPDATE clergy_records SET
  name = 'Rev. Mo. Hannah Soriano', gender = 'Female', date_of_birth = '1979-11-23', baptism_date = '1980-01-27',
  confirmation_date = '1991-12-11', ordination_date = NULL, phone = '0918-316-6155', email = 'hannah.soriano@gmail.com',
  address = 'Poblacion, Tadian, Mountain Province', assignment = 'St. Theodore''s - Basao', status = 'Active', rank = 'deacon',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 2,
  diaconate_date = '2007-07-09', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = NULL,
  previous_assignment = 'St. Marks - Banguitan'
WHERE id = 'CLG-032';
UPDATE clergy_profiles SET
  place_of_birth = 'Tadian, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (2006)', other_information = 'Indigenous Peoples Ministry Liaison',
  spouse_name = 'Manuel Baluyan', marriage_date = '2008-08-05', marriage_place = 'Tadian, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-032';

UPDATE clergy_records SET
  name = 'Rev. Fr. Adrian Salazar', gender = 'Male', date_of_birth = '1978-03-08', baptism_date = '1978-05-24',
  confirmation_date = '1992-03-21', ordination_date = '2007-02-09', phone = '0935-193-1771', email = 'adrian.salazar@gmail.com',
  address = 'Poblacion, Tinglayan, Kalinga', assignment = 'St. Bernard - Buscalan', status = 'Active', rank = 'priest',
  contract_end = '2028-09-30', retirement_date = NULL, deanery_id = 2,
  diaconate_date = '2006-04-05', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Basil - Masameyeo'
WHERE id = 'CLG-033';
UPDATE clergy_profiles SET
  place_of_birth = 'Tinglayan, Kalinga', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (2005)', other_information = 'Diocesan Christian Education Coordinator',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-033';

UPDATE clergy_records SET
  name = 'Rev. Mo. Nicole Fernandez', gender = 'Female', date_of_birth = '1971-11-06', baptism_date = '1972-01-25',
  confirmation_date = '1985-11-15', ordination_date = '2002-06-22', phone = '0917-796-2876', email = 'nicole.fernandez@gmail.com',
  address = 'Poblacion, Tabuk City, Kalinga', assignment = 'Dominic''s - Tulgao', status = 'Active', rank = 'priest',
  contract_end = '2028-12-31', retirement_date = NULL, deanery_id = 2,
  diaconate_date = '2001-05-18', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Dunstan - Catenga'
WHERE id = 'CLG-034';
UPDATE clergy_profiles SET
  place_of_birth = 'Tabuk City, Kalinga', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2000)', other_information = 'Ecumenical and Inter-Faith Relations Officer',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-034';

UPDATE clergy_records SET
  name = 'Rev. Fr. Benedict Cabrera', gender = 'Male', date_of_birth = '1996-05-25', baptism_date = '1996-08-04',
  confirmation_date = '2009-05-25', ordination_date = NULL, phone = '0918-991-5889', email = 'benedict.cabrera@gmail.com',
  address = 'Poblacion, Baguio City', assignment = 'Transfiguration church - Maswa', status = 'Active', rank = 'deacon',
  contract_end = '2028-03-31', retirement_date = NULL, deanery_id = 2,
  diaconate_date = '2024-03-17', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = NULL,
  previous_assignment = 'Saint Martin - Balintaugan'
WHERE id = 'CLG-035';
UPDATE clergy_profiles SET
  place_of_birth = 'Baguio City', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (2023)', other_information = 'Disaster Preparedness and Response Coordinator',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-035';

UPDATE clergy_records SET
  name = 'Rev. Mo. Trisha Valdez', gender = 'Female', date_of_birth = '1994-10-07', baptism_date = '1994-11-15',
  confirmation_date = '2007-10-28', ordination_date = '2024-12-17', phone = '0918-471-6038', email = 'trisha.valdez@gmail.com',
  address = 'Poblacion, La Trinidad, Benguet', assignment = 'St. Augustine - Agawa', status = 'Active', rank = 'priest',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 3,
  diaconate_date = '2024-06-16', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'San Jose - Madepdepas'
WHERE id = 'CLG-036';
UPDATE clergy_profiles SET
  place_of_birth = 'La Trinidad, Benguet', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master in Ministry, Trinity Theological College (2023)', other_information = 'Deanery Secretary',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-036';

UPDATE clergy_records SET
  name = 'Rev. Fr. Jerome Castro', gender = 'Male', date_of_birth = '1977-10-03', baptism_date = '1977-11-07',
  confirmation_date = '1991-10-15', ordination_date = '2005-10-02', phone = '0919-371-9645', email = 'jerome.castro@gmail.com',
  address = 'Poblacion, Cervantes, Ilocos Sur', assignment = 'St. Anne - Besao', status = 'Active', rank = 'priest',
  contract_end = '2027-09-30', retirement_date = NULL, deanery_id = 3,
  diaconate_date = '2004-11-16', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Francis - Cagubatan'
WHERE id = 'CLG-037';
UPDATE clergy_profiles SET
  place_of_birth = 'Cervantes, Ilocos Sur', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (2003)', other_information = 'Deanery Representative to Diocesan Council',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-037';

UPDATE clergy_records SET
  name = 'Rev. Mo. Erika Morales', gender = 'Female', date_of_birth = '1989-04-18', baptism_date = '1989-07-05',
  confirmation_date = '2003-05-07', ordination_date = '2019-04-13', phone = '0920-330-2049', email = 'erika.morales@gmail.com',
  address = 'Poblacion, Bontoc, Mountain Province', assignment = 'St. John the Divine - Lacmaan', status = 'Active', rank = 'bishop',
  contract_end = '2028-06-30', retirement_date = NULL, deanery_id = 3,
  diaconate_date = '2018-09-15', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'San Pedro - Pasbol'
WHERE id = 'CLG-038';
UPDATE clergy_profiles SET
  place_of_birth = 'Bontoc, Mountain Province', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (2017)', other_information = 'Assistant Dean of Deanery',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-038';

UPDATE clergy_records SET
  name = 'Rev. Fr. Vincent Hernandez', gender = 'Male', date_of_birth = '1997-04-19', baptism_date = '1997-06-02',
  confirmation_date = '2009-04-18', ordination_date = NULL, phone = '0920-385-8953', email = 'vincent.hernandez@gmail.com',
  address = 'Poblacion, Sagada, Mountain Province', assignment = 'St. Clement - Payeo', status = 'Active', rank = 'deacon',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 3,
  diaconate_date = '2024-02-17', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = NULL,
  previous_assignment = 'St. Jerome - Bunga'
WHERE id = 'CLG-039';
UPDATE clergy_profiles SET
  place_of_birth = 'Sagada, Mountain Province', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2023)', other_information = 'Curate / Assistant Priest',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-039';

UPDATE clergy_records SET
  name = 'Rev. Mo. Danica Ocampo', gender = 'Female', date_of_birth = '1970-12-19', baptism_date = '1971-02-23',
  confirmation_date = '1983-12-23', ordination_date = '2000-03-25', phone = '0935-984-1887', email = 'danica.ocampo@gmail.com',
  address = 'Poblacion, Besao, Mountain Province', assignment = 'St. Dunstan - Catenga', status = 'Active', rank = 'priest',
  contract_end = '2027-06-30', retirement_date = NULL, deanery_id = 3,
  diaconate_date = '1999-06-14', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Andrew - Patiacan'
WHERE id = 'CLG-040';
UPDATE clergy_profiles SET
  place_of_birth = 'Besao, Mountain Province', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (1998)', other_information = 'Diocesan Youth Ministry Coordinator',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-040';

UPDATE clergy_records SET
  name = 'Rev. Fr. Francis Manalo', gender = 'Male', date_of_birth = '1968-01-13', baptism_date = '1968-03-29',
  confirmation_date = '1981-02-03', ordination_date = '1996-03-13', phone = '0935-355-2235', email = 'francis.manalo@gmail.com',
  address = 'Poblacion, Bauko, Mountain Province', assignment = 'St. Gregory - Bagnen', status = 'Active', rank = 'priest',
  contract_end = '2028-12-31', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '1995-07-06', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Mathias - Supo'
WHERE id = 'CLG-041';
UPDATE clergy_profiles SET
  place_of_birth = 'Bauko, Mountain Province', civil_status = 'Married',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master in Ministry, Trinity Theological College (1994)', other_information = 'Episcopal Church Women Spiritual Adviser',
  spouse_name = 'Grace Manalo', marriage_date = '1992-01-21', marriage_place = 'Bauko, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-041';

UPDATE clergy_records SET
  name = 'Rev. Mo. Leah Padilla', gender = 'Female', date_of_birth = '1996-01-03', baptism_date = '1996-04-01',
  confirmation_date = '2008-01-05', ordination_date = '2024-04-05', phone = '0921-902-8454', email = 'leah.padilla@gmail.com',
  address = 'Poblacion, Tadian, Mountain Province', assignment = 'Holy Innocent - Bebe', status = 'Active', rank = 'priest',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '2023-07-01', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'Annunciation - Antadao'
WHERE id = 'CLG-042';
UPDATE clergy_profiles SET
  place_of_birth = 'Tadian, Mountain Province', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (2022)', other_information = 'Commission on Liturgy and Music Member',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-042';

UPDATE clergy_records SET
  name = 'Rev. Fr. Christian Enriquez', gender = 'Male', date_of_birth = '1997-11-23', baptism_date = '1998-01-23',
  confirmation_date = '2009-11-26', ordination_date = '2024-11-26', phone = '0935-614-9701', email = 'christian.enriquez@gmail.com',
  address = 'Poblacion, Tinglayan, Kalinga', assignment = 'San Luis - Mabaay', status = 'Active', rank = 'priest',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '2024-01-02', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. John - Pide'
WHERE id = 'CLG-043';
UPDATE clergy_profiles SET
  place_of_birth = 'Tinglayan, Kalinga', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (2023)', other_information = 'Stewardship and Finance Committee Member',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-043';

UPDATE clergy_records SET
  name = 'Rev. Mo. Mariel Tolentino', gender = 'Female', date_of_birth = '1994-02-28', baptism_date = '1994-04-10',
  confirmation_date = '2006-03-16', ordination_date = '2025-09-05', phone = '0918-529-9565', email = 'mariel.tolentino@gmail.com',
  address = 'Poblacion, Tabuk City, Kalinga', assignment = 'St. Mary - Mount Data', status = 'Active', rank = 'priest',
  contract_end = '2027-12-31', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '2024-10-02', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Simon Peter - Demang'
WHERE id = 'CLG-044';
UPDATE clergy_profiles SET
  place_of_birth = 'Tabuk City, Kalinga', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2023)', other_information = 'Indigenous Peoples Ministry Liaison',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-044';

UPDATE clergy_records SET
  name = 'Rev. Fr. Kevin Dizon', gender = 'Male', date_of_birth = '1978-04-22', baptism_date = '1978-07-06',
  confirmation_date = '1991-04-26', ordination_date = '2006-11-25', phone = '0947-676-2638', email = 'kevin.dizon@gmail.com',
  address = 'Poblacion, Baguio City', assignment = 'St. Francis - Cagubatan', status = 'Active', rank = 'priest',
  contract_end = '2028-12-31', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '2006-02-01', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'Holy Innocent - Batayan'
WHERE id = 'CLG-045';
UPDATE clergy_profiles SET
  place_of_birth = 'Baguio City', civil_status = 'Married',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (2005)', other_information = 'Diocesan Christian Education Coordinator',
  spouse_name = 'Corazon Dizon', marriage_date = '2006-05-05', marriage_place = 'Baguio City',
  verification = 'Verified'
WHERE record_id = 'CLG-045';

UPDATE clergy_records SET
  name = 'Rev. Mo. Rhea Magsaysay', gender = 'Female', date_of_birth = '1984-02-08', baptism_date = '1984-04-01',
  confirmation_date = '1997-02-09', ordination_date = '2014-12-14', phone = '0919-370-2891', email = 'rhea.magsaysay@gmail.com',
  address = 'Poblacion, La Trinidad, Benguet', assignment = 'St. Mark - Sinto', status = 'Active', rank = 'priest',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '2014-05-22', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. John the Baptist - Ilang'
WHERE id = 'CLG-046';
UPDATE clergy_profiles SET
  place_of_birth = 'La Trinidad, Benguet', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master in Ministry, Trinity Theological College (2013)', other_information = 'Ecumenical and Inter-Faith Relations Officer',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-046';

UPDATE clergy_records SET
  name = 'Rev. Fr. Paolo Gutierrez', gender = 'Male', date_of_birth = '1997-03-09', baptism_date = '1997-04-26',
  confirmation_date = '2011-03-12', ordination_date = '2025-09-09', phone = '0917-194-7939', email = 'paolo.gutierrez@gmail.com',
  address = 'Poblacion, Cervantes, Ilocos Sur', assignment = 'St. John - Pasnadan', status = 'Active', rank = 'priest',
  contract_end = '2028-03-31', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '2024-08-09', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Thomas - Balaoa'
WHERE id = 'CLG-047';
UPDATE clergy_profiles SET
  place_of_birth = 'Cervantes, Ilocos Sur', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (2023)', other_information = 'Disaster Preparedness and Response Coordinator',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-047';

UPDATE clergy_records SET
  name = 'Rev. Mo. Samantha Lim', gender = 'Female', date_of_birth = '1964-01-11', baptism_date = '1964-03-30',
  confirmation_date = '1976-01-28', ordination_date = '1994-07-22', phone = '0919-658-1590', email = 'samantha.lim@gmail.com',
  address = 'Poblacion, Bontoc, Mountain Province', assignment = 'St Cyril - Bab-asig', status = 'Active', rank = 'priest',
  contract_end = '2028-09-30', retirement_date = NULL, deanery_id = 5,
  diaconate_date = '1994-01-04', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Cyprian - Mabalite'
WHERE id = 'CLG-048';
UPDATE clergy_profiles SET
  place_of_birth = 'Bontoc, Mountain Province', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (1993)', other_information = 'Deanery Secretary',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-048';

UPDATE clergy_records SET
  name = 'Rev. Fr. Andrew Tan', gender = 'Male', date_of_birth = '1997-03-14', baptism_date = '1997-04-21',
  confirmation_date = '2009-03-20', ordination_date = '2024-12-21', phone = '0918-462-7658', email = 'andrew.tan@gmail.com',
  address = 'Poblacion, Sagada, Mountain Province', assignment = 'St. Hilarys - Dandanac', status = 'Active', rank = 'bishop',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 5,
  diaconate_date = '2024-04-22', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'Holy Trinity - Dalikan'
WHERE id = 'CLG-049';
UPDATE clergy_profiles SET
  place_of_birth = 'Sagada, Mountain Province', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2023)', other_information = 'Deanery Representative to Diocesan Council',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-049';

UPDATE clergy_records SET
  name = 'Rev. Mo. Olivia Chen', gender = 'Female', date_of_birth = '1971-04-28', baptism_date = '1971-06-07',
  confirmation_date = '1983-05-23', ordination_date = '1999-05-22', phone = '0918-491-1634', email = 'olivia.chen@gmail.com',
  address = 'Poblacion, Besao, Mountain Province', assignment = 'St. Andrew - Patiacan', status = 'Active', rank = 'priest',
  contract_end = '2028-09-30', retirement_date = NULL, deanery_id = 5,
  diaconate_date = '1998-05-06', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Joseph''s - Mainit'
WHERE id = 'CLG-050';
UPDATE clergy_profiles SET
  place_of_birth = 'Besao, Mountain Province', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (1997)', other_information = 'Assistant Dean of Deanery',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-050';

UPDATE clergy_records SET
  name = 'Rev. Fr. Liam Walker', gender = 'Male', date_of_birth = '1976-04-27', baptism_date = '1976-07-24',
  confirmation_date = '1989-05-05', ordination_date = '2004-03-18', phone = '0918-891-5573', email = 'liam.walker@gmail.com',
  address = 'Poblacion, Bauko, Mountain Province', assignment = 'St. Luke - Maliten', status = 'Active', rank = 'priest',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 5,
  diaconate_date = '2003-07-11', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Matthias - Tambingan'
WHERE id = 'CLG-051';
UPDATE clergy_profiles SET
  place_of_birth = 'Bauko, Mountain Province', civil_status = 'Married',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master in Ministry, Trinity Theological College (2002)', other_information = 'Curate / Assistant Priest',
  spouse_name = 'Grace Walker', marriage_date = '2003-11-27', marriage_place = 'Bauko, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-051';

UPDATE clergy_records SET
  name = 'Rev. Mo. Emma Johnson', gender = 'Female', date_of_birth = '1996-06-01', baptism_date = '1996-07-08',
  confirmation_date = '2009-06-03', ordination_date = NULL, phone = '0927-546-9379', email = 'emma.johnson@gmail.com',
  address = 'Poblacion, Tadian, Mountain Province', assignment = 'St. Stephen - Legleg', status = 'Active', rank = 'deacon',
  contract_end = '2028-09-30', retirement_date = NULL, deanery_id = 5,
  diaconate_date = '2024-12-26', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = NULL,
  previous_assignment = 'St. Theodore''s - Basao'
WHERE id = 'CLG-052';
UPDATE clergy_profiles SET
  place_of_birth = 'Tadian, Mountain Province', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (2023)', other_information = 'Diocesan Youth Ministry Coordinator',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-052';

UPDATE clergy_records SET
  name = 'Rev. Fr. Noah Williams', gender = 'Male', date_of_birth = '1974-05-02', baptism_date = '1974-07-16',
  confirmation_date = '1987-04-29', ordination_date = '2003-06-18', phone = '0927-738-6143', email = 'noah.williams@gmail.com',
  address = 'Poblacion, Tinglayan, Kalinga', assignment = 'St. Columba - Ambasing', status = 'Active', rank = 'priest',
  contract_end = '2027-12-31', retirement_date = NULL, deanery_id = 6,
  diaconate_date = '2002-07-03', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'Holy Cross - Tocucan'
WHERE id = 'CLG-053';
UPDATE clergy_profiles SET
  place_of_birth = 'Tinglayan, Kalinga', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (2001)', other_information = 'Episcopal Church Women Spiritual Adviser',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-053';

UPDATE clergy_records SET
  name = 'Rev. Mo. Ava Brown', gender = 'Female', date_of_birth = '1969-12-10', baptism_date = '1970-02-10',
  confirmation_date = '1982-12-28', ordination_date = '1997-04-25', phone = '0919-730-5930', email = 'ava.brown@gmail.com',
  address = 'Poblacion, Tabuk City, Kalinga', assignment = 'St. Matthew - Bangaan', status = 'Active', rank = 'priest',
  contract_end = '2027-09-30', retirement_date = NULL, deanery_id = 6,
  diaconate_date = '1996-07-22', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Philip - Ngibat'
WHERE id = 'CLG-054';
UPDATE clergy_profiles SET
  place_of_birth = 'Tabuk City, Kalinga', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (1995)', other_information = 'Commission on Liturgy and Music Member',
  spouse_name = 'Eduardo Bawas', marriage_date = '1995-04-14', marriage_place = 'Tabuk City, Kalinga',
  verification = 'Verified'
WHERE record_id = 'CLG-054';

UPDATE clergy_records SET
  name = 'Rev. Fr. Oliver Davis', gender = 'Male', date_of_birth = '1982-08-15', baptism_date = '1982-10-12',
  confirmation_date = '1996-08-17', ordination_date = '2009-05-01', phone = '0947-443-2530', email = 'oliver.davis@gmail.com',
  address = 'Poblacion, Baguio City', assignment = 'St. John - Pide', status = 'Active', rank = 'bishop',
  contract_end = '2027-09-30', retirement_date = NULL, deanery_id = 6,
  diaconate_date = '2008-05-17', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Anne - Besao'
WHERE id = 'CLG-055';
UPDATE clergy_profiles SET
  place_of_birth = 'Baguio City', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (2007)', other_information = 'Stewardship and Finance Committee Member',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-055';

UPDATE clergy_records SET
  name = 'Rev. Mo. Mia Miller', gender = 'Female', date_of_birth = '1977-11-10', baptism_date = '1977-12-24',
  confirmation_date = '1989-11-11', ordination_date = '2005-09-21', phone = '0918-566-7790', email = 'mia.miller@gmail.com',
  address = 'Poblacion, La Trinidad, Benguet', assignment = 'Former Parish', status = 'On Leave', rank = 'priest',
  contract_end = NULL, retirement_date = NULL, deanery_id = 8,
  diaconate_date = '2004-08-20', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Caroline - Padangaan'
WHERE id = 'CLG-056';
UPDATE clergy_profiles SET
  place_of_birth = 'La Trinidad, Benguet', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master in Ministry, Trinity Theological College (2003)', other_information = 'Indigenous Peoples Ministry Liaison',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-056';

UPDATE clergy_records SET
  name = 'Rev. Fr. James Wilson', gender = 'Male', date_of_birth = '1974-12-23', baptism_date = '1975-02-15',
  confirmation_date = '1988-01-01', ordination_date = NULL, phone = '0939-575-1822', email = 'james.wilson@gmail.com',
  address = 'Poblacion, Cervantes, Ilocos Sur', assignment = 'St. Stephen - Nacagang', status = 'Active', rank = 'deacon',
  contract_end = '2027-06-30', retirement_date = NULL, deanery_id = 6,
  diaconate_date = '2003-04-06', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = NULL,
  previous_assignment = 'St. Jerome - Bunga'
WHERE id = 'CLG-057';
UPDATE clergy_profiles SET
  place_of_birth = 'Cervantes, Ilocos Sur', civil_status = 'Married',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (2002)', other_information = 'Diocesan Christian Education Coordinator',
  spouse_name = 'Marilou Wilson', marriage_date = '2001-03-26', marriage_place = 'Cervantes, Ilocos Sur',
  verification = 'Verified'
WHERE record_id = 'CLG-057';

UPDATE clergy_records SET
  name = 'Rev. Mo. Charlotte Moore', gender = 'Female', date_of_birth = '1991-11-17', baptism_date = '1992-01-21',
  confirmation_date = '2005-11-23', ordination_date = '2022-08-11', phone = '0935-560-5246', email = 'charlotte.moore@gmail.com',
  address = 'Poblacion, Bontoc, Mountain Province', assignment = 'Holy Trinity - Bantey', status = 'Active', rank = 'priest',
  contract_end = '2028-09-30', retirement_date = NULL, deanery_id = 7,
  diaconate_date = '2021-08-06', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'Holy Innocent - Bebe'
WHERE id = 'CLG-058';
UPDATE clergy_profiles SET
  place_of_birth = 'Bontoc, Mountain Province', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (2020)', other_information = 'Ecumenical and Inter-Faith Relations Officer',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-058';

UPDATE clergy_records SET
  name = 'Rev. Fr. Benjamin Taylor', gender = 'Male', date_of_birth = '1979-09-16', baptism_date = '1979-11-25',
  confirmation_date = '1991-09-21', ordination_date = '2008-04-05', phone = '0919-336-7275', email = 'benjamin.taylor@gmail.com',
  address = 'Poblacion, Sagada, Mountain Province', assignment = 'St. Francis - New Lubon', status = 'Active', rank = 'priest',
  contract_end = '2028-06-30', retirement_date = NULL, deanery_id = 7,
  diaconate_date = '2007-09-03', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Matthias - Mayag'
WHERE id = 'CLG-059';
UPDATE clergy_profiles SET
  place_of_birth = 'Sagada, Mountain Province', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2006)', other_information = 'Disaster Preparedness and Response Coordinator',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-059';

UPDATE clergy_records SET
  name = 'Rev. Mo. Amelia Anderson', gender = 'Female', date_of_birth = '1975-02-14', baptism_date = '1975-04-11',
  confirmation_date = '1988-02-28', ordination_date = '2007-01-04', phone = '0947-489-8814', email = 'amelia.anderson@gmail.com',
  address = 'Poblacion, Besao, Mountain Province', assignment = 'St. John the Baptist - Ilang', status = 'Active', rank = 'priest',
  contract_end = '2028-09-30', retirement_date = NULL, deanery_id = 7,
  diaconate_date = '2005-12-01', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Anselm - Pandayan'
WHERE id = 'CLG-060';
UPDATE clergy_profiles SET
  place_of_birth = 'Besao, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (2004)', other_information = 'Deanery Secretary',
  spouse_name = 'Lito Bawas', marriage_date = '2005-07-28', marriage_place = 'Besao, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-060';

UPDATE clergy_records SET
  name = 'Rev. Fr. Elijah Thomas', gender = 'Male', date_of_birth = '1988-09-24', baptism_date = '1988-12-10',
  confirmation_date = '2002-10-16', ordination_date = '2017-10-06', phone = '0928-841-3704', email = 'elijah.thomas@gmail.com',
  address = 'Poblacion, Bauko, Mountain Province', assignment = 'St. Michael & all angels - Tadian', status = 'Active', rank = 'priest',
  contract_end = '2028-09-30', retirement_date = NULL, deanery_id = 7,
  diaconate_date = '2017-01-13', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. John - Pasnadan'
WHERE id = 'CLG-061';
UPDATE clergy_profiles SET
  place_of_birth = 'Bauko, Mountain Province', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master in Ministry, Trinity Theological College (2016)', other_information = 'Deanery Representative to Diocesan Council',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-061';

UPDATE clergy_records SET
  name = 'Rev. Mo. Harper Jackson', gender = 'Female', date_of_birth = '1970-10-18', baptism_date = '1970-11-18',
  confirmation_date = '1983-11-02', ordination_date = '2000-01-20', phone = '0919-151-5262', email = 'harper.jackson@gmail.com',
  address = 'Poblacion, Tadian, Mountain Province', assignment = 'Overseas Mission', status = 'Missionary to Other Diocese', rank = 'priest',
  contract_end = '2027-12-31', retirement_date = NULL, deanery_id = 8,
  diaconate_date = '1999-03-28', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Dunstan - Catengan'
WHERE id = 'CLG-062';
UPDATE clergy_profiles SET
  place_of_birth = 'Tadian, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (1998)', other_information = 'Assistant Dean of Deanery',
  spouse_name = 'Danilo Ngilangil', marriage_date = '1996-06-25', marriage_place = 'Tadian, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-062';

UPDATE clergy_records SET
  name = 'Rev. Fr. William White', gender = 'Male', date_of_birth = '1986-05-25', baptism_date = '1986-08-23',
  confirmation_date = '1999-05-30', ordination_date = '2014-11-04', phone = '0917-872-1508', email = 'william.white@gmail.com',
  address = 'Poblacion, Tinglayan, Kalinga', assignment = 'St. Stephen - Bunga', status = 'Active', rank = 'priest',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 7,
  diaconate_date = '2014-04-21', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Cyprian - Mabalite'
WHERE id = 'CLG-063';
UPDATE clergy_profiles SET
  place_of_birth = 'Tinglayan, Kalinga', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (2013)', other_information = 'Curate / Assistant Priest',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-063';

UPDATE clergy_records SET
  name = 'Rev. Mo. Evelyn Harris', gender = 'Female', date_of_birth = '1974-01-20', baptism_date = '1974-02-28',
  confirmation_date = '1986-01-21', ordination_date = '2003-05-07', phone = '0947-865-2876', email = 'evelyn.harris@gmail.com',
  address = 'Poblacion, Tabuk City, Kalinga', assignment = 'St. Thomas - Balili', status = 'Active', rank = 'priest',
  contract_end = '2028-12-31', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '2002-06-06', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Stephen - Legleg'
WHERE id = 'CLG-064';
UPDATE clergy_profiles SET
  place_of_birth = 'Tabuk City, Kalinga', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2001)', other_information = 'Diocesan Youth Ministry Coordinator',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-064';

UPDATE clergy_records SET
  name = 'Rev. Fr. Henry Martin', gender = 'Male', date_of_birth = '1972-05-04', baptism_date = '1972-07-10',
  confirmation_date = '1984-05-30', ordination_date = '2000-02-10', phone = '0920-204-5941', email = 'henry.martin@gmail.com',
  address = 'Poblacion, Baguio City', assignment = 'Holy Trinity - Dalikan', status = 'Active', rank = 'bishop',
  contract_end = '2028-09-30', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '1999-02-19', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. John - Balugan'
WHERE id = 'CLG-065';
UPDATE clergy_profiles SET
  place_of_birth = 'Baguio City', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (1998)', other_information = 'Episcopal Church Women Spiritual Adviser',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-065';

UPDATE clergy_records SET
  name = 'Rev. Mo. Abigail Thompson', gender = 'Female', date_of_birth = '1969-10-26', baptism_date = '1969-11-27',
  confirmation_date = '1982-11-09', ordination_date = '1996-05-27', phone = '0918-543-6934', email = 'abigail.thompson@gmail.com',
  address = 'Poblacion, La Trinidad, Benguet', assignment = 'St. Michael''s - Guina-ang', status = 'Active', rank = 'priest',
  contract_end = '2028-06-30', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '1995-07-27', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Mark - Tanulong'
WHERE id = 'CLG-066';
UPDATE clergy_profiles SET
  place_of_birth = 'La Trinidad, Benguet', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master in Ministry, Trinity Theological College (1994)', other_information = 'Commission on Liturgy and Music Member',
  spouse_name = 'Manuel Caligtan', marriage_date = '1994-07-06', marriage_place = 'La Trinidad, Benguet',
  verification = 'Verified'
WHERE record_id = 'CLG-066';

UPDATE clergy_records SET
  name = 'Rev. Fr. Jack Clark', gender = 'Male', date_of_birth = '1995-11-09', baptism_date = '1996-01-17',
  confirmation_date = '2009-11-29', ordination_date = '2023-11-15', phone = '0921-561-4995', email = 'jack.clark@gmail.com',
  address = 'Poblacion, Cervantes, Ilocos Sur', assignment = 'St. Gabriel''s - Maligcong', status = 'Active', rank = 'priest',
  contract_end = '2028-03-31', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '2023-04-27', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Stephen - Nacagang'
WHERE id = 'CLG-067';
UPDATE clergy_profiles SET
  place_of_birth = 'Cervantes, Ilocos Sur', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (2022)', other_information = 'Stewardship and Finance Committee Member',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-067';

UPDATE clergy_records SET
  name = 'Rev. Mo. Ella Lewis', gender = 'Female', date_of_birth = '1986-06-01', baptism_date = '1986-08-01',
  confirmation_date = '1999-06-03', ordination_date = '2017-10-27', phone = '0917-629-4130', email = 'ella.lewis@gmail.com',
  address = 'Poblacion, Bontoc, Mountain Province', assignment = 'St. Paul - Samoki', status = 'Active', rank = 'priest',
  contract_end = '2028-03-31', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '2016-12-09', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Martha - Cabunagan'
WHERE id = 'CLG-068';
UPDATE clergy_profiles SET
  place_of_birth = 'Bontoc, Mountain Province', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (2015)', other_information = 'Indigenous Peoples Ministry Liaison',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-068';

UPDATE clergy_records SET
  name = 'Rev. Fr. Samuel Robinson', gender = 'Male', date_of_birth = '1988-08-18', baptism_date = '1988-11-04',
  confirmation_date = '2000-09-06', ordination_date = '2015-02-15', phone = '0920-413-7046', email = 'samuel.robinson@gmail.com',
  address = 'Poblacion, Sagada, Mountain Province', assignment = 'Mission - Barlig', status = 'Active', rank = 'priest',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '2014-05-08', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'Mission - Duagan'
WHERE id = 'CLG-069';
UPDATE clergy_profiles SET
  place_of_birth = 'Sagada, Mountain Province', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2013)', other_information = 'Diocesan Christian Education Coordinator',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-069';

UPDATE clergy_records SET
  name = 'Rev. Mo. Grace Young', gender = 'Female', date_of_birth = '1995-06-14', baptism_date = '1995-08-30',
  confirmation_date = '2009-06-20', ordination_date = '2022-08-24', phone = '0918-860-9779', email = 'grace.young@gmail.com',
  address = 'Poblacion, Besao, Mountain Province', assignment = 'St. Theodore''s - Basao', status = 'Active', rank = 'priest',
  contract_end = '2027-12-31', retirement_date = NULL, deanery_id = 2,
  diaconate_date = '2021-12-07', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Ignatius - Kayan'
WHERE id = 'CLG-070';
UPDATE clergy_profiles SET
  place_of_birth = 'Besao, Mountain Province', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (2020)', other_information = 'Ecumenical and Inter-Faith Relations Officer',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-070';

UPDATE clergy_records SET
  name = 'Rev. Fr. Owen Hall', gender = 'Male', date_of_birth = '1973-04-07', baptism_date = '1973-06-23',
  confirmation_date = '1986-04-12', ordination_date = '1999-12-04', phone = '0927-283-5952', email = 'owen.hall@gmail.com',
  address = 'Poblacion, Bauko, Mountain Province', assignment = 'St. Bernard - Buscalan', status = 'Active', rank = 'priest',
  contract_end = '2028-03-31', retirement_date = NULL, deanery_id = 2,
  diaconate_date = '1999-04-10', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Barnabas - Alab'
WHERE id = 'CLG-071';
UPDATE clergy_profiles SET
  place_of_birth = 'Bauko, Mountain Province', civil_status = 'Married',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master in Ministry, Trinity Theological College (1998)', other_information = 'Disaster Preparedness and Response Coordinator',
  spouse_name = 'Grace Hall', marriage_date = '1998-05-02', marriage_place = 'Bauko, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-071';

UPDATE clergy_records SET
  name = 'Rev. Mo. Lily Allen', gender = 'Female', date_of_birth = '1965-09-10', baptism_date = '1965-11-23',
  confirmation_date = '1977-09-27', ordination_date = '1995-05-09', phone = '0919-152-5136', email = 'lily.allen@gmail.com',
  address = 'Poblacion, Tadian, Mountain Province', assignment = 'Dominic''s - Tulgao', status = 'Active', rank = 'priest',
  contract_end = '2028-03-31', retirement_date = NULL, deanery_id = 2,
  diaconate_date = '1994-08-15', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Timothy''s - Dantay'
WHERE id = 'CLG-072';
UPDATE clergy_profiles SET
  place_of_birth = 'Tadian, Mountain Province', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (1993)', other_information = 'Deanery Secretary',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-072';

UPDATE clergy_records SET
  name = 'Rev. Fr. Caleb King', gender = 'Male', date_of_birth = '1992-02-27', baptism_date = '1992-04-01',
  confirmation_date = '2005-03-10', ordination_date = NULL, phone = '0920-221-7818', email = 'caleb.king@gmail.com',
  address = 'Poblacion, Tinglayan, Kalinga', assignment = 'Transfiguration church - Maswa', status = 'Active', rank = 'deacon',
  contract_end = '2027-09-30', retirement_date = NULL, deanery_id = 2,
  diaconate_date = '2022-05-03', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = NULL,
  previous_assignment = 'St. Gabriel''s - Maligcong'
WHERE id = 'CLG-073';
UPDATE clergy_profiles SET
  place_of_birth = 'Tinglayan, Kalinga', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (2021)', other_information = 'Deanery Representative to Diocesan Council',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-073';

UPDATE clergy_records SET
  name = 'Rev. Mo. Zoe Wright', gender = 'Female', date_of_birth = '1976-09-13', baptism_date = '1976-11-10',
  confirmation_date = '1989-09-19', ordination_date = '2007-12-14', phone = '0920-740-4457', email = 'zoe.wright@gmail.com',
  address = 'Poblacion, Tabuk City, Kalinga', assignment = 'St. Augustine - Agawa', status = 'Active', rank = 'priest',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 3,
  diaconate_date = '2006-12-04', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Agnes - Payag-eo'
WHERE id = 'CLG-074';
UPDATE clergy_profiles SET
  place_of_birth = 'Tabuk City, Kalinga', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2005)', other_information = 'Assistant Dean of Deanery',
  spouse_name = 'Robert Reyes', marriage_date = '2001-03-18', marriage_place = 'Tabuk City, Kalinga',
  verification = 'Verified'
WHERE record_id = 'CLG-074';

UPDATE clergy_records SET
  name = 'Rev. Fr. Isaac Scott', gender = 'Male', date_of_birth = '1966-03-01', baptism_date = '1966-04-26',
  confirmation_date = '1979-03-20', ordination_date = '1995-10-19', phone = '0921-906-4241', email = 'isaac.scott@gmail.com',
  address = 'Poblacion, Baguio City', assignment = 'St. Anne - Besao', status = 'Active', rank = 'priest',
  contract_end = '2028-03-31', retirement_date = NULL, deanery_id = 3,
  diaconate_date = '1995-02-22', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Andrews - Bugnay'
WHERE id = 'CLG-075';
UPDATE clergy_profiles SET
  place_of_birth = 'Baguio City', civil_status = 'Married',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (1994)', other_information = 'Curate / Assistant Priest',
  spouse_name = 'Grace Scott', marriage_date = '1991-11-05', marriage_place = 'Baguio City',
  verification = 'Verified'
WHERE record_id = 'CLG-075';

UPDATE clergy_records SET
  name = 'Rev. Mo. Nora Green', gender = 'Female', date_of_birth = '1979-03-03', baptism_date = '1979-04-05',
  confirmation_date = '1991-03-25', ordination_date = '2009-02-05', phone = '0921-816-7594', email = 'nora.green@gmail.com',
  address = 'Poblacion, La Trinidad, Benguet', assignment = 'St. John the Divine - Lacmaan', status = 'Active', rank = 'priest',
  contract_end = '2028-03-31', retirement_date = NULL, deanery_id = 3,
  diaconate_date = '2008-02-15', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'Dominic''s - Tulgao'
WHERE id = 'CLG-076';
UPDATE clergy_profiles SET
  place_of_birth = 'La Trinidad, Benguet', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master in Ministry, Trinity Theological College (2007)', other_information = 'Diocesan Youth Ministry Coordinator',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-076';

UPDATE clergy_records SET
  name = 'Rev. Fr. Dylan Baker', gender = 'Male', date_of_birth = '1994-09-16', baptism_date = '1994-11-13',
  confirmation_date = '2006-10-02', ordination_date = '2024-11-09', phone = '0921-126-2496', email = 'dylan.baker@gmail.com',
  address = 'Poblacion, Cervantes, Ilocos Sur', assignment = 'Former Parish', status = 'On Leave', rank = 'priest',
  contract_end = NULL, retirement_date = NULL, deanery_id = 8,
  diaconate_date = '2023-12-11', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'Holy Trinity - Tinglayan'
WHERE id = 'CLG-077';
UPDATE clergy_profiles SET
  place_of_birth = 'Cervantes, Ilocos Sur', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (2022)', other_information = 'Episcopal Church Women Spiritual Adviser',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-077';

UPDATE clergy_records SET
  name = 'Rev. Mo. Hazel Adams', gender = 'Female', date_of_birth = '1963-11-27', baptism_date = '1964-01-13',
  confirmation_date = '1977-11-24', ordination_date = '1992-01-04', phone = '0935-193-8700', email = 'hazel.adams@gmail.com',
  address = 'Poblacion, Bontoc, Mountain Province', assignment = 'St. Dunstan - Catenga', status = 'Active', rank = 'priest',
  contract_end = '2028-12-31', retirement_date = NULL, deanery_id = 3,
  diaconate_date = '1991-03-19', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Philip - Gueday'
WHERE id = 'CLG-078';
UPDATE clergy_profiles SET
  place_of_birth = 'Bontoc, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (1990)', other_information = 'Commission on Liturgy and Music Member',
  spouse_name = 'Lito Codiamat', marriage_date = '1992-02-28', marriage_place = 'Bontoc, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-078';

UPDATE clergy_records SET
  name = 'Rev. Fr. Leo Nelson', gender = 'Male', date_of_birth = '1972-06-14', baptism_date = '1972-08-27',
  confirmation_date = '1985-06-20', ordination_date = '2001-10-13', phone = '0927-218-7622', email = 'leo.nelson@gmail.com',
  address = 'Poblacion, Sagada, Mountain Province', assignment = 'St. Gregory - Bagnen', status = 'Active', rank = 'priest',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '2001-02-11', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Clement - Payeo'
WHERE id = 'CLG-079';
UPDATE clergy_profiles SET
  place_of_birth = 'Sagada, Mountain Province', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2000)', other_information = 'Stewardship and Finance Committee Member',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-079';

UPDATE clergy_records SET
  name = 'Rev. Mo. Aria Hill', gender = 'Female', date_of_birth = '1962-11-28', baptism_date = '1963-01-31',
  confirmation_date = '1975-12-08', ordination_date = '1991-09-12', phone = '0939-234-5719', email = 'aria.hill@gmail.com',
  address = 'Poblacion, Besao, Mountain Province', assignment = 'Holy Innocent - Bebe', status = 'Active', rank = 'priest',
  contract_end = '2028-12-31', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '1991-01-07', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'Holy Apostle - Abatan'
WHERE id = 'CLG-080';
UPDATE clergy_profiles SET
  place_of_birth = 'Besao, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (1990)', other_information = 'Indigenous Peoples Ministry Liaison',
  spouse_name = 'Manuel Dela Cruz', marriage_date = '1986-11-20', marriage_place = 'Besao, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-080';

UPDATE clergy_records SET
  name = 'Rev. Fr. Julian Campbell', gender = 'Male', date_of_birth = '1977-12-06', baptism_date = '1978-01-24',
  confirmation_date = '1991-12-03', ordination_date = '2007-03-21', phone = '0919-610-5781', email = 'julian.campbell@gmail.com',
  address = 'Poblacion, Bauko, Mountain Province', assignment = 'San Luis - Mabaay', status = 'Active', rank = 'bishop',
  contract_end = '2027-06-30', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '2006-02-21', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. John - Bila'
WHERE id = 'CLG-081';
UPDATE clergy_profiles SET
  place_of_birth = 'Bauko, Mountain Province', civil_status = 'Married',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master in Ministry, Trinity Theological College (2005)', other_information = 'Diocesan Christian Education Coordinator',
  spouse_name = 'Imelda Campbell', marriage_date = '2004-08-16', marriage_place = 'Bauko, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-081';

UPDATE clergy_records SET
  name = 'Rev. Mo. Ruby Mitchell', gender = 'Female', date_of_birth = '1977-08-18', baptism_date = '1977-09-26',
  confirmation_date = '1990-08-21', ordination_date = '2006-07-27', phone = '0939-373-1042', email = 'ruby.mitchell@gmail.com',
  address = 'Poblacion, Tadian, Mountain Province', assignment = 'St. Mary - Mount Data', status = 'Active', rank = 'priest',
  contract_end = '2027-06-30', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '2005-07-11', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Mary - Mount Data'
WHERE id = 'CLG-082';
UPDATE clergy_profiles SET
  place_of_birth = 'Tadian, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (2004)', other_information = 'Ecumenical and Inter-Faith Relations Officer',
  spouse_name = 'Ferdinand Kidang', marriage_date = '2005-11-16', marriage_place = 'Tadian, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-082';

UPDATE clergy_records SET
  name = 'Rev. Fr. Aaron Roberts', gender = 'Male', date_of_birth = '1971-08-18', baptism_date = '1971-10-17',
  confirmation_date = '1984-08-24', ordination_date = '1999-10-30', phone = '0928-339-7730', email = 'aaron.roberts@gmail.com',
  address = 'Poblacion, Tinglayan, Kalinga', assignment = 'St. Francis - Cagubatan', status = 'Active', rank = 'priest',
  contract_end = '2028-06-30', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '1998-12-08', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Bernard - Pangao'
WHERE id = 'CLG-083';
UPDATE clergy_profiles SET
  place_of_birth = 'Tinglayan, Kalinga', civil_status = 'Married',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (1997)', other_information = 'Disaster Preparedness and Response Coordinator',
  spouse_name = 'Carmelita Roberts', marriage_date = '2000-07-13', marriage_place = 'Tinglayan, Kalinga',
  verification = 'Verified'
WHERE record_id = 'CLG-083';

UPDATE clergy_records SET
  name = 'Rev. Mo. Stella Carter', gender = 'Female', date_of_birth = '1971-08-02', baptism_date = '1971-09-09',
  confirmation_date = '1985-08-28', ordination_date = '1998-03-17', phone = '0919-519-3529', email = 'stella.carter@gmail.com',
  address = 'Poblacion, Tabuk City, Kalinga', assignment = 'St. Mark - Sinto', status = 'Active', rank = 'priest',
  contract_end = '2028-12-31', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '1997-09-15', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Gregory - Soysoyoc'
WHERE id = 'CLG-084';
UPDATE clergy_profiles SET
  place_of_birth = 'Tabuk City, Kalinga', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (1996)', other_information = 'Deanery Secretary',
  spouse_name = 'Ferdinand Codiamat', marriage_date = '1999-12-13', marriage_place = 'Tabuk City, Kalinga',
  verification = 'Verified'
WHERE record_id = 'CLG-084';

UPDATE clergy_records SET
  name = 'Rev. Fr. Felix Phillips', gender = 'Male', date_of_birth = '1967-06-28', baptism_date = '1967-09-09',
  confirmation_date = '1981-07-06', ordination_date = '1997-08-05', phone = '0920-746-5708', email = 'felix.phillips@gmail.com',
  address = 'Poblacion, Baguio City', assignment = 'St. John - Pasnadan', status = 'Active', rank = 'priest',
  contract_end = '2028-12-31', retirement_date = NULL, deanery_id = 4,
  diaconate_date = '1997-01-20', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Hilarys - Dandanac'
WHERE id = 'CLG-085';
UPDATE clergy_profiles SET
  place_of_birth = 'Baguio City', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (1996)', other_information = 'Deanery Representative to Diocesan Council',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-085';

UPDATE clergy_records SET
  name = 'Rev. Mo. Violet Evans', gender = 'Female', date_of_birth = '1967-07-04', baptism_date = '1967-09-20',
  confirmation_date = '1981-07-22', ordination_date = '1994-01-06', phone = '0921-467-7141', email = 'violet.evans@gmail.com',
  address = 'Poblacion, La Trinidad, Benguet', assignment = 'St Cyril - Bab-asig', status = 'Active', rank = 'priest',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 5,
  diaconate_date = '1993-06-26', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Alfred - Tamboan'
WHERE id = 'CLG-086';
UPDATE clergy_profiles SET
  place_of_birth = 'La Trinidad, Benguet', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master in Ministry, Trinity Theological College (1992)', other_information = 'Assistant Dean of Deanery',
  spouse_name = 'Danilo Alawas', marriage_date = '1994-10-22', marriage_place = 'La Trinidad, Benguet',
  verification = 'Verified'
WHERE record_id = 'CLG-086';

UPDATE clergy_records SET
  name = 'Rev. Fr. Theo Turner', gender = 'Male', date_of_birth = '1973-03-06', baptism_date = '1973-04-10',
  confirmation_date = '1987-03-30', ordination_date = '2001-04-23', phone = '0935-361-1153', email = 'theo.turner@gmail.com',
  address = 'Poblacion, Cervantes, Ilocos Sur', assignment = 'St. Hilarys - Dandanac', status = 'Active', rank = 'priest',
  contract_end = '2027-09-30', retirement_date = NULL, deanery_id = 5,
  diaconate_date = '2000-08-21', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Polycarp - Matibuey'
WHERE id = 'CLG-087';
UPDATE clergy_profiles SET
  place_of_birth = 'Cervantes, Ilocos Sur', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (1999)', other_information = 'Curate / Assistant Priest',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-087';

UPDATE clergy_records SET
  name = 'Rev. Mo. Maya Parker', gender = 'Female', date_of_birth = '1991-05-22', baptism_date = '1991-07-25',
  confirmation_date = '2003-05-21', ordination_date = '2020-05-11', phone = '0920-493-8916', email = 'maya.parker@gmail.com',
  address = 'Poblacion, Bontoc, Mountain Province', assignment = 'St. Andrew - Patiacan', status = 'Active', rank = 'priest',
  contract_end = '2028-09-30', retirement_date = NULL, deanery_id = 5,
  diaconate_date = '2019-08-28', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Matthew - Bangaan'
WHERE id = 'CLG-088';
UPDATE clergy_profiles SET
  place_of_birth = 'Bontoc, Mountain Province', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (2018)', other_information = 'Diocesan Youth Ministry Coordinator',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-088';

UPDATE clergy_records SET
  name = 'Rev. Fr. Jasper Collins', gender = 'Male', date_of_birth = '1986-10-12', baptism_date = '1986-12-17',
  confirmation_date = '1999-10-31', ordination_date = '2013-10-18', phone = '0917-720-9138', email = 'jasper.collins@gmail.com',
  address = 'Poblacion, Sagada, Mountain Province', assignment = 'St. Luke - Maliten', status = 'Active', rank = 'priest',
  contract_end = '2028-03-31', retirement_date = NULL, deanery_id = 5,
  diaconate_date = '2012-10-28', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Mary - Tetep-an'
WHERE id = 'CLG-089';
UPDATE clergy_profiles SET
  place_of_birth = 'Sagada, Mountain Province', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2011)', other_information = 'Episcopal Church Women Spiritual Adviser',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-089';

UPDATE clergy_records SET
  name = 'Rev. Mo. Naomi Edwards', gender = 'Female', date_of_birth = '1980-04-20', baptism_date = '1980-07-10',
  confirmation_date = '1993-04-24', ordination_date = '2007-05-30', phone = '0921-907-8222', email = 'naomi.edwards@gmail.com',
  address = 'Poblacion, Besao, Mountain Province', assignment = 'St. Stephen - Legleg', status = 'Active', rank = 'priest',
  contract_end = '2027-09-30', retirement_date = NULL, deanery_id = 5,
  diaconate_date = '2006-11-21', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Agnes - Pide'
WHERE id = 'CLG-090';
UPDATE clergy_profiles SET
  place_of_birth = 'Besao, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (2005)', other_information = 'Commission on Liturgy and Music Member',
  spouse_name = 'Lito Caligtan', marriage_date = '2005-02-10', marriage_place = 'Besao, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-090';

UPDATE clergy_records SET
  name = 'Rev. Fr. Hugo Stewart', gender = 'Male', date_of_birth = '1982-12-14', baptism_date = '1983-01-24',
  confirmation_date = '1994-12-15', ordination_date = '2010-03-26', phone = '0921-864-6549', email = 'hugo.stewart@gmail.com',
  address = 'Poblacion, Bauko, Mountain Province', assignment = 'St. Columba - Ambasing', status = 'Active', rank = 'priest',
  contract_end = '2028-03-31', retirement_date = NULL, deanery_id = 6,
  diaconate_date = '2009-05-27', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Francis - New Lubon'
WHERE id = 'CLG-091';
UPDATE clergy_profiles SET
  place_of_birth = 'Bauko, Mountain Province', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master in Ministry, Trinity Theological College (2008)', other_information = 'Stewardship and Finance Committee Member',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-091';

UPDATE clergy_records SET
  name = 'Rev. Mo. Elena Morris', gender = 'Female', date_of_birth = '1991-02-05', baptism_date = '1991-04-24',
  confirmation_date = '2003-03-01', ordination_date = '2018-03-05', phone = '0939-226-8451', email = 'elena.morris@gmail.com',
  address = 'Poblacion, Tadian, Mountain Province', assignment = 'St. Matthew - Bangaan', status = 'Active', rank = 'priest',
  contract_end = '2028-06-30', retirement_date = NULL, deanery_id = 6,
  diaconate_date = '2017-07-01', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'Epiphany - Sumadel'
WHERE id = 'CLG-092';
UPDATE clergy_profiles SET
  place_of_birth = 'Tadian, Mountain Province', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (2016)', other_information = 'Indigenous Peoples Ministry Liaison',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-092';

UPDATE clergy_records SET
  name = 'Rev. Fr. Ryan Rogers', gender = 'Male', date_of_birth = '1978-10-13', baptism_date = '1979-01-03',
  confirmation_date = '1992-11-08', ordination_date = '2008-11-03', phone = '0935-817-5951', email = 'ryan.rogers@gmail.com',
  address = 'Poblacion, Tinglayan, Kalinga', assignment = 'St. John - Pide', status = 'Active', rank = 'priest',
  contract_end = '2028-06-30', retirement_date = NULL, deanery_id = 6,
  diaconate_date = '2008-04-21', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Catherine - Cervantes'
WHERE id = 'CLG-093';
UPDATE clergy_profiles SET
  place_of_birth = 'Tinglayan, Kalinga', civil_status = 'Married',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (2007)', other_information = 'Diocesan Christian Education Coordinator',
  spouse_name = 'Marilou Rogers', marriage_date = '2003-01-02', marriage_place = 'Tinglayan, Kalinga',
  verification = 'Verified'
WHERE record_id = 'CLG-093';

UPDATE clergy_records SET
  name = 'Rev. Mo. Clara Reed', gender = 'Female', date_of_birth = '1981-08-04', baptism_date = '1981-09-09',
  confirmation_date = '1993-08-29', ordination_date = '2012-07-30', phone = '0928-770-2622', email = 'clara.reed@gmail.com',
  address = 'Poblacion, Tabuk City, Kalinga', assignment = 'St. Mary the Virgin - Sagada', status = 'Active', rank = 'priest',
  contract_end = '2028-09-30', retirement_date = NULL, deanery_id = 6,
  diaconate_date = '2011-12-24', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Thomas - Balili'
WHERE id = 'CLG-094';
UPDATE clergy_profiles SET
  place_of_birth = 'Tabuk City, Kalinga', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2010)', other_information = 'Ecumenical and Inter-Faith Relations Officer',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-094';

UPDATE clergy_records SET
  name = 'Rev. Fr. Marco Cook', gender = 'Male', date_of_birth = '1988-05-02', baptism_date = '1988-07-15',
  confirmation_date = '2001-05-05', ordination_date = '2017-06-19', phone = '0917-507-5520', email = 'marco.cook@gmail.com',
  address = 'Poblacion, Baguio City', assignment = 'St. Stephen - Nacagang', status = 'Active', rank = 'priest',
  contract_end = '2027-06-30', retirement_date = NULL, deanery_id = 6,
  diaconate_date = '2016-09-21', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Augustine''s - Gonogon'
WHERE id = 'CLG-095';
UPDATE clergy_profiles SET
  place_of_birth = 'Baguio City', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (2015)', other_information = 'Disaster Preparedness and Response Coordinator',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-095';

UPDATE clergy_records SET
  name = 'Rev. Mo. Lara Bell', gender = 'Female', date_of_birth = '1969-08-03', baptism_date = '1969-10-14',
  confirmation_date = '1981-08-20', ordination_date = NULL, phone = '0947-310-2124', email = 'lara.bell@gmail.com',
  address = 'Poblacion, La Trinidad, Benguet', assignment = 'Holy Trinity - Bantey', status = 'Active', rank = 'deacon',
  contract_end = '2028-06-30', retirement_date = NULL, deanery_id = 7,
  diaconate_date = '1996-03-26', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = NULL,
  previous_assignment = 'Favuyan Mission - Maligcong'
WHERE id = 'CLG-096';
UPDATE clergy_profiles SET
  place_of_birth = 'La Trinidad, Benguet', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master in Ministry, Trinity Theological College (1995)', other_information = 'Deanery Secretary',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-096';

UPDATE clergy_records SET
  name = 'Rev. Fr. Diego Murphy', gender = 'Male', date_of_birth = '1997-04-19', baptism_date = '1997-06-01',
  confirmation_date = '2009-04-26', ordination_date = '2024-11-17', phone = '0919-212-1422', email = 'diego.murphy@gmail.com',
  address = 'Poblacion, Cervantes, Ilocos Sur', assignment = 'St. Francis - New Lubon', status = 'Active', rank = 'priest',
  contract_end = '2028-03-31', retirement_date = NULL, deanery_id = 7,
  diaconate_date = '2024-03-18', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'Mission - Barlig'
WHERE id = 'CLG-097';
UPDATE clergy_profiles SET
  place_of_birth = 'Cervantes, Ilocos Sur', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (2023)', other_information = 'Deanery Representative to Diocesan Council',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-097';

UPDATE clergy_records SET
  name = 'Rev. Mo. Yuki Tanaka', gender = 'Female', date_of_birth = '1984-04-19', baptism_date = '1984-06-08',
  confirmation_date = '1996-04-21', ordination_date = '2011-08-29', phone = '0927-625-2786', email = 'yuki.tanaka@gmail.com',
  address = 'Poblacion, Bontoc, Mountain Province', assignment = 'St. John the Baptist - Ilang', status = 'Active', rank = 'priest',
  contract_end = '2027-06-30', retirement_date = NULL, deanery_id = 7,
  diaconate_date = '2010-08-15', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Paul''s - Belwang'
WHERE id = 'CLG-098';
UPDATE clergy_profiles SET
  place_of_birth = 'Bontoc, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (2009)', other_information = 'Assistant Dean of Deanery',
  spouse_name = 'Danilo Kidang', marriage_date = '2008-12-26', marriage_place = 'Bontoc, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-098';

UPDATE clergy_records SET
  name = 'Rev. Fr. Hiro Sato', gender = 'Male', date_of_birth = '1995-05-15', baptism_date = '1995-07-25',
  confirmation_date = '2007-05-13', ordination_date = '2025-07-01', phone = '0918-429-3430', email = 'hiro.sato@gmail.com',
  address = 'Poblacion, Sagada, Mountain Province', assignment = 'St. Michael & all angels - Tadian', status = 'Active', rank = 'priest',
  contract_end = '2027-06-30', retirement_date = NULL, deanery_id = 7,
  diaconate_date = '2024-12-15', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Andrew''s - Bugnay'
WHERE id = 'CLG-099';
UPDATE clergy_profiles SET
  place_of_birth = 'Sagada, Mountain Province', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2023)', other_information = 'Curate / Assistant Priest',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-099';

UPDATE clergy_records SET
  name = 'Rev. Fr. Min-jun Park', gender = 'Male', date_of_birth = '1979-10-21', baptism_date = '1979-12-27',
  confirmation_date = '1993-11-08', ordination_date = '2010-05-07', phone = '0918-973-4522', email = 'min-jun.park@gmail.com',
  address = 'Poblacion, Besao, Mountain Province', assignment = 'St. Ignatius - Kayan', status = 'Active', rank = 'priest',
  contract_end = '2028-12-31', retirement_date = NULL, deanery_id = 7,
  diaconate_date = '2009-10-14', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Augustine - Agawa'
WHERE id = 'CLG-100';
UPDATE clergy_profiles SET
  place_of_birth = 'Besao, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (2008)', other_information = 'Diocesan Youth Ministry Coordinator',
  spouse_name = 'Corazon Park', marriage_date = '2006-06-27', marriage_place = 'Besao, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-100';

UPDATE clergy_records SET
  name = 'Rev. Mo. Seo-yeon Kim', gender = 'Female', date_of_birth = '1991-07-14', baptism_date = '1991-09-28',
  confirmation_date = '2003-07-21', ordination_date = '2021-03-01', phone = '0918-195-8075', email = 'seo-yeon.kim@gmail.com',
  address = 'Poblacion, Bauko, Mountain Province', assignment = 'St. Stephen - Bunga', status = 'Active', rank = 'priest',
  contract_end = '2027-09-30', retirement_date = NULL, deanery_id = 7,
  diaconate_date = '2020-02-03', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Benidict - Kin-iway'
WHERE id = 'CLG-101';
UPDATE clergy_profiles SET
  place_of_birth = 'Bauko, Mountain Province', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master in Ministry, Trinity Theological College (2019)', other_information = 'Episcopal Church Women Spiritual Adviser',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-101';

UPDATE clergy_records SET
  name = 'Rev. Fr. Wei Zhang', gender = 'Male', date_of_birth = '1985-03-18', baptism_date = '1985-04-20',
  confirmation_date = '1999-04-14', ordination_date = NULL, phone = '0921-714-6119', email = 'wei.zhang@gmail.com',
  address = 'Poblacion, Tadian, Mountain Province', assignment = 'St. Thomas - Balili', status = 'Active', rank = 'deacon',
  contract_end = '2028-06-30', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '2014-12-02', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = NULL,
  previous_assignment = 'St. Ambrose - Suquib'
WHERE id = 'CLG-102';
UPDATE clergy_profiles SET
  place_of_birth = 'Tadian, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (2013)', other_information = 'Commission on Liturgy and Music Member',
  spouse_name = 'Leonora Zhang', marriage_date = '2013-04-05', marriage_place = 'Tadian, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-102';

UPDATE clergy_records SET
  name = 'Rev. Mo. Priya Sharma', gender = 'Female', date_of_birth = '1992-04-28', baptism_date = '1992-06-03',
  confirmation_date = '2005-05-22', ordination_date = '2022-10-19', phone = '0947-728-1430', email = 'priya.sharma@gmail.com',
  address = 'Poblacion, Tinglayan, Kalinga', assignment = 'Holy Trinity - Dalikan', status = 'Active', rank = 'priest',
  contract_end = '2027-12-31', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '2021-09-25', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Gregory - Bagnen'
WHERE id = 'CLG-103';
UPDATE clergy_profiles SET
  place_of_birth = 'Tinglayan, Kalinga', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (2020)', other_information = 'Stewardship and Finance Committee Member',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-103';

UPDATE clergy_records SET
  name = 'Rev. Fr. Arjun Patel', gender = 'Male', date_of_birth = '1979-01-06', baptism_date = '1979-02-22',
  confirmation_date = '1993-01-26', ordination_date = NULL, phone = '0918-245-1502', email = 'arjun.patel@gmail.com',
  address = 'Poblacion, Tabuk City, Kalinga', assignment = 'St. Michael''s - Guina-ang', status = 'Active', rank = 'deacon',
  contract_end = '2027-09-30', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '2009-11-13', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = NULL,
  previous_assignment = 'St. Gabriel - Data'
WHERE id = 'CLG-104';
UPDATE clergy_profiles SET
  place_of_birth = 'Tabuk City, Kalinga', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (2008)', other_information = 'Indigenous Peoples Ministry Liaison',
  spouse_name = 'Grace Patel', marriage_date = '2004-07-14', marriage_place = 'Tabuk City, Kalinga',
  verification = 'Verified'
WHERE record_id = 'CLG-104';

UPDATE clergy_records SET
  name = 'Rev. Mo. Fatima Khan', gender = 'Female', date_of_birth = '1991-06-06', baptism_date = '1991-07-29',
  confirmation_date = '2004-06-25', ordination_date = '2019-02-26', phone = '0917-790-2336', email = 'fatima.khan@gmail.com',
  address = 'Poblacion, Baguio City', assignment = 'St. Gabriel''s - Maligcong', status = 'Active', rank = 'priest',
  contract_end = '2027-03-31', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '2018-03-25', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Paul - Otucan'
WHERE id = 'CLG-105';
UPDATE clergy_profiles SET
  place_of_birth = 'Baguio City', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (2017)', other_information = 'Diocesan Christian Education Coordinator',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-105';

UPDATE clergy_records SET
  name = 'Rev. Fr. Omar Hassan', gender = 'Male', date_of_birth = '1989-08-20', baptism_date = '1989-10-17',
  confirmation_date = '2002-08-25', ordination_date = '2018-10-19', phone = '0935-639-6053', email = 'omar.hassan@gmail.com',
  address = 'Poblacion, La Trinidad, Benguet', assignment = 'St. Paul - Samoki', status = 'Active', rank = 'priest',
  contract_end = '2027-06-30', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '2017-11-22', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Mark - Sinto'
WHERE id = 'CLG-106';
UPDATE clergy_profiles SET
  place_of_birth = 'La Trinidad, Benguet', civil_status = 'Single',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master in Ministry, Trinity Theological College (2016)', other_information = 'Ecumenical and Inter-Faith Relations Officer',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-106';

UPDATE clergy_records SET
  name = 'Rev. Mo. Amara Okafor', gender = 'Female', date_of_birth = '1987-10-02', baptism_date = '1987-11-01',
  confirmation_date = '1999-10-08', ordination_date = '2015-12-05', phone = '0928-279-3116', email = 'amara.okafor@gmail.com',
  address = 'Poblacion, Cervantes, Ilocos Sur', assignment = 'Mission - Barlig', status = 'Active', rank = 'priest',
  contract_end = '2028-03-31', retirement_date = NULL, deanery_id = 1,
  diaconate_date = '2015-02-01', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Martin - Gotang'
WHERE id = 'CLG-107';
UPDATE clergy_profiles SET
  place_of_birth = 'Cervantes, Ilocos Sur', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (2014)', other_information = 'Disaster Preparedness and Response Coordinator',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-107';

UPDATE clergy_records SET
  name = 'Rev. Fr. Lukas Schmidt', gender = 'Male', date_of_birth = '1976-09-18', baptism_date = '1976-12-10',
  confirmation_date = '1990-10-10', ordination_date = '2003-09-07', phone = '0927-689-8033', email = 'lukas.schmidt@gmail.com',
  address = 'Poblacion, Bontoc, Mountain Province', assignment = 'St. Theodore''s - Basao', status = 'Active', rank = 'priest',
  contract_end = '2028-09-30', retirement_date = NULL, deanery_id = 2,
  diaconate_date = '2002-08-03', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Marks - Pananuman'
WHERE id = 'CLG-108';
UPDATE clergy_profiles SET
  place_of_birth = 'Bontoc, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Divinity, St. Andrew''s Theological Seminary (2001)', other_information = 'Deanery Secretary',
  spouse_name = 'Fe Schmidt', marriage_date = '2002-02-13', marriage_place = 'Bontoc, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-108';

UPDATE clergy_records SET
  name = 'Rev. Fr. Sven Larsson', gender = 'Male', date_of_birth = '1963-06-06', baptism_date = '1963-08-26',
  confirmation_date = '1977-06-16', ordination_date = NULL, phone = '0928-636-2288', email = 'sven.larsson@gmail.com',
  address = 'Poblacion, Sagada, Mountain Province', assignment = 'St. Bernard - Buscalan', status = 'Active', rank = 'deacon',
  contract_end = '2027-06-30', retirement_date = NULL, deanery_id = 2,
  diaconate_date = '1990-07-19', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = NULL,
  previous_assignment = 'St. Luke - Maliten'
WHERE id = 'CLG-109';
UPDATE clergy_profiles SET
  place_of_birth = 'Sagada, Mountain Province', civil_status = 'Married',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Bachelor of Theology, St. Andrew''s Theological Seminary (1989)', other_information = 'Deanery Representative to Diocesan Council',
  spouse_name = 'Imelda Larsson', marriage_date = '1992-06-08', marriage_place = 'Sagada, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-109';

UPDATE clergy_records SET
  name = 'Rev. Fr. Fabian Kidang', gender = 'Male', date_of_birth = '1983-03-03', baptism_date = '1983-05-04',
  confirmation_date = '1997-03-02', ordination_date = '2010-11-07', phone = '0921-302-3842', email = 'fabian.kidang@gmail.com',
  address = 'Poblacion, Besao, Mountain Province', assignment = 'Dominic''s - Tulgao', status = 'Active', rank = 'priest',
  contract_end = '2028-06-30', retirement_date = NULL, deanery_id = 2,
  diaconate_date = '2010-04-04', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'Ignacia & Juan - Aguid'
WHERE id = 'CLG-110';
UPDATE clergy_profiles SET
  place_of_birth = 'Besao, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Master of Arts in Theological Studies, St. Andrew''s Theological Seminary (2009)', other_information = 'Assistant Dean of Deanery',
  spouse_name = 'Marilou Kidang', marriage_date = '2008-11-16', marriage_place = 'Besao, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-110';

UPDATE clergy_records SET
  name = 'Rev. Fr. Arthur Sano', gender = 'Male', date_of_birth = '1991-10-25', baptism_date = '1991-12-31',
  confirmation_date = '2004-11-11', ordination_date = '2019-09-28', phone = '0935-552-5961', email = 'arthur.sano@gmail.com',
  address = 'Poblacion, Bauko, Mountain Province', assignment = 'Transfiguration church - Maswa', status = 'Active', rank = 'priest',
  contract_end = '2028-06-30', retirement_date = NULL, deanery_id = 2,
  diaconate_date = '2019-03-15', diaconate_place = 'St. Mary the Virgin - Sagada', ordination_place = 'St. Mary the Virgin - Sagada',
  previous_assignment = 'St. Mary Magdalene - Fedelisan'
WHERE id = 'CLG-111';
UPDATE clergy_profiles SET
  place_of_birth = 'Bauko, Mountain Province', civil_status = 'Single',
  baptism_place = 'St. Mary the Virgin, Sagada', confirmation_place = 'St. Mary the Virgin - Sagada',
  education = 'Master in Ministry, Trinity Theological College (2018)', other_information = 'Curate / Assistant Priest',
  spouse_name = '', marriage_date = NULL, marriage_place = '',
  verification = 'Verified'
WHERE record_id = 'CLG-111';

UPDATE clergy_records SET
  name = 'Rev. Mo. Adeline Baluyan', gender = 'Female', date_of_birth = '1965-06-17', baptism_date = '1965-07-21',
  confirmation_date = '1978-06-28', ordination_date = '1992-08-24', phone = '0928-573-1672', email = 'adeline.baluyan@gmail.com',
  address = 'Poblacion, Tadian, Mountain Province', assignment = 'St. Augustine - Agawa', status = 'Active', rank = 'priest',
  contract_end = '2027-06-30', retirement_date = NULL, deanery_id = 3,
  diaconate_date = '1991-10-20', diaconate_place = 'All Saints Cathedral - Bontoc', ordination_place = 'All Saints Cathedral - Bontoc',
  previous_assignment = 'St. Mary the Virgin - Sagada'
WHERE id = 'CLG-112';
UPDATE clergy_profiles SET
  place_of_birth = 'Tadian, Mountain Province', civil_status = 'Married',
  baptism_place = 'All Saints Cathedral, Bontoc', confirmation_place = 'All Saints Cathedral - Bontoc',
  education = 'Diploma in Episcopal Studies, St. Andrew''s Theological Seminary (1990)', other_information = 'Diocesan Youth Ministry Coordinator',
  spouse_name = 'Jaime Bang-as', marriage_date = '1990-06-20', marriage_place = 'Tadian, Mountain Province',
  verification = 'Verified'
WHERE record_id = 'CLG-112';

COMMIT;
