import { createFileRoute } from "@tanstack/react-router";
import { SchoolDetailPage } from "@/features/admin/SchoolDetailPage";

export const Route = createFileRoute("/admin/schools/$schoolId")({
  component: SchoolDetailPage,
});
