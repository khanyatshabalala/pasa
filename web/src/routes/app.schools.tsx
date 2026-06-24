import { createFileRoute } from "@tanstack/react-router";
import { SchoolsPage } from "@/features/schools/SchoolsPage";

export const Route = createFileRoute("/app/schools")({
  component: SchoolsPage,
});
