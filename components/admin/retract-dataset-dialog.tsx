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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { RetractDatasetPayload } from "@/lib/api/admin";

interface RetractDatasetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: RetractDatasetPayload) => void;
  isSaving?: boolean;
}

export function RetractDatasetDialog({ open, onOpenChange, onConfirm, isSaving }: RetractDatasetDialogProps) {
  const [reason, setReason] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [forgetAliases, setForgetAliases] = useState(false);
  const [purgeStaging, setPurgeStaging] = useState(false);

  const canSubmit = reason.trim().length >= 5 && mfaCode.trim().length >= 4;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm({
      reason: reason.trim(),
      mfaCode: mfaCode.trim(),
      forgetAliases,
      purgeStaging,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Retract published dataset</DialogTitle>
          <DialogDescription>
            Reverses exactly this dataset&apos;s effects on burden data, indicators, and
            analytics caches. Other datasets&apos; data is untouched. This requires an MFA
            code and cannot be undone without re-approving and republishing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="retract-reason">
              Reason <span className="text-muted-foreground">(required)</span>
            </Label>
            <Textarea
              id="retract-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g. Wrong source workbook uploaded, values need correction..."
            />
            <p className="text-xs text-muted-foreground">{reason.length}/5 characters minimum</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="retract-mfa">MFA code</Label>
            <Input
              id="retract-mfa"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              placeholder="6-digit code from your authenticator app"
              className="h-11"
              maxLength={12}
            />
          </div>

          <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="retract-forget"
                checked={forgetAliases}
                onCheckedChange={(v) => setForgetAliases(v === true)}
              />
              <Label htmlFor="retract-forget" className="text-sm font-normal leading-5">
                Forget aliases first seen on this dataset
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Use only if the file&apos;s vocabulary itself is untrustworthy (poisoned
                  source). By default confirmed aliases survive — they&apos;re registry
                  knowledge, not this dataset&apos;s data.
                </span>
              </Label>
            </div>
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="retract-purge"
                checked={purgeStaging}
                onCheckedChange={(v) => setPurgeStaging(v === true)}
              />
              <Label htmlFor="retract-purge" className="text-sm font-normal leading-5">
                Purge staging rows
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  By default staging is kept so re-approving republishes without a
                  re-upload. Use for privacy-sensitive removals only.
                </span>
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!canSubmit || isSaving}>
            {isSaving ? "Retracting..." : "Retract Dataset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
