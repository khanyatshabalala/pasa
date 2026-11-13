/** Formats a learner's grade+class as "Grade 10A", "Grade 10", or "Grade R". */
export function gradeClassLabel(gradeId: number | null, className?: string | null): string {
  if (gradeId === null && !className) return "—";
  const grade = gradeId === null ? "" : gradeId === 0 ? "Grade R" : `Grade ${gradeId}`;
  if (!className) return grade;
  return className.match(/^\d/) ? `Grade ${className}` : `${grade}${className}`;
}

interface Props {
  gradeId: number | null;
  className?: string | null;
  badge?: boolean;
}

/** Renders the grade+class label, optionally as a plain span (badge styling handled by caller). */
export function GradeClassDisplay({ gradeId, className }: Props) {
  return <span>{gradeClassLabel(gradeId, className)}</span>;
}
