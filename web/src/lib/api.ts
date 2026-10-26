/**
 * Central API client — all requests to the Spring Boot backend go through here.
 * JWT token is stored in localStorage and attached automatically.
 */

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

// ── Token helpers ─────────────────────────────────────────────────────────────

const TOKEN_KEY = "pasa_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts?: { skipAuth?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!opts?.skipAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      message = err.message ?? err.error ?? message;
    } catch {
      // ignore parse failure
    }
    throw new ApiError(message, res.status);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Convenience methods ───────────────────────────────────────────────────────

async function uploadRequest<T>(path: string, form: FormData): Promise<T> {
  // No Content-Type header — the browser sets the multipart boundary itself.
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: form });

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const err = await res.json();
      message = err.message ?? err.error ?? message;
    } catch {
      // ignore parse failure
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function blobRequest(path: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { method: "GET", headers });
  if (!res.ok) {
    throw new ApiError(`${res.status} ${res.statusText}`, res.status);
  }
  return res.blob();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown, opts?: { skipAuth?: boolean }) =>
    request<T>("POST", path, body, opts),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T = void>(path: string) => request<T>("DELETE", path),
  /** Multipart file upload (JWT attached, no Content-Type so the boundary is set by the browser). */
  upload: <T>(path: string, form: FormData) => uploadRequest<T>(path, form),
  /** Fetch a binary payload (e.g. a report-card PDF) as a Blob with the JWT attached. */
  getBlob: (path: string) => blobRequest(path),
};

// ── API types (mirrors backend DTOs) ─────────────────────────────────────────

export interface TokenResponse {
  token: string;
  userId: string;
  role: string;
}

export interface ProfileResponse {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  subscriptionTier: string;
  city: string | null;
  province: string | null;
}

export interface SchoolResponse {
  id: string;
  name: string;
  emisNumber: string | null;
  district: string | null;
  province: string | null;
  phase: string | null;
  schoolType: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  principalName: string | null;
  establishedYear: number | null;
  learnerCount: number | null;
  feesAnnual: number | null;
  logoUrl: string | null;
  motto: string | null;
  description: string | null;
  districtId: string | null;
  gradeFrom: number | null;
  gradeTo: number | null;
  applicationOpen: string | null;
  applicationClose: string | null;
  admissionRequirements: string | null;
  applicationContact: string | null;
  performanceAvg: number | null;
  performanceRankDistrict: number | null;
  performanceRankProvince: number | null;
  performanceRankNational: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DistrictResponse {
  id: string;
  name: string;
  province: string;
  code: string | null;
}

export interface LearnerResponse {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  gradeId: number | null;
  learnerNumber: string | null;
  gender: string | null;
  dateOfBirth: string | null;
}

export interface AttendanceResponse {
  id: string;
  learnerId: string;
  date: string;
  status: string;
  notes: string | null;
}

export interface DisciplineResponse {
  id: string;
  learnerId: string;
  type: string;
  title: string;
  description: string | null;
  points: number | null;
  date: string;
}

export interface MarkResponse {
  id: string;
  learnerId: string;
  subject: string;
  term: number;
  score: number;
  maxScore: number;
  academicYear: number;
}

export interface ClassResponse {
  id: string;
  schoolId: string;
  name: string;
  gradeId: number | null;
  teacherUserId: string | null;
  academicYear: number;
}

export interface CalendarEventResponse {
  id: string;
  schoolId: string;
  classId: string | null;
  title: string;
  eventType: string;
  eventDate: string;
  eventTime: string | null;
  description: string | null;
}

export interface ExamEntryResponse {
  id: string;
  subject: string;
  gradeId: number | null;
  examDate: string;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  notes: string | null;
  term: number;
}

export interface LinkRequestResponse {
  id: string;
  parentUserId: string;
  schoolId: string;
  schoolName: string | null;
  learnerNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  relationship: string | null;
  status: string;
  createdAt: string;
}

export interface TransferResponse {
  id: string;
  learnerId: string;
  learnerName: string | null;
  fromSchoolId: string;
  fromSchoolName: string | null;
  toSchoolId: string;
  toSchoolName: string | null;
  status: string;
  reason: string | null;
  requestedAt: string;
}

export interface NotificationResponse {
  id: string;
  title: string;
  body: string;
  category: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface StaffResponse {
  id: string;
  userId: string;
  schoolId: string;
  fullName: string | null;
  email: string | null;
  role: string | null;
  staffNumber: string | null;
  position: string | null;
}

export interface AuditLogResponse {
  id: string;
  schoolId: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  actorUserId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminUserResponse {
  id: string;
  email: string;
  fullName: string | null;
  roles: { id: string; role: string; schoolId: string | null }[];
}

export interface GradeResponse {
  id: number;
  label: string;
  phase: string | null;
}

export interface ReportCardResponse {
  id: string;
  learnerId: string;
  schoolId: string;
  academicYear: number;
  term: number;
  fileName: string;
  uploadedBy: string | null;
  uploadedByName: string | null;
  uploadedAt: string;
  notes: string | null;
  learnerFirstName: string | null;
  learnerLastName: string | null;
}

export interface AdminStatsResponse {
  schools: number;
  districts: number;
  users: number;
  learners: number;
  pendingLinkRequests: number;
  pendingSchoolRequests: number;
}

export interface SchoolRequestResponse {
  id: string;
  schoolName: string;
  province: string;
  district: string;
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string | null;
  message: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
}

export interface ParentDashboardResponse {
  children: Array<{
    id: string;
    firstName: string;
    lastName: string;
    schoolId: string | null;
    schoolName: string | null;
    gradeId: number | null;
    relationship: string | null;
    isPrimary: boolean | null;
  }>;
  todayAttendance: Record<string, string>;
  unreadCount: number;
  nextEvent: {
    id: string;
    title: string;
    eventDate: string;
    eventTime: string | null;
    eventType: string | null;
    schoolName: string | null;
  } | null;
  recentAlerts: Array<{
    id: string;
    title: string;
    body: string | null;
    category: string | null;
    createdAt: string;
  }>;
}

export interface SchoolDashboardResponse {
  school: {
    id: string;
    name: string | null;
    district: string | null;
    province: string | null;
  };
  learnerCount: number;
  todayAttendance: {
    present: number;
    late: number;
    absent: number;
    total: number;
    captured: boolean;
  };
  recentDiscipline: Array<{
    id: string;
    type: string | null;
    title: string;
    date: string;
    learnerFirstName: string | null;
    learnerLastName: string | null;
  }>;
  nextEvent: {
    id: string;
    title: string;
    eventDate: string;
    eventTime: string | null;
    eventType: string | null;
  } | null;
  weekEvents: Array<{
    id: string;
    title: string;
    eventDate: string;
    eventTime: string | null;
    eventType: string | null;
  }>;
  pendingLinkRequests: number;
}

export interface NationalCalendarEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  description: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ParentChildResponse {
  learnerId: string;
  learnerFirstName: string;
  learnerLastName: string;
  learnerNumber: string | null;
  gradeId: number | null;
  schoolId: string;
  schoolName: string | null;
  relationship: string | null;
  isPrimary: boolean;
}
