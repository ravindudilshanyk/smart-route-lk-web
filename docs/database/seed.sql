-- ══════════════════════════════════════════════════
-- CLEAN FIRST
-- ══════════════════════════════════════════════════
TRUNCATE TABLE
  payment_intents, notifications, favourite_routes,
  bus_reviews, seat_availability, booking_passengers,
  bookings, conductors, seats, seat_layouts,
  bus_stops, buses, bus_owners, users
RESTART IDENTITY CASCADE;

-- ══════════════════════════════════════════════════
-- BLOCK 1 — USERS
-- ══════════════════════════════════════════════════
DO $$
DECLARE
  -- Password for all demo users in this file: password
  demo_hash TEXT := '$2b$10$PNLWDXzfUFrYVyyiNCf3YeCoscWUjd/9rvENywcun8JWQFM3qf3ue';
BEGIN

INSERT INTO users (first_name,last_name,email,password_hash,whatsapp_number,nic,date_of_birth,gender,role,status)
VALUES ('Ashan','Perera','admin@smartroutelk.com',demo_hash,'+94760000001','198001010001','1980-01-01','male','admin','active');

INSERT INTO users (first_name,last_name,email,password_hash,whatsapp_number,nic,date_of_birth,gender,role,status)
VALUES ('Nimal','Fernando','owner1@smartroutelk.com',demo_hash,'+94770000002','197506150002','1975-06-15','male','owner','active');

INSERT INTO users (first_name,last_name,email,password_hash,whatsapp_number,nic,date_of_birth,gender,role,status)
VALUES ('Kumari','Silva','owner2@smartroutelk.com',demo_hash,'+94770000003','198209220003','1982-09-22','female','owner','active');

INSERT INTO users (first_name,last_name,email,password_hash,whatsapp_number,nic,date_of_birth,gender,role,status)
VALUES ('Sunil','Rajapaksa','conductor1@smartroutelk.com',demo_hash,'+94750000004','198508100004','1985-08-10','male','conductor','active');

INSERT INTO users (first_name,last_name,email,password_hash,whatsapp_number,nic,date_of_birth,gender,role,status)
VALUES ('Roshan','Bandara','conductor2@smartroutelk.com',demo_hash,'+94750000005','199003250005','1990-03-25','male','conductor','active');

INSERT INTO users (first_name,last_name,email,password_hash,whatsapp_number,nic,date_of_birth,gender,role,status)
VALUES ('Kamal','Silva','kamal@demo.com',demo_hash,'+94710000006','200001010006','2000-01-01','male','passenger','active');

INSERT INTO users (first_name,last_name,email,password_hash,whatsapp_number,nic,date_of_birth,gender,role,status)
VALUES ('Nimali','Jayawardena','nimali@demo.com',demo_hash,'+94710000007','199805150007','1998-05-15','female','passenger','active');

INSERT INTO users (first_name,last_name,email,password_hash,whatsapp_number,nic,date_of_birth,gender,role,status)
VALUES ('Dasun','Wickramasinghe','dasun@demo.com',demo_hash,'+94710000008','199512200008','1995-12-20','male','passenger','active');

INSERT INTO users (first_name,last_name,email,password_hash,whatsapp_number,nic,date_of_birth,gender,role,status)
VALUES ('Sachini','Dissanayake','sachini@demo.com',demo_hash,'+94710000009','200207080009','2002-07-08','female','passenger','active');

INSERT INTO users (first_name,last_name,email,password_hash,whatsapp_number,nic,date_of_birth,gender,role,status)
VALUES ('Tharaka','Rathnayake','tharaka@demo.com',demo_hash,'+94710000010','199108300010','1991-08-30','male','passenger','active');

RAISE NOTICE 'Users done: %', (SELECT COUNT(*) FROM users);
END $$;

-- ══════════════════════════════════════════════════
-- BLOCK 2 — BUS OWNERS
-- ══════════════════════════════════════════════════
DO $$
DECLARE
  u_owner1 UUID;
  u_owner2 UUID;
BEGIN
  SELECT id INTO u_owner1 FROM users WHERE email = 'owner1@smartroutelk.com';
  SELECT id INTO u_owner2 FROM users WHERE email = 'owner2@smartroutelk.com';

  INSERT INTO bus_owners (user_id,business_name,business_reg_number,district,address,whatsapp_alerts,status,verified_at)
  VALUES (u_owner1,'Fernando Transport Services','PV-12345','Colombo','No. 45, Galle Road, Colombo 03','+94770000002','verified',NOW());

  INSERT INTO bus_owners (user_id,business_name,business_reg_number,district,address,whatsapp_alerts,status,verified_at)
  VALUES (u_owner2,'Silva Luxury Coaches','PV-67890','Galle','No. 12, Matara Road, Galle','+94770000003','verified',NOW());

  RAISE NOTICE 'Bus owners done: %', (SELECT COUNT(*) FROM bus_owners);
END $$;

-- ══════════════════════════════════════════════════
-- BLOCK 3 — BUSES
-- ══════════════════════════════════════════════════
DO $$
DECLARE
  o1 UUID;
  o2 UUID;
