import { useEffect, useState } from "react";
import { z } from "zod";
import { api, type DistrictResponse } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Loader2, Trash2 } from "lucide-react";

const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "Northern Cape", "North West", "Western Cape",
] as const;

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  province: z.enum(PROVINCES),
  code: z.string().trim().max(20).optional().or(z.literal("")),
});

export function DistrictsPage() {
  const [rows, setRows] = useState<DistrictResponse[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [province, setProvince] = useState<string>("Western Cape");

  const load = async () => {
    try {
      const data = await api.get<DistrictResponse[]>("/api/v1/admin/districts");
      setRows(data);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load districts");
    }
  };
  useEffect(() => { load(); }, []);

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse({ name: fd.get("name"), province, code: fd.get("code") || "" });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    try {
      await api.post("/api/v1/admin/districts", {
        name: parsed.data.name,
        province: parsed.data.province,
        code: parsed.data.code || null,
      });
      toast.success("District created");
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create district");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this district? Schools linked to it will be unlinked.")) return;
    try {
      await api.delete(`/api/v1/admin/districts/${id}`);
      toast.success("Deleted");
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to delete district");
    }
  };

  const grouped = rows.reduce<Record<string, DistrictResponse[]>>((acc, r) => {
    (acc[r.province] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Districts</h1>
          <p className="text-muted-foreground text-sm mt-1">Education districts grouped by province.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="size-4 mr-1" /> New district
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create district</DialogTitle></DialogHeader>
            <form onSubmit={onCreate} className="space-y-4">
              <div>
                <Label htmlFor="d-name">Name</Label>
                <Input id="d-name" name="name" placeholder="e.g. Metro Central" required />
              </div>
              <div>
                <Label>Province</Label>
                <Select value={province} onValueChange={setProvince}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="d-code">Code (optional)</Label>
                <Input id="d-code" name="code" placeholder="e.g. WC-MC" />
              </div>
              <Button disabled={saving} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground text-sm">No districts yet.</Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([prov, list]) => (
            <div key={prov}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{prov}</h2>
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                    <tr><th className="p-3">Name</th><th className="p-3">Code</th><th className="p-3 w-20"></th></tr>
                  </thead>
                  <tbody>
                    {list.map(d => (
                      <tr key={d.id} className="border-t">
                        <td className="p-3 font-medium">{d.name}</td>
                        <td className="p-3 text-muted-foreground">{d.code ?? "—"}</td>
                        <td className="p-3 text-right">
                          <Button size="icon" variant="ghost" onClick={() => onDelete(d.id)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
