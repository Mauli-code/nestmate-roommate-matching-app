# NestMate Project Presentation Outline (12-Slide College Deck)

---

## Slide 1: Project Title & Team Details
- **Header**: NestMate — Roommate Matching & Student Accommodation Platform
- **Subtitle**: Full-Stack Mobile Application & Advanced PostgreSQL Database Engineering
- **Domain**: Relational Database Management Systems (RDBMS) / Web & Mobile Software Engineering
- **Stack**: React Native (Expo Router SDK 58), NestJS 11, PostgreSQL 18.4, native `pg` driver
- **Presenter / Team**: College Engineering Project Submission

---

## Slide 2: Problem Statement
- **Challenges in Student Housing**:
  - **Lifestyle Clashes**: Conflicts arising from non-aligned sleep cycles, cleanliness expectations, dietary choices, and smoking habits.
  - **Housing Rental Scams**: Misleading descriptions, non-existent amenities, and surprise security deposits.
  - **Flat-File Storage Inadequacies**: Legacy naive storage (`store.json`) suffers from race conditions, lack of referential integrity, and loss of state upon server restarts.
  - **Double-Booking Vulnerabilities**: Lack of row-level transaction locking causes multiple applicants to mistakenly secure the same room concurrently.

---

## Slide 3: Project Objectives
- **Key Objectives**:
  1. **Algorithmic Compatibility Engine**: Quantify roommate compatibility (0–100%) across 4 pillars: Budget (25%), Location (25%), Lifestyle (25%), and Habits (25%).
  2. **Verified Housing Inventory**: Showcase flats, PGs, and shared rooms across Indian metro tech hubs (Pune, Bangalore, Mumbai, Delhi) priced in ₹.
  3. **360° Virtual Room Tours**: Enable WebGL panoramic room walkthroughs (living room, bedroom, kitchen, balcony) directly within the app.
  4. **PostgreSQL Relational Engineering**: Build an enterprise 18-table schema in 3NF with connection pooling, parameterized queries, and ACID transaction safety.

---

## Slide 4: Technology Stack
- **Frontend Layer**:
  - React Native with **Expo SDK 58**
  - **Expo Router**: File-based stack and tab navigation
  - React Native WebView for WebGL HTML5 360° panorama rendering
  - `@react-native-async-storage/async-storage` for local bookmark caching
- **Backend API Layer**:
  - **NestJS 11** & Express platform
  - JWT (JSON Web Tokens) with cryptographic signature validation & token versioning
  - `bcryptjs` password hashing
  - Dual-mode storage engine (`STORAGE_MODE=postgres` vs `STORAGE_MODE=memory`)
- **Database Layer**:
  - **PostgreSQL 18.4** (`nestmate_db`)
  - Native `pg` connection pool with automatic connection recycling
  - Parameterized SQL queries preventing SQL injection

---

## Slide 5: System Architecture
- **Two-Tier Decoupled Architecture**:
  - Mobile Client communicates via RESTful JSON endpoints over HTTP.
  - Modular Backend architecture: Controllers $\to$ Services $\to$ Repositories.
  - Pluggable storage abstraction: Allows fast, isolated unit testing in memory mode (`npm test`) while running persistent database integration (`npm run test:all`) against PostgreSQL.
  - Strict input DTO validation and centralized error filters.

---

## Slide 6: Entity-Relationship (ER) Diagram
- **Schema Overview**:
  - **18 Tables**, 29 Foreign Key constraints, 25 Domain CHECK constraints.
  - Core Entities: `users`, `roommate_preferences`, `accommodations`, `amenities`, `virtual_tour_scenes`.
  - Social & Interaction Entities: `booking_requests`, `connection_requests`, `saved_accommodations`, `saved_roommates`, `conversations`, `messages`, `notifications`, `reviews`.
  - Preference & Safety Entities: `notification_preferences`, `privacy_settings`, `user_blocks`, `user_reports`.
  - All foreign keys enforce `ON DELETE CASCADE` to prevent orphaned child tuples.

---

