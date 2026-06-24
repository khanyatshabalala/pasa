import { createFileRoute } from "@tanstack/react-router";
import { AlertsPage } from "@/features/notifications/AlertsPage";

export const Route = createFileRoute("/app/alerts")({
  component: AlertsPage,
});
