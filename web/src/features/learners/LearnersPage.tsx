import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import type { LearnerResponse, GradeResponse } from "@/lib/api";

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

export function LearnersPage() {
  const { primarySchoolId, primaryRole } = useAuth();
  const canManage = ["principal", "school_admin", "super_admin"].includes(primaryRole);

  const [learners, setLearners] = useState<LearnerResponse[]>([]);
  const [grades, setGrades]     = useState<GradeResponse[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<LearnerResponse | null>(null);

  const [firstName, setFirstName]         = useState("");
  const [lastName, setLastName]           = useState("");
  const [gradeId, setGradeId]             = useState("");
  const [learnerNumber, setLearnerNumber] = useState("");
  const [gender, setGender]               = useState("");
  const [dob, setDob]                     = useState("");

  const load = async () => {
    if (!primarySchoolId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [l, g] = await Promise.all([
        api.get<LearnerResponse[]>(`/api/v1/schools/${primarySchoolId}/learners`),
        api.get<GradeResponse[]>("/api/v1/grades"),
      ]);
      setLearners(l);
      setGrades(g);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [primarySchoolId]);

  const openAdd = () => {
    setEditing(null);
    setFirstName(""); setLastName(""); setGradeId("");
    setLearnerNumber(""); setGender(""); setDob("");
    setDialogOpen(true);
  };

  const openEdit = (l: LearnerResponse) => {
    setEditing(l);
    setFirstName(l.firstName);
    setLastName(l.lastName);
    setGradeId(l.gradeId ?? "");
    setLearnerNumber(l.learnerNumber ?? "");
    setGender(l.gender ?? "");
    setDob(l.dateOfBirth ?? "");
    setDialogOpen(true);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return toast.error("Enter first name");
    if (!lastName.trim())  return toast.error("Enter last name");
    if (!gradeId)          return toast.error("Select a grade");
    if (!primarySchoolId)  return;

    setSaving(true);
    const payload = {
      firstName:     firstName.trim(),
      lastName:      lastName.trim(),
      gradeId,
      learnerNumber: learnerNumber.trim() || null,
      gender:        gender || null,
      dateOfBirth:   dob || null,
    };

    try {
      if (editing) {
        await api.put(`/api/v1/learners/${editing.id}`, payload);
        toast.success("Learner updated");
      } else {
        await api.post(`/api/v1/schools/${primarySchoolId}/learners`, payload);
        toast.success("Learner added");
      }
      setDialogOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save learner");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (l: LearnerResponse) => {
    if (!confirm(`Delete ${l.firstName} ${l.lastName}? This cannot be undone.`)) return;
    setDeleting(l.id);
    try {
      await api.delete(`/api/v1/learners/${l.id}`);
      toast.success("Learner deleted");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete learner");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = learners.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${l.firstName} ${l.lastName}`.toLowerCase().includes(q)
      || (l.learnerNumber ?? "").toLowerCase().includes(q);
  });

  const gradeLabel = (id: string | null) =>
    grades.find(g => g.id === id)?.name ?? id ?? "—";

  if (!primarySchoolId) {
    return <div className="max-w-2xl"><PageHeader title="Learners" sub="No school assigned to your account." /></div>;
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Learners"
        sub={`${learners.length} learner${learners.length !== 1 ? "s" : ""} registered`}
        action={
          canManage ? (
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={openAdd}>
              <Plus className="size-4 mr-1.5" /> Add learner
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search by name or learner number…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <Users className="size-8 mx-auto mb-2 opacity-40" />
          {search ? "No learners match your search." : canManage
            ? <><p className="font-medium text-foreground mb-1">No learners yet</p><p>Click "Add learner" to register the first learner.</p></>
            : "No learners registered yet."}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Learner no.</th>
                <th className="p-3">Grade</th>
                <th className="p-3">Gender</th>
                <th className="p-3">Date of birth</th>
                {canManage && <th className="p-3 w-20"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className="border-t align-middle hover:bg-muted/30">
                  <td className="p-3 font-medium">
                    <Link to="/app/learner/$learnerId" params={{ learnerId: l.id }} className="hover:text-accent transition-colors">
                      {l.firstName} {l.lastName}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{l.learnerNumber ?? "—"}</td>
                  <td className="p-3"><Badge variant="secondary">{gradeLabel(l.gradeId)}</Badge></td>
                  <td className="p-3 text-muted-foreground capitalize">{l.gender ?? "—"}</td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {l.dateOfBirth
                      ? new Date(l.dateOfBirth + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  {canManage && (
                    <td className="p-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(l)}><Pencil className="size-4" /></Button>
                        <Button size="icon" variant="ghost" disabled={deleting === l.id} onClick={() => onDelete(l)}>
                          {deleting === l.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={v => setDialogOpen(v)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Edit learner" : "Add learner"}</DialogTitle></DialogHeader>
          <form onSubmit={onSave} className="space-y-4 mt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fn">First name</Label>
                <Input id="fn" value={firstName} onChange={e => setFirstName(e.target.value)} required autoFocus placeholder="e.g. Sipho" />
              </div>
              <div>
                <Label htmlFor="ln">Last name</Label>
                <Input id="ln" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="e.g. Dlamini" />
              </div>
            </div>
            <div>
              <Label>Grade</Label>
              <Select value={gradeId} onValueChange={setGradeId}>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {grades.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lno">Learner number <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input id="lno" value={learnerNumber} onChange={e => setLearnerNumber(e.target.value)} placeholder="e.g. 2024001" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Gender <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Select value={gender || "none"} onValueChange={v => setGender(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dob">Date of birth <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="dob" type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={saving || !firstName.trim() || !lastName.trim() || !gradeId} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {saving ? <><Loader2 className="size-4 animate-spin mr-2" />Saving…</> : editing ? "Save changes" : <><Plus className="size-4 mr-2" />Add learner</>}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
