# PASA — Web App

Developer documentation for the PASA web application.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+

### Install & Run

```bash
npm install
cp .env.example .env
# Fill in environment variables (see below)
npm run dev
```

The dev server starts at `http://localhost:5173`.

---

## Environment Variables

Create a `.env` file from `.env.example`:

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the Spring Boot backend (default `http://localhost:8080`) |
| `VITE_VAPID_PUBLIC_KEY` | Web push VAPID public key (for push notifications) |

> `VITE_*` variables are embedded in the client bundle at build time. They must only contain public values — never secrets. The web app talks exclusively to the backend REST API; it holds no database or storage credentials.

---

## Directory Structure

```
src/
├── components/
│   ├── layout/          # App shell components (AppSidebar, MobileBottomNav, Logo)
│   ├── shared/          # Reusable composed components (page headers, data tables, etc.)
│   └── ui/              # Primitive UI kit — shadcn/ui components (Button, Dialog, etc.)
├── features/            # Domain-specific modules (one folder per domain)
│   ├── admin/           # Super admin pages (districts, users, school management)
│   ├── admissions/
│   ├── attendance/
│   ├── audit/
│   ├── auth/
│   ├── calendar/
│   ├── children/
│   ├── classes/
│   ├── dashboard/
│   ├── discipline/
│   ├── exams/
│   ├── learners/
│   ├── link-requests/
│   ├── marks/
│   ├── notifications/
│   ├── profile/
│   ├── schools/
│   ├── staff/
│   └── transfers/
├── hooks/               # Custom React hooks (use-mobile, use-push-notifications)
├── lib/                 # Shared utilities
│   ├── api.ts           # Central REST API client (JWT auth, typed responses)
│   ├── auth-context.tsx # AuthProvider, useAuth() hook
│   ├── auth-errors.ts   # Auth error message mapping
│   ├── db-errors.ts     # Backend error message mapping
│   └── utils.ts         # cn() and general helpers
├── routes/              # TanStack Router file-based routes (thin wrappers, ~5 lines each)
├── main.tsx             # React entry point
├── router.tsx           # Router instance creation
├── routeTree.gen.ts     # Auto-generated route tree (do not edit)
└── styles.css           # Global Tailwind CSS import
```

---

## Routes

The app has three top-level route groups:

| Route Group | Purpose | Auth Required |
|---|---|---|
| `/` | Public pages (landing, pricing, about, school directory) | No |
| `/auth`, `/school/auth`, `/superadmin/auth` | Sign-in pages (portal-separated) | No |
| `/app/*` | Parent + staff portal (dashboard, calendar, etc.) | Yes |
| `/admin/*` | Super admin portal (districts, users, schools) | Yes (super_admin) |

### All Route Files

```
routes/
├── __root.tsx                  # Root layout
├── index.tsx                   # Landing page
├── about.tsx                   # About page
├── pricing.tsx                 # Pricing page
├── auth.tsx                    # Parent sign-in/register
├── school.auth.tsx             # Staff sign-in
├── superadmin.auth.tsx         # Super admin sign-in
├── reset-password.tsx          # Password reset
├── schools.tsx                 # School directory (public)
├── schools.$schoolId.tsx       # School detail (public)
├── app.tsx                     # Authenticated layout wrapper
├── app.index.tsx               # Dashboard
├── app.calendar.tsx            # School calendar
├── app.exam-timetable.tsx      # Exam timetable
├── app.attendance.tsx          # Attendance (parent view)
├── app.attendance-capture.tsx  # Attendance capture (staff)
├── app.marks.tsx               # Marks (parent view)
├── app.marks-capture.tsx       # Marks capture (staff)
├── app.discipline.tsx          # Discipline (parent view)
├── app.discipline-school.tsx   # Discipline (school view)
├── app.children.tsx            # My children (parent)
├── app.learners.tsx            # Learner list (staff)
├── app.learner.$learnerId.tsx  # Learner detail
├── app.classes.tsx             # Class management
├── app.staff.tsx               # Staff management
├── app.link-requests.tsx       # Link request management
├── app.transfers.tsx           # Transfer management
├── app.alerts.tsx              # Notifications
├── app.audit.tsx               # Audit log
├── app.profile.tsx             # User profile
├── app.schools.tsx             # School selector
├── app.admissions.tsx          # Admissions
├── app.upgrade.tsx             # Premium upgrade
├── admin.tsx                   # Admin layout wrapper
├── admin.index.tsx             # Admin dashboard
├── admin.districts.tsx         # District management
├── admin.users.tsx             # User management
├── admin.schools.tsx           # School management
└── admin.schools.$schoolId.tsx # School detail (admin)
```

