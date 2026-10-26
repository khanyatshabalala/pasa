import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import type { Grade, FormState } from "./types";
import { CURRENT_YEAR, YEARS, TERMS, todayIso, currentTerm } from "./types";

export function ExamForm({
  open,
  grades,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  grades: Grade[];
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { primarySchoolId } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>({
    subject: "",
    gradeId: "all",
    examDate: todayIso(),
    startTime: "",
    endTime: "",
    venue: "",
    notes: "",
    term: String(currentTerm()),
    academicYear: String(CURRENT_YEAR),
  });

  const reset = () =>
    setForm({
      subject: "",
      gradeId: "all",
      examDate: todayIso(),
      startTime: "",
      endTime: "",
      venue: "",
      notes: "",
      term: String(currentTerm()),
      academicYear: String(CURRENT_YEAR),
    });

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) return toast.error("Enter a subject");
    if (!form.examDate)       return toast.error("Select an exam date");
    if (!primarySchoolId)     return toast.error("No school assigned");

    setSaving(true);
    try {
      await api.post(`/api/v1/schools/${primarySchoolId}/exam-timetable`, {
        subject:   form.subject.trim(),
        gradeId:   form.gradeId !== "all" ? parseInt(form.gradeId) : null,
        examDate:  form.examDate,
        startTime: form.startTime || null,
        endTime:   form.endTime || null,
        venue:     form.venue.trim() || null,
        notes:     form.notes.trim() || null,
        term:      parseInt(form.term),
      });
      toast.success("Exam added to timetable");
      reset();
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof FormState) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add exam</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Subject */}
          <div>
            <Label>Subject</Label>
            <Input
              value={form.subject}
              onChange={(e) => set("subject")(e.target.value)}
              placeholder="e.g. Mathematics"
              maxLength={100}
            />
          </div>

          {/* Grade */}
          <div>
            <Label>Grade <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Select value={form.gradeId} onValueChange={set("gradeId")}>
              <SelectTrigger>
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

          {/* Term + Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Term</Label>
              <Select value={form.term} onValueChange={set("term")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TERMS.map((t) => (
                    <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year</Label>
              <Select value={form.academicYear} onValueChange={set("academicYear")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div>
            <Label>Exam date</Label>
            <Input
              type="date"
              value={form.examDate}
              onChange={(e) => set("examDate")(e.target.value)}
            />
          </div>

          {/* Start + End time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start time <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => set("startTime")(e.target.value)}
              />
            </div>
            <div>
              <Label>End time <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => set("endTime")(e.target.value)}
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <Label>Venue <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              value={form.venue}
              onChange={(e) => set("venue")(e.target.value)}
              placeholder="e.g. Hall A"
              maxLength={100}
            />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes")(e.target.value)}
              placeholder="Any additional information…"
              rows={2}
              maxLength={500}
            />
          </div>

          <Button
            type="submit"
            disabled={saving || !form.subject.trim() || !form.examDate}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {saving
              ? <><Loader2 className="size-4 animate-spin mr-2" />Saving…</>
              : <><Plus className="size-4 mr-2" />Add exam</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
