import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, type SchoolResponse } from "@/lib/api";
import { MapPin, Search, Users, GraduationCap, CalendarDays, FileText, Phone, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/schools")({
  component: SchoolsPage
});

function gradeLabel(g: number | null) {
  if (g === null) return "?";
  if (g === 0) return "R";
  return String(g);
}

function isAppOpen(s: SchoolResponse) {
  const today = new Date().toISOString().slice(0, 10);
  return !!s.applicationOpen && s.applicationOpen <= today &&
    (!s.applicationClose || s.applicationClose >= today);
}

function isAppSoon(s: SchoolResponse) {
  if (!s.applicationOpen) return false;
  const today = new Date();
  const open  = new Date(s.applicationOpen);
  const diff  = (open.getTime() - today.getTime()) / 86400000;
  return diff > 0 && diff <= 30;
}

function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolResponse[]>([]);
  const [q, setQ] = useState("");
  const [phase, setPhase] = useState<string>("all");
  const [province, setProvince] = useState<string>("all");
  const [district, setDistrict] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<SchoolResponse[]>("/api/v1/schools")
      // No performance data yet, so order neutrally by name.
      .then((data) => setSchools([...data].sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => setSchools([]))
      .finally(() => setLoading(false));
  }, []);

  const provinces = useMemo(
    () => Array.from(new Set(schools.map(s => s.province).filter(Boolean) as string[])).sort(),
    [schools],
  );
  const districts = useMemo(
    () =>
      Array.from(
        new Set(
          schools
            .filter(s => province === "all" || s.province === province)
            .map(s => s.district)
            .filter(Boolean) as string[],
        ),
      ).sort(),
    [schools, province],
  );

  const filtered = schools.filter(s => {
    const matchQ = !q || s.name.toLowerCase().includes(q.toLowerCase()) || (s.emisNumber ?? "").includes(q);
    const matchPhase = phase === "all" || s.phase === phase;
    const matchProvince = province === "all" || s.province === province;
    const matchDistrict = district === "all" || s.district === district;
    const matchGrade = gradeFilter === "all" || (() => {
      const g = parseInt(gradeFilter);
      if (s.gradeFrom === null || s.gradeTo === null) return false;
      return g >= s.gradeFrom && g <= s.gradeTo;
    })();
    return matchQ && matchPhase && matchProvince && matchDistrict && matchGrade;
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
          <div className="text-sm text-accent font-medium mb-2">SCHOOL EXPLORER</div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Find a school in South Africa.</h1>
          <p className="mt-3 text-primary-foreground/70 max-w-xl">EMIS-verified profiles. Filter by province, district, phase and grade, then check application dates and requirements.</p>
          <div className="mt-8 grid md:grid-cols-5 gap-3">
            <div className="md:col-span-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={q} onChange={e => setQ(e.target.value)}
                placeholder="Search name or EMIS…"
                className="pl-10 bg-white text-foreground border-0 h-11"
              />
            </div>
            <Select
              value={province}
              onValueChange={(v) => {
                setProvince(v);
                setDistrict("all");
              }}
            >
              <SelectTrigger className="bg-white text-foreground border-0 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All provinces</SelectItem>
                {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="bg-white text-foreground border-0 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All districts</SelectItem>
                {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={phase} onValueChange={setPhase}>
              <SelectTrigger className="bg-white text-foreground border-0 h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All phases</SelectItem>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="combined">Combined</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="bg-white text-foreground border-0 h-11"><SelectValue placeholder="Any grade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any grade</SelectItem>
                <SelectItem value="0">Grade R</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                  <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="text-sm text-muted-foreground mb-4">{loading ? "Loading…" : `${filtered.length} schools`}</div>
        {!loading && filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground text-sm">
            No schools found. Try adjusting your filters.
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => {
              const open = isAppOpen(s);
              const soon = isAppSoon(s);
              const expanded = selectedId === s.id;
              return (
                <Card
                  key={s.id}
                  className={`p-6 h-full transition-all hover:border-accent/40 hover:shadow-md ${expanded ? "border-accent/60 md:col-span-2 lg:col-span-1" : ""}`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setSelectedId(expanded ? null : s.id)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="size-11 rounded-lg bg-accent/15 grid place-items-center text-accent shrink-0">
                        <GraduationCap className="size-6" />
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {open && <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">Applications open</Badge>}
                        {soon && !open && <Badge variant="secondary" className="text-orange-500 text-[10px] px-1.5 py-0">Opening soon</Badge>}
                        <Badge variant="secondary" className="capitalize text-[10px]">{s.phase}</Badge>
                      </div>
                    </div>
                    <h3 className="font-semibold leading-tight">{s.name}</h3>
                    {s.motto && <p className="text-xs italic text-muted-foreground mt-1">"{s.motto}"</p>}
                    <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5"><MapPin className="size-3" /> {s.city}, {s.district}</div>
                      <div className="flex items-center gap-1.5"><Users className="size-3" /> {s.learnerCount?.toLocaleString() ?? "—"} learners</div>
                      {s.gradeFrom !== null && s.gradeTo !== null && (
                        <div className="flex items-center gap-1.5"><GraduationCap className="size-3" /> Grade {gradeLabel(s.gradeFrom)}–{gradeLabel(s.gradeTo)}</div>
                      )}
                      <div className="flex items-center gap-1.5">EMIS: <span className="font-mono">{s.emisNumber}</span></div>
                    </div>
                    <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{s.schoolType}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        {s.feesAnnual != null ? (s.feesAnnual === 0 ? "No fees" : `R${s.feesAnnual.toLocaleString()}/yr`) : "—"}
                        <ChevronRight className={`size-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
                      </span>
                    </div>
                  </button>

                  {/* ── Expanded admissions detail ── */}
                  {expanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {(s.applicationOpen || s.applicationClose) && (
                        <div className="flex items-start gap-2 text-sm">
                          <CalendarDays className="size-4 text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">Applications: </span>
                            {s.applicationOpen && (
                              <span>Opens {new Date(s.applicationOpen + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</span>
                            )}
                            {s.applicationClose && (
                              <span> · Closes {new Date(s.applicationClose + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</span>
                            )}
                          </div>
                        </div>
                      )}
                      {s.admissionRequirements && (
                        <div className="flex items-start gap-2 text-sm">
                          <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">Requirements: </span>
                            <span className="text-muted-foreground">{s.admissionRequirements}</span>
                          </div>
                        </div>
                      )}
                      {s.applicationContact && (
                        <div className="flex items-start gap-2 text-sm">
                          <Phone className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div>
                            <span className="font-medium">How to apply: </span>
                            <span className="text-muted-foreground">{s.applicationContact}</span>
                          </div>
                        </div>
                      )}
                      {!s.applicationOpen && !s.applicationClose && !s.admissionRequirements && !s.applicationContact && (
                        <p className="text-xs text-muted-foreground">No admissions details published yet. Contact the school directly.</p>
                      )}
                      <Button asChild size="sm" variant="outline" className="mt-1">
                        <Link to="/schools/$schoolId" params={{ schoolId: s.id }}>
                          View full school profile
                        </Link>
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
