import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { ParentOverview } from "@/features/dashboard/ParentOverview";
import { SchoolOverview } from "@/features/dashboard/SchoolOverview";

export const Route = createFileRoute("/app/")({
  component: () => {
    const { primaryRole } = useAuth();
    // Parents get the parent dashboard; all school roles (including super_admin) get school overview
    return primaryRole === "parent" ? <ParentOverview /> : <SchoolOverview />;
  },
});

