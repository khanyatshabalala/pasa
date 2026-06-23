import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Trash2, Shield } from "lucide-react";
import type { UserRole } from "@/lib/auth-context";
import type { DisciplineRow } from "./types";
import { TYPE_COLORS } from "./types";

function canDelete(record: DisciplineRow, userId: string, primaryRole: UserRole): boolean {
  return (
    record.recorded_by === userId ||
    primaryRole === "principal" ||
    primaryRole === "school_admin" ||
    primaryRole === "super_admin"
  );
}

export function DisciplineTable({
  records,
  allRecordsEmpty,
  userId,
  primaryRole,
  deleting,
  onDelete,
}: {
  records: DisciplineRow[];
  allRecordsEmpty: boolean;
  userId: string | undefined;
  primaryRole: UserRole;
  deleting: string | null;
  onDelete: (record: DisciplineRow) => void;
}) {
  if (records.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground text-sm">
        <Shield className="size-8 mx-auto mb-2 opacity-40" />
        {allRecordsEmpty
          ? "No discipline records yet. Click \"Log record\" to get started."
          : "No records match your filters."}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
          <tr>
            <th className="p-3">Learner</th>
            <th className="p-3">Type</th>
            <th className="p-3">Title</th>
            <th className="p-3">Date</th>
            <th className="p-3">Points</th>
            <th className="p-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-t align-middle">
              <td className="p-3 font-medium">
                <div>{r.learners?.first_name} {r.learners?.last_name}</div>
                <div className="text-xs text-muted-foreground">
                  Grade {r.learners?.grade_id === 0 ? "R" : r.learners?.grade_id ?? "—"}
                </div>
              </td>
              <td className="p-3">
                <span
                  className={`text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full ${TYPE_COLORS[r.type] ?? "text-muted-foreground bg-muted"}`}
                >
                  {r.type}
                </span>
              </td>
              <td className="p-3">
                <div className="font-medium">{r.title}</div>
                {r.description && (
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.description}</div>
                )}
              </td>
              <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                {new Date(r.date + "T00:00:00").toLocaleDateString("en-ZA", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </td>
              <td className="p-3 text-muted-foreground">
                {r.points ?? "—"}
              </td>
              <td className="p-3 text-right">
                {userId && canDelete(r, userId, primaryRole) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={deleting === r.id}
                    onClick={() => onDelete(r)}
                    title="Delete record"
                  >
                    {deleting === r.id
                      ? <Loader2 className="size-4 animate-spin" />
                      : <Trash2 className="size-4 text-destructive" />}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
