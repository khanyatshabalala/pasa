import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { api, type AdminStatsResponse } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Map, Users, GraduationCap, School } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function Stat({ icon: Icon, label, value, to }: { icon: any; label: string; value: number | string; to: any }) {
  return (
    <Link to={to}>
      <Card className="p-5 hover:border-accent/40 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="text-3xl font-bold mt-1">{value}</div>
          </div>
          <div className="size-10 rounded-lg bg-accent/15 text-accent grid place-items-center">
            <Icon className="size-5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function AdminOverview() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError(null);
    try {
      setStats(await api.get<AdminStatsResponse>("/api/v1/admin/stats"));
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : "Could not load platform statistics.");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Platform overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage the entire PASA network from here.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Stat icon={Building2} label="Schools onboarded" value={stats?.schools ?? (loadingStats ? "…" : "—")} to="/admin/schools" />
        <Stat icon={Map} label="Districts" value={stats?.districts ?? "—"} to="/admin/districts" />
        <Stat icon={Users} label="Users" value={stats?.users ?? "—"} to="/admin/users" />
        <Stat icon={GraduationCap} label="Learners" value={stats?.learners ?? "—"} to="/admin/schools" />
        <Stat icon={School} label="Pending requests" value={stats?.pendingSchoolRequests ?? "—"} to="/admin/requests" />
      </div>
      {statsError && (
        <div role="alert" className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <span className="text-destructive">{statsError}</span>
          <Button size="sm" variant="outline" onClick={() => void loadStats()}>Retry</Button>
        </div>
      )}

      <Card className="p-6 mt-8">
        <h2 className="font-semibold mb-3">Quick start</h2>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
          <li>Review <Link to="/admin/requests" className="text-accent hover:underline">school registration requests</Link> from schools that want to join PASA.</li>
          <li>Create a <Link to="/admin/districts" className="text-accent hover:underline">district</Link> for the area you're onboarding.</li>
          <li>Add a <Link to="/admin/schools" className="text-accent hover:underline">school</Link> and link it to that district.</li>
          <li>Find the school's principal in <Link to="/admin/users" className="text-accent hover:underline">Users & roles</Link> and assign them as principal of that school.</li>
        </ol>
      </Card>
    </div>
  );
}
