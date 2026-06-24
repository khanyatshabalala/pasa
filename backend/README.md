# PASA — Backend API

Spring Boot REST API for the PASA platform (Parent and School Alliance).

**123+ source files** | **16 controllers** | **Full layered architecture**

---

## Getting Started

### Prerequisites

- **Java 21** (required)
- Maven wrapper is included — no need to install Maven globally

### Running Locally

```bash
# Set required environment variables
export SUPABASE_DB_PASSWORD=your-database-password
export JWT_SECRET=your-64-char-random-secret
export PASA_CORS_ORIGINS=http://localhost:5173

# Start the server (port 8080)
./mvnw spring-boot:run
```

On Windows:
```powershell
$env:SUPABASE_DB_PASSWORD="your-database-password"
$env:JWT_SECRET="your-64-char-random-secret"
$env:PASA_CORS_ORIGINS="http://localhost:5173"
.\mvnw.cmd spring-boot:run
```

The API is available at `http://localhost:8080`.

### Useful URLs (local)

| URL | Description |
|---|---|
| `http://localhost:8080/swagger-ui` | Interactive API documentation (Swagger UI) |
| `http://localhost:8080/api-docs` | OpenAPI 3.0 JSON spec |
| `http://localhost:8080/actuator/health` | Health check |
| `http://localhost:8080/actuator/info` | App info and version |
| `http://localhost:8080/actuator/metrics` | Runtime metrics |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_DB_PASSWORD` | Yes | PostgreSQL password from Supabase Dashboard → Settings → Database |
| `JWT_SECRET` | Yes | 64+ character random string. Generate with `openssl rand -hex 64` |
| `PASA_CORS_ORIGINS` | No | Comma-separated allowed origins. Defaults to `http://localhost:5173` |

Copy `.env.example` for reference. Environment variables are injected via `application.properties` using `${VAR}` syntax.

---

## Directory Structure

```
src/main/java/com/pasa/backend/
├── config/              # Spring configuration (SecurityConfig, OpenApiConfig)
├── controller/          # REST controllers — thin routing + delegation (16 controllers)
│   ├── AdminController.java
│   ├── AttendanceController.java
│   ├── AuditController.java
│   ├── AuthController.java
│   ├── CalendarController.java
│   ├── ClassController.java
│   ├── DisciplineController.java
│   ├── ExamTimetableController.java
│   ├── LearnerController.java
│   ├── LinkRequestController.java
│   ├── MarksController.java
│   ├── NotificationController.java
│   ├── ProfileController.java
│   ├── SchoolController.java
│   ├── StaffController.java
│   └── TransferController.java
├── domain/
│   ├── entity/          # JPA entities (14 entities)
│   └── enums/           # Java enums (AppRole, AttendanceStatus, TransferStatus, etc.)
├── dto/
│   ├── request/         # Incoming request DTOs (20 records, validated with Jakarta annotations)
│   └── response/        # Outgoing response DTOs (18 immutable records)
├── exception/           # Custom exception classes + GlobalExceptionHandler
├── mapper/              # Entity ↔ DTO conversion (13 mappers)
├── repository/          # Spring Data JPA repositories (13 repositories)
├── security/            # JWT filter, JWT utility, JWT properties
├── service/             # Business logic services (16 services, one per domain)
└── PasaApplication.java # Main Spring Boot entry point
```

### Architecture Pattern

```
controller/ → service/ → repository/ → entity
                ↕               ↕
          dto/request/    dto/response/
               ↕
            mapper/
```

Controllers are thin — they validate input, delegate to services, and return responses. Services contain all business logic. Mappers handle entity ↔ DTO conversion. Repositories provide data access.

---

## Swagger / OpenAPI

Interactive API documentation is available at `/swagger-ui`. The OpenAPI 3.0 spec is served at `/api-docs`.

**Features:**
- All endpoints documented with request/response schemas
- JWT Bearer authentication configured — click "Authorize" and paste your token
- Endpoints grouped by tag and sorted alphabetically
- Try-it-out functionality for testing directly in the browser

---

## Actuator (Observability)

Spring Boot Actuator provides production-ready endpoints:

| Endpoint | Access | Description |
|---|---|---|
| `/actuator/health` | Public | Application health status (DB connectivity, disk space) |
| `/actuator/info` | Public | App name, version, description |
| `/actuator/metrics` | Authenticated | JVM memory, HTTP request counts, response times |

Health check details are shown only for authenticated requests (`show-details=when_authorized`).

---

## API Endpoints Reference

Base URL: `/api/v1`

### Authentication (`/api/v1/auth`) — Public

| Method | Path | Description |
|---|---|---|
| POST | `/auth/parent/register` | Register a new parent account → returns JWT |
| POST | `/auth/parent/signin` | Parent sign in → rejects staff/admin with 403 |
| POST | `/auth/staff/signin` | Staff sign in (teacher/principal/school_admin) → rejects parents with 403 |
| POST | `/auth/admin/signin` | Super admin sign in → rejects non-admins with 403 |
| POST | `/auth/forgot-password` | Request password reset email |
| POST | `/auth/reset-password` | Reset password with token |