BEGIN
  SELECT id INTO o1 FROM bus_owners WHERE business_name = 'Fernando Transport Services';
  SELECT id INTO o2 FROM bus_owners WHERE business_name = 'Silva Luxury Coaches';

  INSERT INTO buses (owner_id,reg_number,bus_type,route_number,route_name,departure_time,arrival_time,operating_days,price_per_km,min_fare,max_fare,has_ac,has_wifi,has_water,refund_pct_before,refund_hours_threshold,refund_pct_within,status)
  VALUES (o1,'NB-1234','luxury','1','Colombo - Kandy','06:30','10:00',ARRAY['mon','tue','wed','thu','fri','sat','sun'],4.50,100,600,true,true,true,100,24,50,'active');

  INSERT INTO buses (owner_id,reg_number,bus_type,route_number,route_name,departure_time,arrival_time,operating_days,price_per_km,min_fare,max_fare,has_ac,has_wifi,has_water,refund_pct_before,refund_hours_threshold,refund_pct_within,status)
  VALUES (o1,'WP-2001','private_ac','2','Colombo - Galle','07:00','10:00',ARRAY['mon','tue','wed','thu','fri','sat','sun'],3.50,80,400,true,false,true,100,24,50,'active');

  INSERT INTO buses (owner_id,reg_number,bus_type,route_number,route_name,departure_time,arrival_time,operating_days,price_per_km,min_fare,max_fare,has_ac,has_wifi,has_water,refund_pct_before,refund_hours_threshold,refund_pct_within,status)
  VALUES (o2,'SP-3001','semi_luxury','3','Galle - Badulla','10:30','16:00',ARRAY['mon','tue','wed','thu','fri','sat','sun'],3.20,60,500,false,false,true,100,24,50,'active');

  INSERT INTO buses (owner_id,reg_number,bus_type,route_number,route_name,departure_time,arrival_time,operating_days,price_per_km,min_fare,max_fare,has_ac,has_wifi,has_water,refund_pct_before,refund_hours_threshold,refund_pct_within,status)
  VALUES (o1,'NP-4001','highway_luxury','4','Colombo - Jaffna','20:00','04:00',ARRAY['mon','tue','wed','thu','fri','sat','sun'],4.00,150,900,true,true,true,100,24,50,'active');

  INSERT INTO buses (owner_id,reg_number,bus_type,route_number,route_name,departure_time,arrival_time,operating_days,price_per_km,min_fare,max_fare,has_ac,has_wifi,has_water,refund_pct_before,refund_hours_threshold,refund_pct_within,status)
  VALUES (o2,'SB-5001','private_normal','5','Colombo - Matara','06:00','09:30',ARRAY['mon','tue','wed','thu','fri','sat','sun'],2.80,50,300,false,false,false,100,24,50,'active');

  INSERT INTO buses (owner_id,reg_number,bus_type,route_number,route_name,departure_time,arrival_time,operating_days,price_per_km,min_fare,max_fare,has_ac,has_wifi,has_water,refund_pct_before,refund_hours_threshold,refund_pct_within,status)
  VALUES (o1,'CP-6001','private_ac','6','Kandy - Badulla','08:00','13:00',ARRAY['mon','tue','wed','thu','fri','sat','sun'],3.00,60,400,true,false,true,100,24,50,'active');

  RAISE NOTICE 'Buses done: %', (SELECT COUNT(*) FROM buses);
END $$;

-- ══════════════════════════════════════════════════
-- BLOCK 4 — BUS STOPS
-- ══════════════════════════════════════════════════
DO $$
DECLARE
  b1 UUID; b2 UUID; b3 UUID;
  b4 UUID; b5 UUID; b6 UUID;
BEGIN
  SELECT id INTO b1 FROM buses WHERE reg_number = 'NB-1234';
  SELECT id INTO b2 FROM buses WHERE reg_number = 'WP-2001';
  SELECT id INTO b3 FROM buses WHERE reg_number = 'SP-3001';
  SELECT id INTO b4 FROM buses WHERE reg_number = 'NP-4001';
  SELECT id INTO b5 FROM buses WHERE reg_number = 'SB-5001';
  SELECT id INTO b6 FROM buses WHERE reg_number = 'CP-6001';

  -- Bus 1: Colombo to Kandy
  INSERT INTO bus_stops(bus_id,stop_name,stop_order,estimated_time,distance_from_start_km) VALUES
  (b1,'Colombo Fort',1,'06:30',0),
  (b1,'Kadawatha',2,'07:00',18),
  (b1,'Nittambuwa',3,'07:25',38),
  (b1,'Ambepussa',4,'07:50',52),
  (b1,'Kegalle',5,'08:20',74),
  (b1,'Mawanella',6,'08:45',88),
  (b1,'Peradeniya',7,'09:40',111),
  (b1,'Kandy',8,'10:00',121);

  -- Bus 2: Colombo to Galle
  INSERT INTO bus_stops(bus_id,stop_name,stop_order,estimated_time,distance_from_start_km) VALUES
  (b2,'Colombo Fort',1,'07:00',0),
  (b2,'Dehiwala',2,'07:20',11),
  (b2,'Panadura',3,'07:45',30),
  (b2,'Kalutara',4,'08:15',52),
  (b2,'Bentota',5,'08:45',75),
  (b2,'Hikkaduwa',6,'09:20',98),
  (b2,'Galle',7,'10:00',116);

  -- Bus 3: Galle to Badulla
  INSERT INTO bus_stops(bus_id,stop_name,stop_order,estimated_time,distance_from_start_km) VALUES
  (b3,'Galle',1,'10:30',0),
  (b3,'Matara',2,'11:15',42),
  (b3,'Hambantota',3,'12:30',104),
  (b3,'Wellawaya',4,'13:30',152),
  (b3,'Badulla',5,'16:00',220);

  -- Bus 4: Colombo to Jaffna
  INSERT INTO bus_stops(bus_id,stop_name,stop_order,estimated_time,distance_from_start_km) VALUES
  (b4,'Colombo Fort',1,'20:00',0),
  (b4,'Kurunegala',2,'21:30',95),
  (b4,'Anuradhapura',3,'23:00',207),
  (b4,'Vavuniya',4,'00:30',262),
  (b4,'Kilinochchi',5,'02:00',330),
  (b4,'Jaffna',6,'04:00',398);

  -- Bus 5: Colombo to Matara
  INSERT INTO bus_stops(bus_id,stop_name,stop_order,estimated_time,distance_from_start_km) VALUES
  (b5,'Colombo Fort',1,'06:00',0),
  (b5,'Panadura',2,'06:45',30),
  (b5,'Kalutara',3,'07:15',52),
  (b5,'Aluthgama',4,'07:45',72),
  (b5,'Galle',5,'08:30',116),
  (b5,'Matara',6,'09:30',158);

  -- Bus 6: Kandy to Badulla
  INSERT INTO bus_stops(bus_id,stop_name,stop_order,estimated_time,distance_from_start_km) VALUES
  (b6,'Kandy',1,'08:00',0),
  (b6,'Matale',2,'08:45',28),
  (b6,'Dambulla',3,'09:30',72),
  (b6,'Mahiyangana',4,'11:00',135),
  (b6,'Badulla',5,'13:00',192);

  RAISE NOTICE 'Stops done: %', (SELECT COUNT(*) FROM bus_stops);
