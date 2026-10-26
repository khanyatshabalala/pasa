import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, ApiError, type ChildDetailResponse } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, CheckCircle2, Clock, XCircle, AlertCircle, Shield,
  Star, AlertTriangle, ShieldAlert, Zap, FileText, Download, Loader2, CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { Route } from "@/routes/app.child.$learnerId";

const ATT_COLOR: Record<string, string> = {
  present: "text-green-600 bg-green-500/10",
  late:    "text-orange-500 bg-orange-500/10",
  absent:  "text-red-500 bg-red-500/10",
  excused: "text-blue-500 bg-blue-500/10",
};
const ATT_ICON: Record<string, React.ReactNode> = {
  present: <CheckCircle2 className="size-3.5 text-green-500" />,
  late:    <Clock className="size-3.5 text-orange-400" />,
  absent:  <XCircle className="size-3.5 text-red-500" />,
  excused: <AlertCircle className="size-3.5 text-blue-400" />,
};
const DISC_COLOR: Record<string, string> = {
  merit:      "text-green-600 bg-green-500/10",
  warning:    "text-orange-500 bg-orange-500/10",
  detention:  "text-red-500 bg-red-500/10",
  suspension: "text-red-700 bg-red-700/10",
  incident:   "text-purple-600 bg-purple-500/10",
};
const DISC_ICON: Record<string, React.ReactNode> = {
  merit:      <Star className="size-3.5" />,
  warning:    <AlertTriangle className="size-3.5" />,
  detention:  <ShieldAlert className="size-3.5" />,
  suspension: <ShieldAlert className="size-3.5" />,
  incident:   <Zap className="size-3.5" />,
};

function gradeLabel(g: number | null) {
  if (g === null) return "";
  return g === 0 ? "Grade R" : `Grade ${g}`;
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function ChildDetailPage() {
  const { learnerId } = Route.useParams();
  const [data, setData] = useState<ChildDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!learnerId) return;
    setLoading(true);
    api.get<ChildDetailResponse>(`/api/v1/children/${learnerId}/detail`)
      .then((d) => { setData(d); setError(null); })
      .catch((e) => setError(e instanceof ApiError && e.status === 403
        ? "You don't have access to this learner."
        : "Could not load this learner."))
      .finally(() => setLoading(false));
  }, [learnerId]);

  const onDownload = async (reportCardId: string) => {
    setDownloading(reportCardId);
    try {
      const blob = await api.getBlob(`/api/v1/learners/${learnerId}/report-cards/${reportCardId}/download`);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error("Could not open the report card.");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground py-10 text-center">Loading…</div>;
  if (error || !data) {
    return (
      <div className="max-w-lg">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
          <Link to="/app"><ArrowLeft className="size-4 mr-1" />Back to overview</Link>
        </Button>
        <Card className="p-10 text-center text-muted-foreground text-sm">{error ?? "Not found."}</Card>
      </div>
    );
  }

  const { child, attendanceSummary: a, recentAttendance, discipline, reportCards, upcomingEvents } = data;
  const todayAtt = child.todayStatus;

  return (
    <div className="max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
        <Link to="/app"><ArrowLeft className="size-4 mr-1" />Back to overview</Link>
      </Button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="size-12 rounded-full bg-accent/15 text-accent grid place-items-center shrink-0 font-semibold">
          {`${child.firstName?.[0] ?? ""}${child.lastName?.[0] ?? ""}`.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{child.firstName} {child.lastName}</h1>
          <p className="text-sm text-muted-foreground">
            {[gradeLabel(child.gradeId), child.schoolName].filter(Boolean).join(" · ")}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {child.learnerNumber && <Badge variant="secondary" className="text-[10px]">No. {child.learnerNumber}</Badge>}
            {todayAtt && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${ATT_COLOR[todayAtt] ?? ""}`}>
                {ATT_ICON[todayAtt]}<span className="capitalize">{todayAtt} today</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Attendance */}
        <div>
          <h2 className="font-semibold text-sm mb-3">Attendance this year</h2>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { label: "Present", value: a.present, color: "text-green-600" },
              { label: "Late",    value: a.late,    color: "text-orange-500" },
              { label: "Absent",  value: a.absent,  color: "text-red-500" },
              { label: "Rate",    value: a.ratePercent !== null ? `${a.ratePercent}%` : "—", color: a.ratePercent !== null && a.ratePercent >= 80 ? "text-green-600" : "text-orange-500" },
            ].map(s => (
              <Card key={s.label} className="p-3 text-center">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
              </Card>
            ))}
          </div>
          {recentAttendance.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-sm">No attendance records yet.</Card>
          ) : (
            <Card className="overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground sticky top-0">
                  <tr><th className="p-2.5">Date</th><th className="p-2.5">Status</th><th className="p-2.5">Notes</th></tr>
                </thead>
                <tbody>
                  {recentAttendance.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.date + "T00:00:00").toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" })}
                      </td>
                      <td className="p-2.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full ${ATT_COLOR[r.status] ?? ""}`}>
                          {ATT_ICON[r.status]}{r.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-xs text-muted-foreground">{r.notes ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        {/* Discipline */}
        <div>
          <h2 className="font-semibold text-sm mb-3">Discipline history</h2>
          {discipline.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-sm">
              <Shield className="size-6 mx-auto mb-2 opacity-40" />No discipline records.
            </Card>
          ) : (
            <Card className="overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground sticky top-0">
                  <tr><th className="p-2.5">Type</th><th className="p-2.5">Title</th><th className="p-2.5">Date</th></tr>
                </thead>
                <tbody>
                  {discipline.map(r => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2.5">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full ${DISC_COLOR[r.type] ?? "text-muted-foreground bg-muted"}`}>
                          {DISC_ICON[r.type]}{r.type}
                        </span>
                      </td>
                      <td className="p-2.5 text-xs font-medium">{r.title}</td>
                      <td className="p-2.5 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(r.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        {/* Report cards */}
        <div>
          <h2 className="font-semibold text-sm mb-3">Report cards</h2>
          {reportCards.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-sm">
              <FileText className="size-6 mx-auto mb-2 opacity-40" />No report cards yet.
            </Card>
          ) : (
            <div className="space-y-2">
              {reportCards.map(rc => (
                <Card key={rc.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium">Term {rc.term} · {rc.academicYear}</div>
                      <div className="text-xs text-muted-foreground truncate">{rc.fileName}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 gap-1.5"
                    disabled={downloading === rc.id} onClick={() => onDownload(rc.id)}>
                    {downloading === rc.id ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                    View
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming events */}
        <div>
          <h2 className="font-semibold text-sm mb-3">Upcoming at {child.schoolName ?? "school"}</h2>
          {upcomingEvents.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-sm">
              <CalendarDays className="size-6 mx-auto mb-2 opacity-40" />No upcoming events.
            </Card>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map(e => (
                <Card key={e.id} className="p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{e.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {fmtDate(e.eventDate)}{e.eventTime && ` · ${e.eventTime.slice(0, 5)}`}
                    </div>
                  </div>
                  {e.eventType && <Badge variant="secondary" className="capitalize text-[10px] shrink-0">{e.eventType}</Badge>}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