> **Security note:** Each portal endpoint enforces role boundaries server-side. A valid credential on the wrong portal returns 403 — no token is ever issued, preventing dashboard flash bugs.

### Profile (`/api/v1/profile`) — Authenticated

| Method | Path | Description |
|---|---|---|
| GET | `/profile` | Get current user's profile |
| PUT | `/profile` | Update current user's profile |

### Admin (`/api/v1/admin`) — super_admin only

| Method | Path | Description |
|---|---|---|
| GET | `/admin/districts` | List districts (optional `?province=` filter) |
| POST | `/admin/districts` | Create a district |
| PUT | `/admin/districts/{id}` | Update a district |
| DELETE | `/admin/districts/{id}` | Delete a district |
| GET | `/admin/users` | List all users with roles (paginated: `?page=0&size=50`) |
| POST | `/admin/users/{userId}/roles` | Assign a role to a user |
| DELETE | `/admin/users/{userId}/roles/{roleId}` | Remove a role from a user |

### Schools (`/api/v1/schools`) — GET public, write requires role

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/schools` | Public | List schools (filter by province/district) |
| GET | `/schools/{id}` | Public | Get school detail |
| POST | `/schools` | super_admin | Create a new school |
| PUT | `/schools/{id}` | super_admin, principal, school_admin | Update school |

### Learners (`/api/v1`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/children` | parent | Get parent's linked children |
| GET | `/schools/{id}/learners` | teacher, principal, school_admin, super_admin | List learners at school |
| GET | `/learners/{id}` | Authenticated | Get learner detail |
| POST | `/schools/{id}/learners` | principal, school_admin, super_admin | Create learner |
| PUT | `/learners/{id}` | principal, school_admin, super_admin | Update learner |

### Calendar (`/api/v1/schools/{schoolId}/calendar`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get events (optional `from`/`to` params) |
| POST | `/` | teacher, principal, school_admin, super_admin | Create event |
| PUT | `/{id}` | teacher, principal, school_admin, super_admin | Update event |
| DELETE | `/{id}` | principal, school_admin, super_admin | Delete event |

### Exam Timetable (`/api/v1/schools/{schoolId}/exam-timetable`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get timetable (filter by year/term) |
| POST | `/` | principal, school_admin, super_admin | Create entry |
| PUT | `/{id}` | principal, school_admin, super_admin | Update entry |
| DELETE | `/{id}` | principal, school_admin, super_admin | Delete entry |

### Classes (`/api/v1/schools/{schoolId}/classes`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | teacher, principal, school_admin, super_admin | Get classes (filter by year) |
| POST | `/` | principal, school_admin, super_admin | Create class |
| PUT | `/{id}` | principal, school_admin, super_admin | Update class |
| DELETE | `/{id}` | principal, school_admin, super_admin | Delete class |

### Staff (`/api/v1/schools/{schoolId}/staff`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | principal, school_admin, super_admin | List staff |
| POST | `/` | principal, school_admin, super_admin | Add staff member |
| POST | `/invite` | principal, school_admin, super_admin | Invite staff (creates account + assigns role) |
| PUT | `/{id}` | principal, school_admin, super_admin | Update staff |
| DELETE | `/{id}` | principal, school_admin, super_admin | Remove staff |

### Attendance (`/api/v1/learners/{learnerId}/attendance`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get attendance (optional `from`/`to`) |
| POST | `/` | teacher, principal, school_admin, super_admin | Record attendance |
| PUT | `/{id}` | teacher, principal, school_admin, super_admin | Update record |

### Marks (`/api/v1/learners/{learnerId}/marks`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get marks (optional `term` filter) |
| POST | `/` | teacher, principal, school_admin, super_admin | Record mark |
| PUT | `/{id}` | teacher, principal, school_admin, super_admin | Update mark |

### Discipline (`/api/v1/learners/{learnerId}/discipline`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get discipline records |
| POST | `/` | teacher, principal, school_admin, super_admin | Create record |
| DELETE | `/{id}` | principal, school_admin, super_admin | Delete record |

### Notifications (`/api/v1/notifications`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | Authenticated | Get notifications (`?unreadOnly=true`) |
| GET | `/unread-count` | Authenticated | Get unread count |
| PATCH | `/{id}/read` | Authenticated | Mark one as read |
| POST | `/read-all` | Authenticated | Mark all as read |

### Link Requests (`/api/v1/link-requests`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/link-requests/mine` | parent | Get own requests |
| POST | `/link-requests` | parent | Submit learner-link request |
| GET | `/schools/{id}/link-requests` | principal, school_admin, super_admin | View school's requests |
| POST | `/link-requests/{id}/approve` | principal, school_admin, super_admin | Approve request |
| POST | `/link-requests/{id}/reject` | principal, school_admin, super_admin | Reject request |

