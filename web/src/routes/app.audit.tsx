import { createFileRoute } from "@tanstack/react-router";
import { AuditLogPage } from "@/features/audit/AuditLogPage";

export const Route = createFileRoute("/app/audit")({
  component: AuditLogPage,
});

