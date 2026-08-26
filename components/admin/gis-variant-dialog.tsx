"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddWardNameVariant } from "@/lib/hooks/useGisReference";
import { toast } from "sonner";

interface GisVariantDialogProps {
  lga: string;
  ward: string;
  open: boolean;
  onClose: () => void;
}

/**
 * The resolution report only tells us a raw (lga, ward) pair didn't match
 * any canonical ward — it can't know which canonical ward the admin
 * intends it to resolve to, so the ward code is entered manually here
 * (visible on the GIS Reference Layers rebuild output / ward boundaries data).
 */
export function GisVariantDialog({ lga, ward, open, onClose }: GisVariantDialogProps) {
  const [wardCode, setWardCode] = useState("");
  const mutation = useAddWardNameVariant();

  const handleSubmit = async () => {
    if (!wardCode.trim()) return;
    try {
      await mutation.mutateAsync({ wardCode: wardCode.trim(), variant: ward });
      toast.success(`"${ward}" now resolves to ward ${wardCode.trim()}`);
      onClose();
    } catch {
      toast.error("Failed to attach this spelling — check the ward code");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attach unmatched spelling</DialogTitle>
          <DialogDescription>
            Record &quot;{ward}&quot; (LGA: {lga}) as a raw spelling variant of an existing
            canonical ward.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="ward-code">Canonical ward code</Label>
          <Input
            id="ward-code"
            placeholder="e.g. NG025001-3"
            value={wardCode}
            onChange={(e) => setWardCode(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!wardCode.trim() || mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Attach
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
