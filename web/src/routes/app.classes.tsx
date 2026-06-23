import { createFileRoute } from "@tanstack/react-router";
import { ClassesPage } from "@/features/classes/ClassesPage";

export const Route = createFileRoute("/app/classes")({
  component: ClassesPage,
});

