# PASA

**Keeping Parents in Sync with Everything Regarding Their Child's Education**

A Parent-School Engagement Platform designed to improve visibility, accountability, and communication throughout a learner's educational journey.

> Founded by Khanya Mgebisa

---

## The Problem

Parents play a critical role in a child's education — yet many remain unaware of important events happening at school. Schools communicate through WhatsApp groups, printed letters, learner diaries, SMS, and verbal messages passed through learners. Important information is regularly delayed, lost, or never reaches the parent at all.

This gap creates real consequences:
- Learners face discipline issues parents never hear about
- Meetings and exams are missed
- Learners exploit the lack of visibility
- Schools carry a growing administrative burden

## The Solution

PASA gives schools a structured, trusted communication channel and gives parents a single secure platform to stay informed about everything relevant to their child's education.

**Schools publish:**
- School calendar, events, and announcements
- Examination timetables and test schedules
- Extra classes and parent meetings
- Learner conduct records
- Academic documents

**Parents receive:**
- Real-time visibility into their child's schedule and conduct
- Direct communication from the school — not filtered through the learner
- A single platform instead of multiple fragmented channels

---

## Vision

To become South Africa's trusted platform for parent-school engagement — a future where every parent has visibility into their child's educational journey, schools communicate more effectively, and learners benefit from stronger collaboration between home and school.

---

## How It Works

### School Portal
Schools are registered within a **Province → District → School** hierarchy. Each school has:
- Principal accounts
- School Administrator accounts
- Teacher accounts

Role-based permissions ensure secure, appropriate access at every level.

### Parent Portal
Parents register on PASA, select their school, submit learner information, and request verification. Schools approve the link — keeping the school as the source of truth.

### Admin Portal
Super admins manage the platform-wide hierarchy — provinces, districts, schools, and user roles.

---

## Current Status

PASA is not a concept. A working MVP has been built and is ready for pilot adoption.

**Live functionality:**
- ✅ Parent registration and authentication
- ✅ Learner verification workflow
- ✅ Province and district hierarchy
- ✅ School management portal
- ✅ Teacher management
- ✅ Staff invite (creates account + assigns role in one step)
- ✅ Calendar management
- ✅ Examination timetable management
- ✅ Extra class management
- ✅ Learner conduct visibility
- ✅ Attendance tracking
- ✅ Learner transfers
- ✅ Push notifications
- ✅ Role-based access control (enforced server-side via Spring Security)
- ✅ Portal-separated authentication (parent / school staff / admin sign-in)
- ✅ Password reset flow
- ✅ User profile management
- ✅ Actuator health/metrics endpoints
- ✅ Audit logging

---

## Business Model

| Audience | Tier | Price |
|---|---|---|
| Schools | Free | R0 — removing barriers to adoption |
| Parents | Free | One learner profile |
| Parents | Premium | R19.99/month — multiple learner profiles, advanced notifications, no ads, cross-school scheduling intelligence |

---

## Roadmap

**Current**
- MVP complete

**Next Phase**
- Pilot schools
- Parent onboarding
- Feedback collection and product refinement

**Future**
- Mobile applications (Expo — in progress)
- Enhanced analytics
- District and provincial communication tools

---

## Tech Stack

### Web (`/web`)
- **React 19** + **TypeScript**
- **TanStack Router** — file-based routing
- **TanStack Query** — server state management
- **Spring Boot REST API** — all data and auth via the backend (JWT), accessed through a single `api` client (`src/lib/api.ts`); the browser holds no database credentials
- **Tailwind CSS v4** + **Radix UI** — component library
- **Vite 8** — build tooling
- **Netlify** — hosting

#### Web Directory Structure (feature-based)

```
web/src/
├── components/
│   ├── layout/       # App shell — sidebar, mobile nav, logo
│   ├── shared/       # Reusable composed components
│   └── ui/           # Primitive UI kit (shadcn/ui)
├── features/         # Domain modules (19 feature folders)
│   ├── admin/        # Super admin pages (districts, users, schools)
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
├── hooks/            # Custom React hooks
├── lib/              # Shared utilities (api client, auth context, error helpers)
├── routes/           # TanStack Router file-based routes (thin wrappers, ~5 lines each)
├── main.tsx          # App entry point
├── router.tsx        # Router instance
└── styles.css        # Global Tailwind styles
```

### Mobile (`/mobile`)
- **React Native 0.83** + **Expo 55**
- **Expo Router** — file-based routing with typed routes
- Talks to the same Spring Boot REST API as the web app

### Backend (`/backend`)
- **Spring Boot 3.3** — REST API (Java 21)
- **Spring Security** + **JWT (jjwt 0.12)** — authentication and role-based access
- **Spring Data JPA** + **PostgreSQL** — data layer (connection string is configurable; not tied to any single provider)
- **AWS SDK v2 (S3)** — report-card PDF storage behind a `StorageService` abstraction, pointed at an S3-compatible endpoint (currently Supabase Storage); swappable to another provider via config
- **Springdoc OpenAPI** — Swagger UI at `/swagger-ui`
- **Spring Boot Actuator** — health, info, and metrics endpoints
- **Lombok** — boilerplate reduction

