import { createFileRoute } from "@tanstack/react-router";
import { StaffPage } from "@/features/staff/StaffPage";

export const Route = createFileRoute("/app/staff")({
  component: StaffPage,
});
