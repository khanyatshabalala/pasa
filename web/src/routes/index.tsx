import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, BookOpen, Users, Shield, Bell, GraduationCap, CalendarDays, TrendingUp, School } from "lucide-react";
import { SchoolRegistrationForm } from "@/features/schools/SchoolRegistrationForm";

export const Route = createFileRoute("/")({
  component: Landing
});

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl md:text-4xl font-bold text-accent">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <Card className="p-6 border-border/60 hover:border-accent/40 transition-colors">
      <div className="size-10 rounded-lg bg-accent/15 text-accent grid place-items-center mb-4">
        <Icon className="size-5" />
      </div>
      <h3 className="font-semibold text-base mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </Card>
  );
}

function Landing() {
  const [schoolFormOpen, setSchoolFormOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[oklch(0.25_0.08_240)]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/15 px-3 py-1 text-xs text-white/90 mb-6">
              <span className="size-1.5 rounded-full bg-accent animate-pulse" />
              Built for South African schools
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.05]">
              Keeping parents in sync <br />
              <span className="text-accent">with their child's education.</span>
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-2xl leading-relaxed">
              PASA connects schools directly with verified parents — so important information about events, meetings, examinations and learner conduct is never lost, delayed or dependent on the learner to pass on.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
                <Link to="/auth">Parent sign up / sign in <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10 hover:text-white">
                <Link to="/school/auth">Teacher / staff sign in</Link>
              </Button>
            </div>
            <div className="mt-4">
              <Button asChild size="sm" variant="ghost" className="text-white/50 hover:text-white/80 hover:bg-white/5 text-xs px-2">
                <Link to="/schools">Explore schools</Link>
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-md">
              <Stat value="Direct" label="School-to-parent communication" />
              <Stat value="Verified" label="Parent-learner links" />
              <Stat value="R0" label="To get started" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mb-12">
          <div className="text-sm font-medium text-accent mb-2">ONE PLATFORM. FULL VISIBILITY.</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Parents cannot support what they cannot see.</h2>
          <p className="text-muted-foreground mt-3">PASA gives schools a trusted channel to communicate directly with verified parents — replacing fragmented WhatsApp groups, printed letters and messages passed through learners.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Feature icon={CalendarDays} title="School calendar & events" body="Schools publish opening dates, events and parent meetings. Parents see everything in one place." />
          <Feature icon={Bell} title="Direct notifications" body="Important updates go straight to parents — no more relying on learners to pass on information." />
          <Feature icon={Shield} title="Conduct visibility" body="Discipline and conduct records are communicated directly to the verified parent, transparently." />
          <Feature icon={GraduationCap} title="Exam & test schedules" body="Examination timetables, class tests and extra classes published by teachers — parents can verify." />
          <Feature icon={BookOpen} title="Academic documents" body="Report cards and marks accessible to parents directly from the school." />
          <Feature icon={Users} title="Verified parent links" body="Schools approve each parent-learner link, keeping the school as the source of truth." />
          <Feature icon={TrendingUp} title="Transfers" body="Request and approve learner transfers with a full audit trail." />
        </div>
      </section>

      {/* SCHOOL REGISTRATION */}
      <section className="container mx-auto px-4 pb-16">
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1">
            <div className="size-12 rounded-xl bg-accent/15 text-accent grid place-items-center mb-4">
              <School className="size-6" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Is your school not on PASA yet?</h3>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Submit a request and we'll reach out to get your school set up. It's free — no hidden costs, no contracts.
            </p>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent inline-block" />Free for schools</li>
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent inline-block" />We handle the setup</li>
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent inline-block" />Ready in days, not weeks</li>
            </ul>
          </div>
          <div className="shrink-0">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setSchoolFormOpen(true)}
            >
              Register your school <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* School registration dialog */}
      <Dialog open={schoolFormOpen} onOpenChange={setSchoolFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register your school on PASA</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2 mb-4">
            Fill in your details and we'll be in touch to get your school set up.
          </p>
          <SchoolRegistrationForm onClose={() => setSchoolFormOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24">
        <Card className="p-10 md:p-14 bg-primary text-primary-foreground border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-transparent to-transparent" />
          <div className="relative max-w-2xl">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight">Bridge the gap between home and school.</h3>
            <p className="mt-3 text-primary-foreground/70">Free for schools. Free for parents. One app connecting every parent to every school.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/auth">Create my account</Link></Button>
            </div>
          </div>
        </Card>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <svg width="18" height="18" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="32" cy="40" rx="14" ry="16" fill="currentColor" opacity="0.5"/>
            <circle cx="20" cy="22" r="5" fill="currentColor" opacity="0.4"/>
            <circle cx="29" cy="18" r="5" fill="#38bdf8" opacity="0.8"/>
            <circle cx="38" cy="20" r="5" fill="currentColor" opacity="0.4"/>
            <circle cx="46" cy="26" r="4" fill="currentColor" opacity="0.25"/>
          </svg>
          <a href="https://barefootlabs.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors font-medium">
            Barefoot Labs
          </a>
        </div>
        © {new Date().getFullYear()} PASA · Made for South African schools
      </footer>
    </div>
  );
}

