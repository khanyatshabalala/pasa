import { createFileRoute } from "@tanstack/react-router";
import { MarksPage } from "@/features/marks/MarksPage";

export const Route = createFileRoute("/app/marks")({
  component: MarksPage,
});
