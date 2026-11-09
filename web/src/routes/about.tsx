import { createFileRoute } from "@tanstack/react-router";
import { PublicHeader } from "@/components/layout/PublicHeader";

export const Route = createFileRoute("/about")({
  component: About
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-sm text-accent font-medium mb-2">ABOUT PASA</div>
        <h1 className="text-4xl font-bold tracking-tight">Built for South African schools.</h1>
        <div className="mt-8 space-y-5 text-muted-foreground leading-relaxed">
          <p>
            Cape Town winters are rough. During a particularly bad stretch in 2026,
            many schools in the city were disrupted for days. On a Thursday — when the
            worst of the weather had passed — a learner was spotted on the street in
            full school uniform, calling out to a friend across the road, asking whether
            they were heading to school. The reply: <em>"I haven't gone once this week.
            And tomorrow I'm not going either."</em> Full uniform, mid-morning, on the streets.
          </p>
          <p>
            That moment surfaced something that had been quietly understood but rarely
            said out loud: a child leaving home in school uniform does not mean they
            arrived at school. It does not mean they stayed. And if nothing bad happens
            that day, the parent may never know.
          </p>
          <p>
            The same gap shows up in other ways. Learners sometimes tell parents that
            classes were cancelled to spend time with friends instead. If something
            happens at school that requires a parent, someone who is not the actual
            parent shows up. Report cards arrive late, or not at all. A meeting is
            called and the right parent never got the message.
          </p>
          <p>
            PASA — the Parent and School Alliance — was built to close that visibility
            gap. A direct, verified connection between schools and the parents who are
            responsible for the learner. Not a WhatsApp group. Not a paper letter that
            depends on a teenager to deliver. A system that gives the school a reliable
            channel to the right person, every time.
          </p>
          <p>
            We support the four roles that actually run a school: parents, teachers,
            principals and school administrators. Each gets a dashboard built for what
            they actually do.
          </p>
          <p>
            PASA is free for parents and free for schools — part of our commitment to
            South African education.
          </p>
          <p className="text-foreground/60 text-sm pt-4 border-t border-border/40">
            PASA is built and maintained by{" "}
            <a href="https://barefootlabs.io" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline font-medium">
              Barefoot Labs
            </a>
            {" "}— a South African software company building tools that matter.
          </p>
        </div>
      </section>
    </div>
  );
}
