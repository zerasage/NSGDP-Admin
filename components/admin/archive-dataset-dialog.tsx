"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import type { ArchiveDatasetPayload } from "@/lib/api/admin";

interface ArchiveDatasetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  datasetTitle: string;
  analyticsPublished: boolean;
  onConfirm: (payload: ArchiveDatasetPayload) => void;
  loading?: boolean;
}

export function ArchiveDatasetDialog({
  open,
  onOpenChange,
  title,
  datasetTitle,
  analyticsPublished,
  onConfirm,
  loading = false,
}: ArchiveDatasetDialogProps) {
  const [reason, setReason] = useState("");
  const [retractFromAnalytics, setRetractFromAnalytics] = useState(true);

  const handleConfirm = () => {
    onConfirm({
      reason: reason.trim() || undefined,
      retractFromAnalytics: analyticsPublished ? retractFromAnalytics : undefined,
      retractReason:
        analyticsPublished && retractFromAnalytics
          ? reason.trim() || "Retracted when dataset was archived"
          : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div className="flex-1">
              <DialogTitle>{title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="space-y-2 pt-2">
            <span className="block">
              <span className="font-medium text-foreground">{datasetTitle}</span>{" "}
              will be removed from the public catalogue but remains accessible to admins.
            </span>
            {analyticsPublished ? (
              <span className="block text-destructive/90">
                This dataset is loaded in the analytics warehouse. Archive must also retract
                warehouse rows or you must retract manually first.
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="archive-reason">Reason (optional)</Label>
            <Input
              id="archive-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this dataset being archived?"
            />
          </div>

          {analyticsPublished ? (
            <label className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
              <Checkbox
                checked={retractFromAnalytics}
                onCheckedChange={(checked) =>
                  setRetractFromAnalytics(checked === true)
                }
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-foreground">
                  Archive and retract from analytics
                </span>
                <span className="mt-1 block text-muted-foreground">
                  Removes this dataset&apos;s rows from disease_burden. Portal charts will stop
                  using them once the retract job finishes.
                </span>
              </span>
            </label>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || (analyticsPublished && !retractFromAnalytics)}
          >
            {loading
              ? "Processing..."
              : analyticsPublished
                ? "Archive and retract"
                : "Archive"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
