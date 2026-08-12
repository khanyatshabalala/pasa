import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import type { Learner, DisciplineType, LogRecordFormState } from "./types";
import { DISCIPLINE_TYPES } from "./types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function DisciplineForm({
  open,
  learners,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  learners: Learner[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [form, setForm] = useState<LogRecordFormState>({
    learnerId: "",
    type: "",
    title: "",
    description: "",
    points: "",
    date: todayIso(),
  });

  // Derive sorted unique grades from the learner list
  const gradeOptions = Array.from(new Set(learners.map((l) => l.grade_id)))
    .sort((a, b) => a - b);

  // When grade filter changes, clear the selected learner
  const handleGradeChange = (v: string) => {
    setGradeFilter(v);
    setForm((f) => ({ ...f, learnerId: "" }));
  };

  // Learners visible in the dropdown — filtered by selected grade
  const visibleLearners = gradeFilter === "all"
    ? learners
    : learners.filter((l) => l.grade_id === parseInt(gradeFilter));

  const resetForm = () => {
    setGradeFilter("all");
    setForm({ learnerId: "", type: "", title: "", description: "", points: "", date: todayIso() });
  };

  const handleClose = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.learnerId) return toast.error("Select a learner");
    if (!form.type)      return toast.error("Select a type");
    if (!form.title.trim()) return toast.error("Enter a title");

    const points =
      form.points.trim() !== "" ? parseInt(form.points, 10) : null;
    if (points !== null && (isNaN(points) || points < 0))
      return toast.error("Points must be a non-negative number");

    setSaving(true);
    try {
      await api.post(`/api/v1/learners/${form.learnerId}/discipline`, {
        type:        form.type,
        title:       form.title.trim(),
        description: form.description.trim() || null,
        points,
        date:        form.date,
      });
      toast.success("Record logged successfully");
      resetForm();
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to log record");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log discipline record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Step 1: Grade filter → Step 2: Learner */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Grade</Label>
              <Select value={gradeFilter} onValueChange={handleGradeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All grades</SelectItem>
                  {gradeOptions.map((g) => (
                    <SelectItem key={g} value={String(g)}>
                      Grade {g === 0 ? "R" : g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Learner</Label>
              <Select
                value={form.learnerId}
                onValueChange={(v) => setForm((f) => ({ ...f, learnerId: v }))}
                disabled={visibleLearners.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      gradeFilter === "all"
                        ? "Pick a grade first"
                        : visibleLearners.length === 0
                        ? "No learners in this grade"
                        : "Select learner"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {visibleLearners.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.first_name} {l.last_name}
                      {l.learner_number && (
                        <span className="text-muted-foreground ml-1.5 text-xs">· {l.learner_number}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {gradeFilter !== "all" && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {visibleLearners.length} learner{visibleLearners.length !== 1 ? "s" : ""} in this grade
                </p>
              )}
            </div>
          </div>

          {/* Type + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as DisciplineType }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DISCIPLINE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                max={todayIso()}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Disruptive behaviour in class"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <Label>
              Description <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Additional details…"
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Points */}
          <div>
            <Label>
              Points <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={form.points}
              onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))}
              placeholder="e.g. 5"
              className="w-32"
            />
          </div>

          <Button
            type="submit"
            disabled={saving || !form.learnerId || !form.type || !form.title.trim()}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {saving ? (
              <><Loader2 className="size-4 animate-spin mr-2" />Saving…</>
            ) : (
              <><Plus className="size-4 mr-2" />Log record</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
