# NestMate — Smart Roommate Matching & Accommodation Platform
### Final College Project Submission — Full-Stack Engineering & PostgreSQL Database Architecture

NestMate is an enterprise-grade full-stack mobile and web application designed to help university students and young professionals discover compatible roommates and verified housing accommodations (flats, PGs, and shared rooms). The platform combines a multi-factor algorithmic compatibility engine, interactive 360° virtual room tours, and an ACID-compliant PostgreSQL relational database.

---

## 1. Project Overview

Finding safe, affordable student housing and compatible roommates in major Indian tech hubs (Pune, Bengaluru, Mumbai, Delhi) is traditionally an unorganized, high-friction process. NestMate replaces scattered classifieds and unreliable social media groups with a centralized platform that pairs seekers based on objective lifestyle compatibility while listing verified properties with transparent pricing, amenity catalogs, and immersive virtual tours.

---

## 2. Problem Statement

Seekers in urban student hubs face significant challenges:
* **Lifestyle & Habit Clashes**: Incompatible sleep cycles (night-owls vs early-birds), cleanliness standards, dietary restrictions (vegetarian/vegan/non-veg), and smoking/drinking habits often lead to broken leases and personal friction.
* **Unverified Listings & Rental Fraud**: Misleading property descriptions, hidden security deposits, and non-existent amenities.
* **Data Fragility in Naive Systems**: Unstructured flat JSON files (`store.json`) or transient in-memory stores lose state upon server restarts and lack transactional integrity.
* **Concurrency Conflicts**: Simultaneous booking attempts by multiple applicants often lead to double-booking when the database lacks row-level locking.

---

## 3. Project Objectives

1. **4-Pillar Algorithmic Compatibility Engine**: Compute a quantitative 0–100% compatibility score across Budget (25%), Location (25%), Lifestyle (25%), and Habits (25%) with transparent match explanations.
2. **Verified Housing Discovery**: Provide detailed listings across Indian metro cities with monthly rent in ₹, security deposit, room counts, furnishing details, and house rules.
3. **Interactive 360° Virtual Room Tours**: Allow prospective tenants to inspect panoramic WebGL scenes of bedrooms, living rooms, and kitchens before scheduling a visit.
4. **Relational Database Engineering**: Establish an 18-table normalized (3NF/BCNF) PostgreSQL schema with connection pooling, foreign key integrity (`ON DELETE CASCADE`), domain CHECK constraints, and row-level concurrency locking (`SELECT ... FOR UPDATE`).
5. **High-Assurance Automated Testing**: Maintain 100% test pass rate across unit, integration, mobile, end-to-end lifecycle, and SQL evaluation suites.

---

## 4. Main Features

### A. Roommate Discovery & Matching
* **Smart Match Score**: 0–100% weighted score breakdown with clear compatibility highlights.
* **Dynamic Search & Filtering**: Filter candidates by maximum budget, preferred neighborhood, sleep cycle, food habits, cleanliness, smoking, and pet tolerance.
* **Social Connections**: Send, accept, reject, or cancel connection requests without prematurely revealing private phone numbers.
* **Favorites / Bookmarks**: Save candidate profiles with persistent database storage.

### B. Accommodation Management ("Places")
* **Comprehensive Listings**: Verified flats, PGs, and shared rooms priced in INR (₹).
* **Multi-Factor Filters**: Filter by city (Pune, Bengaluru, Mumbai, Delhi), rent range, and accommodation type.
* **Atomic Booking Requests**: Request to book with move-in date selection and status tracking (pending, accepted, rejected, cancelled).
* **Host Dashboard & Concurrency Safety**: Host booking acceptance atomically locks accommodation records, decrements available rooms, and automatically rejects competing pending requests.

### C. 360° Virtual Room Tour
* **WebGL Panoramic Viewer**: Seamless 360-degree rotation (yaw, pitch) across multiple rooms.
* **Interactive Scene Switching**: Transition between Living Room, Master Bedroom, Balcony, and Kitchen.
* **Database-Driven Hotspots**: Scene orientation and interactive navigation hotspots stored in PostgreSQL `JSONB`.

### D. Communication & Safety
* **1-on-1 In-App Messaging**: Threaded messaging with canonical conversation uniqueness (`CHECK user1_id < user2_id`).
* **Privacy & Notification Controls**: Granular user toggles for email alerts, push notifications, and phone/email concealment.
* **Community Moderation**: User blocking and categorized moderation report filing.

