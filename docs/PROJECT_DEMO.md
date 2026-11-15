# NestMate Live Project Demonstration Script
### 10–15 Minute College Evaluation & Presentation Guide

---

## Demonstration Overview & Timing

| Step | Segment | Target Duration | Focus Area |
| :---: | :--- | :---: | :--- |
| **1** | Introduction & Problem Statement | 1.5 min | Real-world problem, target student audience |
| **2** | Tech Stack & System Architecture | 1.5 min | React Native Expo, NestJS, PostgreSQL 18.4 |
| **3** | Mobile App Live Demonstration | 4.0 min | Registration, roommate matching, places, 360° VR tour |
| **4** | PostgreSQL Database & Relational Schema | 3.0 min | 18 tables, ER diagram, 3NF normalization |
| **5** | Advanced SQL & ACID Transactions | 3.0 min | 15 SQL query suite, concurrency locking, tests |
| **6** | Conclusion & Viva Summary | 1.0 min | Final wrap-up and Q&A readiness |

---

## Preparation: Pre-Demo Setup Commands

Open two terminal windows:

### Terminal 1: Start Backend (Port 3000)
```bash
cd /Users/krishnayadav/Downloads/nestmate-roommate-matching-app-main
node --env-file=.env src/main.js
```
*Expected Output*: `[NestApplication] Nest application successfully started`

### Terminal 2: Start Mobile App (Expo SDK 58)
```bash
cd /Users/krishnayadav/Downloads/nestmate-roommate-matching-app-main/mobile
npx expo start
```
*Action*: Press `w` to open in browser at `http://localhost:8081` (or scan QR code with Expo Go on your mobile phone).

---

## Step-by-Step Demonstration Walkthrough

### 1. Project Introduction & Problem Statement (1.5 mins)
- **Speaker Script**:
  > *"Respected professors and evaluators, today we present **NestMate**, a roommate matching and student accommodation platform designed to eliminate the friction, lifestyle clashes, and rental fraud that students and young professionals encounter in urban tech centers like Pune, Bangalore, Mumbai, and Delhi.  
  > Unlike generic classifieds, NestMate pairs students through a quantitative 4-pillar compatibility algorithm (Budget, Location, Lifestyle, and Habits) and showcases verified flats, PGs, and shared rooms complete with interactive 360° virtual room tours."*

### 2. Technology Stack & Architecture (1.5 mins)
- **Speaker Script**:
  > *"Our system is architected as an enterprise two-tier application:  
  > 1. **Frontend**: React Native with Expo Router SDK 58 for cross-platform iOS, Android, and Web interfaces.  
  > 2. **Backend**: NestJS 11 modular microservice framework using JWT authentication and bcrypt password hashing.  
  > 3. **Database**: PostgreSQL 18.4 utilizing connection pooling, parameterized queries, and 18 normalized relational tables enforcing ACID transactions."*

### 3. Mobile App Live Demonstration (4 mins)

#### A. User Registration & Onboarding
- Navigate to **Create an account**.
- Register a student user (e.g., `rohit@example.com`, Password: `Password123!`).
- Demonstrate onboarding: Select occupation (*Software Engineering Intern*), city (*Pune*), budget range (*₹12,000 - ₹20,000*), sleep cycle (*night-owl*), dietary habits (*vegetarian*), and cleanliness (*high*).
- Tap **Save Preferences**. The account is created and stored in PostgreSQL `users` and `roommate_preferences` tables.

#### B. Algorithmic Roommate Matching
- Tap the **Discover** tab.
- Explain the match list: Show how compatibility scores (e.g. 95%, 85%) are computed.
- Tap a candidate profile (e.g. *Aarav Sharma*): Show the 4-pillar breakdown bars (Budget Match, Location Match, Lifestyle Match, Habits Match).
- Tap the bookmark icon to save to favorites (`saved_roommates` table).

