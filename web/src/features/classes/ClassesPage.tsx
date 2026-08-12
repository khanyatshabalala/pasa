import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, GraduationCap, ShieldAlert, Users } from "lucide-react";
import type { ClassResponse, GradeResponse, StaffResponse } from "@/lib/api";

const CURRENT_YEAR = new Date().getFullYear();

export function ClassesPage() {
  const { primaryRole, primarySchoolId } = useAuth();
  const canManage = ["principal", "school_admin", "super_admin"].includes(primaryRole);

  const [classes, setClasses]   = useState<ClassResponse[]>([]);
  const [grades, setGrades]     = useState<GradeResponse[]>([]);
  const [staff, setStaff]       = useState<StaffResponse[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving]     = useState(false);

  const [name, setName]               = useState("");
  const [gradeId, setGradeId]         = useState("");
  const [teacherId, setTeacherId]     = useState("none");
  const [academicYear, setAcademicYear] = useState(String(CURRENT_YEAR));

  const load = async () => {
    if (!primarySchoolId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [classData, gradeData, staffData] = await Promise.all([
        api.get<ClassResponse[]>(`/api/v1/schools/${primarySchoolId}/classes`),
        api.get<GradeResponse[]>("/api/v1/grades"),
        api.get<StaffResponse[]>(`/api/v1/schools/${primarySchoolId}/staff`),
      ]);
      setClasses(classData);
      setGrades(gradeData);
      setStaff(staffData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [primarySchoolId]);

  const resetForm = () => {
    setName(""); setGradeId(""); setTeacherId("none");
    setAcademicYear(String(CURRENT_YEAR));
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Enter a class name");
    if (!gradeId)     return toast.error("Select a grade");
    if (!primarySchoolId) return;

    setSaving(true);
    try {
      await api.post(`/api/v1/schools/${primarySchoolId}/classes`, {
        name: name.trim(),
        gradeId,
        teacherUserId: teacherId === "none" ? null : teacherId,
        academicYear:  parseInt(academicYear),
      });
      toast.success(`Class "${name.trim()}" created`);
      setDialogOpen(false);
      resetForm();
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create class");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (cls: ClassResponse) => {
    setDeleting(cls.id);
    try {
      await api.delete(`/api/v1/schools/${primarySchoolId}/classes/${cls.id}`);
      toast.success(`"${cls.name}" deleted`);
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete class");
    } finally {
      setDeleting(null);
    }
  };

  if (!canManage) {
    return (
      <div className="max-w-lg">
        <PageHeader title="Classes" sub="Manage class groups at your school." />
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <ShieldAlert className="size-8 mx-auto mb-2 opacity-40" />
          Only principals and school admins can manage classes.
        </Card>
      </div>
    );
  }

  const gradeLabel = (id: string | null) =>
    grades.find(g => g.id === id)?.name ?? id ?? "—";

  const staffName = (uid: string | null) =>
    staff.find(s => s.userId === uid)?.fullName ?? "Unknown";

  // Group by gradeId
  const byGrade: Record<string, ClassResponse[]> = {};
  for (const c of classes) {
    const key = c.gradeId ?? "unset";
    (byGrade[key] ??= []).push(c);
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Classes"
        sub={`Manage class groups · ${CURRENT_YEAR}`}
        action={
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4 mr-1.5" /> Add class
          </Button>
        }
      />

      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Loading…</div>
      ) : classes.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <GraduationCap className="size-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium text-foreground mb-1">No classes yet</p>
          <p>Add classes to enable class-specific calendar events and discipline filtering.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(byGrade).map(([gId, list]) => (
            <div key={gId}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {gradeLabel(gId === "unset" ? null : gId)}
              </h2>
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="p-3">Class name</th>
                      <th className="p-3">Teacher</th>
                      <th className="p-3">Year</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map(cls => (
                      <tr key={cls.id} className="border-t align-middle">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-md bg-accent/10 grid place-items-center shrink-0">
                              <Users className="size-3.5 text-accent" />
                            </div>
                            <span className="font-medium">{cls.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {cls.teacherUserId
                            ? <Badge variant="secondary">{staffName(cls.teacherUserId)}</Badge>
                            : <span className="text-muted-foreground text-xs">Unassigned</span>}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">{cls.academicYear}</td>
                        <td className="p-3 text-right">
                          <Button size="icon" variant="ghost" disabled={deleting === cls.id} onClick={() => onDelete(cls)}>
                            {deleting === cls.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add class</DialogTitle></DialogHeader>
          <form onSubmit={onSave} className="space-y-4 mt-1">
            <div>
              <Label htmlFor="cls-name">Class name</Label>
              <Input id="cls-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 10A or Grade 4 Maths" required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label>Year</Label>
                <Select value={academicYear} onValueChange={setAcademicYear}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Assign teacher <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">Unassigned</SelectItem>
                  {staff.map(s => <SelectItem key={s.id} value={s.userId}>{s.fullName ?? s.userId}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={saving || !name.trim() || !gradeId} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {saving ? <><Loader2 className="size-4 animate-spin mr-2" />Saving…</> : <><Plus className="size-4 mr-2" />Create class</>}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
