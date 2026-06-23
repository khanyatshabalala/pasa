export type CalEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  event_type: string | null;
  source: "national" | "school";
  schools?: { name: string } | null;
  classes?: { name: string } | null;
};

export type ClassOption = {
  id: string;
  name: string;
  grade_id: number;
};

export const EVENT_TYPES = [
  { value: "extra_class",   label: "Extra class" },
  { value: "meeting",       label: "Meeting" },
  { value: "sport",         label: "Sport" },
  { value: "cultural",      label: "Cultural" },
  { value: "exam",          label: "Exam" },
  { value: "other",         label: "Other" },
];

export const EVENT_COLORS: Record<string, string> = {
  term_start:     "bg-green-500",
  term_end:       "bg-orange-500",
  public_holiday: "bg-red-500",
  holiday:        "bg-red-400",
  exam:           "bg-orange-500",
  sport:          "bg-blue-500",
  meeting:        "bg-purple-500",
  cultural:       "bg-pink-500",
  default:        "bg-accent",
};

export const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

export function eventColor(type: string | null) {
  return EVENT_COLORS[type?.toLowerCase() ?? ""] ?? EVENT_COLORS.default;
}

export function formatTime(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}
