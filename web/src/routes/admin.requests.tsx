import { createFileRoute } from "@tanstack/react-router";
import { SchoolRequestsPage } from "@/features/admin/SchoolRequestsPage";

export const Route = createFileRoute("/admin/requests")({
  component: SchoolRequestsPage,
});
