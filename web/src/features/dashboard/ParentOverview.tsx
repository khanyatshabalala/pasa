import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { api, type ParentDashboardResponse, type ParentDashboardChild } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell, CalendarDays, ClipboardList,
  Shield, ArrowRight, Plus, UserPlus, CheckCircle2,
  XCircle, Clock, AlertCircle, ChevronRight,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────
function currentTerm(): number {
  const m = new Date().getMonth() + 1; // 1-12
  if (m <= 3)  return 1;
  if (m <= 6)  return 2;
  if (m <= 9)  return 3;
  return 4;
}

function greetingTime() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function gradeLabel(g: number | null) {
  if (g === null || g === undefined) return "";
  return g === 0 ? "Grade R" : `Grade ${g}`;
}

const ATT: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  present: { icon: <CheckCircle2 className="size-4 text-green-500" />, label: "Present today",  color: "text-green-600" },
  late:    { icon: <Clock        className="size-4 text-orange-400" />, label: "Late today",     color: "text-orange-500" },
  absent:  { icon: <XCircle      className="size-4 text-red-500" />,    label: "Absent today",   color: "text-red-500" },
  excused: { icon: <AlertCircle  className="size-4 text-blue-400" />,   label: "Excused today",  color: "text-blue-500" },
};

// ── Component ──────────────────────────────────────────────────────────────
export function ParentOverview() {
  const { user, displayName } = useAuth();

  const [children, setChildren]         = useState<ParentDashboardChild[]>([]);
  const [unreadCount, setUnreadCount]   = useState(0);
  const [recentAlerts, setRecentAlerts] = useState<ParentDashboardResponse["recentAlerts"]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get<ParentDashboardResponse>("/api/v1/parents/dashboard")
      .then((d) => {
        setChildren(d.children);
        setUnreadCount(d.unreadCount);
        setRecentAlerts(d.recentAlerts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const firstName = displayName?.split(" ")[0] ?? "there";
  const term      = currentTerm();
  const dateLabel = new Date().toLocaleDateString("en-ZA", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="max-w-2xl space-y-4">

      {/* ── Greeting ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greetingTime()}, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {dateLabel} · Term {term}
        </p>
      </div>

      {/* ── No children CTA ── */}
      {!loading && children.length === 0 && (
        <Card className="p-6 border-dashed border-2 text-center">
          <UserPlus className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm font-medium">No children linked yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Ask your school admin for your child's learner number, then link them here.
          </p>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/app/children"><Plus className="size-4 mr-1.5" />Link a child</Link>
          </Button>
        </Card>
      )}

      {/* ── Per-child cards ── */}
      {children.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {children.map((c) => <ChildCard key={c.id} child={c} />)}
        </div>
      )}

      {/* ── Unread alerts (family-wide) ── */}
      {unreadCount > 0 && (
        <Card className="p-4 border-accent/40 bg-accent/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-accent" />
              <h2 className="font-semibold text-sm">
                {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
              </h2>
            </div>
            <Link to="/app/alerts" className="text-xs text-accent hover:underline flex items-center gap-1">
              See all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentAlerts.map((n) => (
              <div key={n.id} className="flex items-start gap-2">
                <span className="size-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground truncate">{n.body}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Quick links ── */}
      {children.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <QuickLink to="/app/attendance" icon={ClipboardList} label="Attendance" color="text-orange-500 bg-orange-500/10" />
          <QuickLink to="/app/discipline" icon={Shield}        label="Discipline"  color="text-red-500 bg-red-500/10" />
          <QuickLink to="/app/alerts"     icon={Bell}          label="Notifications" color="text-accent bg-accent/10"
            badge={unreadCount > 0 ? String(unreadCount) : undefined} />
        </div>
      )}

    </div>
  );
}

// ── Per-child card ───────────────────────────────────────────────────────
function ChildCard({ child: c }: { child: ParentDashboardChild }) {
  const att = c.todayStatus ? ATT[c.todayStatus] : null;
  const initials = `${c.firstName?.[0] ?? ""}${c.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <Link to="/app/child/$learnerId" params={{ learnerId: c.id }} className="block group">
      <Card className="p-4 h-full hover:border-accent/40 hover:shadow-sm transition-all">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-full bg-accent/15 text-accent grid place-items-center shrink-0 font-semibold text-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate group-hover:text-accent transition-colors">
              {c.firstName} {c.lastName}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {[gradeLabel(c.gradeId), c.schoolName].filter(Boolean).join(" · ")}
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        </div>

        {/* Today's attendance */}
        <div className="mt-3 pt-3 border-t flex items-center gap-1.5 text-xs">
          {att ? (
            <>
              {att.icon}
              <span className={`font-medium ${att.color}`}>{att.label}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Attendance not recorded yet</span>
          )}
        </div>

        {/* Next event */}
        {c.nextEvent && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span className="min-w-0">
              <span className="font-medium text-foreground">{c.nextEvent.title}</span>
              {" · "}
              {new Date(c.nextEvent.eventDate + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
              {c.nextEvent.eventTime && ` · ${c.nextEvent.eventTime.slice(0, 5)}`}
            </span>
          </div>
        )}
      </Card>
    </Link>
  );
}

function QuickLink({ to, icon: Icon, label, color, badge }: {
  to: string; icon: any; label: string; color: string; badge?: string;
}) {
  return (
    <Link to={to as any}>
      <Card className="p-3 flex flex-col items-center gap-2 hover:border-accent/40 transition-colors relative">
        {badge && (
          <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold grid place-items-center">
            {parseInt(badge) > 9 ? "9+" : badge}
          </span>
        )}
        <div className={`size-9 rounded-lg grid place-items-center ${color}`}>
          <Icon className="size-4" />
        </div>
        <span className="text-xs font-medium">{label}</span>
      </Card>
    </Link>
  );
}
