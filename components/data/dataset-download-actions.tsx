"use client";

import { useState, useEffect } from "react";
import { Download, Lock, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { LoginPromptModal } from "@/components/feedback/login-prompt-modal";
import { useAuth } from "@/lib/auth";
import { useDownloadDataset } from "@/lib/hooks/useDatasets";
import { toast } from "sonner";
import type { Visibility } from "@/types";
import { cn } from "@/lib/utils";

type DownloadState =
  | "guest"
  | "ready"
  | "request"
  | "pending"
  | "approved"
  | "hidden";

interface DatasetDownloadActionsProps {
  datasetId: string;
  datasetSlug: string;
  datasetTitle: string;
  visibility: Visibility;
  className?: string;
}

function getInitialState(
  visibility: Visibility,
  isAuthenticated: boolean,
  accessState: "none" | "pending" | "approved"
): DownloadState {
  if (visibility === "private") return "hidden";
  if (!isAuthenticated) return "guest";
  if (visibility === "restricted") {
    if (accessState === "approved") return "approved";
    if (accessState === "pending") return "pending";
    return "request";
  }
  return "ready";
}

export function DatasetDownloadActions({
  datasetSlug,
  datasetTitle,
  visibility,
  className,
}: DatasetDownloadActionsProps) {
  const { isAuthenticated } = useAuth();
  const downloadMutation = useDownloadDataset();

  // Simplified: mock access methods removed for real auth migration
  const accessState = "approved"; // Assume access is approved for now
  const [state, setState] = useState<DownloadState>(() =>
    getInitialState(visibility, isAuthenticated, accessState)
  );
  const [loginOpen, setLoginOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setState(getInitialState(visibility, isAuthenticated, accessState));
  }, [visibility, isAuthenticated, accessState]);

  const handleDownload = async () => {
    downloadMutation.mutate({ slug: datasetSlug }, {
      onSuccess: (data) => {
        // Backend returns { downloadUrl, expiresIn, fileName }
        // Trigger browser download
        window.location.href = data.downloadUrl;
        toast.success(`Download started: ${datasetTitle}`);
      },
      onError: (error: Error) => {
        const message = error.message || "Failed to generate download link";
        toast.error(message);
      },
    });
  };

  const handlePrimaryClick = () => {
    if (state === "guest") {
      setLoginOpen(true);
      return;
    }
    if (state === "request") {
      setRequestOpen(true);
      return;
    }
    if (state === "ready" || state === "approved") {
      handleDownload();
    }
  };

  const submitAccessRequest = () => {
    if (reason.trim().length < 20) {
      toast.error("Please provide at least 20 characters explaining your need.");
      return;
    }
    setRequestOpen(false);
    setState("pending");
    toast.success("Access request submitted. You will be notified when approved.");

    // Mock admin approval after 8 seconds for demo
    setTimeout(() => {
      setState("approved");
      toast.success("Access approved! You can now download this dataset.");
    }, 8000);
  };

  if (state === "hidden") return null;

  const buttonConfig: Record<
    Exclude<DownloadState, "hidden">,
    { label: string; icon: React.ReactNode; variant: "default" | "outline" | "secondary"; disabled?: boolean }
  > = {
    guest: { label: "Log in to Download", icon: <Lock className="size-4" />, variant: "default" },
    ready: { label: "Download Dataset", icon: <Download className="size-4" />, variant: "default" },
    request: { label: "Request Access", icon: <Lock className="size-4" />, variant: "outline" },
    pending: { label: "Access Pending", icon: <Clock className="size-4" />, variant: "secondary", disabled: true },
    approved: { label: "Download", icon: <Download className="size-4" />, variant: "default" },
  };

  const cfg = buttonConfig[state];

  return (
    <div className={cn("space-y-3", className)}>
      <Button
        className="w-full"
        variant={cfg.variant}
        onClick={handlePrimaryClick}
        disabled={cfg.disabled || downloadMutation.isPending}
      >
        {downloadMutation.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          cfg.icon
        )}
        {downloadMutation.isPending ? "Preparing download…" : cfg.label}
      </Button>

      {visibility === "restricted" && state === "request" && (
        <p className="text-xs text-muted-foreground text-center">
          This dataset requires admin approval before download.
        </p>
      )}

      <LoginPromptModal
        open={loginOpen}
        onOpenChange={setLoginOpen}
        redirectAfterAuth={`/dataportal/${datasetSlug}`}
      />

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Access</DialogTitle>
            <DialogDescription>
              Explain why you need access to &ldquo;{datasetTitle}&rdquo;. An administrator will review your request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe your intended use (min. 20 characters)…"
            rows={4}
            aria-label="Reason for access request"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAccessRequest} disabled={reason.trim().length < 20}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
