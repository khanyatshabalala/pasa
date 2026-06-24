import { createFileRoute } from "@tanstack/react-router";
import { LearnerDetailPage } from "@/features/learners/LearnerDetailPage";

export const Route = createFileRoute("/app/learner/$learnerId")({
  component: LearnerDetailPage,
});
