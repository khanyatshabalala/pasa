import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { School, Search, Clock, Phone, Mail, MessageSquare, Loader2 } from "lucide-react";

type SchoolRequest = {
  id: string;
  school_name: string;
  province: string;
  district: string;
  contact_name: string;
  contact_role: string;
  contact_email: string;
  contact_phone: string | null;
  message: string | null;
  status: "pending" | "contacted" | "onboarded" | "declined";
  admin_notes: string | null;
  created_at: string;
};

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-orange-500/10 text-orange-500" },
  contacted: { label: "Contacted", color: "bg-blue-500/10 text-blue-500" },
  onboarded: { label: "Onboarded", color: "bg-green-500/10 text-green-600" },
  declined:  { label: "Declined",  color: "bg-muted text-muted-foreground" },
};

export function SchoolRequestsPage() {
  const [requests, setRequests] = useState<SchoolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<SchoolRequest | null>(null);
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("school_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openRequest = (req: SchoolRequest) => {
    setSelected(req);
    setNotes(req.admin_notes ?? "");
    setNewStatus(req.status);
  };

  const saveUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await (supabase as any)
      .from("school_requests")
      .update({ status: newStatus, admin_notes: notes.trim() || null, reviewed_at: new Date().toISOString() })
      .eq("id", selected.id);
    setSaving(false);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Updated");
    setSelected(null);
    load();
  };

  const filtered = requests.filter(r => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.school_name.toLowerCase().includes(q) ||
      r.contact_name.toLowerCase().includes(q) ||
      r.contact_email.toLowerCase().includes(q) ||
      r.province.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    contacted: requests.filter(r => r.status === "contacted").length,
    onboarded: requests.filter(r => r.status === "onboarded").length,
  };

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="School registration requests"
        sub="Schools that want to join PASA. Review and reach out to onboard them."
        action={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" />
            {counts.pending} pending
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search school, contact, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "contacted", "onboarded", "declined"] as const).map(s => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
              className={statusFilter === s ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
            >
              {s === "all" ? `All (${counts.all})` : s === "pending" ? `Pending (${counts.pending})` : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">
          <School className="size-8 mx-auto mb-2 opacity-40" />
          {requests.length === 0 ? "No school requests yet. They'll appear here when schools submit the form on the landing page." : "No results match your filter."}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3">School</th>
                <th className="p-3">Location</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Submitted</th>
                <th className="p-3">Status</th>
                <th className="p-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => {
                const cfg = STATUS_CONFIG[req.status];
                return (
                  <tr key={req.id} className="border-t">
                    <td className="p-3 font-medium">{req.school_name}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {req.district}<br />{req.province}
                    </td>
                    <td className="p-3 text-xs">
                      <div className="font-medium">{req.contact_name}</div>
                      <div className="text-muted-foreground capitalize">{req.contact_role.replace("_", " ")}</div>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(req.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="outline" onClick={() => openRequest(req)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Review dialog */}
      <Dialog open={!!selected} onOpenChange={v => { if (!v) setSelected(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.school_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Province</div>
                  <div>{selected.province}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">District</div>
                  <div>{selected.district}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Contact</div>
                  <div>{selected.contact_name} · <span className="capitalize">{selected.contact_role.replace("_", " ")}</span></div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Submitted</div>
                  <div>{new Date(selected.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</div>
                </div>
              </div>

              {/* Contact info */}
              <div className="flex flex-col gap-2">
                <a href={`mailto:${selected.contact_email}`} className="flex items-center gap-2 text-sm text-accent hover:underline">
                  <Mail className="size-4" />{selected.contact_email}
                </a>
                {selected.contact_phone && (
                  <a href={`tel:${selected.contact_phone}`} className="flex items-center gap-2 text-sm text-accent hover:underline">
                    <Phone className="size-4" />{selected.contact_phone}
                  </a>
                )}
                {selected.message && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    <MessageSquare className="size-4 shrink-0 mt-0.5" />
                    <span>{selected.message}</span>
                  </div>
                )}
              </div>

              {/* Update status */}
              <div>
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="onboarded">Onboarded</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Internal notes</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Called on 25 June, principal unavailable. Following up Friday."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={saveUpdate}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Save
                </Button>
                <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