END $$;

-- ══════════════════════════════════════════════════
-- BLOCK 5 — SEAT LAYOUTS AND SEATS
-- ══════════════════════════════════════════════════
DO $$
DECLARE
  b1 UUID; b2 UUID; b3 UUID;
  b4 UUID; b5 UUID; b6 UUID;
  l1 UUID; l2 UUID; l3 UUID;
  l4 UUID; l5 UUID; l6 UUID;
BEGIN
  SELECT id INTO b1 FROM buses WHERE reg_number = 'NB-1234';
  SELECT id INTO b2 FROM buses WHERE reg_number = 'WP-2001';
  SELECT id INTO b3 FROM buses WHERE reg_number = 'SP-3001';
  SELECT id INTO b4 FROM buses WHERE reg_number = 'NP-4001';
  SELECT id INTO b5 FROM buses WHERE reg_number = 'SB-5001';
  SELECT id INTO b6 FROM buses WHERE reg_number = 'CP-6001';

  INSERT INTO seat_layouts(bus_id,rows,cols,aisle_col) VALUES(b1,11,5,2) RETURNING id INTO l1;
  INSERT INTO seat_layouts(bus_id,rows,cols,aisle_col) VALUES(b2,10,5,2) RETURNING id INTO l2;
  INSERT INTO seat_layouts(bus_id,rows,cols,aisle_col) VALUES(b3,10,5,2) RETURNING id INTO l3;
  INSERT INTO seat_layouts(bus_id,rows,cols,aisle_col) VALUES(b4,13,5,2) RETURNING id INTO l4;
  INSERT INTO seat_layouts(bus_id,rows,cols,aisle_col) VALUES(b5,10,5,2) RETURNING id INTO l5;
  INSERT INTO seat_layouts(bus_id,rows,cols,aisle_col) VALUES(b6,10,5,2) RETURNING id INTO l6;

  -- Bus 1 seats (44)
  INSERT INTO seats(layout_id,seat_number,row_index,col_index) VALUES
  (l1,'01',1,0),(l1,'02',1,1),(l1,'03',1,3),(l1,'04',1,4),
  (l1,'05',2,0),(l1,'06',2,1),(l1,'07',2,3),(l1,'08',2,4),
  (l1,'09',3,0),(l1,'10',3,1),(l1,'11',3,3),(l1,'12',3,4),
  (l1,'13',4,0),(l1,'14',4,1),(l1,'15',4,3),(l1,'16',4,4),
  (l1,'17',5,0),(l1,'18',5,1),(l1,'19',5,3),(l1,'20',5,4),
  (l1,'21',6,0),(l1,'22',6,1),(l1,'23',6,3),(l1,'24',6,4),
  (l1,'25',7,0),(l1,'26',7,1),(l1,'27',7,3),(l1,'28',7,4),
  (l1,'29',8,0),(l1,'30',8,1),(l1,'31',8,3),(l1,'32',8,4),
  (l1,'33',9,0),(l1,'34',9,1),(l1,'35',9,3),(l1,'36',9,4),
  (l1,'37',10,0),(l1,'38',10,1),(l1,'39',10,3),(l1,'40',10,4),
  (l1,'41',11,0),(l1,'42',11,1),(l1,'43',11,3),(l1,'44',11,4);

  -- Bus 2 seats (40)
  INSERT INTO seats(layout_id,seat_number,row_index,col_index) VALUES
  (l2,'01',1,0),(l2,'02',1,1),(l2,'03',1,3),(l2,'04',1,4),
  (l2,'05',2,0),(l2,'06',2,1),(l2,'07',2,3),(l2,'08',2,4),
  (l2,'09',3,0),(l2,'10',3,1),(l2,'11',3,3),(l2,'12',3,4),
  (l2,'13',4,0),(l2,'14',4,1),(l2,'15',4,3),(l2,'16',4,4),
  (l2,'17',5,0),(l2,'18',5,1),(l2,'19',5,3),(l2,'20',5,4),
  (l2,'21',6,0),(l2,'22',6,1),(l2,'23',6,3),(l2,'24',6,4),
  (l2,'25',7,0),(l2,'26',7,1),(l2,'27',7,3),(l2,'28',7,4),
  (l2,'29',8,0),(l2,'30',8,1),(l2,'31',8,3),(l2,'32',8,4),
  (l2,'33',9,0),(l2,'34',9,1),(l2,'35',9,3),(l2,'36',9,4),
  (l2,'37',10,0),(l2,'38',10,1),(l2,'39',10,3),(l2,'40',10,4);

  -- Bus 3 seats (40)
  INSERT INTO seats(layout_id,seat_number,row_index,col_index) VALUES
  (l3,'01',1,0),(l3,'02',1,1),(l3,'03',1,3),(l3,'04',1,4),
  (l3,'05',2,0),(l3,'06',2,1),(l3,'07',2,3),(l3,'08',2,4),
  (l3,'09',3,0),(l3,'10',3,1),(l3,'11',3,3),(l3,'12',3,4),
  (l3,'13',4,0),(l3,'14',4,1),(l3,'15',4,3),(l3,'16',4,4),
  (l3,'17',5,0),(l3,'18',5,1),(l3,'19',5,3),(l3,'20',5,4),
  (l3,'21',6,0),(l3,'22',6,1),(l3,'23',6,3),(l3,'24',6,4),
  (l3,'25',7,0),(l3,'26',7,1),(l3,'27',7,3),(l3,'28',7,4),
  (l3,'29',8,0),(l3,'30',8,1),(l3,'31',8,3),(l3,'32',8,4),
  (l3,'33',9,0),(l3,'34',9,1),(l3,'35',9,3),(l3,'36',9,4),
  (l3,'37',10,0),(l3,'38',10,1),(l3,'39',10,3),(l3,'40',10,4);

  -- Bus 4 seats (52)
  INSERT INTO seats(layout_id,seat_number,row_index,col_index) VALUES
  (l4,'01',1,0),(l4,'02',1,1),(l4,'03',1,3),(l4,'04',1,4),
  (l4,'05',2,0),(l4,'06',2,1),(l4,'07',2,3),(l4,'08',2,4),
  (l4,'09',3,0),(l4,'10',3,1),(l4,'11',3,3),(l4,'12',3,4),
  (l4,'13',4,0),(l4,'14',4,1),(l4,'15',4,3),(l4,'16',4,4),
  (l4,'17',5,0),(l4,'18',5,1),(l4,'19',5,3),(l4,'20',5,4),
  (l4,'21',6,0),(l4,'22',6,1),(l4,'23',6,3),(l4,'24',6,4),
  (l4,'25',7,0),(l4,'26',7,1),(l4,'27',7,3),(l4,'28',7,4),
  (l4,'29',8,0),(l4,'30',8,1),(l4,'31',8,3),(l4,'32',8,4),
  (l4,'33',9,0),(l4,'34',9,1),(l4,'35',9,3),(l4,'36',9,4),
  (l4,'37',10,0),(l4,'38',10,1),(l4,'39',10,3),(l4,'40',10,4),
  (l4,'41',11,0),(l4,'42',11,1),(l4,'43',11,3),(l4,'44',11,4),
  (l4,'45',12,0),(l4,'46',12,1),(l4,'47',12,3),(l4,'48',12,4),
  (l4,'49',13,0),(l4,'50',13,1),(l4,'51',13,3),(l4,'52',13,4);

  -- Bus 5 seats (40)
  INSERT INTO seats(layout_id,seat_number,row_index,col_index) VALUES
  (l5,'01',1,0),(l5,'02',1,1),(l5,'03',1,3),(l5,'04',1,4),
  (l5,'05',2,0),(l5,'06',2,1),(l5,'07',2,3),(l5,'08',2,4),
  (l5,'09',3,0),(l5,'10',3,1),(l5,'11',3,3),(l5,'12',3,4),
  (l5,'13',4,0),(l5,'14',4,1),(l5,'15',4,3),(l5,'16',4,4),
  (l5,'17',5,0),(l5,'18',5,1),(l5,'19',5,3),(l5,'20',5,4),
  (l5,'21',6,0),(l5,'22',6,1),(l5,'23',6,3),(l5,'24',6,4),
  (l5,'25',7,0),(l5,'26',7,1),(l5,'27',7,3),(l5,'28',7,4),
  (l5,'29',8,0),(l5,'30',8,1),(l5,'31',8,3),(l5,'32',8,4),
  (l5,'33',9,0),(l5,'34',9,1),(l5,'35',9,3),(l5,'36',9,4),
  (l5,'37',10,0),(l5,'38',10,1),(l5,'39',10,3),(l5,'40',10,4);

  -- Bus 6 seats (40)
  INSERT INTO seats(layout_id,seat_number,row_index,col_index) VALUES
  (l6,'01',1,0),(l6,'02',1,1),(l6,'03',1,3),(l6,'04',1,4),
  (l6,'05',2,0),(l6,'06',2,1),(l6,'07',2,3),(l6,'08',2,4),
  (l6,'09',3,0),(l6,'10',3,1),(l6,'11',3,3),(l6,'12',3,4),
  (l6,'13',4,0),(l6,'14',4,1),(l6,'15',4,3),(l6,'16',4,4),
  (l6,'17',5,0),(l6,'18',5,1),(l6,'19',5,3),(l6,'20',5,4),
  (l6,'21',6,0),(l6,'22',6,1),(l6,'23',6,3),(l6,'24',6,4),
  (l6,'25',7,0),(l6,'26',7,1),(l6,'27',7,3),(l6,'28',7,4),
  (l6,'29',8,0),(l6,'30',8,1),(l6,'31',8,3),(l6,'32',8,4),
  (l6,'33',9,0),(l6,'34',9,1),(l6,'35',9,3),(l6,'36',9,4),
  (l6,'37',10,0),(l6,'38',10,1),(l6,'39',10,3),(l6,'40',10,4);

  RAISE NOTICE 'Layouts and seats done: %', (SELECT COUNT(*) FROM seats);