---

## 5. Technology Stack

### Mobile Frontend (`mobile/`)
* **Framework**: React Native with **Expo SDK 58**
* **Routing**: **Expo Router** (file-based stack and bottom tab navigation)
* **Language**: JavaScript (ES Modules)
* **360° Panorama Engine**: `react-native-webview` rendering an HTML5 WebGL three.js panoramic canvas
* **Local Persistence**: `@react-native-async-storage/async-storage` for offline caching and fast UI hydration
* **Styling**: Centralized design system (`COLORS`, `RADII`, `TYPOGRAPHY`, `SHADOWS`)

### Backend API (`src/`)
* **Framework**: **NestJS 11** with Express HTTP platform
* **Authentication**: JSON Web Tokens (`jsonwebtoken`) with `bcryptjs` password hashing and token invalidation
* **Database Driver**: Native `pg` (node-postgres) with connection pooling and parameterized queries
* **Architecture**: Domain-Driven Modular Design (Controllers, Services, Repositories, Guards)

### Database (`database/`)
* **RDBMS**: **PostgreSQL 18.4** (`nestmate_db`)
* **Schema Design**: 18 normalized tables in Third Normal Form (3NF)
* **Integrity Enforcement**: 29 Foreign Keys (`ON DELETE CASCADE`), 25 Domain CHECK constraints, 35 B-Tree indexes

---

## 6. System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               NestMate Mobile Client                   │
│         (React Native • Expo Router SDK 58)            │
│                                                        │
│  [Home]  [Discover]  [Places]  [Saved]  [Profile]      │
└──────────────┬─────────────────────────┬───────────────┘
               │ HTTP / JSON             │ Local Storage Cache
               ▼                         ▼
┌──────────────────────────────┐  ┌──────────────────────┐
│     NestJS Backend API       │  │ AsyncStorage Cache   │
│   (14 Domain Modules)        │  └──────────────────────┘
│                              │
│  • Auth & User Management    │
│  • 4-Pillar Matching Engine  │
│  • Accommodations & Bookings │
│  • Chat, Reviews, Dashboard  │
│  • 360° Virtual Tour Engine  │
└──────────────┬───────────────┘
               │
       ┌───────┴───────┐
       │ STORAGE_MODE  │
       └───┬───────┬───┘
           │       │
 STORAGE_MODE=memory│       │ STORAGE_MODE=postgres
           ▼       ▼
┌──────────────┐ ┌────────────────────────────────────────┐
│ In-Memory    │ │ PostgreSQL 18.4 (nestmate_db)          │
│ Repository   │ │ • Native Connection Pool (pg.Pool)     │
│ (Unit Tests) │ │ • Parameterized SQL ($1, $2, ...)      │
└──────────────┘ │ • 18 Tables in 3NF / BCNF              │
                 │ • Row-Level Locking (SELECT FOR UPDATE)│
                 └────────────────────────────────────────┘
