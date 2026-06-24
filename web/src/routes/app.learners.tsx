import { createFileRoute } from "@tanstack/react-router";
import { LearnersPage } from "@/features/learners/LearnersPage";

export const Route = createFileRoute("/app/learners")({
  component: LearnersPage,
});