> **Supabase scope:** the backend uses Supabase only as the S3-compatible object store for report-card PDFs, accessed server-side through `StorageService`. The browser never talks to Supabase. The relational database and file store are both configurable, so a later move to a South-African provider is a config change, not a code change.

#### Backend Architecture

```
controller/ → service/ → repository/ → entity
                ↕               ↕
          dto/request/    dto/response/
               ↕
            mapper/
```

#### Backend API Endpoints

| Controller | Base Path | Key Operations |
|---|---|---|
| AuthController | `/api/v1/auth` | `POST /parent/register`, `POST /parent/signin`, `POST /staff/signin`, `POST /admin/signin`, `POST /forgot-password`, `POST /reset-password` |
| ProfileController | `/api/v1/profile` | `GET /`, `PUT /`, `POST /change-password` |
| AdminController | `/api/v1/admin` | `GET /stats`, `GET/POST/PUT/DELETE /districts`, `GET /users`, `POST /users/{id}/roles`, `DELETE /users/{id}/roles/{roleId}` |
| DashboardController | `/api/v1` | `GET /schools/{id}/dashboard`, `GET /parents/dashboard` |
| SchoolController | `/api/v1/schools` | `GET /`, `GET /{id}`, `POST /`, `PUT /{id}`, `POST /{id}/recalculate-performance`, `GET /{id}/report-cards` |
| DistrictController | `/api/v1/districts` | `GET /` (authenticated, optional `?province=`) |
| SchoolRequestController | `/api/v1/school-requests` | `POST /` (public), `GET /` (super-admin), `PATCH /{id}` |
| LearnerController | `/api/v1` | `GET /children`, `GET /schools/{id}/learners`, `GET /learners/{id}`, `POST /schools/{id}/learners`, `PUT /learners/{id}` |
| CalendarController | `/api/v1/schools/{id}/calendar` | `GET`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| ExamTimetableController | `/api/v1/schools/{id}/exam-timetable` | `GET`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| ClassController | `/api/v1/schools/{id}/classes` | `GET`, `POST`, `PUT /{id}`, `DELETE /{id}` |
| StaffController | `/api/v1/schools/{id}/staff` | `GET`, `POST`, `POST /invite`, `PUT /{id}`, `DELETE /{id}` |
| AttendanceController | `/api/v1/learners/{id}/attendance` | `GET`, `POST`, `PUT /{id}` |
| MarksController | `/api/v1/learners/{id}/marks` | `GET`, `POST`, `PUT /{id}` |
| DisciplineController | `/api/v1/learners/{id}/discipline` | `GET`, `POST`, `DELETE /{id}` |
| NotificationController | `/api/v1/notifications` | `GET`, `GET /unread-count`, `PATCH /{id}/read`, `POST /read-all` |
| LinkRequestController | `/api/v1/link-requests` | `GET /mine`, `POST /`, `GET /schools/{id}/link-requests`, `POST /{id}/approve`, `POST /{id}/reject` |
| TransferController | `/api/v1/transfers` | `GET /school/{id}`, `GET /learner/{id}`, `POST /`, `PATCH /{id}/status` |
| ReportCardController | `/api/v1/learners/{id}/report-cards` | `GET`, `POST` (multipart PDF), `GET /{id}/download`, `DELETE /{id}` |
| NationalCalendarController | `/api/v1/national-calendar` | `GET` (public, SA holidays & term dates) |
| PushTokenController | `/api/v1/push-tokens` | `POST /`, `DELETE /{token}` |
| AuditController | `/api/v1/schools/{id}/audit` | `GET` (paginated) |

#### Observability

| Tool | Endpoint | Description |
|---|---|---|
| Swagger UI | `/swagger-ui` | Interactive API documentation with JWT bearer auth |
| OpenAPI spec | `/api-docs` | Machine-readable API schema |
| Health check | `/actuator/health` | Application health status |
| App info | `/actuator/info` | Build and version metadata |
| Metrics | `/actuator/metrics` | Runtime metrics (JVM, HTTP, etc.) |

### Infrastructure (`/supabase`)
- PostgreSQL migrations (schema and seed data)
- Report-card object storage bucket (accessed only server-side by the backend)

---

## Monorepo Structure

```
pasa/
├── web/          # React web app (parents + school staff + admin portals)
├── mobile/       # React Native mobile app (Expo)
├── backend/      # Spring Boot REST API
├── supabase/     # Database migrations and report-card storage bucket
└── SKILLS/       # Product documentation
```

---

## Getting Started

### Web
```bash
cd web
npm install
cp .env.example .env
# Set VITE_API_URL to the backend base URL (default http://localhost:8080)
npm run dev
```

### Backend
```bash
cd backend
# Required: DATABASE_URL (or SPRING_DATASOURCE_URL) + credentials, JWT_SECRET, CORS_ALLOWED_ORIGINS
# Optional (report-card uploads): pasa.storage.s3.* — endpoint, bucket, access key, secret key
./mvnw spring-boot:run
# API at http://localhost:8080
# Swagger UI at http://localhost:8080/swagger-ui
```

---

## Partnership Opportunities

PASA is seeking pilot schools, educational NGOs, sponsors, corporate partners, and government stakeholders to accelerate validation, adoption, and growth across South Africa's education ecosystem.

---

*PASA — Keeping Parents in Sync with Everything Regarding Their Child's Education*