```

---

## 7. Database Architecture

The relational schema consists of **18 tables**:
1. `users`: Master user account records, credentials, and profile bio.
2. `roommate_preferences`: Strict 1:1 user matching profile (budget, lifestyle, habits).
3. `accommodations`: Housing inventory, rental rates, room counts, and host references.
4. `amenities`: Normalized catalog of property amenities.
5. `accommodation_amenities`: Composite M:N junction table (`accommodation_id`, `amenity_id`).
6. `virtual_tour_scenes`: 360° panoramic rooms with JSONB navigation hotspots.
7. `booking_requests`: Application records with anti-self-booking CHECK constraints.
8. `connection_requests`: Roommate match invitations.
9. `saved_accommodations`: Property bookmarks (composite PK: `user_id`, `listing_id`).
10. `saved_roommates`: Roommate bookmarks (composite PK: `user_id`, `roommate_id`).
11. `reviews`: Polymorphic reviews for roommates or accommodations with CHECK constraint.
12. `conversations`: Canonical 1-on-1 chat rooms with `CHECK (user1_id < user2_id)`.
13. `messages`: Threaded in-app chat log.
14. `notifications`: Real-time user alert records.
15. `notification_preferences`: 1:1 user toggle preferences.
16. `privacy_settings`: 1:1 user visibility controls.
17. `user_blocks`: Bidirectional safety blocks with anti-reflexive checks.
18. `user_reports`: Community moderation tickets with category taxonomy.

For the comprehensive Entity-Relationship diagram, see [**docs/ER_DIAGRAM.md**](docs/ER_DIAGRAM.md).  
For the complete technical report, see [**docs/DATABASE_PROJECT_REPORT.md**](docs/DATABASE_PROJECT_REPORT.md).

---

## 8. PostgreSQL Setup

### Prerequisites
* **PostgreSQL**: Version 14 or higher installed (PostgreSQL 18.4 verified on port 5432)
* PostgreSQL service running:
```bash
# macOS (Homebrew)
brew services start postgresql@18
```

### Create the Database
```bash
# Open psql terminal
psql -U postgres -h localhost -c "CREATE DATABASE nestmate_db;"
psql -U postgres -h localhost -c "CREATE DATABASE nestmate_test_db;"
```

---

## 9. Installation Instructions

### Step 1: Clone the Repository
```bash
git clone https://github.com/Mauli-code/nestmate-roommate-matching-app.git
cd nestmate-roommate-matching-app
```

### Step 2: Install Backend Dependencies
```bash
npm install
```

### Step 3: Install Mobile Client Dependencies
```bash
cd mobile
npm install
cd ..
```

---

## 10. Environment Variable Configuration

### Backend Configuration (`.env`)
Create a `.env` file in the project root:
```env
PORT=3000
JWT_SECRET=nestmate-jwt-secret-for-demo
STORAGE_MODE=postgres
DATABASE_URL=postgres://postgres:postgres@localhost:5432/nestmate_db
```
*(For running unit tests without PostgreSQL, set `STORAGE_MODE=memory`)*

### Mobile Client Configuration (`mobile/.env`)
Create a `.env` file in the `mobile/` directory:
```env
# Web Browser / iOS Simulator:
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# Android Emulator:
# EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000

# Physical Device via Local Wi-Fi:
# EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LOCAL_IP>:3000
```

---

## 11. Backend Startup Commands

Verify database connectivity:
```bash
npm run db:check
```

Start the NestJS backend:
```bash
node --env-file=.env src/main.js
# Or using npm:
npm start
```
*The backend starts at `http://localhost:3000`.*  
Verify health check:
```bash
curl http://localhost:3000/api/health
```

---

## 12. Mobile Startup Commands

From the project root:
```bash
cd mobile
npx expo start --clear
```

### Target Options:
* **Web Browser**: Press `w` in terminal or open `http://localhost:8081` in Chrome/Safari.
* **Physical Device (Expo Go)**: Scan terminal QR code with Expo Go (Android) or Camera app (iOS).
* **iOS Simulator**: Press `i` (macOS with Xcode).
* **Android Emulator**: Press `a` (Android Studio).

---

## 13. Database Migration Commands

Apply the 18-table relational schema to `nestmate_db`:
```bash
npm run db:migrate
```
*Executes `database/schema.sql` idempotently.*

---

## 14. Database Seeding Commands

Populate `nestmate_db` with realistic demonstration data (14 users, 16 accommodations, 64 amenity links, 6 virtual tour scenes, reviews, and bookings):
```bash
npm run db:seed
```

---

## 15. Testing & Evaluation Commands

### 1. Run Complete Automated Test Suite (251 Tests)
```bash
# 1. Run backend unit tests (156 pass in memory mode)
npm test

# 2. Run mobile client tests (43 pass)
npm run test:mobile

# 3. Run PostgreSQL Stage 2/2B integration tests (14 pass)
node --env-file=.env --test src/database/postgres-stage2-integration.test.js

# 4. Run 20-step End-to-End User Journey test (20 pass)
# Ensure backend is running in a separate terminal: node --env-file=.env src/main.js
node --env-file=.env --test src/database/e2e-user-journey.test.js
```

### 2. Run SQL Evaluation Suite (15 Advanced Queries)
```bash
npm run db:evaluate
```
*Executes JOINs, CTEs, Window functions, aggregations, and subqueries against `nestmate_db`.*

---

