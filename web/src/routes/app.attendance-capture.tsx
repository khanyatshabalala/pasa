import { createFileRoute } from "@tanstack/react-router";
import { AttendanceCapturePage } from "@/features/attendance/AttendanceCapturePage";

export const Route = createFileRoute("/app/attendance-capture")({
  component: AttendanceCapturePage,
});

