import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { CalendarDays, Clock, Flag, Plus } from "lucide-react";
import type { CalEvent, ClassOption } from "./types";
import { eventColor, formatTime } from "./types";
import { CalendarGrid } from "./CalendarGrid";
import { EventForm } from "./EventForm";

export function CalendarPage() {
  const { primarySchoolId, primaryRole, user } = useAuth();
  const today = new Date();

  const [year, setYear]       = useState(today.getFullYear());
  const [month, setMonth]     = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(today.toISOString().slice(0, 10));
  const [events, setEvents]   = useState<CalEvent[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState(today.toISOString().slice(0, 10));

  const isStaff   = primaryRole !== "parent";
  const isTeacher = primaryRole === "teacher";

  // Load classes:
  // - teachers: only their own classes (scoped by teacher_user_id)
  // - admin/principal: all classes at the school (for the audience picker)
  useEffect(() => {
    if (!isStaff || !primarySchoolId || !user) return;
    const query = supabase
      .from("classes")
      .select("id, name, grade_id")
      .eq("school_id", primarySchoolId)
      .order("grade_id")
      .order("name");

    if (isTeacher) {
      query.eq("teacher_user_id", user.id);
    }

    query.then(({ data }) => setClasses((data ?? []) as ClassOption[]));
  }, [isStaff, isTeacher, primarySchoolId, user]);

  const loadEvents = () => {
    const from = new Date(year, month, 1).toISOString().slice(0, 10);
    const to   = new Date(year, month + 2, 0).toISOString().slice(0, 10);

    Promise.all([
      (supabase as any)
        .from("national_calendar")
        .select("id, title, description, event_date, event_type")
        .gte("event_date", from)
        .lte("event_date", to)
        .order("event_date"),

      primarySchoolId
        ? supabase
            .from("calendar_events")
            .select("id, title, description, event_date, event_time, event_type, schools(name), classes(name)")
            .eq("school_id", primarySchoolId)
            .gte("event_date", from)
            .lte("event_date", to)
            .order("event_date")
            .order("event_time", { ascending: true, nullsFirst: false })
        : Promise.resolve({ data: [] }),
    ]).then(([national, school]) => {
      const nat: CalEvent[] = (national.data ?? []).map((e: any) => ({
        ...e, event_time: null, source: "national" as const,
      }));
      const sch: CalEvent[] = (school.data ?? []).map((e: any) => ({
        ...e, source: "school" as const,
      }));
      setEvents([...nat, ...sch].sort((a, b) => a.event_date.localeCompare(b.event_date)));
    });
  };

  useEffect(() => { loadEvents(); }, [year, month, primarySchoolId]);

  const openAddDialog = (date?: string) => {
    setDialogDate(date ?? today.toISOString().slice(0, 10));
    setDialogOpen(true);
  };

  const byDate = events.reduce<Record<string, CalEvent[]>>((acc, e) => {
    (acc[e.event_date] ??= []).push(e);
    return acc;
  }, {});

  const prevMonth = () => month === 0 ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1);
  const nextMonth = () => month === 11 ? (setYear(y => y + 1), setMonth(0)) : setMonth(m => m + 1);

  const todayStr      = today.toISOString().slice(0, 10);
  const selectedEvents = selected ? (byDate[selected] ?? []) : [];
  const upcoming       = events.filter(e => e.event_date >= todayStr).slice(0, 10);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Calendar"
        sub="SA school calendar and your school's events."
        action={
          isStaff ? (
            <Button
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => openAddDialog(selected ?? undefined)}
            >
              <Plus className="size-4 mr-1.5" /> Add event
            </Button>
          ) : undefined
        }
      />

      {/* ── Legend ── */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-green-500 inline-block" />Term start</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-orange-500 inline-block" />Term end</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500 inline-block" />Public holiday</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-accent inline-block" />School event</span>
      </div>

      {/* ── Month grid ── */}
      <CalendarGrid
        year={year}
        month={month}
        selected={selected}
        todayStr={todayStr}
        byDate={byDate}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onSelectDate={setSelected}
      />

      {/* ── Selected day ── */}
      {selected && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-muted-foreground">
              {new Date(selected + "T00:00:00").toLocaleDateString("en-ZA", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </div>
            {isStaff && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 gap-1"
                onClick={() => openAddDialog(selected)}
              >
                <Plus className="size-3" /> Add event
              </Button>
            )}
          </div>
          {selectedEvents.length === 0 ? (
            <Card className="p-4 text-center text-sm text-muted-foreground">No events on this day.</Card>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Upcoming ── */}
      {upcoming.length > 0 && (
        <div>
          <div className="text-sm font-semibold mb-2 text-muted-foreground">Upcoming</div>
          <div className="space-y-2">
            {upcoming.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <CalendarDays className="size-8 mx-auto mb-2 opacity-40" />
          No events this month.
        </Card>
      )}

      {/* ── Add event dialog ── */}
      {isStaff && (
        <EventForm
          open={dialogOpen}
          defaultDate={dialogDate}
          classes={classes}
          isTeacher={isTeacher}
          onOpenChange={setDialogOpen}
          onSaved={loadEvents}
        />
      )}
    </div>
  );
}

function EventCard({ event }: { event: CalEvent }) {
  const dot  = eventColor(event.event_type);
  const time = formatTime(event.event_time);
  const isNational = event.source === "national";

  return (
    <Card className={`p-4 flex items-start gap-3 ${isNational ? "bg-muted/30" : ""}`}>
      <div className={`size-2.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <span className="font-medium text-sm">{event.title}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {isNational && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 text-muted-foreground">
                <Flag className="size-2.5" /> SA
              </Badge>
            )}
            {event.event_type && (
              <Badge variant="secondary" className="capitalize text-[10px] px-1.5 py-0">
                {event.event_type.replace("_", " ")}
              </Badge>
            )}
            {event.classes?.name && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-purple-600 border-purple-300">
                {event.classes.name}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
          <span>
            {new Date(event.event_date + "T00:00:00").toLocaleDateString("en-ZA", {
              day: "numeric", month: "short",
            })}
          </span>
          {time && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />{time}
            </span>
          )}
          {event.schools?.name && <span>{event.schools.name}</span>}
        </div>
        {event.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{event.description}</p>
        )}
      </div>
    </Card>
  );
}
