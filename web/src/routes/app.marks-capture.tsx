import { createFileRoute } from "@tanstack/react-router";
import { ReportCardUploadPage } from "@/features/marks/ReportCardUploadPage";

export const Route = createFileRoute("/app/marks-capture")({
  component: ReportCardUploadPage,
});

