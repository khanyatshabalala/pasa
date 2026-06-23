import { createFileRoute } from "@tanstack/react-router";
import { DisciplinePage } from "@/features/discipline/DisciplinePage";

export const Route = createFileRoute("/app/discipline-school")({
  component: DisciplinePage,
});

