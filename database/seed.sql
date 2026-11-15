-- ============================================================================
-- NestMate PostgreSQL Realistic Demonstration Dataset
-- Target: 28 Diverse Student & Professional Profiles (College Campus Ready)
-- Cities: Pune, Bengaluru, Mumbai, Delhi, Hyderabad, Chennai
-- Normalized to 3NF/BCNF with Full Constraint Compliance
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USERS (28 Fictional Student & Young Professional Profiles)
-- Password for all seed users is 'nestmate123'
-- Bcrypt Hash: $2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW
-- ----------------------------------------------------------------------------
INSERT INTO users (id, full_name, email, password_hash, account_status, auth_version, occupation, city, bio, phone)
VALUES
  ('user-1',  'Alex Rivera',      'alex@example.com',     '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Graduate CS Student',       'Bengaluru', 'Computer Science graduate student at IIIT-B looking for a quiet, clean, and collaborative living space.', '+91 98765 43210'),
  ('user-2',  'Priya Sharma',     'priya@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Software Engineer',     'Bengaluru', 'Full-stack developer who enjoys weekend cooking and keeping common areas spotless.', '+91 98765 43211'),
  ('user-3',  'Rahul Verma',      'rahul@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'UI/UX Designer',        'Bengaluru', 'Design enthusiast and morning runner looking for like-minded creative flatmates.', '+91 98765 43212'),
  ('user-4',  'Ananya Patel',     'ananya@example.com',   '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Data Analyst',          'Mumbai',    'Working at a fintech firm in BKC. Prefers a quiet apartment with good metro access.', '+91 98765 43213'),
  ('user-5',  'Karthik Nair',     'karthik@example.com',  '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Product Manager',       'Pune',      'Moving to Pune for tech role. Respectful, quiet, and enjoys weekend reading.', '+91 98765 43214'),
  ('user-6',  'Sneha Kulkarni',   'sneha@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Frontend Developer',   'Pune',      'React enthusiast who loves indoor plants, board games, and clean kitchen spaces.', '+91 98765 43215'),
  ('user-7',  'Rohan Mehra',      'rohan@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Research Associate',   'Delhi',     'Postgraduate researcher at South Campus. Need peaceful study environment.', '+91 98765 43216'),
  ('user-8',  'Pooja Gupta',      'pooja@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Content Strategist',   'Delhi',     'Digital marketer looking for an apartment near Saket metro station.', '+91 98765 43217'),
  ('user-9',  'Aditya Joshi',     'aditya@example.com',   '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Financial Analyst',     'Mumbai',    'Finance professional working in Lower Parel. Early riser, gym goer, non-smoker.', '+91 98765 43218'),
  ('user-10', 'Meera Iyer',       'meera@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'AI/ML Engineer',        'Bengaluru', 'Machine learning engineer in HSR. Passionate about music and quiet living.', '+91 98765 43219'),
  ('user-11', 'Siddharth Rao',    'siddharth@example.com','$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Security Analyst',     'Pune',      'Cybersecurity engineer at Hinjewadi Phase 1. Looking for flatmates sharing 2BHK.', '+91 98765 43220'),
  ('user-12', 'Neha Kapoor',      'neha@example.com',     '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Architecture Student', 'Delhi',     'Final year architecture student at SPA Delhi. Enjoys natural light, sketching, and coffee.', '+91 98765 43221'),
  ('user-13', 'Vikram Malhotra',  'vikram@example.com',   '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Management Consultant', 'Mumbai',   'Consultant traveling weekdays. Looking for clean, high-rise apartment in Powai.', '+91 98765 43222'),
  ('user-14', 'Tanvi Deshmukh',   'tanvi@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Bioinformatics Fellow', 'Bengaluru', 'Genomics researcher at IISc. Vegetarian, non-smoker, early sleeper.', '+91 98765 43223'),
  ('user-15', 'Aarav Joshi',      'aarav@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Mechanical Student',   'Pune',      '3rd year Mechanical Engineering student at COEP Tech. Enjoys robotics and morning cycling.', '+91 98765 43224'),
  ('user-16', 'Divya Pillai',     'divya@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Medical Resident',     'Mumbai',    'Junior resident at KEM Hospital Parel. Needs quiet hours for hospital shifts.', '+91 98765 43225'),
  ('user-17', 'Ishaan Sundaram',  'ishaan@example.com',   '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Computer Engg Senior',  'Mumbai',    'Final year B.Tech Computer Engineering at IIT Bombay Powai. Tech geek, tea lover.', '+91 98765 43226'),
  ('user-18', 'Riya Sengupta',    'riya@example.com',     '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Economics Scholar',    'Delhi',     'Masters student at Delhi School of Economics (DSE). Avid book reader, non-smoker.', '+91 98765 43227'),
  ('user-19', 'Kabir Saxena',     'kabir@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'MBA Student',          'Pune',      'First-year MBA candidate at SIBM Lavale. Seeking flatmates near Senapati Bapat Road.', '+91 98765 43228'),
  ('user-20', 'Shreya Nambiar',   'shreya@example.com',   '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Product Designer',     'Bengaluru', 'Industrial designer at an EV mobility startup in Koramangala. Cat lover and artist.', '+91 98765 43229'),
  ('user-21', 'Varun Chawla',     'varun@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'FinTech Intern',       'Mumbai',    'Final year at VJTI Matunga interning at a stock trading firm. Clean, organized.', '+91 98765 43230'),
  ('user-22', 'Anika Roy',        'anika@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Biotech Researcher',   'Bengaluru', 'PhD candidate in Molecular Biology at NCBS Bengaluru. Quiet and tidy lifestyle.', '+91 98765 43231'),
  ('user-23', 'Pranav Kulkarni',  'pranav@example.com',   '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Civil Engg Student',    'Pune',      'Civil engineering senior at MIT-WPU Kothrud. Enjoys sports and respectful flatsharing.', '+91 98765 43232'),
  ('user-24', 'Simran Kaur',      'simran@example.com',   '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'FMS MBA Student',      'Delhi',     'First year at Faculty of Management Studies (FMS). Prefers North Campus flatshares.', '+91 98765 43233'),
  ('user-25', 'Yash Singhania',   'yash@example.com',     '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Full-Stack Intern',    'Bengaluru', 'Software engineering fellow at Bellandur tech park. Loves coding marathons and pizza.', '+91 98765 43234'),
  ('user-26', 'Tanya Agarwal',    'tanya@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Data Science Masters', 'Pune',      'M.Sc Data Science student at Fergusson College. Peaceful study routine and early sleeper.', '+91 98765 43235'),
  ('user-27', 'Arjun Bhatt',      'arjun@example.com',    '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Robotics Intern',      'Mumbai',    'Mechatronics student interning at industrial automation firm in Andheri East.', '+91 98765 43236'),
  ('user-28', 'Natasha Roy',      'natasha@example.com',  '$2b$10$YsJHrdgZM63BTQgWuXfy3e0UeDfrclt/QBH./JVDSbvUJa0f7msOW', 'active', 0, 'Law Scholar',          'Pune',      'Final year law student at ILS Law College. Quiet study habits and cooperative flatmate.', '+91 98765 43237')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. ROOMMATE PREFERENCES (Strict 1:1 with All 28 Users)
-- ----------------------------------------------------------------------------
INSERT INTO roommate_preferences (user_id, min_budget, max_budget, preferred_area, sleep_schedule, food_habits, cleanliness, smoking, drinking, pets)
VALUES
  ('user-1',   8000, 18000, 'Koramangala',  'early',      'vegetarian',     'high',     'no',      'never',     'any'),
  ('user-2',  10000, 20000, 'Koramangala',  'early',      'vegetarian',     'high',     'no',      'socially',  'dog'),
  ('user-3',  12000, 22000, 'Indiranagar',  'flexible',   'non-vegetarian', 'moderate', 'no',      'socially',  'any'),
  ('user-4',  16000, 28000, 'Powai',        'night',      'vegetarian',     'high',     'no',      'never',     'none'),
  ('user-5',   9000, 17000, 'Hinjewadi',    'early',      'non-vegetarian', 'moderate', 'outside', 'socially',  'none'),
  ('user-6',  11000, 19000, 'Viman Nagar',  'flexible',   'vegetarian',     'high',     'no',      'never',     'cat'),
  ('user-7',   7500, 15000, 'Hauz Khas',    'early',      'vegetarian',     'high',     'no',      'never',     'none'),
  ('user-8',  12000, 21000, 'Saket',        'night',      'non-vegetarian', 'moderate', 'outside', 'socially',  'dog'),
  ('user-9',  18000, 32000, 'Bandra West',  'early',      'non-vegetarian', 'high',     'no',      'socially',  'none'),
  ('user-10', 13000, 24000, 'HSR Layout',   'early',      'vegetarian',     'high',     'no',      'never',     'any'),
  ('user-11', 10000, 18000, 'Hinjewadi',    'night',      'non-vegetarian', 'moderate', 'outside', 'socially',  'none'),
  ('user-12',  8000, 16000, 'North Campus', 'flexible',   'vegetarian',     'high',     'no',      'never',     'cat'),
  ('user-13', 20000, 35000, 'Powai',        'early',      'non-vegetarian', 'high',     'no',      'socially',  'none'),
  ('user-14',  9000, 17000, 'Indiranagar',  'early',      'vegetarian',     'high',     'no',      'never',     'none'),
  ('user-15',  6500, 13000, 'Shivajinagar', 'early-bird', 'vegetarian',     'high',     'never',   'no',        'none'),
  ('user-16', 14000, 26000, 'Parel',        'flexible',   'any',            'high',     'never',   'socially',  'none'),
  ('user-17', 10000, 22000, 'Powai',        'night-owl',  'non-vegetarian', 'medium',   'never',   'no',        'dog'),
  ('user-18',  8000, 15000, 'North Campus', 'early-bird', 'vegetarian',     'high',     'never',   'never',     'cat'),
  ('user-19', 12000, 20000, 'SB Road',      'flexible',   'any',            'moderate', 'never',   'socially',  'none'),
  ('user-20', 11000, 22000, 'Koramangala',  'night-owl',  'vegan',          'high',     'never',   'no',        'cat'),
  ('user-21', 13000, 25000, 'Dadar',        'early-bird', 'vegetarian',     'high',     'never',   'never',     'none'),
  ('user-22',  8500, 16500, 'Malleshwaram', 'early-bird', 'vegetarian',     'high',     'never',   'never',     'none'),
  ('user-23',  7000, 14000, 'Kothrud',      'flexible',   'any',            'medium',   'outside', 'socially',  'any'),
  ('user-24', 11000, 23000, 'Civil Lines',  'night-owl',  'non-vegetarian', 'high',     'never',   'socially',  'none'),
  ('user-25', 10000, 19000, 'Bellandur',    'flexible',   'any',            'medium',   'never',   'socially',  'any'),
  ('user-26',  7500, 14500, 'FC Road',      'early-bird', 'vegetarian',     'high',     'never',   'never',     'none'),
  ('user-27', 12000, 21000, 'Andheri East', 'night-owl',  'non-vegetarian', 'moderate', 'never',   'socially',  'none'),
  ('user-28',  8000, 16000, 'Law College Rd','early-bird','vegetarian',     'high',     'never',   'never',     'none')
ON CONFLICT (user_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. AMENITIES CATALOG (10 Normalized Amenities)
-- ----------------------------------------------------------------------------
INSERT INTO amenities (name, icon)
VALUES
  ('High-Speed Wi-Fi',     'wifi-outline'),
  ('Air Conditioning',     'snow-outline'),
  ('Furnished Kitchen',    'restaurant-outline'),
  ('Washing Machine',      'shirt-outline'),
  ('Power Backup',         'flash-outline'),
  ('Attached Bathroom',    'water-outline'),
  ('24/7 Security',        'shield-checkmark-outline'),
  ('Gym & Pool',           'barbell-outline'),
  ('Covered Parking',      'car-sport-outline'),
  ('Balcony with View',    'sunny-outline')
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. ACCOMMODATIONS (24 Listings Across Metro Campus Hubs)
-- ----------------------------------------------------------------------------
INSERT INTO accommodations (id, owner_id, title, description, city, preferred_area, type, monthly_rent, security_deposit, available_rooms, available_from, status, photo_urls, has_virtual_tour)
VALUES
  ('prop-1',  'user-2',  'Spacious 2BHK in Koramangala 4th Block',          'Well-ventilated shared flat near Sony Signal with balcony, modular kitchen, and fast Wi-Fi.', 'Bengaluru', 'Koramangala',  'shared_room',      12500, 25000, 1, CURRENT_DATE + INTERVAL '7 days',  'available', ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'], TRUE),
  ('prop-2',  'user-3',  'Modern Studio Apartment near Indiranagar 100ft', 'Private studio walking distance to cafes and metro station. Ideal for professionals.',      'Bengaluru', 'Indiranagar',  'private_room',     18500, 37000, 1, CURRENT_DATE + INTERVAL '10 days', 'available', ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'], TRUE),
  ('prop-3',  'user-10', 'Quiet Single Room in HSR Sector 2 PG',          'Single occupancy PG room with attached bath, 3 meals, and high-speed fiber internet.',      'Bengaluru', 'HSR Layout',   'pg',                9500, 15000, 2, CURRENT_DATE + INTERVAL '3 days',  'available', ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'], FALSE),
  ('prop-4',  'user-2',  'Sunny 3BHK Penthouse in Whitefield',             'Luxury high-rise flat near ITPL. Clubhouse, swimming pool, and dedicated workstation.',     'Bengaluru', 'Whitefield',   'entire_apartment', 28000, 60000, 2, CURRENT_DATE + INTERVAL '14 days', 'available', ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750'], FALSE),
  ('prop-5',  'user-4',  'Lakeview 2BHK Apartment in Powai',               'Stunning Powai lake view from 18th floor. Gated society with gym and security.',            'Mumbai',    'Powai',        'shared_room',      22000, 50000, 1, CURRENT_DATE + INTERVAL '12 days', 'available', ARRAY['https://images.unsplash.com/photo-1493809842364-78817add7ffb'], TRUE),
  ('prop-6',  'user-9',  'Cozy 1BHK in Bandra West Pali Hill',             'Charming apartment in quiet lane near cafes. Fully furnished with modular kitchen.',         'Mumbai',    'Bandra West',  'entire_apartment', 35000, 80000, 1, CURRENT_DATE + INTERVAL '5 days',  'available', ARRAY['https://images.unsplash.com/photo-1502005229762-ee1b2b800539'], FALSE),
  ('prop-7',  'user-13', 'Executive Private Room in Andheri West',         'Spacious master bedroom with attached bathroom and balcony near Lokhandwala market.',       'Mumbai',    'Andheri West', 'private_room',     19500, 40000, 1, CURRENT_DATE + INTERVAL '8 days',  'available', ARRAY['https://images.unsplash.com/photo-1524758631624-e2822e304c36'], FALSE),
  ('prop-8',  'user-4',  'Student Sharing Flat in Powai Plaza',            'Affordable twin-sharing room for IIT Bombay / campus students with Wi-Fi and laundry.',     'Mumbai',    'Powai',        'shared_room',      11000, 20000, 2, CURRENT_DATE + INTERVAL '2 days',  'available', ARRAY['https://images.unsplash.com/photo-1554995207-c18c203602cb'], FALSE),
  ('prop-9',  'user-5',  'Gated Community 2BHK near Hinjewadi Phase 1',    'Modern apartment inside premium society. Gym, pool, clubhouse, and power backup.',          'Pune',      'Hinjewadi',    'entire_apartment', 16500, 32000, 2, CURRENT_DATE + INTERVAL '6 days',  'available', ARRAY['https://images.unsplash.com/photo-1484154218962-a197022b5858'], TRUE),
  ('prop-10', 'user-6',  'Bright Studio Flat in Viman Nagar near Symbiosis','Walking distance to Symbiosis and Phoenix Mall. Fully furnished with kitchen appliances.',  'Pune',      'Viman Nagar',  'private_room',     14000, 28000, 1, CURRENT_DATE + INTERVAL '10 days', 'available', ARRAY['https://images.unsplash.com/photo-1536376072261-38c75010e6c9'], FALSE),
  ('prop-11', 'user-11', 'Comfortable 3BHK Flatshare in Wakad',            'Room in spacious 3BHK flat near highway. Easy commute to Hinjewadi tech parks.',            'Pune',      'Wakad',        'shared_room',       8500, 15000, 1, CURRENT_DATE + INTERVAL '4 days',  'available', ARRAY['https://images.unsplash.com/photo-1560185007-cde436f6a4d0'], FALSE),
  ('prop-12', 'user-6',  'Green View 2BHK in Kothrud near MIT-WPU',        'Peaceful residential area close to MIT World Peace University. Balcony with hill view.',     'Pune',      'Kothrud',      'entire_apartment', 18000, 36000, 1, CURRENT_DATE + INTERVAL '15 days', 'available', ARRAY['https://images.unsplash.com/photo-1513694203232-719a280e022f'], TRUE),
  ('prop-13', 'user-7',  'Serene Room in Hauz Khas Enclave Flat',          'Charming room near Deer Park and metro. Quiet study area and greenery.',                    'Delhi',     'Hauz Khas',    'private_room',     15500, 30000, 1, CURRENT_DATE + INTERVAL '7 days',  'available', ARRAY['https://images.unsplash.com/photo-1505691938895-1758d7feb511'], TRUE),
  ('prop-14', 'user-8',  'Modern 2BHK in Saket near Select Citywalk',      'Prime location flat with air conditioning, modular kitchen, and round-the-clock security.', 'Delhi',     'Saket',        'entire_apartment', 24000, 48000, 2, CURRENT_DATE + INTERVAL '9 days',  'available', ARRAY['https://images.unsplash.com/photo-1540518614846-7ede433c4b49'], FALSE),
  ('prop-15', 'user-12', 'Student PG Room in North Campus Patel Nagar',    'Walking distance to Delhi University North Campus colleges. High-speed Wi-Fi and food.',    'Delhi',     'North Campus', 'pg',                8500, 12000, 2, CURRENT_DATE + INTERVAL '3 days',  'available', ARRAY['https://images.unsplash.com/photo-1598928506311-c55ded91a20c'], FALSE),
  ('prop-16', 'user-8',  'Central 2BHK in Lajpat Nagar III',               'Central Delhi location near metro station and market. Spacious rooms with AC.',             'Delhi',     'Lajpat Nagar', 'shared_room',      13000, 26000, 1, CURRENT_DATE + INTERVAL '11 days', 'available', ARRAY['https://images.unsplash.com/photo-1502005229762-ee1b2b800539'], FALSE),
  ('prop-17', 'user-15', 'COEP Campus Student Room in Shivajinagar',       'Twin sharing student room 5 mins from COEP campus. Study desk, power backup, Wi-Fi.',        'Pune',      'Shivajinagar', 'shared_room',       6500, 10000, 2, CURRENT_DATE + INTERVAL '1 day',   'available', ARRAY['https://images.unsplash.com/photo-1555854877-bab0e564b8d5'], FALSE),
  ('prop-18', 'user-16', 'Medical Intern Studio near KEM Parel',           'Quiet fully furnished flat tailored for doctors and interns with microwave and washing mach.','Mumbai',    'Parel',        'private_room',     16000, 30000, 1, CURRENT_DATE + INTERVAL '6 days',  'available', ARRAY['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af'], FALSE),
  ('prop-19', 'user-19', 'Co-Living 3BHK on Senapati Bapat Road',          'Spacious society near Symbiosis & ICC Towers. High-speed fiber internet and housekeeping.',  'Pune',      'SB Road',      'shared_room',      10500, 20000, 1, CURRENT_DATE + INTERVAL '5 days',  'available', ARRAY['https://images.unsplash.com/photo-1501183638710-841dd1904471'], FALSE),
  ('prop-20', 'user-20', 'Design Loft in Koramangala 5th Block',           'Creative studio space for designers and startup interns with open terrace and natural light.','Bengaluru', 'Koramangala',  'private_room',     15000, 30000, 1, CURRENT_DATE + INTERVAL '8 days',  'available', ARRAY['https://images.unsplash.com/photo-1513694203232-719a280e022f'], TRUE),
  ('prop-21', 'user-22', 'IISc Gateway 2BHK in Malleshwaram',              'Traditional peaceful flat near IISc campus. Pure vegetarian household, balcony and trees.', 'Bengaluru', 'Malleshwaram', 'entire_apartment', 19000, 40000, 2, CURRENT_DATE + INTERVAL '12 days', 'available', ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'], FALSE),
  ('prop-22', 'user-24', 'North Campus DU Girls PG in Vijay Nagar',        'Secure biometric entrance PG with healthy home-cooked meals, Wi-Fi and study rooms.',        'Delhi',     'North Campus', 'pg',                9500, 15000, 3, CURRENT_DATE + INTERVAL '3 days',  'available', ARRAY['https://images.unsplash.com/photo-1598928506311-c55ded91a20c'], FALSE),
  ('prop-23', 'user-25', 'Tech Corridor Twin Room in Bellandur',           'Flatshare opposite EcoSpace tech park. Gym, pool, high-speed Wi-Fi and power backup.',       'Bengaluru', 'Bellandur',    'shared_room',       9000, 18000, 2, CURRENT_DATE + INTERVAL '4 days',  'available', ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'], FALSE),
  ('prop-24', 'user-28', 'Law College Hillview 2BHK on Law College Road',  'Bright and breezy 2BHK near ILS Pune. Wooden flooring, bookshelves, and quiet surroundings.', 'Pune',      'Law College Rd','entire_apartment', 17500, 35000, 1, CURRENT_DATE + INTERVAL '10 days', 'available', ARRAY['https://images.unsplash.com/photo-1484154218962-a197022b5858'], FALSE)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. ACCOMMODATION AMENITIES (M:N Junction Links)
-- ----------------------------------------------------------------------------
INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-1', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Air Conditioning', 'Furnished Kitchen', 'Power Backup', 'Balcony with View')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-2', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Air Conditioning', 'Furnished Kitchen', '24/7 Security')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-3', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Power Backup', 'Attached Bathroom', '24/7 Security')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-4', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Air Conditioning', 'Gym & Pool', 'Covered Parking', 'Balcony with View')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-5', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Air Conditioning', 'Gym & Pool', '24/7 Security', 'Balcony with View')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-6', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Furnished Kitchen', 'Air Conditioning', 'Covered Parking')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-7', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Attached Bathroom', 'Furnished Kitchen', 'Power Backup')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-8', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Power Backup', 'Washing Machine', '24/7 Security')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-9', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Gym & Pool', 'Power Backup', 'Covered Parking', 'Balcony with View')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-10', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Furnished Kitchen', 'Washing Machine', '24/7 Security')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-11', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Power Backup', 'Covered Parking')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-12', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Furnished Kitchen', 'Balcony with View', 'Power Backup')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-13', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Air Conditioning', 'Power Backup', 'Balcony with View')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-14', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Air Conditioning', '24/7 Security', 'Covered Parking')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-15', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Attached Bathroom', 'Power Backup')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-16', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Air Conditioning', 'Furnished Kitchen')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-17', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Power Backup', 'Furnished Kitchen')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-18', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Air Conditioning', 'Washing Machine', '24/7 Security')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-19', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Power Backup', 'Covered Parking', '24/7 Security')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-20', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Balcony with View', 'Furnished Kitchen')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-21', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Power Backup', 'Covered Parking')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-22', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Attached Bathroom', '24/7 Security')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-23', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Gym & Pool', 'Power Backup')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-24', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Balcony with View', 'Power Backup')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. VIRTUAL TOUR SCENES (360° Tours)
-- ----------------------------------------------------------------------------
INSERT INTO virtual_tour_scenes (id, accommodation_id, room_name, panorama_url, is_default, yaw, pitch)
VALUES
  ('scene-1-1', 'prop-1', 'Living Room',      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80', TRUE,   0.0,   0.0),
  ('scene-1-2', 'prop-1', 'Master Bedroom',   'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=2000&q=80', FALSE, 45.0, -10.0),
  ('scene-2-1', 'prop-2', 'Main Studio Area', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=2000&q=80', TRUE,   0.0,   0.0),
  ('scene-5-1', 'prop-5', 'Living & Balcony', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80', TRUE,   0.0,   5.0),
  ('scene-9-1', 'prop-9', 'Clubhouse & Flat', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=2000&q=80', TRUE,   0.0,   0.0),
  ('scene-12-1','prop-12','Kothrud Hillview', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=2000&q=80', TRUE,   0.0,   0.0),
  ('scene-13-1','prop-13','Study & Garden',   'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=2000&q=80', TRUE,  10.0,  -5.0),
  ('scene-20-1','prop-20','Designer Loft',    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=2000&q=80', TRUE,   0.0,   0.0)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. BOOKING REQUESTS (16 Bookings with Varied Statuses)
-- ----------------------------------------------------------------------------
INSERT INTO booking_requests (id, sender_id, owner_id, listing_id, status, move_in_date, message)
VALUES
  ('book-1',  'user-1',  'user-2',  'prop-1',  'pending',   CURRENT_DATE + INTERVAL '10 days', 'Hi Priya! I would love to schedule a visit and discuss moving in next week.'),
  ('book-2',  'user-3',  'user-4',  'prop-5',  'accepted',  CURRENT_DATE + INTERVAL '20 days', 'Looking forward to moving in. Security deposit is ready.'),
  ('book-3',  'user-5',  'user-2',  'prop-1',  'rejected',  CURRENT_DATE + INTERVAL '5 days',  'Hi, is this twin sharing room still available?'),
  ('book-4',  'user-6',  'user-11', 'prop-11', 'accepted',  CURRENT_DATE + INTERVAL '15 days', 'Hi Siddharth, confirmed move in date after office transfer.'),
  ('book-5',  'user-7',  'user-8',  'prop-14', 'cancelled', CURRENT_DATE + INTERVAL '12 days', 'Sorry, I found another place closer to campus.'),
  ('book-6',  'user-8',  'user-7',  'prop-13', 'pending',   CURRENT_DATE + INTERVAL '14 days', 'Would love to check out the room this Saturday afternoon.'),
  ('book-7',  'user-9',  'user-13', 'prop-7',  'accepted',  CURRENT_DATE + INTERVAL '25 days', 'Ready to sign the rental agreement for next month.'),
  ('book-8',  'user-12', 'user-10', 'prop-3',  'pending',   CURRENT_DATE + INTERVAL '8 days',  'Is the single PG room on the 2nd floor still open?'),
  ('book-9',  'user-14', 'user-3',  'prop-2',  'pending',   CURRENT_DATE + INTERVAL '18 days', 'Hi Rahul, interested in the studio flat for 6 months lease.'),
  ('book-10', 'user-1',  'user-4',  'prop-5',  'cancelled', CURRENT_DATE + INTERVAL '30 days', 'Plan changed, staying in Bangalore.'),
  ('book-11', 'user-15', 'user-6',  'prop-12', 'pending',   CURRENT_DATE + INTERVAL '7 days',  'COEP student looking for 1 room in this 2BHK flat. Very clean.'),
  ('book-12', 'user-21', 'user-16', 'prop-18', 'pending',   CURRENT_DATE + INTERVAL '10 days', 'Fintech intern looking for clean quiet studio near Parel.'),
  ('book-13', 'user-17', 'user-4',  'prop-8',  'accepted',  CURRENT_DATE + INTERVAL '14 days', 'IIT Bombay student ready to move in for final semester.'),
  ('book-14', 'user-18', 'user-12', 'prop-15', 'pending',   CURRENT_DATE + INTERVAL '6 days',  'DSE economics student interested in the North Campus room.'),
  ('book-15', 'user-23', 'user-15', 'prop-17', 'accepted',  CURRENT_DATE + INTERVAL '9 days',  'COEP roommate confirmed for twin sharing.'),
  ('book-16', 'user-25', 'user-2',  'prop-4',  'pending',   CURRENT_DATE + INTERVAL '16 days', 'Software engineer looking for master bedroom.')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. CONNECTION REQUESTS (16 Roommate Social Matches)
-- ----------------------------------------------------------------------------
INSERT INTO connection_requests (id, sender_id, receiver_id, status)
VALUES
  ('conn-1',  'user-1',  'user-2',  'accepted'),
  ('conn-2',  'user-1',  'user-3',  'pending'),
  ('conn-3',  'user-2',  'user-10', 'accepted'),
  ('conn-4',  'user-4',  'user-9',  'accepted'),
  ('conn-5',  'user-5',  'user-6',  'accepted'),
  ('conn-6',  'user-5',  'user-11', 'pending'),
  ('conn-7',  'user-7',  'user-8',  'accepted'),
  ('conn-8',  'user-7',  'user-12', 'pending'),
  ('conn-9',  'user-13', 'user-4',  'rejected'),
  ('conn-10', 'user-14', 'user-2',  'pending'),
  ('conn-11', 'user-15', 'user-23', 'accepted'),
  ('conn-12', 'user-16', 'user-21', 'accepted'),
  ('conn-13', 'user-17', 'user-27', 'accepted'),
  ('conn-14', 'user-18', 'user-24', 'accepted'),
  ('conn-15', 'user-19', 'user-26', 'pending'),
  ('conn-16', 'user-20', 'user-22', 'accepted')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 9. SAVED ACCOMMODATIONS & SAVED ROOMMATES
-- ----------------------------------------------------------------------------
INSERT INTO saved_accommodations (user_id, listing_id)
VALUES
  ('user-1', 'prop-1'),
  ('user-1', 'prop-2'),
  ('user-1', 'prop-3'),
  ('user-3', 'prop-5'),
  ('user-4', 'prop-5'),
  ('user-5', 'prop-9'),
  ('user-6', 'prop-10'),
  ('user-7', 'prop-13'),
  ('user-8', 'prop-14'),
  ('user-9', 'prop-6'),
  ('user-12', 'prop-15'),
  ('user-14', 'prop-2'),
  ('user-15', 'prop-12'),
  ('user-15', 'prop-17'),
  ('user-17', 'prop-5'),
  ('user-17', 'prop-8'),
  ('user-18', 'prop-13'),
  ('user-18', 'prop-15'),
  ('user-20', 'prop-1'),
  ('user-20', 'prop-20')
ON CONFLICT (user_id, listing_id) DO NOTHING;

INSERT INTO saved_roommates (user_id, roommate_id)
VALUES
  ('user-1', 'user-2'),
  ('user-1', 'user-3'),
  ('user-2', 'user-1'),
  ('user-3', 'user-10'),
  ('user-4', 'user-9'),
  ('user-5', 'user-6'),
  ('user-6', 'user-11'),
  ('user-7', 'user-8'),
  ('user-8', 'user-12'),
  ('user-9', 'user-13'),
  ('user-10', 'user-2'),
  ('user-14', 'user-1'),
  ('user-15', 'user-23'),
  ('user-16', 'user-21'),
  ('user-17', 'user-27'),
  ('user-18', 'user-24'),
  ('user-19', 'user-26'),
  ('user-20', 'user-22'),
  ('user-21', 'user-16'),
  ('user-23', 'user-15')
ON CONFLICT (user_id, roommate_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 10. REVIEWS (14 Reviews with Strict Polymorphic FK Integrity)
-- ----------------------------------------------------------------------------
INSERT INTO reviews (id, reviewer_id, target_type, target_accommodation_id, rating, comment, interaction_key)
VALUES
  ('rev-1', 'user-1', 'accommodation', 'prop-1',  5, 'Exceptional property! Accurate photos, super clean, and landlord is very cooperative.', 'rev_u1_p1'),
  ('rev-2', 'user-3', 'accommodation', 'prop-2',  4, 'Great location in Indiranagar. Fast Wi-Fi and quiet surroundings for remote work.',     'rev_u3_p2'),
  ('rev-3', 'user-5', 'accommodation', 'prop-9',  5, 'Loved the amenities and gated security. Smooth check-in process.',                      'rev_u5_p9'),
  ('rev-4', 'user-7', 'accommodation', 'prop-13', 5, 'Peaceful stay near Hauz Khas Deer Park. Landlord is very helpful.',                    'rev_u7_p13'),
  ('rev-5', 'user-9', 'accommodation', 'prop-7',  4, 'Prime Andheri location, close to metro and food places.',                                'rev_u9_p7'),
  ('rev-11','user-15','accommodation', 'prop-12', 5, 'Quiet neighborhood near MIT-WPU Kothrud. Super study friendly.',                        'rev_u15_p12'),
  ('rev-12','user-17','accommodation', 'prop-8',  4, 'Affordable flatshare near IIT Bombay main gate. Great value.',                           'rev_u17_p8')
ON CONFLICT (id) DO NOTHING;

INSERT INTO reviews (id, reviewer_id, target_type, target_user_id, rating, comment, interaction_key)
VALUES
  ('rev-6',  'user-1', 'roommate', 'user-2',  5, 'Priya is an incredible roommate! Very considerate of noise levels and keeps common areas spotless.', 'rev_u1_u2'),
  ('rev-7',  'user-2', 'roommate', 'user-1',  5, 'Alex is super responsible, friendly, and pays utility bills right on time. Highly recommended!',      'rev_u2_u1'),
  ('rev-8',  'user-5', 'roommate', 'user-6',  5, 'Sneha is great to live with. Very organized and respectful of personal space.',                        'rev_u5_u6'),
  ('rev-9',  'user-7', 'roommate', 'user-8',  4, 'Pooja is friendly and communicative. Great experience sharing the flat.',                              'rev_u7_u8'),
  ('rev-10', 'user-4', 'roommate', 'user-9',  5, 'Aditya is very quiet, clean, and disciplined with household chores.',                                 'rev_u4_u9'),
  ('rev-13', 'user-15','roommate', 'user-23', 5, 'Pranav is punctual, respectful and a great study partner at COEP.',                                  'rev_u15_u23'),
  ('rev-14', 'user-18','roommate', 'user-24', 5, 'Simran is an amazing flatmate! Keeps the apartment spotless and very cooperative.',                  'rev_u18_u24')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 11. CHAT CONVERSATIONS & MESSAGES (Ensuring user1_id < user2_id)
-- ----------------------------------------------------------------------------
INSERT INTO conversations (id, user1_id, user2_id)
VALUES
  ('conv-1', 'user-1', 'user-2'),
  ('conv-2', 'user-1', 'user-3'),
  ('conv-3', 'user-4', 'user-9'),
  ('conv-4', 'user-5', 'user-6'),
  ('conv-5', 'user-15', 'user-23'),
  ('conv-6', 'user-16', 'user-21'),
  ('conv-7', 'user-17', 'user-27'),
  ('conv-8', 'user-18', 'user-24')
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, is_read)
VALUES
  ('msg-1', 'conv-1', 'user-1', 'user-2', 'Hi Priya! Are you free this weekend for a quick call regarding the flat?', TRUE),
  ('msg-2', 'conv-1', 'user-2', 'user-1', 'Hey Alex, yes! Saturday 11am works perfectly for me.', TRUE),
  ('msg-3', 'conv-1', 'user-1', 'user-2', 'Awesome, looking forward to it!', TRUE),
  ('msg-4', 'conv-2', 'user-1', 'user-3', 'Hi Rahul, loved your profile! Are you still looking for flatmates in Indiranagar?', TRUE),
  ('msg-5', 'conv-2', 'user-3', 'user-1', 'Hi Alex, yes I am! Let me know when you want to connect.', FALSE),
  ('msg-6', 'conv-3', 'user-4', 'user-9', 'Hi Aditya, confirmed our move-in date with the broker.', TRUE),
  ('msg-7', 'conv-3', 'user-9', 'user-4', 'Great news! I will transfer the advance rent today.', TRUE),
  ('msg-8', 'conv-4', 'user-5', 'user-6', 'Hi Sneha, did you get a chance to see the Hinjewadi apartment photos?', TRUE),
  ('msg-9', 'conv-4', 'user-6', 'user-5', 'Yes! The virtual tour looked really nice. Let us proceed with the booking.', TRUE),
  ('msg-10','conv-5', 'user-15', 'user-23', 'Hi Pranav! Did you finalize the Kothrud flat for next semester?', TRUE),
  ('msg-11','conv-5', 'user-23', 'user-15', 'Yes Aarav! Met the owner yesterday. Rent split is 9k each.', TRUE),
  ('msg-12','conv-6', 'user-16', 'user-21', 'Hi Varun, how are the hospital shifts aligning with study time?', TRUE),
  ('msg-13','conv-7', 'user-17', 'user-27', 'Hey Arjun, let us inspect the Powai studio after robotics lab.', TRUE),
  ('msg-14','conv-8', 'user-18', 'user-24', 'Hi Simran, DSE library is 10 mins from the Vijay Nagar PG.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 12. NOTIFICATIONS & PREFERENCES
-- ----------------------------------------------------------------------------
INSERT INTO notifications (id, recipient_id, type, title, body, related_request_id, is_read)
VALUES
  ('notif-1', 'user-2', 'booking_request',    'New Booking Inquiry', 'Alex Rivera requested to book your Koramangala 2BHK.', 'book-1', FALSE),
  ('notif-2', 'user-1', 'booking_status',     'Booking Update',      'Your booking request is under review.',                  'book-1', TRUE),
  ('notif-3', 'user-4', 'booking_request',    'New Booking Request', 'Rahul Verma sent a booking request for your Powai flat.', 'book-2', TRUE),
  ('notif-4', 'user-2', 'connection_request', 'New Match Request',   'Alex Rivera sent you a roommate match request.',         'conn-1', TRUE),
  ('notif-5', 'user-6', 'booking_status',     'Booking Accepted',    'Your booking for Wakad 3BHK was accepted!',             'book-4', FALSE),
  ('notif-6', 'user-15', 'booking_status',    'Application Received','Your application for Kothrud flat was received.',       'book-11', TRUE),
  ('notif-7', 'user-23', 'connection_request','New Match Request',   'Aarav Joshi connected with you.',                       'conn-11', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO notification_preferences (user_id, new_requests, messages, status_updates, email_alerts, push_notifications)
SELECT id, TRUE, TRUE, TRUE, TRUE, TRUE FROM users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO privacy_settings (user_id, show_profile, show_phone, show_email, allow_requests)
SELECT id, TRUE, FALSE, FALSE, TRUE FROM users
ON CONFLICT (user_id) DO NOTHING;
