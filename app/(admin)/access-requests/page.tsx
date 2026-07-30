"use client";

import { useMemo, useState } from "react";
import { KeyRound, CheckCircle2, XCircle, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/lib/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  useAccessRequests,
  useApproveAccessRequest,
  useDenyAccessRequest,
} from "@/lib/hooks/useAccessRequests";
import type { AccessRequest, AccessRequestStatus } from "@/lib/api/access-requests";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";

const STATUS_BADGE: Record<AccessRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-300",
  denied: "bg-red-100 text-red-800 border-red-300",
};

const TABS: Array<{ key: AccessRequestStatus | "all"; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "denied", label: "Denied" },
  { key: "all", label: "All" },
];

export default function AccessRequestsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canAdjudicate = user?.role === "super_admin" || hasPermission("approve:access-requests");
  const [status, setStatus] = useState<AccessRequestStatus | "all">("pending");
  const [query, setQuery] = useState("");
  const [denyTarget, setDenyTarget] = useState<AccessRequest | null>(null);
  const [comment, setComment] = useState("");

  const { data, isLoading } = useAccessRequests({
    status: status !== "all" ? status : undefined,
    limit: 50,
  });
  const approveMutation = useApproveAccessRequest();
  const denyMutation = useDenyAccessRequest();

  const requests = data?.data ?? [];

  // No backend search param for access requests (list sizes are small
  // enough that client-side filtering is fine) — match on requester or
  // dataset.
  const filteredRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        r.requester_name?.toLowerCase().includes(q) ||
        r.requester_email?.toLowerCase().includes(q) ||
        r.dataset_title?.toLowerCase().includes(q)
    );
  }, [requests, query]);

  const handleApprove = (id: string) => {
    approveMutation.mutate(id, {
      onSuccess: () => toast({ title: "Access request approved" }),
      onError: (error: unknown) =>
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        }),
    });
  };

  const closeDenyDialog = () => {
    setDenyTarget(null);
    setComment("");
  };

  const handleDeny = () => {
    if (!denyTarget) return;
    if (comment.length < 20) {
      toast({
        title: "Error",
        description: "Denial reason must be at least 20 characters",
        variant: "destructive",
      });
      return;
    }
    denyMutation.mutate(
      { id: denyTarget.id, comment },
      {
        onSuccess: () => {
          toast({ title: "Access request denied" });
          closeDenyDialog();
        },
        onError: (error: unknown) =>
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : undefined,
            variant: "destructive",
          }),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <KeyRound className="size-5" />
          Access Requests
        </h1>
        <p className="text-muted-foreground mt-1">
          Requests from users to access restricted datasets
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={status === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => setStatus(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by requester or dataset…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requests</CardTitle>
          <CardDescription>
            Approving grants immediate access; denying requires a reason.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {query
                ? "No access requests match your search."
                : `No ${status !== "all" ? status : ""} access requests.`}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requester</TableHead>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.requester_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{request.requester_email}</div>
                    </TableCell>
                    <TableCell className="font-medium">{request.dataset_title}</TableCell>
                    <TableCell className="max-w-xs truncate" title={request.reason}>
                      {request.reason}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", STATUS_BADGE[request.status])}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(request.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === "pending" ? (
                        canAdjudicate ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="size-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDenyTarget(request)}
                              disabled={denyMutation.isPending}
                            >
                              <XCircle className="size-3.5 mr-1" />
                              Deny
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Requires approve:access-requests
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {request.review_comment || "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!denyTarget} onOpenChange={(open) => !open && closeDenyDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Deny Access Request</DialogTitle>
            <DialogDescription>{denyTarget?.dataset_title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="deny-comment">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="deny-comment"
              placeholder="Explain why this request is being denied (minimum 20 characters)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              className={comment.length > 0 && comment.length < 20 ? "border-destructive" : ""}
            />
            <p className="text-sm text-muted-foreground">{comment.length}/20 characters minimum</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDenyDialog}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeny}
              disabled={denyMutation.isPending || comment.length < 20}
            >
              {denyMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Deny Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
