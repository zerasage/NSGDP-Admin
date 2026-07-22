"use client";

import { useState } from "react";
import { KeyRound, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function AccessRequestsPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<AccessRequestStatus | "all">("pending");
  const [denyTarget, setDenyTarget] = useState<AccessRequest | null>(null);
  const [comment, setComment] = useState("");

  const { data, isLoading } = useAccessRequests({
    status: status !== "all" ? status : undefined,
    limit: 50,
  });
  const approveMutation = useApproveAccessRequest();
  const denyMutation = useDenyAccessRequest();

  const requests = data?.data ?? [];

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="size-5" />
            Access Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            Requests from users to access restricted datasets
          </p>
        </div>
        <Select value={status} onValueChange={(v) => v && setStatus(v as AccessRequestStatus | "all")}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
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
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No {status !== "all" ? status : ""} access requests.
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
                {requests.map((request) => (
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
