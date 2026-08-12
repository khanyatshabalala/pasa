import { useEffect, useState } from "react";
import { z } from "zod";
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
import { UserPlus, Loader2, Trash2, Users, Eye, EyeOff, Copy, Check, ShieldAlert } from "lucide-react";
import type { StaffResponse } from "@/lib/api";

const createSchema = z.object({
  firstName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  lastName:  z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email:     z.string().trim().email("Invalid email").max(255),
  password:  z.string().min(6, "Password must be at least 6 characters").max(72),
  role:      z.enum(["teacher", "school_admin"]),
});

export function StaffPage() {
  const { primaryRole, primarySchoolId, user } = useAuth();
  const canManage = ["principal", "school_admin", "super_admin"].includes(primaryRole);

  const [staff, setStaff]         = useState<StaffResponse[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading]     = useState(true);

  const [removeOpen, setRemoveOpen]     = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string | null } | null>(null);
  const [removing, setRemoving]         = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [showPw, setShowPw]         = useState(false);
  const [copied, setCopied]         = useState(false);
  const [role, setRole]             = useState("teacher");
  const [pwValue, setPwValue]       = useState("");

  const load = async () => {
    if (!primarySchoolId) return;
    setLoading(true);
    try {
      const [members, school] = await Promise.all([
        api.get<StaffResponse[]>(`/api/v1/schools/${primarySchoolId}/staff`),
        api.get<{ name: string }>(`/api/v1/schools/${primarySchoolId}`),
      ]);
      setStaff(members.filter(m => m.userId !== user?.id));
      setSchoolName(school.name);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [primarySchoolId]);

  const onCreateStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = createSchema.safeParse({
      firstName: fd.get("first_name"),
      lastName:  fd.get("last_name"),
      email:     fd.get("email"),
      password:  fd.get("password"),
      role,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!primarySchoolId) return toast.error("No school assigned to your account");

    setSaving(true);
    try {
      await api.post(`/api/v1/schools/${primarySchoolId}/staff/invite`, {
        ...parsed.data,
        staffNumber: null,
        position: null,
      });
      toast.success(`Account created for ${parsed.data.firstName} ${parsed.data.lastName}.`);
      setCreateOpen(false);
      resetDialog();
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create account");
    } finally {
      setSaving(false);
    }
  };

  const onRemoveConfirm = async () => {
    if (!removeTarget || !primarySchoolId) return;
    setRemoving(true);
    try {
      await api.delete(`/api/v1/schools/${primarySchoolId}/staff/${removeTarget.id}`);
      toast.success("Staff member removed from this school.");
      setRemoveOpen(false);
      setRemoveTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to remove staff member");
    } finally {
      setRemoving(false);
    }
  };

  const copyPassword = () => {
    if (!pwValue) return;
    navigator.clipboard.writeText(pwValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetDialog = () => {
    setRole("teacher"); setPwValue(""); setShowPw(false); setCopied(false);
  };

  if (!canManage) {
    return (
      <div className="max-w-lg">
        <PageHeader title="Staff" sub="Manage your school's staff accounts." />
        <Card className="p-8 text-center text-muted-foreground text-sm">
          <ShieldAlert className="size-8 mx-auto mb-2 opacity-40" />
          Only principals and school admins can manage staff.
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Staff"
        sub={schoolName ? `Managing staff at ${schoolName}` : "Manage your school's staff accounts."}
        action={
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setCreateOpen(true)}>
            <UserPlus className="size-4 mr-1.5" /> Add staff member
          </Button>
        }
      />

      <Card className="p-4 mb-6 bg-muted/40 border-border/60 text-sm text-muted-foreground">
        Staff members sign in at <span className="font-medium text-foreground">/school/auth</span> using the email and temporary password you set.
      </Card>

      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Loading…</div>
      ) : staff.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <Users className="size-8 mx-auto mb-2 opacity-50" />
          No staff added yet. Click "Add staff member" to get started.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {staff.map(m => (
                <tr key={m.id} className="border-t align-middle">
                  <td className="p-3 font-medium">{m.fullName ?? "—"}</td>
                  <td className="p-3 text-muted-foreground text-xs">{m.email ?? "—"}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className="capitalize">
                      {(m.role ?? "").replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      size="icon" variant="ghost"
                      onClick={() => { setRemoveTarget({ id: m.id, name: m.fullName }); setRemoveOpen(true); }}
                      title="Remove staff member"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create staff dialog */}
      <Dialog open={createOpen} onOpenChange={v => { setCreateOpen(v); if (!v) resetDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add staff member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Creates a login for a teacher or school admin at <span className="font-medium text-foreground">{schoolName}</span>.
          </p>
          <form onSubmit={onCreateStaff} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sf-fn">First name</Label>
                <Input id="sf-fn" name="first_name" required placeholder="e.g. Nomsa" />
              </div>
              <div>
                <Label htmlFor="sf-ln">Last name</Label>
                <Input id="sf-ln" name="last_name" required placeholder="e.g. Dlamini" />
              </div>
            </div>
            <div>
              <Label htmlFor="sf-email">Work email</Label>
              <Input id="sf-email" name="email" type="email" required placeholder="teacher@school.co.za" />
            </div>
            <div>
              <Label htmlFor="sf-pw">Temporary password</Label>
              <div className="relative">
                <Input
                  id="sf-pw" name="password"
                  type={showPw ? "text" : "password"}
                  required minLength={6}
                  value={pwValue}
                  onChange={e => setPwValue(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="pr-20"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="size-7" onClick={copyPassword} tabIndex={-1}>
                    {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="school_admin">School Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button disabled={saving} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}
              Create account
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation dialog */}
      <Dialog open={removeOpen} onOpenChange={v => { setRemoveOpen(v); if (!v) setRemoveTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remove staff member?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will remove <span className="font-medium text-foreground">{removeTarget?.name ?? "this person"}</span>'s access to your school.
          </p>
          <div className="flex gap-2 mt-2">
            <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={onRemoveConfirm} disabled={removing}>
              {removing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash2 className="size-4 mr-2" />}
              Remove access
            </Button>
            <Button variant="outline" onClick={() => setRemoveOpen(false)} disabled={removing}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
