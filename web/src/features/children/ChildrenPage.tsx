import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/shared/PageHeader";
import { LinkRequestFormDialog } from "@/features/children/components/LinkRequestFormDialog";
import { gradeClassLabel } from "@/components/shared/GradeClassDisplay";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  BookOpen,
  ClipboardList,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Pencil,
  Ban,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { LinkRequestPayload, LinkRequestResponse, ParentChildResponse } from "@/lib/api";

export function ChildrenPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ParentChildResponse[]>([]);
  const [requests, setRequests] = useState<LinkRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LinkRequestResponse | null>(null);
  const [savingRequest, setSavingRequest] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<LinkRequestResponse | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [kids, reqs] = await Promise.all([
        api.get<ParentChildResponse[]>("/api/v1/children"),
        api.get<LinkRequestResponse[]>("/api/v1/link-requests/mine"),
      ]);
      setChildren(kids);
      setRequests(reqs);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Could not load your children and requests.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const submitRequest = async (payload: LinkRequestPayload) => {
    setSavingRequest(true);
    try {
      if (editingRequest) {
        await api.put(`/api/v1/link-requests/${editingRequest.id}`, payload);
        toast.success("Link request updated.");
      } else {
        await api.post("/api/v1/link-requests", payload);
        toast.success("Request submitted. The school will review and approve it.");
      }
      setRequestDialogOpen(false);
      setEditingRequest(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save request.");
    } finally {
      setSavingRequest(false);
    }
  };

  const withdrawRequest = async () => {
    if (!withdrawTarget) return;
    setWithdrawing(true);
    try {
      await api.post(`/api/v1/link-requests/${withdrawTarget.id}/withdraw`);
      toast.success("Link request withdrawn.");
      setWithdrawTarget(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not withdraw request.");
    } finally {
      setWithdrawing(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");
  const withdrawnRequests = requests.filter((r) => r.status === "withdrawn");

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="My children"
        sub="Submit a request to link your child. The school will verify and approve it."
        action={
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => {
              setEditingRequest(null);
              setRequestDialogOpen(true);
            }}
          >
            <Plus className="size-4 mr-1" /> Request to link a child
          </Button>
        }
      />

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Loading your children and requests…
        </Card>
      ) : loadError ? (
        <Card className="p-8 text-center text-sm">
          <p className="text-destructive mb-3">{loadError}</p>
          <Button variant="outline" onClick={load}>
            Try again
          </Button>
        </Card>
      ) : (
        <>
          {pendingRequests.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">Pending approval</h2>
              <div className="space-y-2">
                {pendingRequests.map((r) => (
                  <Card
                    key={r.id}
                    className="p-4 flex items-center gap-3 border-orange-300/50 bg-orange-50/30 dark:bg-orange-950/10"
                  >
                    <Clock className="size-4 text-orange-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {r.firstName} {r.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.schoolName ?? "School"} · {gradeClassLabel(r.gradeId, null)} · Learner
                        no. {r.learnerNumber}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-orange-500 bg-orange-100 dark:bg-orange-950/30 shrink-0"
                    >
                      Pending
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingRequest(r);
                        setRequestDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/40 hover:bg-destructive/10"
                      onClick={() => setWithdrawTarget(r)}
                    >
                      <Ban className="size-3.5 mr-1" /> Withdraw
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {rejectedRequests.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">Not approved</h2>
              <div className="space-y-2">
                {rejectedRequests.map((r) => (
                  <Card
                    key={r.id}
                    className="p-4 flex items-center gap-3 border-red-300/50 bg-red-50/30 dark:bg-red-950/10"
                  >
                    <XCircle className="size-4 text-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {r.firstName} {r.lastName}
                      </p>
                      {r.rejectionReason && (
                        <p className="text-xs text-red-500 mt-0.5">{r.rejectionReason}</p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-red-500 bg-red-100 dark:bg-red-950/30 shrink-0"
                    >
                      Rejected
                    </Badge>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {withdrawnRequests.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-muted-foreground mb-2">
                Withdrawn requests
              </h2>
              <div className="space-y-2">
                {withdrawnRequests.map((r) => (
                  <Card key={r.id} className="p-4 flex items-center gap-3">
                    <Ban className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {r.firstName} {r.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.schoolName ?? "School"}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      Withdrawn
                    </Badge>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {children.length === 0 &&
          pendingRequests.length === 0 &&
          rejectedRequests.length === 0 &&
          withdrawnRequests.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground text-sm">
              No children linked yet. Click "Request to link a child" to get started.
            </Card>
          ) : (
            children.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-2">
                  Linked children
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {children.map((c) => (
                    <Card key={c.id} className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {c.firstName} {c.lastName}
                            <CheckCircle2 className="size-3.5 text-green-500" />
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{c.schoolName}</div>
                        </div>
                        <Badge variant="secondary">{gradeClassLabel(c.gradeId, c.className)}</Badge>
                      </div>
                      <div className="mt-4 flex gap-2 flex-wrap">
                        <Button asChild size="sm" variant="outline" className="text-xs h-7">
                          <Link to="/app/marks">
                            <BookOpen className="size-3 mr-1" />
                            Reports
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="text-xs h-7">
                          <Link to="/app/attendance">
                            <ClipboardList className="size-3 mr-1" />
                            Attendance
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="text-xs h-7">
                          <Link to="/app/discipline">
                            <Shield className="size-3 mr-1" />
                            Discipline
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          )}
        </>
      )}

      <LinkRequestFormDialog
        open={requestDialogOpen}
        request={editingRequest}
        saving={savingRequest}
        onOpenChange={(open) => {
          setRequestDialogOpen(open);
          if (!open) setEditingRequest(null);
        }}
        onSubmit={submitRequest}
      />

      <Dialog
        open={withdrawTarget !== null}
        onOpenChange={(open) => {
          if (!open && !withdrawing) setWithdrawTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Withdraw link request?</DialogTitle>
            <DialogDescription>
              The request for {withdrawTarget?.firstName} {withdrawTarget?.lastName} will be kept in
              your history and will no longer be reviewed by the school.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={withdrawing}
              onClick={() => setWithdrawTarget(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" disabled={withdrawing} onClick={withdrawRequest}>
              {withdrawing ? "Withdrawing…" : "Withdraw request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
