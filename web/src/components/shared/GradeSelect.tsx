import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GradeResponse } from "@/lib/api";

interface Props {
  schoolId: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

/** Grade dropdown scoped to the grades offered by the selected school. */
export function GradeSelect({ schoolId, value, onChange, required, disabled }: Props) {
  const [grades, setGrades] = useState<GradeResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    if (!schoolId) {
      setGrades([]);
      setLoadError(null);
      setLoading(false);
      return () => { active = false; };
    }

    setGrades([]);
    setLoadError(null);
    setLoading(true);
    api.get<GradeResponse[]>(`/api/v1/grades?schoolId=${encodeURIComponent(schoolId)}`)
      .then(data => { if (active) setGrades(data); })
      .catch(error => {
        if (active) setLoadError(error instanceof Error ? error.message : "Could not load grades.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [schoolId, retry]);

  return (
    <div>
      <Label>Grade{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled || loading || !schoolId || !!loadError || grades.length === 0}>
        <SelectTrigger>
          <SelectValue placeholder={
            loadError ? "Could not load grades"
              : loading ? "Loading grades…"
                : !schoolId ? "Select a school first"
                  : grades.length === 0 ? "No grades available" : "Select grade"
          } />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {grades.map(g => (
            <SelectItem key={g.id} value={String(g.id)}>{g.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {loadError && (
        <div className="mt-1 flex items-center gap-2">
          <p className="text-xs text-destructive">{loadError}</p>
          <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setRetry(value => value + 1)}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
