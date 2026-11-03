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
- **Navigation**: Expo Router (file-based navigation with tabs)
- **Styling**: React Native `StyleSheet` with centralized design tokens
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Storage**: `@react-native-async-storage/async-storage`

### Directory Structure
```
mobile/
├── app/                      # Expo Router file-based routes
│   ├── _layout.js            # Root layout with SafeAreaProvider & Stack
│   ├── index.js              # Entry redirect to (tabs)
│   └── (tabs)/               # Bottom tab navigation
│       ├── _layout.js        # Tab bar configuration & icons
│       ├── index.js          # Home / Discovery screen
│       ├── discover.js       # Discover & recommendations screen
│       ├── saved.js          # Bookmarked roommates & accommodations
│       └── profile.js        # User profile & preferences
├── src/
│   ├── components/           # Reusable UI component library
│   │   ├── Button.js         # Primary, secondary, outline, danger buttons
│   │   ├── Card.js           # Elevated, outlined, and flat cards
│   │   ├── Input.js          # Form text inputs with icons & validation
│   │   ├── SearchBar.js      # Search input with filter toggle
│   │   ├── Badge.js          # Compatibility & status pills
│   │   └── index.js
│   ├── constants/            # Design system tokens
│   │   ├── theme.js          # Palette (Navy/Blue), Typography, Spacing, Shadows
│   │   └── index.js
│   └── data/
│       └── mockData.js       # Realistic mock data aligned with backend schemas
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

## 5. Mobile Day 1 Implementation Summary

- [x] Initialized Expo mobile application inside `mobile/`.
- [x] Configured Expo Router with file-based routing and root stack.
- [x] Established design system with navy, soft blue, and white palette, spacing, typography, and shadows.
- [x] Built reusable components: `Button` (with variants, loading, icons), `Card` (elevated, flat), `Input`, `SearchBar`, and `Badge`.
- [x] Implemented bottom tab navigation (`Home`, `Discover`, `Saved`, `Profile`) with active indicators.
- [x] Built polished Home / Discovery screen with user greeting, search bar, filter pills, Smart Match algorithm banner, quick stats, top roommate matches, and featured accommodation cards.
- [x] Preserved all existing backend files and unit tests.
