import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardList, ShieldAlert, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react";
import type { ClassResponse, LearnerResponse, AttendanceResponse } from "@/lib/api";

type AttendanceStatus = "present" | "late" | "absent";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { value: "present", label: "Present", color: "bg-green-600 hover:bg-green-700 text-white",        icon: <CheckCircle2 className="size-3.5" /> },
  { value: "late",    label: "Late",    color: "bg-orange-500 hover:bg-orange-600 text-white",      icon: <Clock className="size-3.5" /> },
  { value: "absent",  label: "Absent",  color: "bg-destructive hover:bg-destructive/90 text-white", icon: <XCircle className="size-3.5" /> },
];

function todayIso() { return new Date().toISOString().slice(0, 10); }

export function AttendanceCapturePage() {
  const { primaryRole, primarySchoolId } = useAuth();
  const isStaff = ["teacher", "principal", "school_admin", "super_admin"].includes(primaryRole);

  const [classes, setClasses]             = useState<ClassResponse[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassResponse | null>(null);
  const [learners, setLearners]           = useState<LearnerResponse[]>([]);
  const [attendance, setAttendance]       = useState<Record<string, AttendanceStatus>>({});
  const [existingIds, setExistingIds]     = useState<Record<string, string>>({});
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [date]                            = useState(todayIso());

  // Load classes
  useEffect(() => {
    if (!primarySchoolId || !isStaff) { setLoading(false); return; }
    api.get<ClassResponse[]>(`/api/v1/schools/${primarySchoolId}/classes`)
      .then(list => {
        setClasses(list);
        if (list.length > 0) setSelectedClass(list[0]);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [primarySchoolId, isStaff]);

  // Load learners + existing attendance when class changes
  useEffect(() => {
    if (!selectedClass || !primarySchoolId) return;
    setLoading(true);

    const gradeParam = selectedClass.gradeId ? `?gradeId=${selectedClass.gradeId}` : "";
    Promise.all([
      api.get<LearnerResponse[]>(`/api/v1/schools/${primarySchoolId}/learners${gradeParam}`),
      api.get<AttendanceResponse[]>(`/api/v1/schools/${primarySchoolId}/attendance?date=${date}&classId=${selectedClass.id}`),
    ]).then(([learnersData, attData]) => {
      setLearners(learnersData);
      const statusMap: Record<string, AttendanceStatus> = {};
      const idMap: Record<string, string> = {};
      for (const row of attData) {
        statusMap[row.learnerId] = row.status as AttendanceStatus;
        idMap[row.learnerId] = row.id;
      }
      setAttendance(statusMap);
      setExistingIds(idMap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedClass, primarySchoolId, date]);

  const setStatus = (learnerId: string, status: AttendanceStatus) =>
    setAttendance(prev => ({ ...prev, [learnerId]: status }));

  const markAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {};
    learners.forEach(l => { all[l.id] = status; });
    setAttendance(all);
  };

  const doSave = async (statusMap: Record<string, AttendanceStatus>) => {
    setSaving(true);
    try {
      await Promise.all(
        learners.map(l =>
          api.post(`/api/v1/learners/${l.id}/attendance`, {
            date,
            status: statusMap[l.id] ?? "absent",
          })
        )
      );
      toast.success(`Attendance saved for ${new Date(date + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    const updated = { ...attendance };
    learners.filter(l => !updated[l.id]).forEach(l => { updated[l.id] = "absent"; });
    setAttendance(updated);
    await doSave(updated);
  };

  if (!isStaff) {
    return (
      <div className="max-w-lg">
        <PageHeader title="Attendance capture" sub="Daily roll call." />
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <ShieldAlert className="size-8 mx-auto mb-2 opacity-40" />
          Staff only.
        </Card>
      </div>
    );
  }

  const markedCount = learners.filter(l => attendance[l.id]).length;
  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-ZA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Attendance capture"
        sub={formattedDate}
        action={
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={saving || learners.length === 0}
            onClick={onSave}
          >
            {saving ? <><Loader2 className="size-4 animate-spin mr-2" />Saving…</> : <><ClipboardList className="size-4 mr-1.5" />Save attendance</>}
          </Button>
        }
      />

      {classes.length > 0 && (
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <span className="text-sm text-muted-foreground">Class:</span>
          <Select
            value={selectedClass?.id ?? ""}
            onValueChange={id => setSelectedClass(classes.find(c => c.id === id) ?? null)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {learners.length > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">
              {markedCount}/{learners.length} marked
            </span>
          )}
        </div>
      )}

      {learners.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-muted-foreground">Mark all:</span>
          {STATUS_OPTIONS.map(opt => (
            <Button key={opt.value} size="sm" className={`h-7 text-xs gap-1 ${opt.color}`} onClick={() => markAll(opt.value)}>
              {opt.icon}{opt.label}
            </Button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Loading…</div>
      ) : classes.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <ClipboardList className="size-8 mx-auto mb-2 opacity-40" />
          <p className="font-medium text-foreground mb-1">No classes set up</p>
          <p>Add classes first so you can take attendance per class.</p>
        </Card>
      ) : learners.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          No learners in this class.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Learner</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {learners.map(l => {
                const status = attendance[l.id];
                return (
                  <tr key={l.id} className="border-t align-middle">
                    <td className="p-3 font-medium">{l.firstName} {l.lastName}</td>
                    <td className="p-3">
                      <div className="flex gap-1.5 justify-end">
                        {STATUS_OPTIONS.map(opt => (
                          <Button
                            key={opt.value}
                            size="sm"
                            className={`h-7 px-2.5 text-xs gap-1 transition-opacity ${
                              status === opt.value ? opt.color : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                            onClick={() => setStatus(l.id, opt.value)}
                          >
                            {opt.icon}
                            <span className="hidden sm:inline">{opt.label}</span>
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
