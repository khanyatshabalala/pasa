import { Card } from "@/components/ui/card";
import { PageHeader } from "./PageHeader";
import { useEffect, useState } from "react";
import { api, type ParentChildResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { ShieldAlert } from "lucide-react";

// Maps the legacy `table` prop to the backend per-learner resource path.
const RESOURCE_PATH: Record<string, string> = {
  attendance: "attendance",
  discipline_records: "discipline",
};

// ── Parent-only guard wrapper ──────────────────────────────────────────────
function ParentOnly({ children }: { children: React.ReactNode }) {
  const { primaryRole, loading } = useAuth();
  if (loading) return null;
  if (primaryRole !== "parent") {
    return (
      <div className="max-w-lg">
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <ShieldAlert className="size-8 mx-auto mb-2 opacity-40" />
          This page is for parents only.
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}

// ── ParentDataList ─────────────────────────────────────────────────────────
export function ParentDataList({
  title,
  sub,
  table,
  columns,
  orderBy = "date",
}: {
  title: string;
  sub: string;
  table: string;
  columns: { key: string; label: string; format?: (v: any, r: any) => any }[];
  parentField?: string;
  orderBy?: string;
}) {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const resource = RESOURCE_PATH[table];
      if (!resource) { setRows([]); return; }
      try {
        const children = await api.get<ParentChildResponse[]>("/api/v1/children");
        if (!children.length) { setRows([]); return; }
        const perChild = await Promise.all(
          children.map(async (c) => {
            const items = await api
              .get<any[]>(`/api/v1/learners/${c.learnerId}/${resource}`)
              .catch(() => [] as any[]);
            return items.map((it) => ({
              ...it,
              learnerName: `${c.learnerFirstName} ${c.learnerLastName}`.trim(),
            }));
          })
        );
        const all = perChild.flat().sort((a, b) =>
          String(b[orderBy] ?? "").localeCompare(String(a[orderBy] ?? ""))
        );
        setRows(all.slice(0, 100));
      } catch {
        setRows([]);
      }
    })();
  }, [user, table, orderBy]);

  return (
    <ParentOnly>
      <div className="max-w-6xl">
        <PageHeader title={title} sub={sub} />
        <Card className="overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">No records yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Learner</th>
                  {columns.map((c) => (
                    <th key={c.key + c.label} className="p-3">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-medium">
                      {r.learnerName}
                    </td>
                    {columns.map((c) => (
                      <td key={c.key + c.label} className="p-3">
                        {c.format ? c.format(r[c.key], r) : r[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </ParentOnly>
  );
}

// ── StubPage ───────────────────────────────────────────────────────────────
export function StubPage({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="max-w-3xl">
      <PageHeader title={title} sub={sub} />
      <Card className="p-10 text-center text-muted-foreground text-sm">
        This area is coming in the next release.
      </Card>
    </div>
  );
}
