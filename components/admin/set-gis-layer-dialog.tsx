"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSetGisReferenceLayer } from "@/lib/hooks/useGisReference";
import { adminApi } from "@/lib/api/admin";
import type { Dataset } from "@/lib/api/datasets";
import type { PaginatedResponse } from "@/lib/types/common";
import {
  GIS_SLOT_LABELS,
  type GisReferenceLayer,
  type GisReferenceSlot,
} from "@/lib/api/gis-reference";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SetGisLayerDialogProps {
  slot: GisReferenceSlot;
  currentLayer?: GisReferenceLayer;
  open: boolean;
  onClose: () => void;
}

export function SetGisLayerDialog({
  slot,
  currentLayer,
  open,
  onClose,
}: SetGisLayerDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const mutation = useSetGisReferenceLayer();

  useEffect(() => {
    if (open) {
      setSelectedDatasetId(currentLayer?.datasetId ?? "");
      setQuery("");
    }
  }, [open, currentLayer?.datasetId]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["gis-reference", "eligible-datasets"],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: "100",
        format: "geopackage",
      });
      const response = await adminApi.get<{ data: PaginatedResponse<Dataset> }>(
        `/admin/datasets?${params}`,
      );
      return response.data.data;
    },
    enabled: open,
    staleTime: 60 * 1000,
  });

  const datasets = useMemo(
    () => (data?.data ?? []).filter((d) => !!d.file_path),
    [data?.data],
  );

  const filteredDatasets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return datasets;
    return datasets.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.slug.toLowerCase().includes(q) ||
        (d.description?.toLowerCase().includes(q) ?? false),
    );
  }, [datasets, query]);

  const selectedDataset = useMemo(() => {
    if (!selectedDatasetId) return null;
    return (
      datasets.find((d) => d.id === selectedDatasetId) ??
      (currentLayer?.datasetId === selectedDatasetId && currentLayer.datasetName
        ? {
            id: currentLayer.datasetId,
            title: currentLayer.datasetName,
            slug: currentLayer.datasetSlug ?? "",
          }
        : null)
    );
  }, [datasets, selectedDatasetId, currentLayer]);

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
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="min-w-0 flex-1 space-y-4 overflow-y-auto p-4 pb-0">
          <DialogHeader>
            <DialogTitle className="pr-8 leading-snug">
              {currentLayer?.datasetId ? "Change" : "Assign"} {GIS_SLOT_LABELS[slot]}
            </DialogTitle>
            <DialogDescription className="break-words">
              Pick a GeoPackage dataset with an uploaded file. Any organisation is fine —
              only GeoPackage format is accepted for GIS reference layers.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-info/25 bg-info/[0.06] px-3 py-2.5 text-xs break-words text-muted-foreground">
            Need a new file?{" "}
            <Link href="/upload" className="font-medium text-primary underline-offset-4 hover:underline">
              Upload a GeoPackage dataset
            </Link>{" "}
            first, wait for the file to finish processing, then return here to assign it.
          </div>

          {currentLayer?.datasetName && (
            <div className="min-w-0 text-sm">
              <span className="text-muted-foreground">Current source: </span>
              {currentLayer.datasetSlug ? (
                <Link
                  href={`/datasets/${currentLayer.datasetSlug}`}
                  className="inline-flex max-w-full items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                  title={currentLayer.datasetName}
                >
                  <span className="truncate">{currentLayer.datasetName}</span>
                  <ExternalLink className="size-3 shrink-0" />
                </Link>
              ) : (
                <span className="font-medium break-words">{currentLayer.datasetName}</span>
              )}
            </div>
          )}

          <div className="min-w-0 space-y-3 pb-4">
            <div className="space-y-2">
              <Label htmlFor="dataset-search">Search GeoPackage datasets</Label>
              <Input
                id="dataset-search"
                placeholder="Type to filter by title..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </div>

            {selectedDataset && (
              <p className="text-xs text-muted-foreground">
                Selected:{" "}
                <span className="font-medium text-foreground">{selectedDataset.title}</span>
              </p>
            )}

            <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 px-3 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading datasets...
                </div>
              ) : isError ? (
                <div className="px-3 py-8 text-center text-xs text-destructive">
                  Failed to load datasets. Try again.
                </div>
              ) : filteredDatasets.length === 0 ? (
                <div className="px-3 py-8 text-center text-xs break-words text-muted-foreground">
                  {query.trim()
                    ? `No GeoPackage datasets match “${query.trim()}”.`
                    : "No GeoPackage datasets with files found."}{" "}
                  <Link href="/upload" className="text-primary underline-offset-4 hover:underline">
                    Upload one
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {filteredDatasets.map((dataset) => {
                    const selected = dataset.id === selectedDatasetId;
                    return (
                      <li key={dataset.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedDatasetId(dataset.id)}
                          className={cn(
                            "flex w-full min-w-0 items-start gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
                            selected && "bg-primary/5",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40",
                            )}
                          >
                            {selected && <Check className="size-2.5" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{dataset.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {dataset.slug}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 mt-0 shrink-0 flex-col gap-2 border-t p-4 sm:flex-row sm:justify-between">
          <Link
            href="/upload"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 w-full gap-1.5 sm:w-auto")}
          >
            <Upload className="size-3.5 shrink-0" aria-hidden />
            Upload new
          </Link>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedDatasetId || mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
