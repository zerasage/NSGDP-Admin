"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
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
import {
  GIS_SLOT_ACCEPT,
  GIS_SLOT_LABELS,
  type GisReferenceLayer,
  type GisReferenceSlot,
  type GisUploadResult,
} from "@/lib/api/gis-reference";
import { useUploadGisReferenceLayer } from "@/lib/hooks/useGisReference";
import { toast } from "sonner";

interface ReplaceGisLayerDialogProps {
  slot: GisReferenceSlot;
  currentLayer?: GisReferenceLayer;
  open: boolean;
  onClose: () => void;
  onUploaded?: (result: GisUploadResult) => void;
}

export function ReplaceGisLayerDialog({
  slot,
  currentLayer,
  open,
  onClose,
  onUploaded,
}: ReplaceGisLayerDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState(currentLayer?.label ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const uploadMutation = useUploadGisReferenceLayer();

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file to upload");
      return;
    }
    try {
      setUploadPercent(0);
      const result = await uploadMutation.mutateAsync({
        slot,
        file,
        label,
        onUploadProgress: setUploadPercent,
      });
      onUploaded?.(result);
      if (result.rebuildStatus === "queued" && result.jobId) {
        toast.success(
          `${GIS_SLOT_LABELS[slot]} uploaded — gazetteer rebuild running in the background`,
        );
      } else {
        toast.success(`Layer replaced for ${GIS_SLOT_LABELS[slot]}`);
      }
      onClose();
    } catch {
      toast.error("Upload failed — check file type and try again");
    } finally {
      setUploadPercent(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace {GIS_SLOT_LABELS[slot]}</DialogTitle>
          <DialogDescription>
            Upload a dedicated GIS reference file ({GIS_SLOT_ACCEPT[slot]}). This is not a
            catalogue dataset — no title, org, or publish workflow. A gazetteer rebuild may
            run in the background after upload; you do not need to wait here.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gis-file">File</Label>
            <Input
              id="gis-file"
              ref={fileRef}
              type="file"
              accept={
                slot === "population"
                  ? ".csv,.xlsx,.xls,.gpkg"
                  : ".gpkg"
              }
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            {selectedFile ? (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} · {formatBytes(selectedFile.size)}
                {selectedFile.size > 10 * 1024 * 1024
                  ? " — large files can take several minutes to upload"
                  : null}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gis-label">Label (optional)</Label>
            <Input
              id="gis-label"
              placeholder="e.g. Niger ward boundaries 2024"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
        </div>
        {uploadMutation.isPending ? (
          <p className="text-xs text-muted-foreground">
            {uploadPercent != null && uploadPercent < 100
              ? `Sending file… ${uploadPercent}%`
              : "Saving to storage and activating the slot"}
            {" — "}
            gazetteer rebuild runs in the background after this finishes.
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploadMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Upload &amp; activate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