## Slide 7: Database Design & Key Constraints
- **Relational Integrity Highlights**:
  - **Strict 1:1 Relationship**: `roommate_preferences.user_id` is both PK and FK referencing `users.id`.
  - **M:N Junction Tables**: `accommodation_amenities` resolves many-to-many catalog mapping with composite primary key `(accommodation_id, amenity_id)`.
  - **Anti-Reflexive CHECK Constraints**:
    - `CHECK (sender_id <> owner_id)` in `booking_requests` prevents self-booking.
    - `CHECK (sender_id <> receiver_id)` in `connection_requests`.
    - `CHECK (owner_id <> blocked_user_id)` in `user_blocks`.
  - **Canonical Chat Uniqueness**: `CHECK (user1_id < user2_id)` and `UNIQUE (user1_id, user2_id)` prevents reciprocal conversation duplication.

---

## Slide 8: Normalization Analysis
- **1NF (First Normal Form)**:
  - All attributes atomic (no comma-separated amenity lists; separate `amenities` table).
- **2NF (Second Normal Form)**:
  - In 1NF and no partial dependencies on composite keys (`accommodation_amenities`, `saved_accommodations`).
- **3NF (Third Normal Form)**:
  - In 2NF and no transitive functional dependencies (host contact info lives solely in `users`, linked by `owner_id`).
- **BCNF (Boyce-Codd Normal Form)**:
  - For every functional dependency $X \to Y$, determinant $X$ is a superkey (e.g., `id` and `email` in `users`).

---

## Slide 9: Advanced SQL Implementation
- **Verified SQL Suite (`npm run db:evaluate`)**:
  - **Multi-Table JOINs**: Aggregating property amenities using `string_agg()`.
  - **Group-Level Filtering**: `HAVING count(*) >= 3` for high-density rental cities.
  - **Multi-Stage CTEs (WITH)**: Computing composite user activity scores from bookings and chat messages.
  - **Window Functions**: `DENSE_RANK()` and `ROW_NUMBER()` partitioned by city to rank listing affordability.
  - **Market Intelligence**: Comparing average seeker budget vs market rent to evaluate affordability gaps.

---

## Slide 10: Application Features & User Experience
- **Mobile Experience (5 Main Tabs)**:
  - **Home**: Smart match highlights, greeting, and category shortcuts.
  - **Discover**: Algorithmic roommate list with compatibility score badges and multi-criteria filters.
  - **Places**: Verified flats, PGs, and shared rooms with price in ₹ and furnishing tags.
  - **Saved**: Segmented control switching between saved roommates and favorited properties.
  - **Profile**: Full bio, lifestyle toggles, habit preferences, and session controls.
- **Interactive 360° Virtual Tour**:
  - Real-time WebGL panoramic viewer supporting room switching (Living Room $\leftrightarrow$ Bedroom $\leftrightarrow$ Kitchen).

---

## Slide 11: Testing & Verification Results
- **Automated Test Results (100% Pass Rate)**:
  - **Backend Unit Tests**: 156 passed, 0 failed, 3 skipped (memory mode).
  - **Mobile Client Tests**: 43 passed, 0 failed.
  - **PostgreSQL Stage 2/2B Integration**: 14 passed, 0 failed.
  - **20-Step End-to-End User Journey**: 20 passed, 0 failed.
  - **Database SQL Evaluation Suite**: 15 passed, 0 failed.
  - **Total Verified Tests**: **251 tests executed with 0 failures**.

---

## Slide 12: Conclusion & Future Scope
- **Conclusion**:
  - Successfully engineered a production-grade full-stack platform combining mobile UX with an ACID-compliant PostgreSQL database.
  - Solved flat-file fragility, prevented double-booking race conditions with row-level locks, and established full 3NF relational normalization.
- **Future Enhancements**:
  - **PostGIS Geospatial Extension**: Distance-based perimeter search around campus coordinates.
  - **PostgreSQL Full-Text Search**: Inverted indexes (`tsvector` & GIN) for intelligent keyword queries.
  - **High-Throughput Connection Pooling**: Integration with PgBouncer for production read-replicas.
