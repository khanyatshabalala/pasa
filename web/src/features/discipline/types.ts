import type { UserRole } from "@/lib/auth-context";

export type DisciplineType = "merit" | "warning" | "detention" | "suspension" | "incident";

export interface DisciplineRow {
  id: string;
  date: string;
  title: string;
  description: string | null;
  type: DisciplineType;
  points: number | null;
  recorded_at: string;
  recorded_by: string | null;
  learner_id: string;
  learners: { first_name: string; last_name: string; grade_id: number } | null;
}

export interface Learner {
  id: string;
  first_name: string;
  last_name: string;
  grade_id: number;
  learner_number: string | null;
}

export interface LogRecordFormState {
  learnerId: string;
  type: DisciplineType | "";
  title: string;
  description: string;
  points: string;
  date: string;
}

export interface TermStats {
  merits: number;
  warnings: number;
  seriousCount: number;
  incidents: number;
}

export const TYPE_COLORS: Record<DisciplineType, string> = {
  merit:      "text-green-600 bg-green-500/10",
  warning:    "text-orange-500 bg-orange-500/10",
  detention:  "text-red-500 bg-red-500/10",
  suspension: "text-red-700 bg-red-700/10",
  incident:   "text-purple-600 bg-purple-500/10",
};

export const DISCIPLINE_TYPES: { value: DisciplineType; label: string }[] = [
  { value: "merit",      label: "Merit" },
  { value: "warning",    label: "Warning" },
  { value: "detention",  label: "Detention" },
  { value: "suspension", label: "Suspension" },
  { value: "incident",   label: "Incident" },
];