END $$;

-- ══════════════════════════════════════════════════
-- BLOCK 6 — CONDUCTORS
-- ══════════════════════════════════════════════════
DO $$
DECLARE
  u_conductor1 UUID; u_conductor2 UUID;
  u_owner1 UUID;
  b1 UUID; b2 UUID;
BEGIN
  SELECT id INTO u_conductor1 FROM users WHERE email = 'conductor1@smartroutelk.com';
  SELECT id INTO u_conductor2 FROM users WHERE email = 'conductor2@smartroutelk.com';
  SELECT id INTO u_owner1     FROM users WHERE email = 'owner1@smartroutelk.com';
  SELECT id INTO b1 FROM buses WHERE reg_number = 'NB-1234';
  SELECT id INTO b2 FROM buses WHERE reg_number = 'WP-2001';

  INSERT INTO conductors(user_id,bus_id,assigned_by) VALUES(u_conductor1,b1,u_owner1);
  INSERT INTO conductors(user_id,bus_id,assigned_by) VALUES(u_conductor2,b2,u_owner1);

  RAISE NOTICE 'Conductors done: %', (SELECT COUNT(*) FROM conductors);
END $$;

-- ══════════════════════════════════════════════════
-- BLOCK 7 — BOOKINGS + PASSENGERS + SEAT AVAILABILITY
-- Note: seat_availability uses booking_passenger_id not booking_id
-- Note: booking_passengers.qr_token is UUID type (auto generated)
-- ══════════════════════════════════════════════════
DO $$
DECLARE
  u_p1 UUID; u_p2 UUID; u_p3 UUID; u_p4 UUID; u_p5 UUID;
  b1 UUID; b2 UUID; b4 UUID;
  l1 UUID; l2 UUID; l4 UUID;
  b1s1 UUID; b1s5 UUID; b1s8 UUID;
  b2s1 UUID; b2s3 UUID; b2s7 UUID;
  b4s1 UUID; b4s6 UUID;
  s_b1_01 UUID; s_b1_02 UUID; s_b1_03 UUID; s_b1_04 UUID;
  s_b2_01 UUID; s_b2_02 UUID;
  s_b4_01 UUID;
  bk1 UUID; bk2 UUID; bk3 UUID; bk4 UUID;
  bk5 UUID; bk6 UUID; bk7 UUID;
  bp1 UUID; bp2 UUID; bp3 UUID; bp4 UUID;
  bp5 UUID; bp6 UUID; bp7 UUID;
  today_date DATE := CURRENT_DATE;
  tmrw_date  DATE := CURRENT_DATE + 1;
  day5_date  DATE := CURRENT_DATE + 5;
  past_date  DATE := CURRENT_DATE - 3;
