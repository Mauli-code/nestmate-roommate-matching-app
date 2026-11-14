-- ============================================================================
-- NestMate PostgreSQL Seed Data
-- Provides realistic development & demonstration records
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USERS
-- (All default users use password 'nestmate123', hash: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)
-- ----------------------------------------------------------------------------
INSERT INTO users (id, full_name, email, password_hash, account_status, auth_version, occupation, city, bio, phone)
VALUES
  ('user-1', 'Alex Rivera', 'alex@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', 0, 'Graduate Student', 'Bangalore', 'Computer Science graduate student looking for a quiet, clean, and collaborative space.', '+91 98765 43210'),
  ('user-2', 'Priya Sharma', 'priya@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', 0, 'Software Engineer', 'Bangalore', 'Full-stack developer who loves weekend cooking and keeping common spaces neat.', '+91 98765 43211'),
  ('user-3', 'Rahul Verma', 'rahul@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', 0, 'UI/UX Designer', 'Bangalore', 'Creative professional passionate about design, early morning runs, and healthy food.', '+91 98765 43212'),
  ('user-4', 'Ananya Patel', 'ananya@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', 0, 'Data Analyst', 'Mumbai', 'Working at a fintech firm. Looking for friendly flatmates in Powai or Andheri.', '+91 98765 43213'),
  ('user-5', 'Karthik Nair', 'karthik@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', 0, 'Product Manager', 'Pune', 'Product manager moving to Pune. Quiet, respectful, and loves reading on weekends.', '+91 98765 43214')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. ROOMMATE PREFERENCES (1:1 WITH USERS)
-- ----------------------------------------------------------------------------
INSERT INTO roommate_preferences (user_id, min_budget, max_budget, preferred_area, sleep_schedule, food_habits, cleanliness, smoking, drinking, pets)
VALUES
  ('user-1', 8000, 18000, 'Koramangala', 'early', 'vegetarian', 'high', 'no', 'never', 'any'),
  ('user-2', 10000, 20000, 'Koramangala', 'early', 'vegetarian', 'high', 'no', 'socially', 'dog'),
  ('user-3', 12000, 22000, 'Indiranagar', 'flexible', 'non-vegetarian', 'moderate', 'no', 'socially', 'any'),
  ('user-4', 15000, 28000, 'Powai', 'night', 'vegetarian', 'high', 'no', 'never', 'none'),
  ('user-5', 9000, 17000, 'Hinjewadi', 'early', 'non-vegetarian', 'moderate', 'outside', 'socially', 'none')
