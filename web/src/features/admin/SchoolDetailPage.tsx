import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { api, ApiError, type DistrictResponse, type SchoolResponse } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trophy, GraduationCap } from "lucide-react";
import { Route } from "@/routes/admin.schools.$schoolId";

const PHASE_LABELS: Record<string, string> = {
  primary:   "Primary school",
  secondary: "High school",
  combined:  "Combined school",
};

// Grade ranges per phase
const PHASE_GRADES: Record<string, { min: number; max: number; label: string }> = {
  primary:   { min: 0, max: 7,  label: "Grade R to Grade 7" },
  secondary: { min: 8, max: 12, label: "Grade 8 to Grade 12" },
  combined:  { min: 0, max: 12, label: "Grade R to Grade 12" },
};
const SCHOOL_TYPES = ["PUBLIC", "INDEPENDENT", "PRIVATE", "SPECIAL"] as const;

// Builds the full CreateSchoolRequest payload the PUT endpoint requires,
// merging the current school with the supplied overrides.
function schoolPayload(school: SchoolResponse, overrides: Record<string, unknown>) {
  return {
    name: school.name,
    emisNumber: school.emisNumber,
    district: school.district,
    province: school.province,
    phase: school.phase,
    schoolType: school.schoolType?.toUpperCase() || null,
    city: school.city,
    email: school.email,
    phone: school.phone,
    districtId: school.districtId,
    address: school.address,
    postalCode: school.postalCode,
    website: school.website,
    principalName: school.principalName,
    establishedYear: school.establishedYear,
    learnerCount: school.learnerCount,
    feesAnnual: school.feesAnnual,
    logoUrl: school.logoUrl,
    motto: school.motto,
    description: school.description,
    gradeFrom: school.gradeFrom,
    gradeTo: school.gradeTo,
    applicationOpen: school.applicationOpen,
    applicationClose: school.applicationClose,
    admissionRequirements: school.admissionRequirements,
    applicationContact: school.applicationContact,
    ...overrides,
  };
}