BEGIN
  -- Load users
  SELECT id INTO u_p1 FROM users WHERE email = 'kamal@demo.com';
  SELECT id INTO u_p2 FROM users WHERE email = 'nimali@demo.com';
  SELECT id INTO u_p3 FROM users WHERE email = 'dasun@demo.com';
  SELECT id INTO u_p4 FROM users WHERE email = 'sachini@demo.com';
  SELECT id INTO u_p5 FROM users WHERE email = 'tharaka@demo.com';

  -- Load buses
  SELECT id INTO b1 FROM buses WHERE reg_number = 'NB-1234';
  SELECT id INTO b2 FROM buses WHERE reg_number = 'WP-2001';
  SELECT id INTO b4 FROM buses WHERE reg_number = 'NP-4001';

  -- Load layouts
  SELECT id INTO l1 FROM seat_layouts WHERE bus_id = b1;
  SELECT id INTO l2 FROM seat_layouts WHERE bus_id = b2;
  SELECT id INTO l4 FROM seat_layouts WHERE bus_id = b4;

  -- Load stops
  SELECT id INTO b1s1 FROM bus_stops WHERE bus_id = b1 AND stop_order = 1;
  SELECT id INTO b1s5 FROM bus_stops WHERE bus_id = b1 AND stop_order = 5;
  SELECT id INTO b1s8 FROM bus_stops WHERE bus_id = b1 AND stop_order = 8;
  SELECT id INTO b2s1 FROM bus_stops WHERE bus_id = b2 AND stop_order = 1;
  SELECT id INTO b2s3 FROM bus_stops WHERE bus_id = b2 AND stop_order = 3;
  SELECT id INTO b2s7 FROM bus_stops WHERE bus_id = b2 AND stop_order = 7;
  SELECT id INTO b4s1 FROM bus_stops WHERE bus_id = b4 AND stop_order = 1;
  SELECT id INTO b4s6 FROM bus_stops WHERE bus_id = b4 AND stop_order = 6;

  -- Load seats
  SELECT id INTO s_b1_01 FROM seats WHERE layout_id = l1 AND seat_number = '01';
  SELECT id INTO s_b1_02 FROM seats WHERE layout_id = l1 AND seat_number = '02';
  SELECT id INTO s_b1_03 FROM seats WHERE layout_id = l1 AND seat_number = '03';
  SELECT id INTO s_b1_04 FROM seats WHERE layout_id = l1 AND seat_number = '04';
  SELECT id INTO s_b2_01 FROM seats WHERE layout_id = l2 AND seat_number = '01';
  SELECT id INTO s_b2_02 FROM seats WHERE layout_id = l2 AND seat_number = '02';
  SELECT id INTO s_b4_01 FROM seats WHERE layout_id = l4 AND seat_number = '01';

  -- ── Booking 1: Kamal — Colombo to Kandy TODAY (boarded) ──
  INSERT INTO bookings(bus_id,booked_by,board_stop_id,drop_stop_id,travel_date,booking_status,payment_method,payment_status,total_fare,service_fee,whatsapp_number)
  VALUES(b1,u_p1,b1s1,b1s8,today_date,'confirmed','card','paid',544,27,'+94710000006')
  RETURNING id INTO bk1;

  INSERT INTO booking_passengers(booking_id,passenger_name,nic,gender,seat_id,seat_number,boarded,boarded_at)
  VALUES(bk1,'Kamal Silva','200001010006','male',s_b1_01,'01',true,NOW()-INTERVAL '1 hour')
  RETURNING id INTO bp1;

  INSERT INTO seat_availability(seat_id,travel_date,board_stop_order,drop_stop_order,booking_passenger_id)
  VALUES(s_b1_01,today_date,1,8,bp1);

  -- ── Booking 2: Nimali — Colombo to Kegalle TODAY (pending) ──
  INSERT INTO bookings(bus_id,booked_by,board_stop_id,drop_stop_id,travel_date,booking_status,payment_method,payment_status,total_fare,service_fee,whatsapp_number)
  VALUES(b1,u_p2,b1s1,b1s5,today_date,'confirmed','card','paid',333,17,'+94710000007')
  RETURNING id INTO bk2;

  INSERT INTO booking_passengers(booking_id,passenger_name,nic,gender,seat_id,seat_number,boarded)
  VALUES(bk2,'Nimali Jayawardena','199805150007','female',s_b1_02,'02',false)
  RETURNING id INTO bp2;

  INSERT INTO seat_availability(seat_id,travel_date,board_stop_order,drop_stop_order,booking_passenger_id)
  VALUES(s_b1_02,today_date,1,5,bp2);

  -- ── Booking 3: Dasun — Kegalle to Kandy TODAY (partial seat demo) ──
  -- Seat 03 shows YELLOW — booked only from stop 5 to 8
  -- Free from stop 1 to 4 — passenger can board at Colombo and sit here
  INSERT INTO bookings(bus_id,booked_by,board_stop_id,drop_stop_id,travel_date,booking_status,payment_method,payment_status,total_fare,service_fee,whatsapp_number)
  VALUES(b1,u_p3,b1s5,b1s8,today_date,'confirmed','card','paid',212,11,'+94710000008')
  RETURNING id INTO bk3;

  INSERT INTO booking_passengers(booking_id,passenger_name,nic,gender,seat_id,seat_number,boarded)
  VALUES(bk3,'Dasun Wickramasinghe','199512200008','male',s_b1_03,'03',false)
  RETURNING id INTO bp3;

  INSERT INTO seat_availability(seat_id,travel_date,board_stop_order,drop_stop_order,booking_passenger_id)
  VALUES(s_b1_03,today_date,5,8,bp3);

  -- ── Booking 4: Sachini — Colombo to Galle TOMORROW ──
  INSERT INTO bookings(bus_id,booked_by,board_stop_id,drop_stop_id,travel_date,booking_status,payment_method,payment_status,total_fare,service_fee,whatsapp_number)
  VALUES(b2,u_p4,b2s1,b2s7,tmrw_date,'confirmed','card','paid',400,20,'+94710000009')
  RETURNING id INTO bk4;

  INSERT INTO booking_passengers(booking_id,passenger_name,nic,gender,seat_id,seat_number,boarded)
  VALUES(bk4,'Sachini Dissanayake','200207080009','female',s_b2_01,'01',false)
  RETURNING id INTO bp4;

  INSERT INTO seat_availability(seat_id,travel_date,board_stop_order,drop_stop_order,booking_passenger_id)
  VALUES(s_b2_01,tmrw_date,1,7,bp4);

  -- ── Booking 5: Tharaka — Colombo to Panadura TOMORROW (partial on bus 2) ──
  -- Seat 02 on bus 2 is YELLOW from Panadura onwards = free for other passengers
  INSERT INTO bookings(bus_id,booked_by,board_stop_id,drop_stop_id,travel_date,booking_status,payment_method,payment_status,total_fare,service_fee,whatsapp_number)
  VALUES(b2,u_p5,b2s1,b2s3,tmrw_date,'confirmed','card','paid',105,5,'+94710000010')
  RETURNING id INTO bk5;

  INSERT INTO booking_passengers(booking_id,passenger_name,nic,gender,seat_id,seat_number,boarded)
  VALUES(bk5,'Tharaka Rathnayake','199108300010','male',s_b2_02,'02',false)
  RETURNING id INTO bp5;

  INSERT INTO seat_availability(seat_id,travel_date,board_stop_order,drop_stop_order,booking_passenger_id)
  VALUES(s_b2_02,tmrw_date,1,3,bp5);

  -- ── Booking 6: Kamal — past completed trip ──
  INSERT INTO bookings(bus_id,booked_by,board_stop_id,drop_stop_id,travel_date,booking_status,payment_method,payment_status,total_fare,service_fee,whatsapp_number)
  VALUES(b1,u_p1,b1s1,b1s8,past_date,'completed','card','paid',544,27,'+94710000006')
  RETURNING id INTO bk6;

  INSERT INTO booking_passengers(booking_id,passenger_name,nic,gender,seat_id,seat_number,boarded,boarded_at)
  VALUES(bk6,'Kamal Silva','200001010006','male',s_b1_04,'04',true,past_date+'07:00'::time)
  RETURNING id INTO bp6;

  -- No seat_availability needed for past/completed bookings

  -- ── Booking 7: Nimali — future Jaffna trip ──
  INSERT INTO bookings(bus_id,booked_by,board_stop_id,drop_stop_id,travel_date,booking_status,payment_method,payment_status,total_fare,service_fee,whatsapp_number)
  VALUES(b4,u_p2,b4s1,b4s6,day5_date,'confirmed','card','paid',900,45,'+94710000007')
  RETURNING id INTO bk7;

  INSERT INTO booking_passengers(booking_id,passenger_name,nic,gender,seat_id,seat_number,boarded)
  VALUES(bk7,'Nimali Jayawardena','199805150007','female',s_b4_01,'01',false)
  RETURNING id INTO bp7;

  INSERT INTO seat_availability(seat_id,travel_date,board_stop_order,drop_stop_order,booking_passenger_id)
  VALUES(s_b4_01,day5_date,1,6,bp7);

  RAISE NOTICE 'Bookings done: %, Passengers: %',
    (SELECT COUNT(*) FROM bookings),
    (SELECT COUNT(*) FROM booking_passengers);
