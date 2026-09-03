"use client";

import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
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
} from "@/lib/api/gis-reference";
import { toast } from "sonner";

export interface GisLayerUploadRequest {
  slot: GisReferenceSlot;
  file: File;
  label?: string;
}

interface ReplaceGisLayerDialogProps {
  slot: GisReferenceSlot;
  currentLayer?: GisReferenceLayer;
  open: boolean;
  onClose: () => void;
  /** Starts the upload on the page; the dialog closes immediately. */
  onStartUpload: (request: GisLayerUploadRequest) => void;
}

export function ReplaceGisLayerDialog({
  slot,
  currentLayer,
  open,
  onClose,
  onStartUpload,
}: ReplaceGisLayerDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState(currentLayer?.label ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setLabel(currentLayer?.label ?? "");
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [open, slot, currentLayer?.label]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = () => {
    const file = fileRef.current?.files?.[0] ?? selectedFile;
    if (!file) {
      toast.error("Choose a file to upload");
      return;
    }
    onStartUpload({
      slot,
      file,
      label: label.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace {GIS_SLOT_LABELS[slot]}</DialogTitle>
          <DialogDescription>
            Upload a dedicated GIS reference file ({GIS_SLOT_ACCEPT[slot]}). This is not a
            catalogue dataset — no title, org, or publish workflow. Progress shows on the
            layer row after you confirm; a gazetteer rebuild may follow in the background.
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <Upload className="size-4" />
            Upload &amp; activate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
