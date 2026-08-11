import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

const PROVINCES = [
  "Western Cape", "Gauteng", "KwaZulu-Natal", "Eastern Cape",
  "Free State", "Limpopo", "Mpumalanga", "Northern Cape", "North West",
];

const ROLES = [
  { value: "principal", label: "Principal" },
  { value: "school_admin", label: "School Administrator" },
  { value: "governing_body", label: "Governing Body Member" },
  { value: "teacher", label: "Teacher" },
];

export function SchoolRegistrationForm({ onClose }: { onClose?: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [province, setProvince] = useState("");
  const [role, setRole] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (!province) return toast.error("Please select a province");
    if (!role) return toast.error("Please select your role");

    setSubmitting(true);
    const { error } = await (supabase as any).from("school_requests").insert({
      school_name:   fd.get("school_name"),
      province,
      district:      fd.get("district"),
      contact_name:  fd.get("contact_name"),
      contact_role:  role,
      contact_email: fd.get("contact_email"),
      contact_phone: fd.get("contact_phone") || null,
      message:       fd.get("message") || null,
    });
    setSubmitting(false);

    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="size-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Request submitted!</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Thank you. We'll review your request and reach out to you shortly to get your school set up on PASA.
        </p>
        {onClose && (
          <Button className="mt-6" onClick={onClose}>Close</Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="school_name">School name <span className="text-destructive">*</span></Label>
          <Input id="school_name" name="school_name" required placeholder="e.g. Westridge High School" />
        </div>

        <div>
          <Label>Province <span className="text-destructive">*</span></Label>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
            <SelectContent>
              {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="district">District <span className="text-destructive">*</span></Label>
          <Input id="district" name="district" required placeholder="e.g. Metro South" />
        </div>

        <div>
          <Label htmlFor="contact_name">Your name <span className="text-destructive">*</span></Label>
          <Input id="contact_name" name="contact_name" required placeholder="Full name" />
        </div>

        <div>
          <Label>Your role <span className="text-destructive">*</span></Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
            <SelectContent>
              {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="contact_email">Email address <span className="text-destructive">*</span></Label>
          <Input id="contact_email" name="contact_email" type="email" required placeholder="school@example.co.za" />
        </div>

        <div>
          <Label htmlFor="contact_phone">Phone number <span className="text-muted-foreground/60 text-xs font-normal">(optional)</span></Label>
          <Input id="contact_phone" name="contact_phone" type="tel" placeholder="e.g. 021 123 4567" />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="message">Anything else? <span className="text-muted-foreground/60 text-xs font-normal">(optional)</span></Label>
          <Textarea id="message" name="message" rows={3} placeholder="Tell us about your school — learner count, any specific needs, etc." />
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
      >
        {submitting ? <><Loader2 className="size-4 mr-2 animate-spin" />Submitting…</> : "Submit request"}
      </Button>
    </form>
  );
}