#### C. Accommodation Discovery ("Places")
- Tap the **Places** tab.
- Show realistic listings across Indian cities with prices in ₹.
- Filter by City: Select **Pune** $\to$ observe list update.
- Select listing **prop-12** (*Modern 2BHK Flatshare in Kothrud*). Show specifications, deposit, amenities chips, and host details.

#### D. 360° Virtual Room Tour
- On the property detail page, tap **"Explore 360° Virtual Tour"**.
- Demonstrate the WebGL panoramic scene viewer:
  - Drag to pan $360^\circ$ around the living room.
  - Tap the scene switcher to transition to the Master Bedroom and Kitchen.
  - Highlight that scene coordinates and hotspots are retrieved from PostgreSQL `virtual_tour_scenes`.

#### E. Booking & Social Requests
- Tap **"Request to Book"** $\to$ select move-in date and message.
- Tap the **Saved** tab $\to$ show segmented control switching between bookmarked roommates and saved properties.

---

### 4. PostgreSQL Relational Database & Normalization (3 mins)

Switch to Terminal:

```bash
# Verify database connection
npm run db:check
```

- Open and display [`docs/ER_DIAGRAM.md`](file:///Users/krishnayadav/Downloads/nestmate-roommate-matching-app-main/docs/ER_DIAGRAM.md).
- **Key Highlights to Present to Evaluators**:
  1. **18 Tables**: Show entity coverage (`users`, `roommate_preferences`, `accommodations`, `amenities`, `virtual_tour_scenes`, `booking_requests`, etc.).
  2. **Strict 1:1 Relationship**: Show `roommate_preferences.user_id` as both Primary Key and Foreign Key pointing to `users(id)`.
  3. **Many-to-Many Resolution**: Explain `accommodation_amenities` junction table resolving the M:N relationship between properties and the global amenities catalog.
  4. **Normalization Proof**:
     - *1NF*: Atomic values, no repeating amenity strings.
     - *2NF*: No partial key dependencies in composite key tables.
     - *3NF*: No transitive dependencies (owner contact info is stored in `users`, not duplicated in `accommodations`).
     - *BCNF*: Every determinant is a candidate key.

---

### 5. Advanced SQL Queries & ACID Transactions (3 mins)

Execute the live evaluation suite in front of evaluators:

```bash
npm run db:evaluate
```

- **Explain the Output**:
  - Show query 1: City and budget filtering (`WHERE city = 'Pune' AND monthly_rent <= 20000`).
  - Show query 3: Multi-table M:N join aggregating amenity strings with `string_agg()`.
  - Show query 8: Multi-stage Common Table Expression (CTE) scoring user engagement.
  - Show query 9: Window functions `DENSE_RANK()` and `ROW_NUMBER() OVER (PARTITION BY city)`.
  - Show query 14: Market supply vs demand budget liquidity analysis.

#### Concurrency & Row-Level Locking
- Show evaluators [`database/transactions/03_concurrent_booking.sql`](file:///Users/krishnayadav/Downloads/nestmate-roommate-matching-app-main/database/transactions/03_concurrent_booking.sql).
- Explain how `SELECT ... FOR UPDATE` locks the target accommodation row during booking acceptance to prevent concurrent double-booking.

---

### 6. Automated Verification Test Suite (1 min)

Demonstrate automated test coverage:

```bash
# 1. Run unit test suite (156 tests passing)
npm test

# 2. Run mobile test suite (43 tests passing)
npm run test:mobile

# 3. Run PostgreSQL integration tests (14 tests passing)
node --env-file=.env --test src/database/postgres-stage2-integration.test.js

# 4. Run 20-step End-to-End User Lifecycle test (20 tests passing)
node --env-file=.env --test src/database/e2e-user-journey.test.js
```

---

## 7. Conclusion & Viva Defense Summary (1 min)

- **Concluding Statement**:
  > *"In conclusion, NestMate demonstrates a complete, production-ready full-stack application backed by rigorous database engineering. We have achieved 100% test pass rate across 251 tests, eliminated flat-file volatility with ACID-compliant PostgreSQL transactions, and delivered a seamless cross-platform mobile experience with 360° virtual room tours. We are now ready for your questions."*
