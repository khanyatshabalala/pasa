import { createFileRoute } from "@tanstack/react-router";
import { ChildrenPage } from "@/features/children/ChildrenPage";

export const Route = createFileRoute("/app/children")({
  component: ChildrenPage,
});
