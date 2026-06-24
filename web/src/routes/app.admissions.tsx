import { createFileRoute } from "@tanstack/react-router";
import { AdmissionsPage } from "@/features/admissions/AdmissionsPage";

export const Route = createFileRoute("/app/admissions")({
  component: AdmissionsPage,
});
