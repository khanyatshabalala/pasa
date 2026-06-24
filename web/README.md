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
| `VITE_SUPABASE_URL` | Supabase project URL (public, shipped to browser) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key (public, shipped to browser) |
| `SUPABASE_URL` | Same URL for SSR/edge function use |
| `SUPABASE_PUBLISHABLE_KEY` | Same key for SSR/edge function use |
| `VITE_VAPID_PUBLIC_KEY` | Web push VAPID public key (for push notifications) |

> `VITE_*` variables are embedded in the client bundle at build time. They must only contain public values — never secrets.

---

## Directory Structure

```
src/
├── components/
│   ├── layout/          # App shell components (AppSidebar, MobileBottomNav, Logo)
│   ├── shared/          # Reusable composed components (page headers, data tables, etc.)
│   └── ui/              # Primitive UI kit — shadcn/ui components (Button, Dialog, etc.)
├── features/            # Domain-specific modules (one folder per domain)
│   ├── admin/
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
│   ├── staff/
│   └── transfers/
├── hooks/               # Custom React hooks (use-mobile, use-push-notifications)
├── integrations/
│   └── supabase/        # Supabase client instances and generated types
├── lib/                 # Shared utilities
│   ├── auth-context.tsx # AuthProvider, useAuth() hook
│   ├── auth-errors.ts   # Auth error message mapping
│   ├── db-errors.ts     # Database error message mapping
│   └── utils.ts         # cn() and general helpers
├── routes/              # TanStack Router file-based routes
├── main.tsx             # React entry point
├── router.tsx           # Router instance creation
├── routeTree.gen.ts     # Auto-generated route tree (do not edit)
└── styles.css           # Global Tailwind CSS import
```

---

## Conventions

### Route files are thin wrappers

Route files in `src/routes/` define the route and point to a page component inside `features/`. They contain no page logic themselves.

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
| Auth & DB | Supabase |
| Styling | Tailwind CSS v4 |
| UI primitives | Radix UI (via shadcn/ui) |
| Forms | React Hook Form + Zod |
| Build | Vite 8 |
| Language | TypeScript 5.8 |
| Hosting | Netlify |
