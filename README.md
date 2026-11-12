# NestMate — Smart Roommate Matching & Accommodation Application

NestMate is a modern full-stack mobile application designed to help students and working professionals find compatible roommates based on budget, location, lifestyle, habits, and preferences, while discovering verified accommodation options (flats, PGs, and shared rooms).

---

## 1. Problem Statement

Finding a suitable roommate or shared housing in urban centers and near university campuses is traditionally an unorganized, high-friction process. Seekers face:
* Mismatched lifestyle expectations (cleanliness, sleep cycles, dietary and smoking habits).
* Incompatible budget splits and geographic requirements.
* Unverified listings and scattered communication channels.
* Cluttered, unfiltered classifieds with no quantitative measure of roommate compatibility.

---

## 2. Project Objectives

1. **Algorithmic Compatibility Matching**: Automatically compute a multi-factor compatibility score (0–100%) between candidates across four pillars (Budget, Location, Lifestyle, and Habits).
2. **Comprehensive Accommodation Discovery**: Enable seekers to discover verified PGs, flats, private rooms, and shared apartments with detailed specs (rent in ₹, furnishing, BHK, amenities, house rules).
3. **Structured Social Connection**: Provide match requests, connection requests, and booking inquiries without exposing private contact info prematurely.
4. **Intuitive Mobile Experience**: Deliver a responsive, native-feeling mobile app built on React Native & Expo Router with persistent bookmarks, real-time search, multi-factor filtering, and customizable profile preferences.

---

## 3. Technology Stack

### Mobile Frontend (`mobile/`)
* **Framework**: React Native with **Expo SDK 58**
* **Routing**: **Expo Router** (file-based navigation with tab bar and nested stack routes)
* **Language**: JavaScript (ES Modules)
* **Styling**: React Native `StyleSheet` with centralized design tokens (`COLORS`, `RADII`, `TYPOGRAPHY`, `SHADOWS`)
* **Icons**: `@expo/vector-icons` (Ionicons)
* **Persistence**: `@react-native-async-storage/async-storage` for saved properties, bookmarked roommates, and local session profile state
* **Web Bundling**: `react-native-web` for cross-platform browser support

### Backend API (`src/`)
* **Framework**: **NestJS 11** with `@nestjs/platform-express` HTTP driver
* **Architecture**: Modular Domain-Driven Design (Controllers, Services, In-Memory Repositories, Guards)
* **Security & Auth**: `jsonwebtoken` (JWT), `bcryptjs` password hashing, token revocation, account lifecycle guards
* **CORS**: Enabled for seamless cross-origin requests from web and mobile clients
* **Testing**: Node.js built-in test runner (`node:test` and `node:assert/strict`)

---

## 4. Project Architecture

NestMate uses a decoupled, clean two-tier architecture:

```text
┌────────────────────────────────────────────────────────┐
│               NestMate Mobile Client                   │
│   (Expo Router • 5 Tabs • Dynamic Stack Routes)        │
│                                                        │
│  [Home]  [Discover]  [Places]  [Saved]  [Profile]      │
└──────────────┬─────────────────────────┬───────────────┘
               │ HTTP / JSON             │ Local Storage
               ▼                         ▼
┌──────────────────────────────┐  ┌──────────────────────┐
│     NestJS Backend API       │  │ AsyncStorage Cache   │
│  (14 Modules • Controllers)  │  │ - Saved Properties   │
│                              │  │ - Bookmarked Matches │
│  • Auth & User Management    │  │ - Sent Requests      │
│  • 4-Pillar Matching Engine  │  │ - Edited Profile     │
│  • Accommodations & Bookings │  └──────────────────────┘
│  • Favorites & Connections   │
│  • Chat, Reviews, Dashboard  │
│  • Health Check API          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ In-Memory Repository Layer   │
│ (Seeded Demo Datasets)       │
└──────────────────────────────┘
```

---

## 5. Folder Structure

