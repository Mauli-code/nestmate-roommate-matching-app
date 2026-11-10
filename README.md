# NestMate — Smart Roommate Matching & Accommodation Application

NestMate is a mobile application designed to help students and working professionals find compatible roommates based on budget, location, lifestyle, habits, and preferences, while also discovering verified accommodation options.

---

## 1. Project Architecture

The repository is structured into two decoupled tiers:

- **Backend (`/src`)**: NestJS matching engine written in JavaScript with compatibility scoring (0–100%) and candidate ranking.
- **Mobile Frontend (`/mobile`)**: React Native mobile application built with Expo and Expo Router, featuring a custom navy/blue design system, reusable UI components, and bottom tab navigation.

---

## 2. Mobile Application (`mobile/`)

The mobile UI is designed specifically for students and professionals looking for flatmates and housing.

### Tech Stack
- **Framework**: React Native with Expo (SDK 58)
- **Language**: JavaScript
- **Navigation**: Expo Router (file-based navigation with tabs and dynamic routes)
- **Styling**: React Native `StyleSheet` with centralized design tokens
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Storage**: `@react-native-async-storage/async-storage`

### Directory Structure
```
mobile/
├── app/                      # Expo Router file-based routes
│   ├── _layout.js            # Root layout with SafeAreaProvider & Stack
│   ├── index.js              # Entry redirect to (tabs)
│   ├── (tabs)/               # Bottom tab navigation
│   │   ├── _layout.js        # Tab bar configuration & icons
│   │   ├── index.js          # Home / Discovery screen
│   │   ├── discover.js       # Roommate discovery with search & sorting
│   │   ├── saved.js          # Bookmarked roommates & accommodations
│   │   └── profile.js        # User profile & preferences
│   └── roommate/
│       └── [id].js           # Roommate profile details & compatibility breakdown
├── src/
│   ├── components/           # Reusable UI component library
│   │   ├── Button.js         # Primary, secondary, outline, danger buttons
│   │   ├── Card.js           # Elevated, outlined, and flat cards
│   │   ├── Input.js          # Form text inputs with icons & validation
│   │   ├── SearchBar.js      # Search input with filter toggle
│   │   ├── Badge.js          # Compatibility & status pills
│   │   ├── RoommateCard.js   # Roommate recommendation card
│   │   ├── CompatibilityBreakdown.js # 4-pillar visual scoring breakdown
│   │   ├── RoommateFilterModal.js    # Filter bottom sheet modal
│   │   ├── MatchRequestModal.js      # Match request confirmation dialog
│   │   └── index.js
│   ├── constants/            # Design system tokens
│   │   ├── theme.js          # Palette (Navy/Blue), Typography, Spacing, Shadows
│   │   └── index.js
│   ├── hooks/
│   │   └── useMatchRequests.js # Hook for managing match request states
│   ├── services/
│   │   └── matchRequestService.js # Match request storage & API client
│   └── data/
│       └── mockData.js       # Realistic mock data aligned with backend schemas
├── test/
│   └── roommateJourney.test.js # Automated verification for roommate discovery journey
├── assets/                   # App icons, splash screens, and images
├── app.json                  # Expo project configuration
└── package.json              # Mobile dependencies and scripts
```

---

## 3. Mobile Setup and Startup

### Prerequisites
- Node.js (v18 or newer)
- npm or yarn
- Expo Go mobile app (iOS App Store or Google Play Store) or an iOS/Android simulator

### Quick Start

