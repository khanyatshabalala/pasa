import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/PageHeader";
import { GradeSelect } from "@/components/shared/GradeSelect";
import { ClassSelect } from "@/components/shared/ClassSelect";
import { gradeClassLabel } from "@/components/shared/GradeClassDisplay";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen, ClipboardList, Shield, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { LinkRequestResponse, ParentChildResponse, DistrictResponse, SchoolResponse } from "@/lib/api";

const PROVINCES = [
  "Eastern Cape","Free State","Gauteng","KwaZulu-Natal","Limpopo",
  "Mpumalanga","Northern Cape","North West","Western Cape",
] as const;

export function ChildrenPage() {
  const { user } = useAuth();
  const [children, setChildren]     = useState<ParentChildResponse[]>([]);
  const [requests, setRequests]     = useState<LinkRequestResponse[]>([]);
  const [open, setOpen]             = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Location cascade
  const [province, setProvince]     = useState("");
  const [districtId, setDistrictId] = useState("");
  const [schoolId, setSchoolId]     = useState("");
  const [districts, setDistricts]   = useState<DistrictResponse[]>([]);
  const [schools, setSchools]       = useState<SchoolResponse[]>([]);

  // Learner details
  const [gradeId, setGradeId]       = useState("");
  const [classId, setClassId]       = useState("");
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [learnerNo, setLearnerNo]   = useState("");
  const [relationship, setRelationship] = useState("parent");

  const load = async () => {
    if (!user) return;
    try {
      const [kids, reqs] = await Promise.all([
        api.get<ParentChildResponse[]>("/api/v1/children"),
        api.get<LinkRequestResponse[]>("/api/v1/link-requests/mine"),
      ]);
      setChildren(kids);
      setRequests(reqs);
    } catch { /* non-fatal */ }
  };

  useEffect(() => { load(); }, [user]);

  // Load districts when province changes.
  useEffect(() => {
    if (!province) { setDistricts([]); setDistrictId(""); setSchools([]); setSchoolId(""); return; }
    api.get<DistrictResponse[]>(`/api/v1/districts?province=${encodeURIComponent(province)}`)
      .then(d => { setDistricts(d); setDistrictId(""); setSchools([]); setSchoolId(""); })
      .catch(() => {});
  }, [province]);

  // Load schools when district changes (UUID first, name fallback for schools without districtId).
  useEffect(() => {
    if (!districtId) { setSchools([]); setSchoolId(""); return; }
    const dist = districts.find(d => d.id === districtId);
    api.get<SchoolResponse[]>(`/api/v1/schools?districtId=${encodeURIComponent(districtId)}`)
      .then(s => s.length > 0 ? s : dist
        ? api.get<SchoolResponse[]>(`/api/v1/schools?district=${encodeURIComponent(dist.name)}`)
        : Promise.resolve([] as SchoolResponse[]))
      .then(s => { setSchools(s); setSchoolId(""); })
      .catch(() => {});
  }, [districtId]);

  const resetDialog = () => {
    setProvince(""); setDistrictId(""); setSchoolId("");
    setDistricts([]); setSchools([]);
    setGradeId(""); setClassId("");
    setFirstName(""); setLastName(""); setLearnerNo("");
    setRelationship("parent");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId)         return toast.error("Select a school");
    if (!gradeId)          return toast.error("Select the learner's grade");
    if (!firstName.trim()) return toast.error("Enter the child's first name");
    if (!lastName.trim())  return toast.error("Enter the child's last name");
    if (!learnerNo.trim()) return toast.error("Enter the learner number");

    setSubmitting(true);
    try {
      await api.post("/api/v1/link-requests", {
        schoolId,
        firstName:    firstName.trim(),
        lastName:     lastName.trim(),
        learnerNumber: learnerNo.trim(),
        relationship,
        gradeId:      Number(gradeId),
        classId:      classId || null,
      });
      toast.success("Request submitted. The school will review and approve it.");
      setOpen(false);
      resetDialog();
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingRequests  = requests.filter(r => r.status === "pending");
  const rejectedRequests = requests.filter(r => r.status === "rejected");

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="My children"
        sub="Submit a request to link your child. The school will verify and approve it."
        action={
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setOpen(true)}>
            <Plus className="size-4 mr-1" /> Request to link a child
          </Button>
        }
      />

      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Pending approval</h2>
          <div className="space-y-2">
            {pendingRequests.map(r => (
              <Card key={r.id} className="p-4 flex items-center gap-3 border-orange-300/50 bg-orange-50/30 dark:bg-orange-950/10">
                <Clock className="size-4 text-orange-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.firstName} {r.lastName}</p>
                  <p className="text-xs text-muted-foreground">Learner no. {r.learnerNumber}</p>
                </div>
                <Badge variant="secondary" className="text-orange-500 bg-orange-100 dark:bg-orange-950/30 shrink-0">Pending</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {rejectedRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Not approved</h2>
          <div className="space-y-2">
            {rejectedRequests.map(r => (
              <Card key={r.id} className="p-4 flex items-center gap-3 border-red-300/50 bg-red-50/30 dark:bg-red-950/10">
                <XCircle className="size-4 text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.firstName} {r.lastName}</p>
                  {r.rejectionReason && <p className="text-xs text-red-500 mt-0.5">{r.rejectionReason}</p>}
                </div>
                <Badge variant="secondary" className="text-red-500 bg-red-100 dark:bg-red-950/30 shrink-0">Rejected</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {children.length === 0 && pendingRequests.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          No children linked yet. Click "Request to link a child" to get started.
        </Card>
      ) : children.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Linked children</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {children.map(c => (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {c.firstName} {c.lastName}
                      <CheckCircle2 className="size-3.5 text-green-500" />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.schoolName}</div>
                  </div>
                  <Badge variant="secondary">{gradeClassLabel(c.gradeId, c.className)}</Badge>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Button asChild size="sm" variant="outline" className="text-xs h-7">
                    <Link to="/app/marks"><BookOpen className="size-3 mr-1" />Reports</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs h-7">
                    <Link to="/app/attendance"><ClipboardList className="size-3 mr-1" />Attendance</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="text-xs h-7">
                    <Link to="/app/discipline"><Shield className="size-3 mr-1" />Discipline</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) resetDialog(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request to link a child</DialogTitle>
            <DialogDescription>
              Select the school and fill in your child's details exactly as registered.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4 mt-2">
            <div>
              <Label>Province</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                <SelectContent>{PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>District</Label>
              <Select value={districtId} onValueChange={setDistrictId} disabled={!province || districts.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={!province ? "Select province first" : districts.length === 0 ? "No districts found" : "Select district"} />
                </SelectTrigger>
                <SelectContent>{districts.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>School</Label>
              <Select value={schoolId} onValueChange={setSchoolId} disabled={!districtId || schools.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={!districtId ? "Select district first" : schools.length === 0 ? "No schools in this district" : "Select school"} />
                </SelectTrigger>
                <SelectContent>{schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {schoolId && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs text-muted-foreground">Child's details as registered at the school.</p>

                <GradeSelect
                  value={gradeId}
                  onChange={v => { setGradeId(v); setClassId(""); }}
                  required
                />

                <ClassSelect
                  schoolId={schoolId}
                  gradeId={gradeId}
                  value={classId}
                  onChange={setClassId}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="fn">First name</Label>
                    <Input id="fn" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="e.g. Sipho" />
                  </div>
                  <div>
                    <Label htmlFor="ln">Last name</Label>
                    <Input id="ln" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="e.g. Dlamini" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="lno">Learner number</Label>
                  <Input id="lno" value={learnerNo} onChange={e => setLearnerNo(e.target.value)} required placeholder="e.g. 2024001" />
                  <p className="text-xs text-muted-foreground mt-1">Ask your school admin if you don't have this.</p>
                </div>

                <div>
                  <Label>Your relationship</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="grandparent">Grandparent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || !schoolId || !gradeId || !firstName || !lastName || !learnerNo}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