---

## Conventions

### Route files are thin wrappers

Route files in `src/routes/` define the route and point to a page component inside `features/`. They contain no page logic themselves (~5 lines each).

```tsx
// src/routes/app.calendar.tsx
import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/features/calendar/CalendarPage";

export const Route = createFileRoute("/app/calendar")({
  component: CalendarPage,
});
```

### Page logic lives in `features/`

Each feature folder contains the page component, sub-components, types, hooks, and API calls relevant to that domain. This keeps routes clean and features self-contained.

Large pages are split into sub-components (e.g., DisciplinePage splits into DisciplineSchoolView, CalendarPage into CalendarDays, ExamTimetable into ExamTimetableForm).

### Path alias

The `@/` alias resolves to `src/`. Use it for all imports:

```tsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
```

### Named exports

Components and hooks use named exports, not default exports:

```tsx
export function CalendarPage() { ... }
```

### UI primitives vs. composed components

- `components/ui/` — atomic building blocks (shadcn/ui). Do not add app-specific logic here.
- `components/shared/` — composed components used across multiple features.
- `components/layout/` — app-level layout (sidebar, nav bars, logo).

### Portal-separated authentication

The web app has three separate sign-in pages:
- `/auth` — parent sign-in and registration
- `/school/auth` — staff sign-in (teachers, principals, school admins)
- `/superadmin/auth` — super admin sign-in

Each calls a different backend endpoint, and the server enforces role boundaries. If a staff member tries to sign into the parent portal, they get a 403 — no dashboard flash.

---

## Adding a New Feature

1. **Create a feature directory:**
   ```
   src/features/my-feature/
   ```

2. **Add a types file** (if the feature has domain models):
   ```
   src/features/my-feature/types.ts
   ```

3. **Create the page component:**
   ```tsx
   // src/features/my-feature/MyFeaturePage.tsx
   export function MyFeaturePage() {
     return <div>My Feature</div>;
   }
   ```

4. **Create the route file:**
   ```tsx
   // src/routes/app.my-feature.tsx
   import { createFileRoute } from "@tanstack/react-router";
   import { MyFeaturePage } from "@/features/my-feature/MyFeaturePage";

   export const Route = createFileRoute("/app/my-feature")({
     component: MyFeaturePage,
   });
   ```

5. **Run the dev server** — TanStack Router auto-generates the route tree.

6. **(Optional) Add a sidebar link** in `components/layout/AppSidebar.tsx`.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server (HMR) |
| `npm run build` | Production build → `dist/` |
| `npm run build:dev` | Development build (unminified, source maps) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

---

## Deployment

The web app is deployed to **Netlify**.

Configuration lives in `netlify.toml` at the monorepo root:
- Base directory: `web`
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 20
- SPA fallback: all routes rewrite to `/index.html`
- Security headers and cache rules are configured in the same file.

Netlify automatically builds on push to the configured branch.

---

## Tech Stack Summary

| Layer | Tool |
|---|---|
| Framework | React 19 |
| Router | TanStack Router (file-based) |
| Server state | TanStack Query |
| Auth & data | Spring Boot REST API (JWT) via `src/lib/api.ts` |
| Styling | Tailwind CSS v4 |
| UI primitives | Radix UI (via shadcn/ui) |
| Forms | React Hook Form + Zod |
| Build | Vite 8 |
| Language | TypeScript 5.8 |
| Hosting | Netlify |