```text
nestmate-roommate-matching-app-main/
├── src/                          # NestJS Backend Modules
│   ├── main.js                   # Server bootstrap & CORS configuration
│   ├── app.module.js             # Root module aggregating all domain modules
│   ├── health/                   # Health-check endpoint (/api/health)
│   ├── auth/                     # JWT authentication, register, login, photo upload
│   ├── matching/                 # Compatibility scoring, ranking & profile repository
│   ├── accommodations/           # Accommodation listings, filters & recommendations
│   ├── booking-requests/         # Booking inquiry workflow
│   ├── connection-requests/      # Roommate connection workflow
│   ├── favorites/                # Roommate favorites API
│   ├── chat/                     # In-app messaging & blocking controls
│   ├── dashboard/                # User metrics & profile completion statistics
│   ├── notifications/            # Notification center & preference controls
│   ├── privacy/                  # Profile visibility & field concealment
│   ├── moderation/               # User reporting & safety blocks
│   ├── reviews/                  # Roommate & accommodation rating reviews
│   └── search/                   # Global multi-parameter seeker search
│
├── mobile/                       # React Native Mobile Application (Expo SDK 58)
│   ├── app/                      # Expo Router navigation routes
│   │   ├── _layout.js            # Root Stack layout
│   │   ├── index.js              # Entry redirect to (tabs)
│   │   ├── (tabs)/               # Bottom tab navigator
│   │   │   ├── _layout.js        # Tab configuration (Home, Discover, Places, Saved, Profile)
│   │   │   ├── index.js          # Home screen (Greeting, Stats, Smart Match Overview)
│   │   │   ├── discover.js       # Roommate discovery (Search, Sort, Filters)
│   │   │   ├── accommodations.js # Accommodation listings (PGs, Flats, Rooms)
│   │   │   ├── saved.js          # Segmented saved bookmarks (Roommates & Properties)
│   │   │   └── profile.js        # User profile, preferences editor & logout
│   │   ├── roommate/[id].js      # Roommate details & compatibility breakdown
│   │   └── property/[id].js      # Accommodation property details & contact CTA
│   │
│   ├── src/
│   │   ├── api/                  # Backend REST API client services
│   │   ├── components/           # Reusable UI component library (13 components)
│   │   ├── constants/theme.js    # Design system palette, typography, radii, spacing
│   │   ├── data/mockData.js      # Seeded realistic datasets (users, roommates, properties)
│   │   ├── hooks/                # Custom hooks (useMatchRequests, useSavedProperties, useSavedRoommates)
│   │   └── services/             # Client persistence and backend fallback services
│   └── test/                     # Mobile automated journey verification tests
│
├── .env.example                  # Backend environment variable template
├── mobile/.env.example           # Mobile client environment variable template
├── package.json                  # Root backend scripts & dependencies
└── README.md                     # Project documentation
```

---

## 6. Features Overview

### A. Mobile Application Features
* **Home Screen**: Personalized greeting, live active match counts, Smart Match explanation card, horizontal top roommate carousel, and quick category pills.
* **Roommate Discovery**: Instant keyword search (name, role, area, vibe), horizontal sorting pills (Highest Match, Budget Asc/Desc, Location), multi-criteria filter modal (Budget, Sleep, Cleanliness, Smoking, Pets), and pull-to-refresh.
* **Roommate Profile Details**: Profile hero image, verified status, 4-pillar compatibility breakdown bars, lifestyle tags, habit preferences, match request modal action, and persistent bookmarking.
* **Accommodation Listings ("Places")**: Dedicated listings for 10 realistic properties across Indian metro hubs (Bangalore, Mumbai, Delhi, Hyderabad, Pune, Noida, Chennai). Includes rent in ₹, property type (PG, Flat, Shared Room, Private Room), BHK, furnishing chips, availability indicator, search bar, sort selector, and filter modal.
* **Property Details**: Hero image, full street address, specifications grid (BHK, baths, deposit, furnishing), description, amenity chips (WiFi, AC, Power Backup, Gym), house rules, and fixed bottom "Contact Owner" CTA.
* **Segmented Saved Screen**: Segmented control switching between **Bookmarked Roommates & Match Requests** and **Saved Accommodation Properties**, backed by persistent device storage (`AsyncStorage`).
* **Profile & Preferences Editor**: Complete profile screen showing personal details, housing preferences, lifestyle habits, notification toggles, privacy toggles, an interactive **Edit Preferences Modal**, and session reset/logout.

