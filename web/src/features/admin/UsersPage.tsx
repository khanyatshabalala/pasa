import { useEffect, useState } from "react";
import { z } from "zod";
import { api, type AdminUserResponse, type SchoolResponse } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Loader2, Trash2, Users, Eye, EyeOff, Copy, Check } from "lucide-react";

const CREATABLE_ROLES = ["principal", "school_admin"] as const;

const createSchema = z.object({
  fullName:  z.string().trim().min(2).max(100),
  email:     z.string().trim().email().max(255),
  password:  z.string().min(6).max(72),
  role:      z.enum(CREATABLE_ROLES),
  schoolId:  z.string().uuid("Pick a school"),
});

export function UsersPage() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [schools, setSchools] = useState<SchoolResponse[]>([]);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState<string>("principal");
  const [schoolId, setSchoolId] = useState<string>("");
  const [pwValue, setPwValue] = useState("");

  const load = async () => {
    try {
      const [usersData, schoolsData] = await Promise.all([
        api.get<{ content: AdminUserResponse[] }>("/api/v1/admin/users?size=200"),
        api.get<SchoolResponse[]>("/api/v1/schools"),
      ]);
      setUsers(usersData.content ?? []);
      setSchools(schoolsData);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load data");
    }
  };

  useEffect(() => { load(); }, []);

  const onCreateAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = createSchema.safeParse({
      fullName: fd.get("full_name"),
      email:    fd.get("email"),
      password: fd.get("password"),
      role,
      schoolId,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSaving(true);
    try {
      // Invite via staff invite endpoint on the selected school
      await api.post(`/api/v1/schools/${parsed.data.schoolId}/staff/invite`, {
        email:       parsed.data.email,
        firstName:   parsed.data.fullName.split(" ")[0],
        lastName:    parsed.data.fullName.split(" ").slice(1).join(" ") || parsed.data.fullName,
        role:        parsed.data.role,
        password:    parsed.data.password,
        staffNumber: null,
        position:    parsed.data.role === "principal" ? "Principal" : "School Administrator",
      });
      toast.success(`Account created for ${parsed.data.fullName}.`);
      setCreateOpen(false);
      resetDialog();
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create account");
    } finally {
      setSaving(false);
    }
  };

  const onRevoke = async (userId: string, roleId: string) => {
    if (!confirm("Revoke this role?")) return;
    try {
      await api.delete(`/api/v1/admin/users/${userId}/roles/${roleId}`);
      toast.success("Role revoked");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to revoke role");
    }
  };

  const copyPassword = () => {
    if (!pwValue) return;
    navigator.clipboard.writeText(pwValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetDialog = () => {
    setRole("principal");
    setSchoolId("");
    setPwValue("");
    setShowPw(false);
    setCopied(false);
  };

  const staffUsers = users.filter(u =>
    u.roles.some(r => r.role !== "parent")
  );

  const filtered = staffUsers.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.fullName ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">School accounts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create principal and school admin accounts. They can then add their own staff.
          </p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setCreateOpen(true)}>
          <UserPlus className="size-4 mr-1.5" /> Create account
        </Button>
      </div>

      <div className="mb-4">
        <Input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <Users className="size-8 mx-auto mb-2 opacity-50" />
          No school accounts yet. Create the first principal or school admin above.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Roles</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const staffRoles = u.roles.filter(r => r.role !== "parent");
                return (
                  <tr key={u.id} className="border-t align-top">
                    <td className="p-3 font-medium">{u.fullName ?? "—"}</td>
                    <td className="p-3 text-muted-foreground text-xs">{u.email}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {staffRoles.map(r => (
                          <div key={r.id} className="inline-flex items-center gap-1 bg-muted rounded-md pl-2 pr-1 py-0.5 text-xs">
                            <Badge variant="outline" className="capitalize border-0 bg-transparent px-0">
                              {r.role.replace("_", " ")}
                            </Badge>
                            <button onClick={() => onRevoke(u.id, r.id)} className="hover:text-destructive ml-1" title="Revoke role">
                              <Trash2 className="size-3" />
                            </button>
                          </div>
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

      <Dialog open={createOpen} onOpenChange={v => { setCreateOpen(v); if (!v) resetDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create school account</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Creates a login for a principal or school admin. Share the temporary password with them.
          </p>
          <form onSubmit={onCreateAccount} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="ca-name">Full name</Label>
              <Input id="ca-name" name="full_name" required placeholder="e.g. Thabo Nkosi" />
            </div>
            <div>
              <Label htmlFor="ca-email">Work email</Label>
              <Input id="ca-email" name="email" type="email" required placeholder="principal@school.co.za" />
            </div>
            <div>
              <Label htmlFor="ca-pw">Temporary password</Label>
              <div className="relative">
                <Input
                  id="ca-pw"
                  name="password"
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
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
                  <SelectItem value="principal">Principal</SelectItem>
                  <SelectItem value="school_admin">School Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>School</Label>
              <Select value={schoolId} onValueChange={setSchoolId}>
                <SelectTrigger><SelectValue placeholder="Pick a school" /></SelectTrigger>
                <SelectContent>
                  {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button disabled={saving} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {saving && <Loader2 className="size-4 animate-spin mr-2" />}Create account
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
