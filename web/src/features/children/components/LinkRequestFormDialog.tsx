import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type {
  DistrictResponse,
  LinkRequestPayload,
  LinkRequestResponse,
  SchoolResponse,
} from "@/lib/api";
import { GradeSelect } from "@/components/shared/GradeSelect";
import { ClassSelect } from "@/components/shared/ClassSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
] as const;

interface Props {
  open: boolean;
  request: LinkRequestResponse | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: LinkRequestPayload) => Promise<void>;
}

export function LinkRequestFormDialog({ open, request, saving, onOpenChange, onSubmit }: Props) {
  const [province, setProvince] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [districts, setDistricts] = useState<DistrictResponse[]>([]);
  const [schools, setSchools] = useState<SchoolResponse[]>([]);
  const [gradeId, setGradeId] = useState("");
  const [classId, setClassId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [learnerNumber, setLearnerNumber] = useState("");
  const [relationship, setRelationship] = useState("parent");
  const [loadingSchool, setLoadingSchool] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setProvince("");
    setDistrictId("");
    setSchoolId("");
    setDistricts([]);
    setSchools([]);
    setGradeId(request?.gradeId == null ? "" : String(request.gradeId));
    setClassId(request?.classId ?? "");
    setFirstName(request?.firstName ?? "");
    setLastName(request?.lastName ?? "");
    setLearnerNumber(request?.learnerNumber ?? "");
    setRelationship(request?.relationship ?? "parent");
    setLookupError(null);

    if (request) {
      setLoadingSchool(true);
      void (async () => {
        try {
          const school = await api.get<SchoolResponse>(`/api/v1/schools/${request.schoolId}`);
          if (!school.province) throw new Error("The school has no province assigned.");
          const districtList = await api.get<DistrictResponse[]>(
            `/api/v1/districts?province=${encodeURIComponent(school.province)}`,
          );
          const district =
            districtList.find((item) => item.id === school.districtId) ??
            districtList.find((item) => item.name === school.district);
          let schoolList: SchoolResponse[] = [];
          if (district) {
            schoolList = await api.get<SchoolResponse[]>(
              `/api/v1/schools?districtId=${encodeURIComponent(district.id)}`,
            );
            if (schoolList.length === 0) {
              schoolList = await api.get<SchoolResponse[]>(
                `/api/v1/schools?district=${encodeURIComponent(district.name)}`,
              );
            }
          }
          if (!schoolList.some((item) => item.id === school.id)) schoolList.push(school);
          if (!active) return;
          setProvince(school.province);
          setDistricts(districtList);
          setDistrictId(district?.id ?? "");
          setSchools(schoolList);
          setSchoolId(school.id);
        } catch (error) {
          if (active)
            setLookupError(
              error instanceof Error ? error.message : "Could not load the current school.",
            );
        } finally {
          if (active) setLoadingSchool(false);
        }
      })();
    } else {
      setLoadingSchool(false);
    }

    return () => {
      active = false;
    };
  }, [open, request, retry]);

  const loadDistricts = async (value: string) => {
    setProvince(value);
    setDistrictId("");
    setDistricts([]);
    setSchoolId("");
    setSchools([]);
    setGradeId("");
    setClassId("");
    setLookupError(null);
    if (!value) {
      setDistricts([]);
      return;
    }
    setLoadingDistricts(true);
    try {
      setDistricts(
        await api.get<DistrictResponse[]>(
          `/api/v1/districts?province=${encodeURIComponent(value)}`,
        ),
      );
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "Could not load districts.");
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadSchools = async (value: string) => {
    setDistrictId(value);
    setSchoolId("");
    setSchools([]);
    setGradeId("");
    setClassId("");
    setLookupError(null);
    if (!value) return;
    setLoadingSchools(true);
    try {
      const district = districts.find((item) => item.id === value);
      let schoolList = await api.get<SchoolResponse[]>(
        `/api/v1/schools?districtId=${encodeURIComponent(value)}`,
      );
      if (schoolList.length === 0 && district) {
        schoolList = await api.get<SchoolResponse[]>(
          `/api/v1/schools?district=${encodeURIComponent(district.name)}`,
        );
      }
      setSchools(schoolList);
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "Could not load schools.");
    } finally {
      setLoadingSchools(false);
    }
  };

  const retryLookup = () => {
    if (request && !province) {
      setRetry((value) => value + 1);
    } else if (districtId) {
      void loadSchools(districtId);
    } else if (province) {
      void loadDistricts(province);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!schoolId || !gradeId || !firstName.trim() || !lastName.trim() || !learnerNumber.trim())
      return;
    await onSubmit({
      schoolId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      learnerNumber: learnerNumber.trim(),
      relationship,
      gradeId: Number(gradeId),
      classId: classId || null,
    });
  };

  const isBusy = saving || loadingSchool;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{request ? "Edit link request" : "Request to link a child"}</DialogTitle>
          <DialogDescription>
            Select the school and enter your child's details as registered.
          </DialogDescription>
        </DialogHeader>

        {loadingSchool ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading request details…</p>
        ) : lookupError && !schools.length ? (
          <div className="py-4 text-center text-sm">
            <p className="text-destructive mb-3">{lookupError}</p>
            <Button type="button" variant="outline" onClick={retryLookup}>
              Try again
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-2">
            <div>
              <Label>Province</Label>
              <Select value={province} onValueChange={loadDistricts} disabled={isBusy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>District</Label>
              <Select
                value={districtId}
                onValueChange={loadSchools}
                disabled={!province || loadingDistricts || isBusy || districts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={loadingDistricts ? "Loading districts…" : "Select district"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>School</Label>
              <Select
                value={schoolId}
                onValueChange={(value) => {
                  setSchoolId(value);
                  setGradeId("");
                  setClassId("");
                }}
                disabled={!districtId || loadingSchools || isBusy || schools.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={loadingSchools ? "Loading schools…" : "Select school"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {schoolId && (
              <>
                <GradeSelect
                  schoolId={schoolId}
                  value={gradeId}
                  onChange={(value) => {
                    setGradeId(value);
                    setClassId("");
                  }}
                  required
                />
                <ClassSelect
                  schoolId={schoolId}
                  gradeId={gradeId}
                  value={classId}
                  onChange={setClassId}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="link-request-first-name">First name</Label>
                    <Input
                      id="link-request-first-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="link-request-last-name">Last name</Label>
                    <Input
                      id="link-request-last-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="link-request-learner-number">Learner number</Label>
                  <Input
                    id="link-request-learner-number"
                    value={learnerNumber}
                    onChange={(event) => setLearnerNumber(event.target.value)}
                    required
                    maxLength={50}
                  />
                </div>
                <div>
                  <Label>Your relationship</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="grandparent">Grandparent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {lookupError && <p className="text-sm text-destructive">{lookupError}</p>}
            <Button
              type="submit"
              disabled={
                isBusy ||
                !schoolId ||
                !gradeId ||
                !firstName.trim() ||
                !lastName.trim() ||
                !learnerNumber.trim()
              }
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saving ? "Saving…" : request ? "Save changes" : "Submit request"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
