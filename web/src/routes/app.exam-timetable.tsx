import { createFileRoute } from "@tanstack/react-router";
import { ExamTimetablePage } from "@/features/exams/ExamTimetablePage";

export const Route = createFileRoute("/app/exam-timetable")({
  component: ExamTimetablePage,
});