END $$;

-- ══════════════════════════════════════════════════
-- BLOCK 8 — REVIEWS
-- bus_reviews requires booking_id (NOT NULL)
-- Using actual booking IDs from above
-- ══════════════════════════════════════════════════
DO $$
DECLARE
  u_p1 UUID; u_p2 UUID; u_p3 UUID; u_p4 UUID; u_p5 UUID;
  b1 UUID; b2 UUID; b4 UUID;
  bk1 UUID; bk2 UUID; bk4 UUID; bk6 UUID;
BEGIN
  SELECT id INTO u_p1 FROM users WHERE email = 'kamal@demo.com';
  SELECT id INTO u_p2 FROM users WHERE email = 'nimali@demo.com';
  SELECT id INTO u_p3 FROM users WHERE email = 'dasun@demo.com';
  SELECT id INTO u_p4 FROM users WHERE email = 'sachini@demo.com';
  SELECT id INTO u_p5 FROM users WHERE email = 'tharaka@demo.com';
  SELECT id INTO b1   FROM buses WHERE reg_number = 'NB-1234';
  SELECT id INTO b2   FROM buses WHERE reg_number = 'WP-2001';
  SELECT id INTO b4   FROM buses WHERE reg_number = 'NP-4001';

  -- Get booking IDs (past completed trip for Kamal)
  SELECT id INTO bk6
  FROM bookings
  WHERE booked_by = u_p1 AND booking_status = 'completed'
  LIMIT 1;

  -- Get today booking for Nimali
  SELECT id INTO bk2
  FROM bookings
  WHERE booked_by = u_p2 AND booking_status = 'confirmed'
    AND bus_id = b1
  LIMIT 1;

  -- Get tomorrow booking for Sachini
  SELECT id INTO bk4
  FROM bookings
  WHERE booked_by = u_p4 AND booking_status = 'confirmed'
  LIMIT 1;

  -- Reviews only on completed trips or confirmed bookings
  -- Using past booking for Kamal (completed)
  IF bk6 IS NOT NULL THEN
    INSERT INTO bus_reviews(bus_id,user_id,booking_id,rating,comment)
    VALUES(b1,u_p1,bk6,5,'Excellent service! Very comfortable AC bus. Always on time.');
  END IF;

  IF bk2 IS NOT NULL THEN
    INSERT INTO bus_reviews(bus_id,user_id,booking_id,rating,comment)
    VALUES(b1,u_p2,bk2,4,'Good bus, clean seats. WiFi was a nice touch.');
  END IF;

  IF bk4 IS NOT NULL THEN
    INSERT INTO bus_reviews(bus_id,user_id,booking_id,rating,comment)
    VALUES(b2,u_p4,bk4,5,'Perfect ride to Galle. Driver professional, bus spotless.');
  END IF;

  RAISE NOTICE 'Reviews done: %', (SELECT COUNT(*) FROM bus_reviews);