1. **Navigate to the mobile directory**:
   ```bash
   cd mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Expo development server**:
   ```bash
   npm start
   # or
   npx expo start
   ```

4. **Run on your preferred target**:
   - Press `i` to launch in the **iOS Simulator** (macOS required with Xcode).
   - Press `a` to launch in the **Android Emulator** (Android Studio required).
   - Press `w` to open in the **Web browser**.
   - Scan the QR code using the **Expo Go** app on your physical device.

5. **Run mobile journey tests**:
   ```bash
   node --test mobile/test/roommateJourney.test.js
   ```

### Expo Go troubleshooting (QR scans but the app only reloads / shows nothing)

The most common cause is starting Expo from the repository root instead of the
`mobile/` folder. From the root, Metro serves `expo/AppEntry` and fails with
`Unable to resolve module ../../App`, so Expo Go loops on the splash screen.

- **Always start from `mobile/`.** From the repository root you can also run
  `npm run mobile` (or `npm run mobile:clear` to reset Metro's cache).
- Update **Expo Go** to the latest version (SDK 58) from the App Store / Play Store.
- Keep the phone and computer on the **same Wi-Fi**. Turn off VPNs and
  iCloud Private Relay while testing.
- **Android:** scan the QR from *inside* Expo Go (tap **Scan QR code**), not from
  the camera / Google Lens — the camera may open a browser that cannot handle
  `exp://` URLs. Check connectivity in Chrome with
  `http://<computer-ip>:8081/status` (it must show `packager-status:running`).
  Guest / college Wi-Fi often blocks phone-to-laptop traffic; use a phone
  hotspot or `npx expo start --tunnel` (tunnel requires `npx expo login`).
- **iPhone (physical device):** Expo Go and Expo CLI must be signed in to the
  same Expo account (SDK 58 requirement). Run `npx expo login`, then sign in to
  Expo Go with the same account.
- If the LAN connection is blocked, use a tunnel:
  ```bash
  cd mobile
  npx expo start --tunnel
  ```
- Clear the Metro cache and restart:
  ```bash
  cd mobile
  npx expo start --clear
  ```
- In Expo Go, shake the device and tap **Reload**, or force-close and reopen Expo Go.
- Sanity check from the phone browser: open `http://<computer-ip>:8081/status`.
  It should show `packager-status:running`.

---

## 4. Backend Development (`/src`)

The matching backend contains the 4-pillar compatibility algorithm and ranking engine:

```bash
npm install
npm run build
npm test
```

- Compatibility is scored from 0 to 100 based on:
  1. **Budget (25%)**: Proportional difference ratio.
  2. **Location (25%)**: Case-insensitive area matching.
  3. **Lifestyle (25%)**: Sleep schedule & cleanliness alignment.
  4. **Habits & Preferences (25%)**: Smoking & pet compatibility.

---

## 5. Development Progress

### Day 1 Summary
- [x] Initialized Expo mobile application inside `mobile/`.
- [x] Configured Expo Router with file-based routing and root stack.
- [x] Established design system with navy, soft blue, and white palette, spacing, typography, and shadows.
- [x] Built reusable components: `Button`, `Card`, `Input`, `SearchBar`, and `Badge`.
- [x] Implemented bottom tab navigation (`Home`, `Discover`, `Saved`, `Profile`).
- [x] Built initial Home screen with user greeting, search bar, filter pills, and recommendation preview cards.
- [x] Preserved all existing backend files and unit tests.

### Day 2 Summary (Roommate Discovery & Recommendations)
- [x] **Roommate Discovery Screen**: Polished `discover.js` with responsive card layout, search bar, active filter count, loading indicator, and empty states.
- [x] **Recommendation Cards**: `RoommateCard.js` displaying profile photo, age, role, budget ($/mo), area, lifestyle chips (cleanliness, sleep schedule, smoking, pets), and match percentage badge.
- [x] **Profile Details Screen**: `roommate/[id].js` dynamic route with full introduction, key lease specs, habits grid, roommate preferences (WFH, cooking, guests), and interest tags.
- [x] **Compatibility Breakdown Component**: `CompatibilityBreakdown.js` visualizing the 4 pillars (Budget, Location, Lifestyle, Habits) with progress bars, color thresholds, and mathematical verification that category scores sum strictly to the backend total score (25 pts each = 100 max).
- [x] **Client-Side Filters**: `RoommateFilterModal.js` bottom sheet filtering by preferred area, max budget, minimum score threshold (80%+, 85%+, 90%+), sleep schedule, cleanliness, non-smoking only, and pet-friendly.
- [x] **Sorting Controls**: Real-time sorting by Highest Match, Lowest Budget, Highest Budget, and Preferred Location.
- [x] **Match Request Interactions**: `matchRequestService.js` and `useMatchRequests.js` with AsyncStorage persistence, duplicate prevention, and `MatchRequestModal.js` confirmation feedback.
- [x] **User Journey Verification**: `roommateJourney.test.js` validating compatibility scoring math, filtering accuracy, and sorting order.
