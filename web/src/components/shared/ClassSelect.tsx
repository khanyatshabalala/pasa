import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClassResponse } from "@/lib/api";

interface Props {
  schoolId: string;
  gradeId: string; // string because form state is always string
  value: string;
  onChange: (value: string) => void;
}

/**
 * Class dropdown for a school+grade. Only renders when the school has classes
 * for the selected grade — hidden otherwise, so no empty dropdown is shown.
 */
export function ClassSelect({ schoolId, gradeId, value, onChange }: Props) {
  const [classes, setClasses] = useState<ClassResponse[]>([]);

  useEffect(() => {
    if (!schoolId) { setClasses([]); return; }
    api.get<ClassResponse[]>(`/api/v1/schools/${schoolId}/classes`)
      .then(setClasses)
      .catch(() => setClasses([]));
  }, [schoolId]);

  const filtered = classes
    .filter(c => gradeId !== "" && c.gradeId === Number(gradeId))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (filtered.length === 0) return null;

  return (
    <div>
      <Label>Class</Label>
      <Select value={value || "_none"} onValueChange={v => onChange(v === "_none" ? "" : v)}>
        <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">Not assigned</SelectItem>
          {filtered.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
