"use client";

import { useEffect, useState } from "react";
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

interface BulkArchiveDatasetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  analyticsLoadedCount: number;
  onConfirm: (payload: ArchiveDatasetPayload) => void;
  loading?: boolean;
}

export function BulkArchiveDatasetDialog({
  open,
  onOpenChange,
  selectedCount,
  analyticsLoadedCount,
  onConfirm,
  loading = false,
}: BulkArchiveDatasetDialogProps) {
  const [reason, setReason] = useState("");
  const [retractFromAnalytics, setRetractFromAnalytics] = useState(true);

  useEffect(() => {
    if (!open) {
      setReason("");
      setRetractFromAnalytics(true);
    }
  }, [open]);

  const needsRetract = analyticsLoadedCount > 0;

  const handleConfirm = () => {
    onConfirm({
      reason: reason.trim() || undefined,
      retractFromAnalytics: needsRetract ? retractFromAnalytics : undefined,
      retractReason:
        needsRetract && retractFromAnalytics
          ? reason.trim() || "Retracted when dataset was archived"
          : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div className="flex-1">
              <DialogTitle>
                Archive {selectedCount} {selectedCount === 1 ? "dataset" : "datasets"}?
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="space-y-2 pt-2">
            <span className="block">
              Selected datasets will be removed from the public catalogue but remain accessible
              to admins. Each dataset is processed independently — partial success is possible.
            </span>
            {needsRetract ? (
              <span className="block text-destructive/90">
                {analyticsLoadedCount}{" "}
                {analyticsLoadedCount === 1 ? "dataset is" : "datasets are"} loaded in the
                analytics warehouse. Those must be retracted as part of archive or they will
                fail.
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="bulk-archive-reason">Reason (optional)</Label>
            <Input
              id="bulk-archive-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are these datasets being archived?"
            />
          </div>

          {needsRetract ? (
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
                  Archive and retract analytics-loaded datasets
                </span>
                <span className="mt-1 block text-muted-foreground">
                  Removes warehouse rows for loaded datasets. Portal charts stop using them once
                  retract jobs finish.
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
            disabled={loading || (needsRetract && !retractFromAnalytics)}
          >
            {loading
              ? "Processing..."
              : needsRetract
                ? "Archive and retract"
                : "Archive selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
