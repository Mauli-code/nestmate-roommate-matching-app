-- ============================================================================
-- NestMate Relational Database Schema (PostgreSQL 14+)
-- Normalized to 3NF/BCNF with Entity, Referential, and Domain Constraints
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  account_status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'deactivated')),
  auth_version INT NOT NULL DEFAULT 0 CHECK (auth_version >= 0),
  photo_path VARCHAR(500),
  occupation VARCHAR(100) DEFAULT '',
  city VARCHAR(100) DEFAULT '',
  bio TEXT DEFAULT '',
  phone VARCHAR(30) DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. ROOMMATE PREFERENCES (STRICT 1:1 WITH USERS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roommate_preferences (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  min_budget NUMERIC(10, 2) NOT NULL CHECK (min_budget >= 0),
  max_budget NUMERIC(10, 2) NOT NULL CHECK (max_budget >= min_budget),
  preferred_area VARCHAR(100) NOT NULL,
  sleep_schedule VARCHAR(20) NOT NULL
    CHECK (sleep_schedule IN ('early', 'night', 'flexible')),
  food_habits VARCHAR(20) NOT NULL
    CHECK (food_habits IN ('vegetarian', 'non-vegetarian', 'vegan', 'any')),
  cleanliness VARCHAR(20) NOT NULL
    CHECK (cleanliness IN ('low', 'moderate', 'high')),
  smoking VARCHAR(20) NOT NULL
    CHECK (smoking IN ('no', 'yes', 'outside')),
  drinking VARCHAR(20) NOT NULL
    CHECK (drinking IN ('never', 'socially', 'regularly')),
  pets VARCHAR(20) NOT NULL
    CHECK (pets IN ('none', 'dog', 'cat', 'any')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. ACCOMMODATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accommodations (
  id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  preferred_area VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL
    CHECK (type IN ('shared_room', 'private_room', 'entire_apartment', 'pg', 'flat', 'apartment', 'shared-room')),
  monthly_rent NUMERIC(10, 2) NOT NULL CHECK (monthly_rent > 0),
  security_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (security_deposit >= 0),
  available_rooms INT NOT NULL DEFAULT 1 CHECK (available_rooms >= 1),
  available_from DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'booked', 'inactive')),
  photo_urls TEXT[] DEFAULT '{}',
  has_virtual_tour BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. AMENITIES TABLE (NORMALIZED CATALOG)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS amenities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(50) DEFAULT 'checkmark-circle-outline'
);

-- ----------------------------------------------------------------------------
-- 5. ACCOMMODATION AMENITIES (M:N JUNCTION TABLE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accommodation_amenities (
  accommodation_id VARCHAR(64) NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  amenity_id INT NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (accommodation_id, amenity_id)
);

-- ----------------------------------------------------------------------------
-- 6. VIRTUAL TOUR SCENES (360° TOUR ATTACHMENT)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS virtual_tour_scenes (
  id VARCHAR(64) PRIMARY KEY,
  accommodation_id VARCHAR(64) NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  room_name VARCHAR(100) NOT NULL,
  panorama_url TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  yaw NUMERIC(6, 2) DEFAULT 0,
  pitch NUMERIC(6, 2) DEFAULT 0,
  hotspots JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. BOOKING REQUESTS (WITH STRICT PREVENTIONS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS booking_requests (
  id VARCHAR(64) PRIMARY KEY,
  sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id VARCHAR(64) NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  move_in_date DATE NOT NULL,
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (sender_id <> owner_id)
);

-- Unique index prevents multiple pending requests from the same user for the same listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_pending_booking
  ON booking_requests (sender_id, listing_id)
  WHERE status = 'pending';

-- ----------------------------------------------------------------------------
-- 8. CONNECTION REQUESTS (ROOMMATE MATCH REQUESTS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connection_requests (
  id VARCHAR(64) PRIMARY KEY,
  sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (sender_id <> receiver_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_pending_connection
  ON connection_requests (sender_id, receiver_id)
  WHERE status = 'pending';

-- ----------------------------------------------------------------------------
-- 9. SAVED ACCOMMODATIONS (BOOKMARKS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_accommodations (
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id VARCHAR(64) NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, listing_id)
);

-- ----------------------------------------------------------------------------
-- 10. SAVED ROOMMATES (FAVORITES)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_roommates (
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roommate_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, roommate_id),
  CHECK (user_id <> roommate_id)
);

-- ----------------------------------------------------------------------------
-- 11. REVIEWS (WITH STRICT FOREIGN KEY INTEGRITY)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(64) PRIMARY KEY,
  reviewer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL
    CHECK (target_type IN ('roommate', 'accommodation')),
  target_user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  target_accommodation_id VARCHAR(64) REFERENCES accommodations(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  interaction_key VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (target_type = 'roommate' AND target_user_id IS NOT NULL AND target_accommodation_id IS NULL)
    OR
    (target_type = 'accommodation' AND target_accommodation_id IS NOT NULL AND target_user_id IS NULL)
  )
);

-- ----------------------------------------------------------------------------
-- 12. CHAT CONVERSATIONS & MESSAGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(64) PRIMARY KEY,
  user1_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (user1_id < user2_id),
  UNIQUE (user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) PRIMARY KEY,
  conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 13. NOTIFICATIONS & PREFERENCES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  recipient_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  related_request_id VARCHAR(64),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  new_requests BOOLEAN NOT NULL DEFAULT TRUE,
  messages BOOLEAN NOT NULL DEFAULT TRUE,
  status_updates BOOLEAN NOT NULL DEFAULT TRUE,
  email_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  connection_requests BOOLEAN NOT NULL DEFAULT TRUE,
  connection_updates BOOLEAN NOT NULL DEFAULT TRUE,
  booking_updates BOOLEAN NOT NULL DEFAULT TRUE,
  review_updates BOOLEAN NOT NULL DEFAULT TRUE,
  match_recommendations BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 14. PRIVACY SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS privacy_settings (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  show_profile BOOLEAN NOT NULL DEFAULT TRUE,
  show_phone BOOLEAN NOT NULL DEFAULT FALSE,
  show_email BOOLEAN NOT NULL DEFAULT FALSE,
  show_budget BOOLEAN NOT NULL DEFAULT TRUE,
  show_lifestyle BOOLEAN NOT NULL DEFAULT TRUE,
  allow_requests BOOLEAN NOT NULL DEFAULT TRUE,
  allow_connection_requests BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 15. MODERATION (USER BLOCKS & REPORTS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_blocks (
  owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (owner_id, blocked_user_id),
  CHECK (owner_id <> blocked_user_id)
);

CREATE TABLE IF NOT EXISTS user_reports (
  id VARCHAR(64) PRIMARY KEY,
  reporter_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (reporter_id <> reported_user_id)
);

-- ============================================================================
-- PERFORMANCE & QUERY OPTIMIZATION INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_accommodations_city_rent ON accommodations(city, monthly_rent) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_accommodations_owner ON accommodations(owner_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_listing_status ON booking_requests(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_sender ON booking_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_owner ON booking_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_receiver ON connection_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_target_acc ON reviews(target_accommodation_id) WHERE target_type = 'accommodation';
CREATE INDEX IF NOT EXISTS idx_reviews_target_user ON reviews(target_user_id) WHERE target_type = 'roommate';
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);