### B. Backend API Features
* **Compatibility Scoring Engine**: Quantitative 0–100% calculation factoring budget proximity (25%), location match (25%), sleep/cleanliness alignment (25%), and smoking/pets habits (25%) with human-readable match explanations.
* **Authentication**: User registration, login with bcrypt password comparison, JWT token issuance, profile editing, photo upload, and account deactivation/deletion requests.
* **Connection & Match Requests**: Create, list sent, list received, accept, reject, and cancel pending requests.
* **Accommodation Management**: CRUD endpoints for housing listings with suitability scoring and recommendations.
* **Health Check**: High-availability health status endpoint at `/api/health`.

---

## 7. Installation Instructions (Fresh Clone)

### Prerequisites
* **Node.js**: v18.0.0 or newer (Node v20+ / v24 verified)
* **npm**: v9.0.0 or newer
* **Expo Go**: Available on iOS App Store & Android Google Play Store (for physical phone testing)

### Step 1: Clone the repository
```bash
git clone https://github.com/Mauli-code/nestmate-roommate-matching-app.git
cd nestmate-roommate-matching-app
```

### Step 2: Install Root & Backend Dependencies
```bash
npm install
```

### Step 3: Install Mobile Dependencies
```bash
cd mobile
npm install
cd ..
```

---

## 8. Backend Startup Instructions

Start the NestJS backend from the repository root:

```bash
npm start
```

The backend starts on port 3000:
```text
[Nest] LOG [NestApplication] Nest application successfully started
```

To verify the backend is running, query the health-check endpoint:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "nestmate-backend",
  "timestamp": "2026-11-12T09:00:07.236Z",
  "uptime": 12.34
}
```

---

## 9. Mobile Startup Instructions

Start the Expo mobile app:

```bash
cd mobile
npx expo start --clear
```

### Target Options:
* **Web Browser**: Press `w` in the terminal or open `http://localhost:8081` in Chrome/Safari.
* **Physical Device (Expo Go)**:
  1. Ensure your mobile phone and computer are on the **same Wi-Fi network**.
  2. Open the **Expo Go** app on your phone.
  3. Scan the terminal's QR code (on Android, scan via Expo Go's built-in "Scan QR code"; on iOS, scan with the Camera app).
* **iOS Simulator**: Press `i` (macOS with Xcode required).
* **Android Emulator**: Press `a` (Android Studio required).

---

## 10. Environment Variable Setup

### Backend (`.env`)
Copy the template in the root directory:
```bash
cp .env.example .env
```
Default values:
```env
PORT=3000
JWT_SECRET=nestmate-jwt-secret-for-demo
```

### Mobile Frontend (`mobile/.env`)
Copy the template in the `mobile/` directory:
```bash
cp mobile/.env.example mobile/.env
```
Configuration guide:
* **Web / iOS Simulator**: `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`
* **Android Emulator**: `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000`
* **Physical Device via Wi-Fi**: `EXPO_PUBLIC_API_BASE_URL=http://<YOUR_COMPUTER_LOCAL_IP>:3000` (e.g. `http://192.168.1.102:3000`)

---

## 11. Backend API Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Service health status and uptime | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate with email/password (returns JWT) | No |
| `GET` | `/api/auth/profile` | Retrieve authenticated user profile | Yes (Bearer) |
| `PATCH`| `/api/auth/profile` | Update profile attributes and bio | Yes (Bearer) |
| `GET` | `/api/matches?profileId=:id` | Paginated ranked roommate compatibility matches | Yes (Bearer) |
| `GET` | `/api/accommodations` | Filtered accommodation listings | Yes (Bearer) |
| `GET` | `/api/accommodations/recommendations` | Ranked housing recommendations | Yes (Bearer) |
| `GET` | `/api/accommodations/:id` | Accommodation listing detail by ID | Yes (Bearer) |
| `POST` | `/api/connection-requests/:id` | Send roommate connection request | Yes (Bearer) |
| `GET` | `/api/connection-requests/sent` | List connection requests sent by user | Yes (Bearer) |
| `GET` | `/api/connection-requests/received`| List received connection requests | Yes (Bearer) |
| `GET` | `/api/favorites` | List user's bookmarked favorite roommates | Yes (Bearer) |
| `POST` | `/api/favorites/:id` | Add roommate to favorites | Yes (Bearer) |
| `DELETE`| `/api/favorites/:id` | Remove roommate from favorites | Yes (Bearer) |
| `GET` | `/api/dashboard` | Activity summary and profile completion percentage | Yes (Bearer) |

