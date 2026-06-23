import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { friendlyDbError } from "@/lib/db-errors";
import type { ClassOption } from "./types";
import { EVENT_TYPES } from "./types";

export function EventForm({
  open,
  defaultDate,
  classes,
  isTeacher,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  defaultDate: string;
  classes: ClassOption[];
  isTeacher: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { user, primarySchoolId } = useAuth();
  const [saving, setSaving] = useState(false);

  // Teachers must always pick a class — default to their only class if they have one
  const defaultClassId = classes.length === 1 ? classes[0].id : "";

  const [title, setTitle]             = useState("");
  const [eventType, setEventType]     = useState("extra_class");
  const [eventDate, setEventDate]     = useState(defaultDate);
  const [eventTime, setEventTime]     = useState("");
  const [classId, setClassId]         = useState(defaultClassId);
  const [description, setDescription] = useState("");

  // Keep date in sync when defaultDate changes (clicking a day)
  useEffect(() => { setEventDate(defaultDate); }, [defaultDate]);
  // Auto-select class when there's only one
  useEffect(() => { setClassId(classes.length === 1 ? classes[0].id : ""); }, [classes]);

  const reset = () => {
    setTitle("");
    setEventType("extra_class");
    setEventDate(defaultDate);
    setEventTime("");
    setClassId(classes.length === 1 ? classes[0].id : "");
    setDescription("");
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim())              return toast.error("Enter a title");
    if (!eventDate)                 return toast.error("Select a date");
    if (!primarySchoolId)           return toast.error("No school assigned");
    // Teachers must select a class
    if (isTeacher && !classId)      return toast.error("Select a class");

    setSaving(true);
    const { error } = await supabase.from("calendar_events").insert({
      school_id:   primarySchoolId,
      title:       title.trim(),
      event_type:  eventType,
      event_date:  eventDate,
      event_time:  eventTime || null,
      class_id:    classId || null,
      description: description.trim() || null,
      created_by:  user?.id,
    });
    setSaving(false);

    if (error) return toast.error(friendlyDbError(error));

    toast.success("Event added to calendar");
    reset();
    onOpenChange(false);
    onSaved();
  };

  const selectedClass = classes.find(c => c.id === classId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Title */}
          <div>
            <Label>What's happening?</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isTeacher ? "e.g. Extra Maths class, Test revision…" : "e.g. Sports day, Parent meeting…"}
              maxLength={120}
              autoFocus
            />
          </div>

          {/* Event type */}
          <div>
            <Label>Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class selector */}
          <div>
            <Label>
              {isTeacher ? "Class" : "Class / audience"}
              {!isTeacher && <span className="text-muted-foreground text-xs ml-1">(optional)</span>}
            </Label>
            <Select
              value={classId || "whole_school"}
              onValueChange={(v) => setClassId(v === "whole_school" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={isTeacher ? "Select your class" : "Whole school"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {/* Admin/principal can target whole school; teachers cannot */}
                {!isTeacher && (
                  <SelectItem value="whole_school">🏫 Whole school</SelectItem>
                )}
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isTeacher && classes.length === 1 && (
              <p className="text-xs text-muted-foreground mt-1">
                Your class is auto-selected.
              </p>
            )}
            {isTeacher && classes.length === 0 && (
              <p className="text-xs text-destructive mt-1">
                No classes assigned to your profile yet.
              </p>
            )}
            {!isTeacher && selectedClass && (
              <p className="text-xs text-muted-foreground mt-1">
                Only parents of learners in <strong>{selectedClass.name}</strong> will be notified.
              </p>
            )}
            {!isTeacher && !classId && (
              <p className="text-xs text-muted-foreground mt-1">
                All parents at the school will be notified.
              </p>
            )}
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div>
              <Label>
                Time <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>
              Details <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any extra info for learners or parents…"
              rows={2}
              maxLength={500}
            />
          </div>

          <Button
            type="submit"
            disabled={saving || !title.trim() || !eventDate || (isTeacher && !classId)}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {saving
              ? <><Loader2 className="size-4 animate-spin mr-2" />Saving…</>
              : <><Plus className="size-4 mr-2" />Add event</>}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
