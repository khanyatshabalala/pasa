import { createFileRoute } from "@tanstack/react-router";
import { ChildDetailPage } from "@/features/children/ChildDetailPage";

export const Route = createFileRoute("/app/child/$learnerId")({
  component: ChildDetailPage,
});