END $$;

-- ══════════════════════════════════════════════════
-- BLOCK 9 — FAVOURITE ROUTES
-- ══════════════════════════════════════════════════
DO $$
DECLARE
  u_p1 UUID; u_p2 UUID; u_p3 UUID; u_p4 UUID; u_p5 UUID;
BEGIN
  SELECT id INTO u_p1 FROM users WHERE email = 'kamal@demo.com';
  SELECT id INTO u_p2 FROM users WHERE email = 'nimali@demo.com';
  SELECT id INTO u_p3 FROM users WHERE email = 'dasun@demo.com';
  SELECT id INTO u_p4 FROM users WHERE email = 'sachini@demo.com';
  SELECT id INTO u_p5 FROM users WHERE email = 'tharaka@demo.com';

  INSERT INTO favourite_routes(user_id,origin,destination) VALUES
  (u_p1,'Colombo Fort','Kandy'),
  (u_p1,'Colombo Fort','Galle'),
  (u_p2,'Colombo Fort','Jaffna'),
  (u_p3,'Colombo Fort','Badulla'),
  (u_p4,'Colombo Fort','Matara'),
  (u_p5,'Kandy','Badulla');

  RAISE NOTICE 'Favourites done: %', (SELECT COUNT(*) FROM favourite_routes);
END $$;

-- ══════════════════════════════════════════════════
-- BLOCK 10 — NOTIFICATIONS
-- Schema: user_id, whatsapp_number, type, message, status, sent_at
-- No title or is_read columns
-- ══════════════════════════════════════════════════
DO $$
DECLARE
  u_p1     UUID; u_p2 UUID; u_p3 UUID;
  u_owner1 UUID;
