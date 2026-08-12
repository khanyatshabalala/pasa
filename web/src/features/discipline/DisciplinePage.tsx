import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Star, AlertTriangle, ShieldAlert, Zap } from "lucide-react";
import type { DisciplineRow, DisciplineType, Learner, TermStats } from "./types";
import { DISCIPLINE_TYPES } from "./types";
import { DisciplineTable } from "./DisciplineTable";
import { DisciplineForm } from "./DisciplineForm";

// ── Helpers ────────────────────────────────────────────────────────────────

function getTermWindow(year: number): { termStart: string; termEnd: string; term: number } {
  const m = new Date().getMonth() + 1;
  if (m <= 3)  return { term: 1, termStart: `${year}-01-01`, termEnd: `${year}-03-31` };
  if (m <= 6)  return { term: 2, termStart: `${year}-04-01`, termEnd: `${year}-06-30` };
  if (m <= 9)  return { term: 3, termStart: `${year}-07-01`, termEnd: `${year}-09-30` };
  return       { term: 4, termStart: `${year}-10-01`, termEnd: `${year}-12-31` };
}

function filterRecords(
  records: DisciplineRow[],
  search: string,
  typeFilter: DisciplineType | "",
  dateFrom: string,
  dateTo: string,
): DisciplineRow[] {
  const q = search.trim().toLowerCase();
  return records.filter((r) => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (dateFrom && r.date < dateFrom) return false;
    if (dateTo && r.date > dateTo) return false;
    if (q) {
      const name = `${r.learners?.first_name ?? ""} ${r.learners?.last_name ?? ""}`.toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });
}

function computeTermStats(records: DisciplineRow[], termStart: string, termEnd: string): TermStats {
  const inWindow = records.filter((r) => r.date >= termStart && r.date <= termEnd);
  return {
    merits:       inWindow.filter((r) => r.type === "merit").length,
    warnings:     inWindow.filter((r) => r.type === "warning").length,
    seriousCount: inWindow.filter((r) => r.type === "detention" || r.type === "suspension").length,
    incidents:    inWindow.filter((r) => r.type === "incident").length,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`size-9 rounded-lg grid place-items-center shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export function DisciplinePage() {
  const { primaryRole, primarySchoolId } = useAuth();

  const [learners, setLearners] = useState<Learner[]>([]);
  const [records, setRecords]   = useState<DisciplineRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filters
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState<DisciplineType | "">("");
  const [dateFrom, setDateFrom]   = useState("");
  const [dateTo, setDateTo]       = useState("");

  const load = async () => {
    if (!primarySchoolId) return;
    setLoading(true);

    try {
      const learnersData = await api.get<{ id: string; firstName: string; lastName: string; gradeId: string | null; learnerNumber: string | null }[]>(
        `/api/v1/schools/${primarySchoolId}/learners`
      );

      // Map to local Learner shape
      const learnerList: Learner[] = learnersData.map(l => ({
        id: l.id,
        first_name: l.firstName,
        last_name: l.lastName,
        grade_id: parseInt(l.gradeId ?? "0") || 0,
        learner_number: l.learnerNumber,
      }));
      setLearners(learnerList);

      // Fetch discipline records for all learners at once via school endpoint
      const records = await api.get<any[]>(`/api/v1/schools/${primarySchoolId}/discipline`);
      setRecords(records);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load discipline records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [primarySchoolId]);

  const handleDelete = async (record: DisciplineRow) => {
    setDeleting(record.id);
    try {
      await api.delete(`/api/v1/learners/${record.learner_id}/discipline/${record.id}`);
      toast.success("Record deleted");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete record");
    } finally {
      setDeleting(null);
    }
  };

  // No school guard
  if (!primarySchoolId) {
    return (
      <div className="max-w-lg">
        <PageHeader title="Discipline" sub="Log incidents and merits." />
        <Card className="p-10 text-center text-muted-foreground text-sm">
          No school assigned to your account.
        </Card>
      </div>
    );
  }

  const year = new Date().getFullYear();
  const { termStart, termEnd, term } = getTermWindow(year);
  const stats = computeTermStats(records, termStart, termEnd);
  const filtered = filterRecords(records, search, typeFilter, dateFrom, dateTo);

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Discipline"
        sub={`Log incidents and merits · Term ${term} ${year}`}
        action={
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-4 mr-1.5" /> Log record
          </Button>
        }
      />

      {/* ── Term stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard
          label="Merits this term"
          value={stats.merits}
          icon={<Star className="size-4" />}
          colorClass="text-green-600 bg-green-500/10"
        />
        <StatCard
          label="Warnings this term"
          value={stats.warnings}
          icon={<AlertTriangle className="size-4" />}
          colorClass="text-orange-500 bg-orange-500/10"
        />
        <StatCard
          label="Detentions / suspensions"
          value={stats.seriousCount}
          icon={<ShieldAlert className="size-4" />}
          colorClass="text-red-500 bg-red-500/10"
        />
        <StatCard
          label="Incidents this term"
          value={stats.incidents}
          icon={<Zap className="size-4" />}
          colorClass="text-purple-600 bg-purple-500/10"
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search learner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter || "all"}
          onValueChange={(v) => setTypeFilter(v === "all" ? "" : v as DisciplineType)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {DISCIPLINE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-36"
          title="From date"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-36"
          title="To date"
        />
      </div>

      {/* ── Records table ── */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Loading…</div>
      ) : (
        <DisciplineTable
          records={filtered}
          allRecordsEmpty={records.length === 0}
          userId={user?.id}
          primaryRole={primaryRole}
          deleting={deleting}
          onDelete={handleDelete}
        />
      )}

      {/* ── Log record dialog ── */}
      <DisciplineForm
        open={dialogOpen}
        learners={learners}
        onOpenChange={setDialogOpen}
        onSaved={load}
      />
    </div>
  );
}
