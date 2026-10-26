import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { api, ApiError, type SchoolResponse, type DistrictResponse } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Loader2, Building2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "Northern Cape", "North West", "Western Cape",
] as const;
// Backend SchoolPhase enum is lowercase: primary | secondary | combined.
const PHASES = ["primary", "secondary", "combined"] as const;
const PHASE_LABELS: Record<string, string> = {
  primary:   "Primary school (Grade R–7)",
  secondary: "High school (Grade 8–12)",
  combined:  "Combined (Grade R–12)",
};
const PHASE_GRADE_HINT: Record<string, string> = {
  primary:   "Grades R to 7",
  secondary: "Grades 8 to 12",
  combined:  "Grades R to 12",
};
const TYPES = ["public", "independent", "private", "special"] as const;

const schema = z.object({
  name: z.string().trim().min(2).max(200),
  emis_number: z.string().trim().min(3).max(20),
  district: z.string().trim().min(2).max(100),
  province: z.enum(PROVINCES),
  phase: z.enum(PHASES),
  school_type: z.enum(TYPES),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

type School = SchoolResponse;
type District = DistrictResponse;

export function AdminSchoolsPage() {
  const [rows, setRows] = useState<School[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [province, setProvince] = useState<string>("Western Cape");
  const [phase, setPhase] = useState<string>("primary");
  const [type, setType] = useState<string>("public");
  const [districtId, setDistrictId] = useState<string>("");
  const [districtText, setDistrictText] = useState<string>("");

  const load = async () => {
    try {
      const [s, d] = await Promise.all([
        api.get<School[]>("/api/v1/schools"),
        api.get<District[]>("/api/v1/districts"),
      ]);
      setRows([...s].sort((a, b) => a.name.localeCompare(b.name)));
      setDistricts(d);
    } catch {
      setRows([]);
    }
  };
  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const linked = districts.find(d => d.id === districtId);
    const effectiveProvince = linked?.province ?? province;
    const effectiveDistrictName = linked?.name ?? districtText.trim();
    const parsed = schema.safeParse({
      name: fd.get("name"),
      emis_number: fd.get("emis_number"),
      district: effectiveDistrictName,
      province: effectiveProvince,
      phase,
      school_type: type,
      city: fd.get("city") || "",
      email: fd.get("email") || "",
      phone: fd.get("phone") || "",
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (!linked && !districtText.trim()) {
      return toast.error("Pick a district from the list or type one in.");
    }
    setSaving(true);
    try {
      await api.post("/api/v1/schools", {
        name: parsed.data.name,
        emisNumber: parsed.data.emis_number,
        district: parsed.data.district,
        province: parsed.data.province,
        phase: parsed.data.phase,                    // lowercase enum
        schoolType: parsed.data.school_type.toUpperCase(), // backend SchoolType is uppercase
        city: parsed.data.city || null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        districtId: districtId || null,
      });
      toast.success("School created");
      setOpen(false);
      setDistrictId("");
      setDistrictText("");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create school. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const districtOptions = districts.filter(d => d.province === province);
  const linkedDistrict = districts.find(d => d.id === districtId);

  return (
    <div className="max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Schools</h1>
          <p className="text-muted-foreground text-sm mt-1">All schools on the PASA network.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="size-4 mr-1" /> New school</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create school</DialogTitle></DialogHeader>
            <form onSubmit={onCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label htmlFor="s-name">Name</Label><Input id="s-name" name="name" required /></div>
                <div><Label htmlFor="s-emis">EMIS number</Label><Input id="s-emis" name="emis_number" required /></div>
                <div>
                  <Label>Province</Label>
                  <Select
                    value={province}
                    onValueChange={(v) => { setProvince(v); setDistrictId(""); }}
                    disabled={!!linkedDistrict}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                  {linkedDistrict && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Set automatically from the linked district.
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label>Link to district</Label>
                  <Select value={districtId || "_none"} onValueChange={(v) => setDistrictId(v === "_none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={districtOptions.length ? "Pick a district" : `No districts in ${province}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— Type a custom district below —</SelectItem>
                      {districtOptions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {!linkedDistrict && (
                  <div className="col-span-2">
                    <Label htmlFor="s-district-text">District name</Label>
                    <Input
                      id="s-district-text"
                      value={districtText}
                      onChange={(e) => setDistrictText(e.target.value)}
                      required
                      placeholder="e.g. Metro Central"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Tip: create the district under <strong>Districts</strong> first to link it properly.
                    </p>
                  </div>
                )}
                <div>
                  <Label>Phase</Label>
                  <Select value={phase} onValueChange={setPhase}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PHASES.map(p => <SelectItem key={p} value={p}>{PHASE_LABELS[p]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {PHASE_GRADE_HINT[phase]}
                  </p>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label htmlFor="s-city">City</Label><Input id="s-city" name="city" /></div>
                <div><Label htmlFor="s-email">Email</Label><Input id="s-email" name="email" type="email" /></div>
                <div><Label htmlFor="s-phone">Phone</Label><Input id="s-phone" name="phone" /></div>
              </div>
              <Button disabled={saving} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}Create school
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <Building2 className="size-8 mx-auto mb-2 opacity-50" />
          No schools yet. Click "New school" to add the first one.
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                  <th className="p-3">School</th>
                  <th className="p-3">EMIS</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Province</th>
                  <th className="p-3">Phase</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Learners</th>
                  <th className="p-3 w-16"></th>
                </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 text-muted-foreground">{r.emisNumber}</td>
                  <td className="p-3">{r.district}</td>
                  <td className="p-3 text-muted-foreground">{r.province}</td>
                  <td className="p-3"><Badge variant="secondary">{PHASE_LABELS[r.phase ?? ""] ?? r.phase}</Badge></td>
                  <td className="p-3 capitalize text-muted-foreground">{r.schoolType}</td>
                  <td className="p-3">{r.learnerCount ?? 0}</td>
                  <td className="p-3 text-right">
                    <Button asChild size="icon" variant="ghost" className="size-7">
                      <Link to="/admin/schools/$schoolId" params={{ schoolId: r.id }}>
                        <Pencil className="size-3.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
