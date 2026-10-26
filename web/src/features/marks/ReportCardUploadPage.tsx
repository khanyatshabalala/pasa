import { useEffect, useRef, useState } from "react";
import { api, ApiError, type LearnerResponse, type ReportCardResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Loader2, ShieldAlert, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS  = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR + 1];
const TERMS  = [1, 2, 3, 4];

type Learner = LearnerResponse;
type ReportCard = ReportCardResponse;

export function ReportCardUploadPage() {
  const { primaryRole, primarySchoolId } = useAuth();
  const isStaff = ["teacher", "principal", "school_admin", "super_admin"].includes(primaryRole);

  const [learners, setLearners]   = useState<Learner[]>([]);
  const [reports, setReports]     = useState<ReportCard[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [yearFilter, setYearFilter] = useState(String(CURRENT_YEAR));
  const [termFilter, setTermFilter] = useState("all");

  // Upload dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [learnerId, setLearnerId]   = useState("");
  const [term, setTerm]             = useState(String(TERMS[0]));
  const [year, setYear]             = useState(String(CURRENT_YEAR));
  const [notes, setNotes]           = useState("");
  const [file, setFile]             = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!primarySchoolId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [lData, rData] = await Promise.all([
        api.get<Learner[]>(`/api/v1/schools/${primarySchoolId}/learners`),
        api.get<ReportCard[]>(`/api/v1/schools/${primarySchoolId}/report-cards`),
      ]);
      setLearners(lData);
      setReports([...rData].sort((a, b) => b.academicYear - a.academicYear || b.term - a.term));
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [primarySchoolId]);

  const resetDialog = () => {
    setLearnerId(""); setTerm(String(TERMS[0])); setYear(String(CURRENT_YEAR));
    setNotes(""); setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file)          return toast.error("Select a PDF file");
    if (!learnerId)     return toast.error("Select a learner");
    if (!primarySchoolId) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("term", term);
      form.append("academicYear", year);
      if (notes.trim()) form.append("notes", notes.trim());
      await api.upload(`/api/v1/learners/${learnerId}/report-cards`, form);
      toast.success("Report card uploaded. Parent has been notified.");
      setDialogOpen(false);
      resetDialog();
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (card: ReportCard) => {
    setDeleting(card.id);
    try {
      await api.delete(`/api/v1/learners/${card.learnerId}/report-cards/${card.id}`);
      toast.success("Report card deleted");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const onView = async (card: ReportCard) => {
    setDownloading(card.id);
    try {
      const blob = await api.getBlob(`/api/v1/learners/${card.learnerId}/report-cards/${card.id}/download`);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Could not open file");
    } finally {
      setDownloading(null);
    }
  };

  if (!isStaff) {
    return (
      <div className="max-w-lg">
        <PageHeader title="Report cards" sub="Upload term report cards for learners." />
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <ShieldAlert className="size-8 mx-auto mb-2 opacity-40" />
          Staff only.
        </Card>
      </div>
    );
  }

  // Filter
  const filtered = reports.filter(r => {
    if (yearFilter !== "all" && r.academicYear !== parseInt(yearFilter)) return false;
    if (termFilter !== "all" && r.term !== parseInt(termFilter)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = `${r.learnerFirstName ?? ""} ${r.learnerLastName ?? ""}`.toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Report cards"
        sub="Upload PDF report cards per learner per term. Parents are notified automatically."
        action={
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => setDialogOpen(true)}
          >
            <Upload className="size-4 mr-1.5" /> Upload report card
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search learner�" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={termFilter} onValueChange={setTermFilter}>
          <SelectTrigger className="w-28"><SelectValue placeholder="All terms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All terms</SelectItem>
            {TERMS.map(t => <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Loading�</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <FileText className="size-8 mx-auto mb-2 opacity-40" />
          {reports.length === 0
            ? <><p className="font-medium text-foreground mb-1">No report cards uploaded yet</p><p>Click "Upload report card" to get started.</p></>
            : "No report cards match your filters."}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Learner</th>
                <th className="p-3">Term</th>
                <th className="p-3">File</th>
                <th className="p-3">Uploaded</th>
                <th className="p-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(card => (
                <tr key={card.id} className="border-t align-middle">
                  <td className="p-3 font-medium">
                    {card.learnerFirstName} {card.learnerLastName}
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">Term {card.term} · {card.academicYear}</Badge>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs max-w-[180px] truncate">
                    {card.fileName}
                    {card.notes && <div className="italic mt-0.5 line-clamp-1">{card.notes}</div>}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(card.uploadedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" disabled={downloading === card.id} onClick={() => onView(card)} title="View">
                        {downloading === card.id ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" disabled={deleting === card.id} onClick={() => onDelete(card)} title="Delete">
                        {deleting === card.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Upload dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) resetDialog(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Upload report card</DialogTitle></DialogHeader>
          <form onSubmit={onUpload} className="space-y-4 mt-1">
            <div>
              <Label>Learner</Label>
              <Select value={learnerId} onValueChange={setLearnerId}>
                <SelectTrigger><SelectValue placeholder="Select learner" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {learners.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.firstName} {l.lastName} · Grade {l.gradeId === 0 ? "R" : l.gradeId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TERMS.map(t => <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>PDF file</Label>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-accent/15 file:text-accent hover:file:bg-accent/25 cursor-pointer mt-1"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground mt-1">Max 10 MB � PDF only</p>
            </div>
            <div>
              <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Supplementary report" rows={2} maxLength={300} />
            </div>
            <Button
              type="submit"
              disabled={uploading || !file || !learnerId}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {uploading ? <><Loader2 className="size-4 animate-spin mr-2" />Uploading�</> : <><Upload className="size-4 mr-2" />Upload</>}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
