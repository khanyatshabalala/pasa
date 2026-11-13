import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GradeResponse } from "@/lib/api";

interface Props {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

/** Grade dropdown. Fetches /api/v1/grades once on mount. */
export function GradeSelect({ value, onChange, required, disabled }: Props) {
  const [grades, setGrades] = useState<GradeResponse[]>([]);

  useEffect(() => {
    api.get<GradeResponse[]>("/api/v1/grades").then(setGrades).catch(() => {});
  }, []);

  return (
    <div>
      <Label>Grade{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
        <SelectContent className="max-h-60">
          {grades.map(g => (
            <SelectItem key={g.id} value={String(g.id)}>{g.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
