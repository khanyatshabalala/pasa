import { createFileRoute } from "@tanstack/react-router";
import { DistrictsPage } from "@/features/admin/DistrictsPage";

export const Route = createFileRoute("/admin/districts")({
  component: DistrictsPage,
});