BEGIN
  SELECT id INTO u_p1     FROM users WHERE email = 'kamal@demo.com';
  SELECT id INTO u_p2     FROM users WHERE email = 'nimali@demo.com';
  SELECT id INTO u_p3     FROM users WHERE email = 'dasun@demo.com';
  SELECT id INTO u_owner1 FROM users WHERE email = 'owner1@smartroutelk.com';

  INSERT INTO notifications(user_id,whatsapp_number,type,message,status) VALUES
  (u_p1,'+94710000006','booking_confirmed','Your booking on NB-1234 (Colombo to Kandy) for today is confirmed. QR ticket sent.','sent'),
  (u_p1,'+94710000006','trip_completed','Your Colombo to Kandy trip is complete. Thank you for travelling with SmartRoute LK!','sent'),
  (u_p2,'+94710000007','booking_confirmed','Your booking on WP-2001 (Colombo to Galle) for tomorrow is confirmed.','sent'),
  (u_p2,'+94710000007','trip_reminder','Reminder: Your Colombo to Jaffna trip is in 5 days. Be at Colombo Fort by 19:45.','sent'),
  (u_p3,'+94710000008','booking_confirmed','Your booking on NB-1234 (Kegalle to Kandy) for today is confirmed.','sent'),
  (u_owner1,'+94770000002','new_booking','New booking on NB-1234 today. Passenger: Kamal Silva, Seat 01.','sent'),
  (u_owner1,'+94770000002','new_booking','New booking on WP-2001 tomorrow. Passenger: Sachini Dissanayake, Seat 01.','sent');

  RAISE NOTICE 'Notifications done: %', (SELECT COUNT(*) FROM notifications);
END $$;

-- Add cancelled booking
DO $$
DECLARE
  u_p3 UUID; u_p4 UUID; u_p5 UUID;
  b1 UUID; b5 UUID;
  b1s1 UUID; b1s8 UUID;
  b5s1 UUID; b5s6 UUID;
  l1 UUID; l5 UUID;
  s_b1_05 UUID; s_b5_03 UUID;
BEGIN
  SELECT id INTO u_p3 FROM users WHERE email = 'dasun@demo.com';
  SELECT id INTO u_p4 FROM users WHERE email = 'sachini@demo.com';
  SELECT id INTO u_p5 FROM users WHERE email = 'tharaka@demo.com';
  SELECT id INTO b1 FROM buses WHERE reg_number = 'NB-1234';
  SELECT id INTO b5 FROM buses WHERE reg_number = 'SB-5001';
  SELECT id INTO l1 FROM seat_layouts WHERE bus_id = b1;
  SELECT id INTO l5 FROM seat_layouts WHERE bus_id = b5;
  SELECT id INTO b1s1 FROM bus_stops WHERE bus_id = b1 AND stop_order = 1;
  SELECT id INTO b1s8 FROM bus_stops WHERE bus_id = b1 AND stop_order = 8;
  SELECT id INTO b5s1 FROM bus_stops WHERE bus_id = b5 AND stop_order = 1;
  SELECT id INTO b5s6 FROM bus_stops WHERE bus_id = b5 AND stop_order = 6;
  SELECT id INTO s_b1_05 FROM seats WHERE layout_id = l1 AND seat_number = '05';
  SELECT id INTO s_b5_03 FROM seats WHERE layout_id = l5 AND seat_number = '03';

  -- Cancelled booking — Sachini cancelled Colombo→Kandy
  INSERT INTO bookings(bus_id,booked_by,board_stop_id,drop_stop_id,travel_date,
    booking_status,payment_method,payment_status,total_fare,service_fee,
    whatsapp_number,cancelled_at,refund_amount)
  VALUES(b1,u_p4,b1s1,b1s8,CURRENT_DATE+3,'cancelled','card','refunded',
    544,27,'+94710000009',NOW(),544);

  INSERT INTO booking_passengers(booking_id,passenger_name,nic,gender,seat_id,seat_number,boarded)
  SELECT id,'Sachini Dissanayake','200207080009','female',s_b1_05,'05',false
  FROM bookings WHERE booked_by = u_p4 AND booking_status = 'cancelled' LIMIT 1;

  -- Cash on bus booking — Tharaka pays on bus
  INSERT INTO bookings(bus_id,booked_by,board_stop_id,drop_stop_id,travel_date,
    booking_status,payment_method,payment_status,total_fare,service_fee,whatsapp_number)
  VALUES(b5,u_p5,b5s1,b5s6,CURRENT_DATE+2,'confirmed','cash_on_bus','pending',
    300,0,'+94710000010');

  INSERT INTO booking_passengers(booking_id,passenger_name,nic,gender,seat_id,seat_number,boarded)
  SELECT id,'Tharaka Rathnayake','199108300010','male',s_b5_03,'03',false
  FROM bookings WHERE booked_by = u_p5 AND payment_method = 'cash_on_bus' LIMIT 1;

  RAISE NOTICE 'Extra bookings done';
END $$;

-- ══════════════════════════════════════════════════
-- FINAL VERIFY
-- ══════════════════════════════════════════════════
SELECT
  'Users'           AS item, COUNT(*)::text AS count FROM users       UNION ALL
SELECT 'Bus Owners',         COUNT(*)::text FROM bus_owners            UNION ALL
SELECT 'Buses',              COUNT(*)::text FROM buses                 UNION ALL
SELECT 'Bus Stops',          COUNT(*)::text FROM bus_stops             UNION ALL
SELECT 'Seat Layouts',       COUNT(*)::text FROM seat_layouts          UNION ALL
SELECT 'Seats',              COUNT(*)::text FROM seats                 UNION ALL
SELECT 'Conductors',         COUNT(*)::text FROM conductors            UNION ALL
SELECT 'Bookings',           COUNT(*)::text FROM bookings              UNION ALL
SELECT 'Passengers',         COUNT(*)::text FROM booking_passengers    UNION ALL
SELECT 'Seat Availability',  COUNT(*)::text FROM seat_availability     UNION ALL
SELECT 'Reviews',            COUNT(*)::text FROM bus_reviews           UNION ALL
SELECT 'Favourites',         COUNT(*)::text FROM favourite_routes      UNION ALL
SELECT 'Notifications',      COUNT(*)::text FROM notifications
ORDER BY 1;