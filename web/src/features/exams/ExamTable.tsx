import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, CalendarDays, Clock, MapPin } from "lucide-react";
import type { ExamEntry, Grade } from "./types";
import { formatTime, formatDate } from "./types";

export function ExamTable({
  grouped,
  sortedDates,
  grades,
  canManage,
  examsEmpty,
  deleting,
  onDelete,
}: {
  grouped: Record<string, ExamEntry[]>;
  sortedDates: string[];
  grades: Grade[];
  canManage: boolean;
  examsEmpty: boolean;
  deleting: string | null;
  onDelete: (exam: ExamEntry) => void;
}) {
  const gradeLabel = (id: number | null) => {
    if (id === null) return null;
    return grades.find((g) => g.id === id)?.label ?? `Grade ${id}`;
  };

  if (sortedDates.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground text-sm">
        <CalendarDays className="size-8 mx-auto mb-2 opacity-40" />
        {examsEmpty
          ? canManage
            ? "No exams scheduled yet. Click \"Add exam\" to get started."
            : "No exams scheduled yet."
          : "No exams match your filters."}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => (
        <div key={date}>
          {/* Date header */}
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="size-4 text-accent shrink-0" />
            <span className="text-sm font-semibold">{formatDate(date)}</span>
          </div>

          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Venue</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {grouped[date].map((exam) => (
                  <tr key={exam.id} className="border-t align-middle">
                    <td className="p-3">
                      <div className="font-medium">{exam.subject}</div>
                      {exam.notes && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">
                          {exam.notes}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {gradeLabel(exam.grade_id) ? (
                        <Badge variant="secondary" className="text-xs">
                          {gradeLabel(exam.grade_id)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">All</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatTime(exam.start_time) ? (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 shrink-0" />
                          {formatTime(exam.start_time)}
                          {formatTime(exam.end_time) && ` – ${formatTime(exam.end_time)}`}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {exam.venue ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3 shrink-0" />
                          {exam.venue}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {canManage && (
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={deleting === exam.id}
                          onClick={() => onDelete(exam)}
                          title="Remove exam"
                        >
                          {deleting === exam.id
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
        </div>
      ))}
    </div>
  );
}
