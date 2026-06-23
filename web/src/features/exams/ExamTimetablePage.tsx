import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { friendlyDbError } from "@/lib/db-errors";
import type { ExamEntry, Grade } from "./types";
import { CURRENT_YEAR, YEARS, TERMS, currentTerm } from "./types";
import { ExamTable } from "./ExamTable";
import { ExamForm } from "./ExamForm";

// ── Main Page ──────────────────────────────────────────────────────────────

export function ExamTimetablePage() {
  const { primaryRole, primarySchoolId, user } = useAuth();

  const canManage = ["principal", "school_admin", "super_admin"].includes(primaryRole);

  const [exams, setExams]   = useState<ExamEntry[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Filters
  const [search, setSearch]         = useState("");
  const [termFilter, setTermFilter] = useState(String(currentTerm()));
  const [yearFilter, setYearFilter] = useState(String(CURRENT_YEAR));
  const [gradeFilter, setGradeFilter] = useState("all");

  const load = async () => {
    if (!primarySchoolId) return;
    setLoading(true);

    const [{ data: schoolData }, { data: g }, { data: e }] = await Promise.all([
      supabase.from("schools").select("phase").eq("id", primarySchoolId).maybeSingle(),
      supabase.from("grades").select("id, label").order("id"),
      (supabase as any)
        .from("exam_timetables")
        .select("id, subject, grade_id, exam_date, start_time, end_time, venue, notes, term, academic_year, created_by")
        .eq("school_id", primarySchoolId)
        .order("exam_date", { ascending: true })
        .order("start_time", { ascending: true }),
    ]);

    // Filter grades to those matching the school's phase
    const schoolPhase: string = (schoolData as any)?.phase ?? "";
    const allGrades = (g ?? []) as Grade[];
    const filteredGrades = schoolPhase === "combined" || !schoolPhase
      ? allGrades
      : allGrades.filter((gr) => {
          if (schoolPhase === "primary")   return gr.id <= 7;
          if (schoolPhase === "secondary") return gr.id >= 8;
          return true;
        });

    setGrades(filteredGrades);
    setExams((e ?? []) as ExamEntry[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [primarySchoolId]);

  const handleDelete = async (exam: ExamEntry) => {
    setDeleting(exam.id);
    const { error } = await (supabase as any)
      .from("exam_timetables")
      .delete()
      .eq("id", exam.id);
    setDeleting(null);
    if (error) return toast.error(friendlyDbError(error));
    toast.success("Exam removed");
    load();
  };

  if (!primarySchoolId) {
    return (
      <div className="max-w-lg">
        <PageHeader title="Exam timetable" sub="View and manage exam schedules." />
        <Card className="p-10 text-center text-muted-foreground text-sm">
          No school assigned to your account.
        </Card>
      </div>
    );
  }

  // Apply filters
  const filtered = exams.filter((e) => {
    if (termFilter !== "all" && e.term !== parseInt(termFilter)) return false;
    if (yearFilter !== "all" && e.academic_year !== parseInt(yearFilter)) return false;
    if (gradeFilter !== "all") {
      if (gradeFilter === "all_grades") {
        // show entries with no specific grade
        if (e.grade_id !== null) return false;
      } else if (e.grade_id !== parseInt(gradeFilter)) return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const haystack = [e.subject, e.venue ?? ""].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  // Group by date for display
  const grouped: Record<string, ExamEntry[]> = {};
  for (const exam of filtered) {
    if (!grouped[exam.exam_date]) grouped[exam.exam_date] = [];
    grouped[exam.exam_date].push(exam);
  }
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Exam timetable"
        sub="Schedule and view upcoming exams."
        action={
          canManage ? (
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="size-4 mr-1.5" /> Add exam
            </Button>
          ) : undefined
        }
      />

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search subject or venue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={termFilter} onValueChange={setTermFilter}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All terms</SelectItem>
            {TERMS.map((t) => (
              <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={gradeFilter} onValueChange={setGradeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All grades" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="all">All grades</SelectItem>
            {grades.map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Loading…</div>
      ) : (
        <ExamTable
          grouped={grouped}
          sortedDates={sortedDates}
          grades={grades}
          canManage={canManage}
          examsEmpty={exams.length === 0}
          deleting={deleting}
          onDelete={handleDelete}
        />
      )}

      <ExamForm
        open={dialogOpen}
        grades={grades}
        onOpenChange={setDialogOpen}
        onSaved={load}
      />
    </div>
  );
}
