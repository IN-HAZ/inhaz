# inHaz Mobile App — React Native Expo

The `mobile` directory contains the cross-platform iOS and Android application for inHaz, built using **React Native**, **Expo Router**, and **NativeWind** (Tailwind CSS).

---

## 📱 Dual-Role App Architecture

The mobile app is a single unified application serving both **Client** and **Driver** user personas:
*   **Client Mode:** Map home screen, address autocomplete, reverse-bidding request submission, live offer stream, tracking map, and ratings.
*   **Driver Mode:** One-handed ergonomic dashboard, nearby request discovery feed, quick counter-offer buttons (`+10%`, `+20%`), and navigation stepper.

---

## 🛠️ Stack & Technologies

*   **Framework:** React Native (Expo SDK 51+)
*   **Navigation:** Expo Router (File-based navigation)
*   **Styling:** NativeWind (Tailwind CSS v4 / preset)
*   **State Management:** Zustand (`lib/store/auth.ts`)
*   **Data Fetching:** TanStack / React Query (`lib/api/`)
*   **Icons & Fonts:** Expo Vector Icons & Google Fonts (`Inter`, `SpaceMono`)

---

## 🚀 Running the Mobile App

### 1. Launch via Root Makefile (Recommended)
Starting the development stack from root automatically boots the backend containers and launches the Expo dev server:

```bash
# From repository root:
make dev
```

### 2. Launch Mobile App Standalone
If backend Docker services are already running (`make up`):

```bash
cd mobile
npm install
npm run start
```

*Press `a` to open Android Emulator, `i` to open iOS Simulator, or scan the QR code with the Expo Go app on a physical device.*

---

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file in the `mobile/` directory to configure local API target:

```env
# Local Development API Target
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 📁 Directory Structure

```text
mobile/
├── app/                  # Expo Router File-Based Screens
│   ├── (tabs)/           # Navigation Tabs
│   ├── auth/             # Phone entry & OTP screens
│   ├── driver/           # Driver onboarding, documents & marketplace
│   ├── requests/         # Client request creation & bidding stream
│   └── trips/            # Active delivery tracking & milestones
├── components/           # UI Component Library (Toast, Buttons, Steppers)
├── constants/            # Color themes & constants
├── lib/                  # Zustand stores & REST API clients
└── tailwind.config.js    # NativeWind Tailwind configuration
```
