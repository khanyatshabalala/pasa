import { createFileRoute } from "@tanstack/react-router";
import { LinkRequestsPage } from "@/features/link-requests/LinkRequestsPage";

export const Route = createFileRoute("/app/link-requests")({
  component: LinkRequestsPage,
});

