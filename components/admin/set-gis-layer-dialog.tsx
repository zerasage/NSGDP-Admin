"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDatasets } from "@/lib/hooks/useDatasets";
import { useSetGisReferenceLayer } from "@/lib/hooks/useGisReference";
import { GIS_SLOT_LABELS, type GisReferenceSlot } from "@/lib/api/gis-reference";
import { toast } from "sonner";

interface SetGisLayerDialogProps {
  slot: GisReferenceSlot;
  open: boolean;
  onClose: () => void;
}

export function SetGisLayerDialog({ slot, open, onClose }: SetGisLayerDialogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const mutation = useSetGisReferenceLayer();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useDatasets({ search: debouncedQuery || undefined, limit: 20 });
  const datasets = data?.data ?? [];

  const handleSubmit = async () => {
    if (!selectedDatasetId) return;
    try {
      await mutation.mutateAsync({ slot, datasetId: selectedDatasetId });
      toast.success(`${GIS_SLOT_LABELS[slot]} layer updated`);
      onClose();
    } catch {
      toast.error("Failed to update the GIS reference layer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change {GIS_SLOT_LABELS[slot]}</DialogTitle>
          <DialogDescription>
            Search for the dataset that should become the active source for this GIS layer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dataset-search">Search datasets</Label>
            <Input
              id="dataset-search"
              placeholder="Search by title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Dataset</Label>
            <Select value={selectedDatasetId} onValueChange={(v) => v && setSelectedDatasetId(v)}>
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoading ? "Loading..." : "Select a dataset"}
                />
              </SelectTrigger>
              <SelectContent>
                {datasets.map((dataset) => (
                  <SelectItem key={dataset.id} value={dataset.id}>
                    {dataset.title} ({dataset.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedDatasetId || mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