### Transfers (`/api/v1/transfers`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/school/{id}` | principal, school_admin, super_admin | Transfers for a school |
| GET | `/learner/{id}` | Authenticated | Transfers for a learner |
| POST | `/` | parent, principal, school_admin, super_admin | Request transfer |
| PATCH | `/{id}/status` | principal, school_admin, super_admin | Approve/reject transfer |

### Audit (`/api/v1/schools/{schoolId}/audit`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/` | principal, school_admin, super_admin | Paginated audit log |

---

## Authentication Flow

PASA uses **JWT-based stateless authentication** with **portal-separated sign-in**.

```
┌─────────┐         ┌─────────────┐         ┌────────────┐
│  Client │         │  /api/v1/   │         │  Database  │
└────┬────┘         └──────┬──────┘         └─────┬──────┘
     │                      │                      │
     │  POST /auth/parent/  │                      │
     │       register       │                      │
     ├─────────────────────►│  create account      │
     │                      ├─────────────────────►│
     │                      │◄─────────────────────┤
     │◄─── { token, role } ─┤                      │
     │                      │                      │
     │  POST /auth/{portal}/│                      │
     │       signin         │                      │
     ├─────────────────────►│  validate creds      │
     │                      │  check portal match  │
     │                      ├─────────────────────►│
     │                      │◄─────────────────────┤
     │◄─── { token, role } ─┤  (or 403 if wrong   │
     │                      │   portal)            │
     │                      │                      │
     │  GET /api/v1/...     │                      │
     │  Authorization:      │                      │
     │  Bearer <token>      │                      │
     ├─────────────────────►│  verify JWT          │
     │                      │  extract userId+role │
     │◄─── response ────────┤                      │
```

### Portal Separation

Three sign-in endpoints enforce strict role boundaries:

| Endpoint | Allowed Roles | Rejects |
|---|---|---|
| `POST /auth/parent/signin` | parent | staff, admin → 403 |
| `POST /auth/staff/signin` | teacher, principal, school_admin | parent, super_admin → 403 |
| `POST /auth/admin/signin` | super_admin | all others → 403 |

**Why?** This prevents dashboard flash — if a staff member accidentally signs into the parent portal, the server rejects the request before issuing any token. The frontend never receives a JWT for the wrong portal.

### Password Reset

1. `POST /auth/forgot-password` — sends reset link to the provided email (always returns 200 to prevent email enumeration)
2. `POST /auth/reset-password` — validates the token and updates the password

### Token Details

- Valid for **24 hours** (`pasa.jwt.expiration-ms=86400000`)
- Contains: `sub` (user ID), `role`, `iat`, `exp`
- Signed with HMAC-SHA using `JWT_SECRET`

---

## Role-Based Access

| Role | Can Do |
|---|---|
| `parent` | View own children, attendance, marks, discipline. Submit link requests and transfers. |
| `teacher` | Everything a parent can see for their school's learners. Create calendar events, record attendance, marks, discipline. |
| `principal` | All teacher abilities + manage staff, approve link requests, manage classes, delete records, view audit log. |
| `school_admin` | Same as principal (administrative peer). |
| `super_admin` | Full access. Create/manage schools, districts, users, roles. Platform-wide administration. |

Roles are enforced via `@PreAuthorize` annotations on controllers and the `SecurityConfig` request matchers.

---

## Database

- **Provider:** Supabase (managed PostgreSQL)
- **Connection:** Direct connection on port 5432
- **ORM:** Spring Data JPA with Hibernate
- **DDL mode:** `validate` — Hibernate checks that entities match the schema but never modifies it. Schema changes are managed via Supabase migrations.
- **Schema:** Application entities live in `public` schema; auth is managed by Supabase in `auth` schema.

---

## Deployment

- **Target:** AWS (EC2/ECS)
- **Build artifact:** Fat JAR via `./mvnw package`
- **Health check:** `GET /actuator/health` (public)
- **CORS:** Configure `PASA_CORS_ORIGINS` with your production frontend URL

```bash
# Build the JAR
./mvnw clean package -DskipTests

# Run in production
java -jar target/pasa-backend-0.0.1-SNAPSHOT.jar
```

---

## Tech Stack Summary

| Layer | Tool |
|---|---|
| Framework | Spring Boot 3.3 |
| Language | Java 21 |
| Security | Spring Security + JWT (jjwt 0.12) |
| Data | Spring Data JPA + PostgreSQL |
| Validation | Jakarta Bean Validation |
| API docs | Springdoc OpenAPI (Swagger UI) |
| Monitoring | Spring Boot Actuator |
| Boilerplate | Lombok |
| Build | Maven (wrapper included) |
| Database | Supabase PostgreSQL |
| Deployment | AWS |
