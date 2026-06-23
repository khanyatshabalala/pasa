export interface ExamEntry {
  id: string;
  subject: string;
  grade_id: number | null;
  exam_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  notes: string | null;
  term: number;
  academic_year: number;
  created_by: string | null;
}

export interface Grade {
  id: number;
  label: string;
}

export interface FormState {
  subject: string;
  gradeId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  notes: string;
  term: string;
  academicYear: string;
}

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR - 1];
export const TERMS = [1, 2, 3, 4];

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function currentTerm() {
  const m = new Date().getMonth() + 1;
  if (m <= 3) return 1;
  if (m <= 6) return 2;
  if (m <= 9) return 3;
  return 4;
}

export function formatTime(t: string | null) {
  if (!t) return null;
  return t.slice(0, 5); // "HH:MM"
}

export function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-ZA", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}