const schoolDetailsSchema = z.object({
  name: z.string().trim().min(2).max(200),
  emis_number: z.string().trim().min(3).max(20),
  district: z.string().trim().min(2).max(100),
  province: z.string().trim().min(2).max(100),
  school_type: z.enum(SCHOOL_TYPES),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  website: z.string().trim().max(255).optional().or(z.literal("")),
  principal_name: z.string().trim().max(150).optional().or(z.literal("")),
  established_year: z.union([z.literal(""), z.coerce.number().int().min(1800).max(2100)]),
  learner_count: z.union([z.literal(""), z.coerce.number().int().min(0)]),
  fees_annual: z.union([z.literal(""), z.coerce.number().min(0)]),
  logo_url: z.string().trim().max(500).optional().or(z.literal("")),
  motto: z.string().trim().max(255).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

const admissionsSchema = z.object({
  grade_from: z.coerce.number().int().min(0).max(12).nullable(),
  grade_to:   z.coerce.number().int().min(0).max(12).nullable(),
  application_open:  z.string().optional().or(z.literal("")),
  application_close: z.string().optional().or(z.literal("")),
  admission_requirements: z.string().max(2000).optional().or(z.literal("")),
  application_contact:    z.string().max(500).optional().or(z.literal("")),
});

export function SchoolDetailPage() {
  const { schoolId } = Route.useParams();
  const [school, setSchool] = useState<SchoolResponse | null>(null);
  const [districts, setDistricts] = useState<DistrictResponse[]>([]);
  const [districtId, setDistrictId] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [savingPhase, setSavingPhase] = useState(false);
  const [phase, setPhase] = useState<string>("");

  const loadSchool = async () => {
    setLoadError(null);
    try {
      const [data, districtRows] = await Promise.all([
        api.get<SchoolResponse>(`/api/v1/schools/${schoolId}`),
        api.get<DistrictResponse[]>("/api/v1/admin/districts"),
      ]);
      setSchool(data);
      setDistricts(districtRows);
      const matchingDistrict = districtRows.find(district => district.id === data.districtId)
        ?? districtRows.find(district => district.name === data.district && district.province === data.province);
      setDistrictId(matchingDistrict?.id ?? "");
      setPhase(data.phase ?? "");
    } catch (err) {
      setSchool(null);
      setLoadError(err instanceof ApiError ? err.message : "Could not load school and district information.");
    }
  };

  useEffect(() => { loadSchool(); }, [schoolId]);

  const onSaveDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!school) return;
    const fd = new FormData(e.currentTarget);
    const selectedDistrict = districts.find(district => district.id === districtId);
    if (!selectedDistrict) return toast.error("Select an existing district for this school.");
    const parsed = schoolDetailsSchema.safeParse({
      name: fd.get("name"),
      emis_number: fd.get("emis_number"),
      district: selectedDistrict.name,
      province: selectedDistrict.province,
      school_type: fd.get("school_type"),
      city: fd.get("city") || "",
      email: fd.get("email") || "",
      phone: fd.get("phone") || "",
      address: fd.get("address") || "",
      postal_code: fd.get("postal_code") || "",
      website: fd.get("website") || "",
      principal_name: fd.get("principal_name") || "",
      established_year: fd.get("established_year") || "",
      learner_count: fd.get("learner_count") || "",
      fees_annual: fd.get("fees_annual") || "",
      logo_url: fd.get("logo_url") || "",
      motto: fd.get("motto") || "",
      description: fd.get("description") || "",
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSavingDetails(true);
    try {
      await api.put(`/api/v1/schools/${schoolId}`, schoolPayload(school, {
        name: parsed.data.name,
        emisNumber: parsed.data.emis_number,
        district: parsed.data.district,
        province: parsed.data.province,
        districtId: selectedDistrict.id,
        schoolType: parsed.data.school_type,
        city: parsed.data.city || null,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        address: parsed.data.address || null,
        postalCode: parsed.data.postal_code || null,
        website: parsed.data.website || null,
        principalName: parsed.data.principal_name || null,
        establishedYear: parsed.data.established_year === "" ? null : Number(parsed.data.established_year),
        learnerCount: parsed.data.learner_count === "" ? null : Number(parsed.data.learner_count),
        feesAnnual: parsed.data.fees_annual === "" ? null : Number(parsed.data.fees_annual),
        logoUrl: parsed.data.logo_url || null,
        motto: parsed.data.motto || null,
        description: parsed.data.description || null,
      }));
      toast.success("School profile updated");
      await loadSchool();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not update this school.");
    } finally {
      setSavingDetails(false);
    }
  };

  const onSavePhase = async () => {
    if (!phase || !school) return;
    setSavingPhase(true);
    const gradeRange = PHASE_GRADES[phase];
    try {
      await api.put(`/api/v1/schools/${schoolId}`, schoolPayload(school, {
        phase,
        gradeFrom: gradeRange?.min ?? null,
        gradeTo:   gradeRange?.max ?? null,
      }));
      toast.success("School phase updated");
      loadSchool();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSavingPhase(false);
    }
  };

  const onSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!school) return;
    const fd = new FormData(e.currentTarget);
    const parsed = admissionsSchema.safeParse({
      grade_from:             fd.get("grade_from") || null,
      grade_to:               fd.get("grade_to")   || null,
      application_open:       fd.get("application_open")  || "",
      application_close:      fd.get("application_close") || "",
      admission_requirements: fd.get("admission_requirements") || "",
      application_contact:    fd.get("application_contact")    || "",
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSaving(true);
    try {
      await api.put(`/api/v1/schools/${schoolId}`, schoolPayload(school, {
        gradeFrom:             parsed.data.grade_from,
        gradeTo:               parsed.data.grade_to,
        applicationOpen:       parsed.data.application_open  || null,
        applicationClose:      parsed.data.application_close || null,
        admissionRequirements: parsed.data.admission_requirements || null,
        applicationContact:    parsed.data.application_contact    || null,
      }));
      toast.success("School updated");
      loadSchool();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const onRecalculate = async () => {
    setRecalculating(true);
    try {
      await api.post(`/api/v1/schools/${schoolId}/recalculate-performance`);
      toast.success("Performance rankings updated");
      loadSchool();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setRecalculating(false);
    }
  };

  if (!school) return (
    <div className="text-sm text-muted-foreground py-10 text-center">
      {loadError ? (
        <div className="space-y-3">
          <p>{loadError}</p>
          <Button variant="outline" onClick={loadSchool}>Try again</Button>
        </div>
      ) : "Loading…"}
    </div>
  );

  const phaseInfo = PHASE_GRADES[school.phase ?? ""];

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="icon" className="size-8">
          <Link to="/admin/schools"><ArrowLeft className="size-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{school.name}</h1>
          <p className="text-sm text-muted-foreground">{school.district} · {school.province}</p>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="font-semibold mb-4">School profile</h2>
        <form onSubmit={onSaveDetails} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="school-name">School name</Label>
              <Input id="school-name" name="name" defaultValue={school.name} required />
            </div>
            <div>
              <Label htmlFor="school-emis">EMIS number</Label>
              <Input id="school-emis" name="emis_number" defaultValue={school.emisNumber ?? ""} required />
            </div>
            <div>
              <Label>School type</Label>
              <Select name="school_type" defaultValue={school.schoolType?.toUpperCase() ?? "PUBLIC"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCHOOL_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type.toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>District</Label>
              <Select value={districtId} onValueChange={setDistrictId}>
                <SelectTrigger disabled={districts.filter(district => district.province === school.province).length === 0}>
                  <SelectValue placeholder="Select a district" />
                </SelectTrigger>
                <SelectContent>
                  {districts
                    .filter(district => district.province === school.province)
                    .map(district => (
                      <SelectItem key={district.id} value={district.id}>{district.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="school-province">Province</Label>
              <Input id="school-province" value={districts.find(district => district.id === districtId)?.province ?? school.province ?? ""} disabled />
            </div>
            <div>
              <Label htmlFor="school-city">City</Label>
              <Input id="school-city" name="city" defaultValue={school.city ?? ""} />
            </div>
            <div>
              <Label htmlFor="school-phone">Phone</Label>
              <Input id="school-phone" name="phone" type="tel" defaultValue={school.phone ?? ""} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="school-email">Email</Label>
              <Input id="school-email" name="email" type="email" defaultValue={school.email ?? ""} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="school-address">Address</Label>
              <Input id="school-address" name="address" defaultValue={school.address ?? ""} />
            </div>
            <div>
              <Label htmlFor="school-postal-code">Postal code</Label>
              <Input id="school-postal-code" name="postal_code" defaultValue={school.postalCode ?? ""} />
            </div>
            <div>
              <Label htmlFor="school-website">Website</Label>
              <Input id="school-website" name="website" type="url" defaultValue={school.website ?? ""} placeholder="https://…" />
            </div>
            <div>
              <Label htmlFor="school-principal">Principal name</Label>
              <Input id="school-principal" name="principal_name" defaultValue={school.principalName ?? ""} />
            </div>
            <div>
              <Label htmlFor="school-established">Established year</Label>
              <Input id="school-established" name="established_year" type="number" min={1800} max={2100}
                defaultValue={school.establishedYear ?? ""} />
            </div>
            <div>
              <Label htmlFor="school-learner-count">Learner count</Label>
              <Input id="school-learner-count" name="learner_count" type="number" min={0}
                defaultValue={school.learnerCount ?? ""} />
            </div>
            <div>
              <Label htmlFor="school-fees">Annual fees</Label>
              <Input id="school-fees" name="fees_annual" type="number" min={0} step="0.01"
                defaultValue={school.feesAnnual ?? ""} />
            </div>
            <div>
              <Label htmlFor="school-logo">Logo URL</Label>
              <Input id="school-logo" name="logo_url" type="url" defaultValue={school.logoUrl ?? ""} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="school-motto">Motto</Label>
              <Input id="school-motto" name="motto" defaultValue={school.motto ?? ""} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="school-description">Description</Label>
              <Textarea id="school-description" name="description" rows={3}
                defaultValue={school.description ?? ""} />
            </div>
          </div>
          <Button type="submit" disabled={savingDetails} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {savingDetails && <Loader2 className="size-4 animate-spin mr-2" />}
            Save school profile
          </Button>
        </form>
      </Card>

      {/* ── School type & phase ── */}
      <Card className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="size-4 text-accent" />
          <h2 className="font-semibold">School type & phase</h2>
        </div>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Badge variant="secondary" className="capitalize">{school.schoolType}</Badge>
          <Badge className="bg-accent/15 text-accent border-0">
            {PHASE_LABELS[school.phase ?? ""] ?? school.phase}
          </Badge>
          {phaseInfo && (
            <span className="text-sm text-muted-foreground">{phaseInfo.label}</span>
          )}
        </div>
        <div className="space-y-3">
          <div>
            <Label>Change phase</Label>
            <div className="flex gap-2 mt-1">
              <Select value={phase} onValueChange={setPhase}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary school (Grade R–7)</SelectItem>
                  <SelectItem value="secondary">High school (Grade 8–12)</SelectItem>
                  <SelectItem value="combined">Combined school (Grade R–12)</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={onSavePhase}
                disabled={savingPhase || phase === school.phase}
                variant="outline"
              >
                {savingPhase && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                Save
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Changing the phase automatically updates the grade range for this school.
            </p>
          </div>
        </div>
      </Card>

      {/* ── Performance summary ── */}
      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Trophy className="size-4 text-accent" /> Performance
          </h2>
          <Button size="sm" variant="outline" onClick={onRecalculate} disabled={recalculating}>
            {recalculating && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
            Recalculate
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-accent">
              {school.performanceAvg != null ? `${school.performanceAvg}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Avg mark</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {school.performanceRankDistrict != null ? `#${school.performanceRankDistrict}` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">District rank</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {school.performanceRankProvince != null ? `#${school.performanceRankProvince}` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Province rank</div>
          </div>
        </div>
        {school.performanceRankNational != null && (
          <div className="mt-3 text-center">
            <Badge variant="secondary">National rank: #{school.performanceRankNational}</Badge>
          </div>
        )}
      </Card>

      {/* ── Admissions info ── */}
      <Card className="p-6">
        <h2 className="font-semibold mb-4">Admissions information</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This information is shown to parents browsing schools. Setting an application open date will automatically notify parents whose children are finishing the previous phase.
        </p>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="gf">Grade from</Label>
              <Input id="gf" name="grade_from" type="number" min={0} max={12}
                defaultValue={school.gradeFrom ?? phaseInfo?.min ?? ""}
                placeholder={`e.g. ${phaseInfo?.min ?? 0}`} />
              <p className="text-[10px] text-muted-foreground mt-1">0 = Grade R</p>
            </div>
            <div>
              <Label htmlFor="gt">Grade to</Label>
              <Input id="gt" name="grade_to" type="number" min={0} max={12}
                defaultValue={school.gradeTo ?? phaseInfo?.max ?? ""}
                placeholder={`e.g. ${phaseInfo?.max ?? 12}`} />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ao">Applications open</Label>
              <Input id="ao" name="application_open" type="date"
                defaultValue={school.applicationOpen ?? ""} />
            </div>
            <div>
              <Label htmlFor="ac">Applications close</Label>
              <Input id="ac" name="application_close" type="date"
                defaultValue={school.applicationClose ?? ""} />
            </div>
          </div>

          <div>
            <Label htmlFor="ar">Admission requirements</Label>
            <Textarea id="ar" name="admission_requirements" rows={4}
              defaultValue={school.admissionRequirements ?? ""}
              placeholder="e.g. Grade 7 report, birth certificate, proof of residence, previous school transfer letter…" />
          </div>

          <div>
            <Label htmlFor="ac2">How to apply</Label>
            <Input id="ac2" name="application_contact"
              defaultValue={school.applicationContact ?? ""}
              placeholder="e.g. Visit the school office or call 021 000 0000" />
            <p className="text-[10px] text-muted-foreground mt-1">
              This is shown to parents — keep it clear and actionable.
            </p>
          </div>

          <Button disabled={saving} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {saving && <Loader2 className="size-4 animate-spin mr-2" />}
            Save admissions info
          </Button>
        </form>
      </Card>
    </div>
  );
}
