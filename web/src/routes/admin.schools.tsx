import { createFileRoute } from "@tanstack/react-router";
import { AdminSchoolsPage } from "@/features/admin/AdminSchoolsPage";

export const Route = createFileRoute("/admin/schools")({
  component: AdminSchoolsPage,
});
