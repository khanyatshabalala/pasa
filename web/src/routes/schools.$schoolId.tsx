import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, type SchoolResponse } from "@/lib/api";
import { MapPin, Phone, Mail, Globe, Users, Calendar, GraduationCap, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/schools/$schoolId")({
  component: SchoolDetail,
});

function SchoolDetail() {
  const { schoolId } = Route.useParams();
  const [school, setSchool] = useState<SchoolResponse | null>(null);
  useEffect(() => {
    api.get<SchoolResponse>(`/api/v1/schools/${schoolId}`)
      .then((data) => setSchool(data))
      .catch(() => setSchool(null));
  }, [schoolId]);

  if (!school) return <div className="min-h-screen bg-background"><PublicHeader /><div className="container mx-auto px-4 py-12 text-muted-foreground">Loading…</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-12">
          <Link to="/schools" className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/70 hover:text-white mb-6"><ArrowLeft className="size-4"/> All schools</Link>
          <div className="flex items-start gap-5">
            <div className="size-16 rounded-xl bg-accent grid place-items-center text-accent-foreground"><GraduationCap className="size-8" /></div>
            <div>
              <Badge variant="secondary" className="capitalize mb-2">{school.phase} • {school.schoolType}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold">{school.name}</h1>
              {school.motto && <p className="italic text-primary-foreground/70 mt-2">"{school.motto}"</p>}
              <p className="text-primary-foreground/70 mt-2 text-sm">EMIS {school.emisNumber} • Established {school.establishedYear}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-lg mb-3">About</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{school.description}</p>
          </Card>
          <div className="grid sm:grid-cols-3 gap-4">
            <Card className="p-5"><div className="text-xs text-muted-foreground">Learners</div><div className="text-2xl font-bold mt-1 flex items-center gap-2"><Users className="size-5 text-accent" />{school.learnerCount?.toLocaleString()}</div></Card>
            <Card className="p-5"><div className="text-xs text-muted-foreground">Annual fees</div><div className="text-2xl font-bold mt-1">{school.feesAnnual ? `R${school.feesAnnual.toLocaleString()}` : "Free"}</div></Card>
            <Card className="p-5"><div className="text-xs text-muted-foreground">Founded</div><div className="text-2xl font-bold mt-1 flex items-center gap-2"><Calendar className="size-5 text-accent" />{school.establishedYear}</div></Card>
          </div>
        </div>
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Contact</h3>
            <div className="space-y-3 text-sm">
              {school.principalName && <div><div className="text-xs text-muted-foreground">Principal</div><div>{school.principalName}</div></div>}
              {school.address && <div className="flex gap-2"><MapPin className="size-4 mt-0.5 shrink-0 text-muted-foreground" /><span>{school.address}, {school.city} {school.postalCode}</span></div>}
              {school.phone && <div className="flex gap-2"><Phone className="size-4 mt-0.5 shrink-0 text-muted-foreground" /><a href={`tel:${school.phone}`}>{school.phone}</a></div>}
              {school.email && <div className="flex gap-2"><Mail className="size-4 mt-0.5 shrink-0 text-muted-foreground" /><a className="break-all" href={`mailto:${school.email}`}>{school.email}</a></div>}
              {school.website && <div className="flex gap-2"><Globe className="size-4 mt-0.5 shrink-0 text-muted-foreground" /><a className="break-all text-accent" href={school.website} target="_blank" rel="noreferrer">{school.website}</a></div>}
            </div>
          </Card>
          <Card className="p-6 bg-primary text-primary-foreground border-0">
            <h3 className="font-semibold mb-1">Are you a parent here?</h3>
            <p className="text-sm text-primary-foreground/70 mb-4">Connect to your child's account to see marks, attendance and notices.</p>
            <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/auth">Get started</Link></Button>
          </Card>
        </div>
      </section>
    </div>
  );
}