## 16. Backend REST API Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Service health status and uptime | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate with email/password (returns JWT) | No |
| `POST` | `/api/auth/logout` | Revoke the active JWT token | Yes (Bearer) |
| `GET` | `/api/auth/profile` | Retrieve authenticated user profile | Yes (Bearer) |
| `PATCH`| `/api/auth/profile` | Update profile bio and lifestyle attributes | Yes (Bearer) |
| `PUT` | `/api/matches/:profileId/preferences` | Update matching preferences | Yes (Bearer) |
| `GET` | `/api/matches?profileId=:id` | Paginated ranked compatible roommates | Yes (Bearer) |
| `GET` | `/api/accommodations` | Filtered accommodation listings | Yes (Bearer) |
| `GET` | `/api/accommodations/:id` | Accommodation listing detail by ID | Yes (Bearer) |
| `POST` | `/api/booking-requests` | Send booking request for accommodation | Yes (Bearer) |
| `GET` | `/api/booking-requests/sent` | List booking requests sent by user | Yes (Bearer) |
| `GET` | `/api/booking-requests/received`| List booking requests received by host | Yes (Bearer) |
| `PATCH`| `/api/booking-requests/:id/accept` | Accept booking atomically (row lock) | Yes (Bearer) |
| `POST` | `/api/connection-requests/:id` | Send roommate connection request | Yes (Bearer) |
| `GET` | `/api/connection-requests/sent` | List sent connection requests | Yes (Bearer) |
| `GET` | `/api/connection-requests/received`| List received connection requests | Yes (Bearer) |
| `GET` | `/api/favorites` | List user's bookmarked favorite roommates | Yes (Bearer) |
| `POST` | `/api/favorites/:id` | Add roommate to favorites | Yes (Bearer) |
| `DELETE`| `/api/favorites/:id` | Remove roommate from favorites | Yes (Bearer) |
| `GET` | `/api/conversations` | List user conversations | Yes (Bearer) |
| `GET` | `/api/conversations/:id/messages` | Retrieve threaded chat messages | Yes (Bearer) |
| `POST` | `/api/conversations/:id/messages` | Send in-app chat message | Yes (Bearer) |
| `GET` | `/api/notifications` | Retrieve unread user notifications | Yes (Bearer) |
| `GET` | `/api/dashboard` | Activity summary and profile completion percentage | Yes (Bearer) |

---

## 17. 360-Degree Virtual Room Tour Feature

NestMate includes a built-in WebGL panoramic virtual tour engine:
* **Multi-Room Scene Navigation**: Prospective tenants can transition between Living Room, Bedroom, Kitchen, and Balcony.
* **Touch & Mouse Pan Controls**: Users can drag to pan 360° horizontally (yaw) and vertically (pitch) with auto-rotation option.
* **Database Integration**: Each scene is stored in `virtual_tour_scenes` referencing the parent accommodation, with interactive hotspot overlays stored in PostgreSQL `JSONB`.

---

## 18. UI Screenshots & Visual Inspection

Live demonstration recordings and screenshots can be generated directly using the mobile web view (`http://localhost:8081`):
* **Home Screen**: Active match counter, smart match highlight cards, and category pills.
* **Discover Screen**: Compatibility percentage badges and multi-criteria lifestyle filter modal.
* **Places Screen**: Accommodation cards with rent in ₹, availability tags, and 360° Virtual Tour badges.
* **Virtual Tour Viewer**: Full-screen WebGL spherical viewer with room switcher tabs.
* **Saved Screen**: Segmented control switching between saved roommates and saved properties.
* **Profile Screen**: Personal details, rupee budget slider, habit choices, and session management.

---

## 19. Known Limitations

1. **Local Media Storage**: Profile photos and static panorama assets currently use local filesystem paths in `/uploads` and `mobile/assets/` rather than a cloud bucket (Amazon S3 / Google Cloud Storage).
2. **Push Notifications**: Notification preferences and event generation are fully implemented in PostgreSQL; mobile delivery operates via in-app alert toasts rather than Apple APNs / Firebase Cloud Messaging (FCM).
3. **Geospatial Distance Queries**: Location matching currently relies on normalized city and neighborhood strings rather than PostGIS geospatial radius coordinates (`ST_DWithin`).

---

## 20. Future Improvements

1. **PostGIS Integration**: Add spatial indexing to support radius-based perimeter filtering (e.g. "Find PGs within 1.5 km of Pune University").
2. **PostgreSQL Full-Text Search (tsvector)**: Implement GIN-indexed natural language search with stemming and ranking across accommodation titles and descriptions.
3. **WebRTC Video Calling**: Enable secure, in-app video interviews between matched roommates before booking confirmations.
4. **Automated Rent Split & Payment Gateway**: Integrate UPI/Stripe payment gateway for automated security deposit escrow and monthly rent collection.