---

## 12. Automated Testing

The project includes **113 automated unit and integration tests** executing via the native Node.js test runner:

### Run all tests across the entire repository:
```bash
node --test 'src/**/*.test.js' 'mobile/src/**/*.test.js' 'mobile/test/*.test.js'
```

### Run backend tests only:
```bash
npm test
```

### Run mobile journey tests only:
```bash
node --test 'mobile/test/*.test.js'
```

### Test Suite Summary:
* **Backend Services & Controllers (96 tests)**:
  * Compatibility calculation & ranking algorithms (25 tests)
  * Authentication, session & photo uploads (11 tests)
  * Accommodation management & recommendations (6 tests)
  * Connection requests & booking inquiries (9 tests)
  * Chat, privacy, moderation, notifications & reviews (44 tests)
  * Health check endpoint (1 test)
* **Mobile Client & User Journeys (17 tests)**:
  * Mock properties data integrity & search filters (5 tests)
  * Roommate discovery, sorting & compatibility breakdown (3 tests)
  * Saved roommate persistence & profile preference validation (2 tests)
  * Mobile API contracts & pagination helpers (7 tests)

---

## 13. End-to-End Demo Walkthrough

Follow this step-by-step user journey during a presentation or demo:

1. **Launch**: Start backend (`npm start`) and mobile app (`cd mobile && npx expo start`).
2. **Home Screen**: View the welcome banner for Alex Rivera, smart match statistics, and top compatibility matches.
3. **Discover Roommates**: Tap the **Discover** tab. Search for `"Bangalore"` or `"Sarah"`. Use the sort selector to rank by *Highest Match* or *Lowest Budget*. Open the filter modal to filter by non-smoker or pets.
4. **Roommate Details**: Tap on a profile card (e.g. *Sarah Chen, 96% Match*). Review the 4-pillar compatibility breakdown bars. Tap **Match Request** to trigger the confirmation modal. Tap the top-right bookmark icon to save the roommate.
5. **Accommodation Discovery**: Tap the **Places** tab. Browse listings across Bangalore, Mumbai, and Delhi. Filter for *PG* or *Flat* and adjust the budget range.
6. **Property Details**: Tap on any property (e.g. *Cozy 1BHK near Koramangala Metro*). Review rent, amenities (WiFi, AC, Power Backup), and house rules. Tap **Save Bookmark** and **Contact Owner**.
7. **Saved Items**: Tap the **Saved** tab. Notice the segmented control showing both your saved/bookmarked roommates and saved accommodations. Tap to unsave or view details.
8. **Profile & Preferences**: Tap the **Profile** tab. Review current budget, area, and lifestyle habits. Tap **Edit** to change your monthly budget or cleanliness preference. Tap **Save** and verify changes persist across restarts.

---

## 14. Known Limitations

* **In-Memory Backend Storage**: The NestJS backend currently uses thread-safe in-memory maps seeded with demo data rather than an external PostgreSQL instance. All created users, requests, and reviews persist for the duration of the server process.
* **Image Uploads**: Profile photo uploads use local file storage in `/uploads`. In a production deployment, this would be wired to an S3 or Google Cloud Storage bucket.
* **Push Notifications**: Notification preferences and in-app notification state are fully modeled in the backend, while push notifications rely on local device alerts in the mobile demo.

---

## 15. Submission Verification Checklist

- [x] Backend starts cleanly with `npm start` without missing driver errors.
- [x] Health check endpoint `/api/health` returns `200 OK`.
- [x] Mobile app builds and runs cleanly via Expo SDK 58 on Web and Expo Go.
- [x] All 5 bottom navigation tabs are responsive and fully functional.
- [x] Roommate search, filtering, and compatibility scoring work as specified.
- [x] Accommodation listings, search, rent in ₹, and property details work.
- [x] Saved items persist using local AsyncStorage.
- [x] User profile screen allows editing housing and habit preferences.
- [x] 113 automated unit and integration tests pass with 0 failures.
- [x] No secrets, passwords, or sensitive keys are committed.
