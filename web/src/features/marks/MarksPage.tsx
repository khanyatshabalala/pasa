import { useEffect, useState } from "react";
import { api, type ReportCardResponse, type ParentChildResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, FileText, Download, Loader2, GraduationCap } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

type ReportCard = ReportCardResponse;

export function MarksPage() {
  const { user, primaryRole } = useAuth();
  const isParent = primaryRole === "parent";

  const [reports, setReports]       = useState<ReportCard[]>([]);
  const [loading, setLoading]       = useState(true);
  const [yearFilter, setYearFilter] = useState(String(CURRENT_YEAR));
  const [termFilter, setTermFilter] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isParent) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const children = await api.get<ParentChildResponse[]>("/api/v1/children");
        if (!children.length) { setReports([]); return; }
        const perChild = await Promise.all(
          children.map(c =>
            api.get<ReportCard[]>(`/api/v1/learners/${c.learnerId}/report-cards`).catch(() => [] as ReportCard[])
          )
        );
        const all = perChild.flat().sort((a, b) =>
          b.academicYear - a.academicYear || b.term - a.term
        );
        setReports(all);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isParent]);

  const onDownload = async (report: ReportCard) => {
    setDownloading(report.id);
    try {
      const blob = await api.getBlob(`/api/v1/learners/${report.learnerId}/report-cards/${report.id}/download`);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      // Revoke after a delay so the new tab can load it first.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      // ignore — download failed
    } finally {
      setDownloading(null);
    }
  };

  if (!isParent) {
    return (
      <div className="max-w-lg">
        <PageHeader title="Report cards" sub="View your children's term report cards." />
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <ShieldAlert className="size-8 mx-auto mb-2 opacity-40" />
          This page is for parents only.
        </Card>
      </div>
    );
  }

  // Filter
  const filtered = reports.filter(r => {
    if (yearFilter && r.academicYear !== parseInt(yearFilter)) return false;
    if (termFilter && r.term !== parseInt(termFilter)) return false;
    return true;
  });

  // Group by learner for a cleaner layout
  const grouped = filtered.reduce<Record<string, { name: string; cards: ReportCard[] }>>((acc, r) => {
    if (!acc[r.learnerId]) {
      acc[r.learnerId] = {
        name: `${r.learnerFirstName ?? ""} ${r.learnerLastName ?? ""}`.trim() || "Learner",
        cards: [],
      };
    }
    acc[r.learnerId].cards.push(r);
    return acc;
  }, {});

  // Available years from data
  const years = [...new Set(reports.map(r => r.academicYear))].sort((a, b) => b - a);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Report cards"
        sub="Your children's term report cards, uploaded by the school."
      />

      {/* ── Filters ── */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All years</SelectItem>
            {(years.length ? years : [CURRENT_YEAR]).map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={termFilter} onValueChange={setTermFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All terms</SelectItem>
            {[1, 2, 3, 4].map(t => (
              <SelectItem key={t} value={String(t)}>Term {t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-10 text-center">Loading…</div>
      ) : reports.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <FileText className="size-8 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground mb-1">No report cards yet</p>
          <p>Your school will upload report cards here at the end of each term.</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          No report cards match your filters.
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([learnerId, { name, cards }]) => (
            <div key={learnerId}>
              {/* Learner header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="size-8 rounded-full bg-accent/15 text-accent grid place-items-center shrink-0">
                  <GraduationCap className="size-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm">
                    {name}
                  </div>
                </div>
              </div>

              {/* Report cards grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                {cards.map(card => (
                  <Card key={card.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="size-10 rounded-lg bg-muted grid place-items-center shrink-0">
                        <FileText className="size-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
                          Term {card.term}
                          <Badge variant="secondary" className="text-[10px]">{card.academicYear}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {card.fileName}
                        </div>
                        {card.notes && (
                          <div className="text-xs text-muted-foreground italic mt-1 line-clamp-2">
                            {card.notes}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Uploaded {new Date(card.uploadedAt).toLocaleDateString("en-ZA", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      disabled={downloading === card.id}
                      onClick={() => onDownload(card)}
                    >
                      {downloading === card.id
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Download className="size-3.5" />}
                      View
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
