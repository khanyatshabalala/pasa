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

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown, opts?: { skipAuth?: boolean }) =>
    request<T>("POST", path, body, opts),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T = void>(path: string) => request<T>("DELETE", path),
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
  gradeFrom: string | null;
  gradeTo: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
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
  gradeId: string | null;
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
  gradeId: string | null;
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
  schoolId: string;
  subject: string;
  gradeId: string;
  examDate: string;
  startTime: string | null;
  endTime: string | null;
  term: number;
  academicYear: number;
}

export interface LinkRequestResponse {
  id: string;
  parentUserId: string;
  parentName: string | null;
  schoolId: string;
  learnerId: string | null;
  learnerFirstName: string | null;
  learnerLastName: string | null;
  learnerNumber: string | null;
  status: string;
  rejectionReason: string | null;
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
  id: string;
  name: string;
  order: number;
  phase: string | null;
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
  gradeId: string | null;
  schoolId: string;
  schoolName: string | null;
  relationship: string | null;
  isPrimary: boolean;
}
