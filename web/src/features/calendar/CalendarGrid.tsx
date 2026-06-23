import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalEvent } from "./types";
import { DAYS, MONTHS, eventColor } from "./types";

export function CalendarGrid({
  year,
  month,
  selected,
  todayStr,
  byDate,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: {
  year: number;
  month: number;
  selected: string | null;
  todayStr: string;
  byDate: Record<string, CalEvent[]>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateStr: string | null) => void;
}) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Card className="overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <Button size="icon" variant="ghost" onClick={onPrevMonth} className="size-8">
          <ChevronLeft className="size-4" />
        </Button>
        <span className="font-semibold text-sm">{MONTHS[month]} {year}</span>
        <Button size="icon" variant="ghost" onClick={onNextMonth} className="size-8">
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 border-b">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-2">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="h-12 border-b border-r last:border-r-0" />;
          const dateStr   = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = byDate[dateStr] ?? [];
          const isToday   = dateStr === todayStr;
          const isSel     = dateStr === selected;
          // Dim weekends slightly
          const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;

          return (
            <button
              key={i}
              onClick={() => onSelectDate(isSel ? null : dateStr)}
              className={`relative h-12 flex flex-col items-center pt-1.5 border-b border-r last:border-r-0 transition-colors
                ${isSel ? "bg-accent/15" : "hover:bg-muted/50"}
                ${isWeekend ? "bg-muted/20" : ""}
              `}
            >
              <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                ${isToday ? "bg-accent text-accent-foreground font-bold" : ""}
                ${isSel && !isToday ? "text-accent font-bold" : ""}
                ${isWeekend && !isToday ? "text-muted-foreground" : ""}
              `}>
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((e, idx) => (
                    <span key={idx} className={`size-1.5 rounded-full ${eventColor(e.event_type)}`} />
                  ))}
                  {dayEvents.length > 3 && <span className="size-1.5 rounded-full bg-muted-foreground/40" />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