ON CONFLICT (user_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. AMENITIES CATALOG
-- ----------------------------------------------------------------------------
INSERT INTO amenities (name, icon)
VALUES
  ('High-Speed Wi-Fi', 'wifi-outline'),
  ('Air Conditioning', 'snow-outline'),
  ('Furnished Kitchen', 'restaurant-outline'),
  ('Washing Machine', 'shirt-outline'),
  ('Power Backup', 'flash-outline'),
  ('Attached Bathroom', 'water-outline'),
  ('24/7 Security', 'shield-checkmark-outline'),
  ('Gym & Pool', 'barbell-outline')
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. ACCOMMODATION LISTINGS
-- ----------------------------------------------------------------------------
INSERT INTO accommodations (id, owner_id, title, description, city, preferred_area, type, monthly_rent, security_deposit, available_rooms, available_from, status, photo_urls, has_virtual_tour)
VALUES
  ('prop-1', 'user-2', 'Spacious 2BHK in Koramangala 4th Block', 'Bright and fully ventilated shared flat with balcony, high-speed Wi-Fi, and modular kitchen near Sony World Signal.', 'Bangalore', 'Koramangala', 'shared_room', 12500, 25000, 1, CURRENT_DATE + INTERVAL '7 days', 'available', ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'], TRUE),
  ('prop-2', 'user-3', 'Modern Studio Flat in Indiranagar', 'Cozy private studio walking distance to 100ft road cafes and metro station with modern amenities and power backup.', 'Bangalore', 'Indiranagar', 'private_room', 18000, 36000, 1, CURRENT_DATE + INTERVAL '10 days', 'available', ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688'], TRUE),
  ('prop-3', 'user-1', 'Peaceful PG near HSR Layout Sector 2', 'Single occupancy PG room with attached bathroom, 3 times meals included, and laundry service.', 'Bangalore', 'HSR Layout', 'pg', 9500, 15000, 2, CURRENT_DATE + INTERVAL '3 days', 'available', ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'], FALSE),
  ('prop-4', 'user-4', '3BHK Lakeview Apartment in Powai', 'Luxury high-rise apartment facing Powai lake. Looking for working professional flatmate.', 'Mumbai', 'Powai', 'shared_room', 22000, 50000, 1, CURRENT_DATE + INTERVAL '15 days', 'available', ARRAY['https://images.unsplash.com/photo-1493809842364-78817add7ffb'], FALSE),
  ('prop-5', 'user-5', 'Gated Community 2BHK near Hinjewadi Phase 1', 'Furnished apartment inside premium gated society with gym, clubhouse, and swimming pool.', 'Pune', 'Hinjewadi', 'entire_apartment', 16000, 30000, 2, CURRENT_DATE + INTERVAL '5 days', 'available', ARRAY['https://images.unsplash.com/photo-1484154218962-a197022b5858'], FALSE)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. ACCOMMODATION AMENITIES (M:N LINKS)
-- ----------------------------------------------------------------------------
INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-1', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Air Conditioning', 'Furnished Kitchen', 'Power Backup')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-2', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Furnished Kitchen', 'Washing Machine', '24/7 Security')
ON CONFLICT DO NOTHING;

INSERT INTO accommodation_amenities (accommodation_id, amenity_id)
SELECT 'prop-3', id FROM amenities WHERE name IN ('High-Speed Wi-Fi', 'Power Backup', 'Attached Bathroom')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. VIRTUAL TOUR SCENES (360° WEBGL TOURS)
-- ----------------------------------------------------------------------------
INSERT INTO virtual_tour_scenes (id, accommodation_id, room_name, panorama_url, is_default, yaw, pitch)
VALUES
  ('scene-1-1', 'prop-1', 'Living Room', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80', TRUE, 0.0, 0.0),
  ('scene-1-2', 'prop-1', 'Master Bedroom', 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=2000&q=80', FALSE, 45.0, -10.0),
  ('scene-2-1', 'prop-2', 'Main Studio & Desk', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=2000&q=80', TRUE, 0.0, 0.0)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. BOOKING REQUESTS
-- ----------------------------------------------------------------------------
INSERT INTO booking_requests (id, sender_id, owner_id, listing_id, status, move_in_date, message)
VALUES
  ('book-1', 'user-1', 'user-2', 'prop-1', 'pending', CURRENT_DATE + INTERVAL '10 days', 'Hi Priya! I would love to schedule a visit and discuss moving in next week.'),
  ('book-2', 'user-3', 'user-4', 'prop-4', 'accepted', CURRENT_DATE + INTERVAL '20 days', 'Looking forward to moving in. Security deposit is ready.'),
  ('book-3', 'user-5', 'user-2', 'prop-1', 'rejected', CURRENT_DATE + INTERVAL '5 days', 'Hi, is this room still open?')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. REVIEWS
-- ----------------------------------------------------------------------------
INSERT INTO reviews (id, reviewer_id, target_type, target_accommodation_id, rating, comment, interaction_key)
VALUES
  ('rev-1', 'user-1', 'accommodation', 'prop-1', 5, 'Exceptional property! Accurate photos, super clean, and landlord is very cooperative.', 'rev_user1_prop1'),
  ('rev-2', 'user-3', 'accommodation', 'prop-2', 4, 'Great location in Indiranagar. Fast Wi-Fi and quiet surroundings.', 'rev_user3_prop2')
ON CONFLICT (id) DO NOTHING;

INSERT INTO reviews (id, reviewer_id, target_type, target_user_id, rating, comment, interaction_key)
VALUES
  ('rev-3', 'user-1', 'roommate', 'user-2', 5, 'Priya is an incredible roommate! Very considerate of noise levels and always keeps common areas spotless.', 'rev_user1_user2')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 9. NOTIFICATIONS & PRIVACY
-- ----------------------------------------------------------------------------
INSERT INTO notifications (id, recipient_id, type, title, body, related_request_id, is_read)
VALUES
  ('notif-1', 'user-2', 'booking_request', 'New Booking Inquiry', 'Alex Rivera sent a booking request for your Koramangala listing.', 'book-1', FALSE),
  ('notif-2', 'user-1', 'booking_status', 'Booking Update', 'Your booking request is under review.', 'book-1', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO notification_preferences (user_id, new_requests, messages, status_updates, email_alerts, push_notifications)
VALUES
  ('user-1', TRUE, TRUE, TRUE, TRUE, TRUE),
  ('user-2', TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO privacy_settings (user_id, show_profile, show_phone, show_email, allow_requests)
VALUES
  ('user-1', TRUE, FALSE, FALSE, TRUE),
  ('user-2', TRUE, TRUE, FALSE, TRUE)
ON CONFLICT (user_id) DO NOTHING;
