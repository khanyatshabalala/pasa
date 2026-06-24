# PASA — Mobile App

React Native mobile application for PASA (Parent and School Alliance), built with Expo.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Expo CLI (`npx expo`)
- iOS Simulator (macOS) or Android emulator, or Expo Go on a physical device

### Install & Run

```bash
npm install
cp .env.example .env
# Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npm start
```

This starts the Expo development server. Scan the QR code with Expo Go or press:
- `a` — open on Android emulator
- `i` — open on iOS simulator
- `w` — open in web browser

### Platform-Specific Commands

```bash
npm run android   # Start directly on Android
npm run ios       # Start directly on iOS
npm run web       # Start in web browser
```

---

## Environment Variables

Create a `.env` file from `.env.example`:

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase public/anon key |

---

## Project Structure

```
mobile/
├── app/                    # Expo Router file-based routes
│   ├── (tabs)/             # Tab navigator screens
│   │   ├── index.tsx       # Home / Dashboard
│   │   ├── alerts.tsx      # Notifications
│   │   ├── assistant.tsx   # AI Assistant
│   │   ├── attendance.tsx  # Attendance (parent view)
│   │   ├── attendance-capture.tsx  # Attendance capture (staff)
│   │   ├── calendar.tsx    # School calendar
│   │   ├── children.tsx    # My children (parent)
│   │   ├── classes.tsx     # Class management (staff)
│   │   ├── discipline.tsx  # Discipline records
│   │   ├── exam-timetable.tsx  # Exam schedule
│   │   ├── learners.tsx    # Learner list (staff)
│   │   ├── link-requests.tsx   # Link request management
│   │   ├── profile.tsx     # User profile
│   │   ├── report-cards.tsx    # Report cards (parent view)
│   │   ├── report-cards-upload.tsx # Report cards upload (staff)
│   │   ├── schools.tsx     # School directory
│   │   ├── staff.tsx       # Staff management
│   │   ├── transfers.tsx   # Learner transfers
│   │   └── upgrade.tsx     # Premium upgrade
│   ├── admin/              # Admin screens
│   ├── _layout.tsx         # Root layout
│   ├── auth.tsx            # Authentication screen
│   └── forgot-password.tsx # Password reset
├── lib/                    # Shared utilities
│   ├── auth-context.tsx    # Auth provider and useAuth() hook
│   ├── BarefootLoader.tsx  # Loading indicator component
│   ├── push-notifications.ts  # Push notification setup
│   └── supabase.ts         # Supabase client instance
├── app.json                # Expo app configuration
├── babel.config.js         # Babel configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm start` | Start Expo development server |
| `npm run android` | Start on Android emulator |
| `npm run ios` | Start on iOS simulator |
| `npm run web` | Start in web browser |
| `npm run lint` | Run ESLint |

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React Native 0.83 |
| Platform | Expo 55 |
| Router | Expo Router (file-based, typed routes) |
| Auth & DB | Supabase |
| Notifications | expo-notifications |
| Secure storage | expo-secure-store |
| Animations | react-native-reanimated |
| Language | TypeScript 5.8 |

---

## Key Features

- Role-based navigation (parent vs. school staff views)
- Push notifications via Expo Notifications
- Secure token storage with expo-secure-store
- Shared Supabase backend with the web app
- File-based routing with typed routes

---

## Notes

- The mobile app shares the same Supabase backend and database as the web app.
- Authentication tokens are stored securely using `expo-secure-store`.
- The app supports both portrait orientation on phones (tablets not currently supported).
