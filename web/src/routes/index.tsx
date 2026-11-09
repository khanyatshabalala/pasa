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
              Launching in the Western Cape · 2027
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.05]">
              Your child left home <br />
              <span className="text-accent">in full uniform.</span>
            </h1>
            <p className="mt-6 text-lg text-white/70 max-w-2xl leading-relaxed">
              That does not mean they arrived at school. And if they did, it does not mean they stayed. PASA is a direct, verified connection between schools and parents — so what happens at school does not stay at school.
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
            <p className="mt-12 text-xs text-white/40 max-w-md leading-relaxed">
              PASA is in pre-launch. We are approaching Western Cape schools in early 2027 and building with their input. Free for schools. Free for parents.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mb-12">
          <div className="text-sm font-medium text-accent mb-2">THE VISIBILITY GAP</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">A lot can happen between leaving home and arriving at school.</h2>
          <p className="text-muted-foreground mt-3">
            Learners skip classes. Parents are called to school and a stranger shows up instead. Bad weather closes the school for a week and no one told you. WhatsApp groups help but they are not the answer — the right parent does not always get the right message. PASA closes that gap with a verified, direct line between the school and the people who are actually responsible for the learner.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Feature icon={Bell} title="Direct to the parent" body="Notifications go straight to the verified parent's phone. Attendance, conduct, school closures — not filtered through a group chat or a 15-year-old." />
          <Feature icon={Users} title="Verified links, no impostors" body="The school approves every parent-learner connection. If the school calls a parent in, the person who shows up is the actual parent." />
          <Feature icon={BookOpen} title="Report cards & marks" body="Schools upload report cards directly. Parents access them in the app — no envelope that gets lost or opened and resealed." />
          <Feature icon={CalendarDays} title="One school calendar" body="Exam dates, school events, public holidays and closures — all in one feed, updated by the school, visible to every linked parent." />
          <Feature icon={Shield} title="Conduct on record" body="Discipline records go directly to the verified parent. No more 'I didn't know' on both sides." />
          <Feature icon={GraduationCap} title="Exam timetables" body="Published by teachers, visible to parents before the learner loses the printout." />
          <Feature icon={TrendingUp} title="Transfers" body="Learner transfers handled with a proper paper trail, not a series of phone calls." />
        </div>
      </section>

      {/* SCHOOL REGISTRATION */}
      <section className="container mx-auto px-4 pb-16">
        <div className="rounded-2xl border border-accent/20 bg-accent/5 p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center gap-8">
          <div className="flex-1">
            <div className="size-12 rounded-xl bg-accent/15 text-accent grid place-items-center mb-4">
              <School className="size-6" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">We are looking for Western Cape schools to pilot with.</h3>
            <p className="text-muted-foreground mt-2 max-w-lg">
              PASA is launching in early 2027. If you are a principal or school administrator in the Western Cape and want to be part of the first group, register your school now. We will reach out personally to discuss your school's specific needs and set everything up at no cost.
            </p>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent inline-block" />Free — no contracts, no hidden fees</li>
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent inline-block" />We handle onboarding and setup</li>
              <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent inline-block" />Built with pilot school input, not without it</li>
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
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight">The school knows. Now the parent can too.</h3>
            <p className="mt-3 text-primary-foreground/70">Free for schools. Free for parents. A direct line between the people who are responsible for the same child.</p>
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

