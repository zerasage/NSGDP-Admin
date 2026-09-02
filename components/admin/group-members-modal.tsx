"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, ExternalLink, Loader2, Search, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGroupBySlug, useAddDatasetToGroup, useRemoveDatasetFromGroup } from "@/lib/hooks/useGroups";
import { getDatasets, type Dataset } from "@/lib/api/datasets";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

function isPublishedDataset(dataset: Dataset): boolean {
  return dataset.status === "approved" && !!dataset.published_at;
}

interface GroupMembersModalProps {
  open: boolean;
  onClose: () => void;
  groupSlug: string | undefined;
}

export function GroupMembersModal({ open, onClose, groupSlug }: GroupMembersModalProps) {
  const [search, setSearch] = useState("");
  const { data: group, isLoading } = useGroupBySlug(open ? groupSlug : undefined);
  const addMutation = useAddDatasetToGroup();
  const removeMutation = useRemoveDatasetFromGroup();

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ["dataset-search", search],
    queryFn: () => getDatasets({ search, limit: 8 }),
    enabled: open && search.trim().length >= 2,
  });

  const currentDatasetIds = new Set((group?.datasets ?? []).map((d) => d.id));
  const publishableResults = (searchResults?.data ?? []).filter(isPublishedDataset);

  const handleAdd = (dataset: Dataset) => {
    if (!groupSlug) return;
    if (!isPublishedDataset(dataset)) {
      toast.error("Only published datasets can be added to a collection.");
      return;
    }
    addMutation.mutate(
      { slug: groupSlug, datasetId: dataset.id },
      {
        onSuccess: () => toast.success(`Added "${dataset.title}" to collection`),
        onError: (error) => {
          const err = error as { message?: string };
          toast.error(err?.message || "Failed to add dataset");
        },
      },
    );
  };

  const handleRemove = (datasetId: string, title: string) => {
    if (!groupSlug) return;
    removeMutation.mutate(
      { slug: groupSlug, datasetId },
      {
        onSuccess: () => toast.success(`Removed "${title}" from collection`),
        onError: () => toast.error("Failed to remove dataset"),
      },
    );
  };

  const handleClose = () => {
    setSearch("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="size-5" />
            Curate datasets — {group?.name ?? "…"}
          </DialogTitle>
          <DialogDescription>
            Add or remove published datasets in this collection. Only published datasets can be
            added.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search datasets to add..."
              className="pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {search.trim().length >= 2 && (
            <div className="rounded-lg border">
              {searching ? (
                <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Searching...
                </div>
              ) : publishableResults.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No published datasets match your search. Approve and publish a dataset first.
                </p>
              ) : (
                <ul className="divide-y">
                  {publishableResults.map((dataset) => {
                    const alreadyIn = currentDatasetIds.has(dataset.id);
                    return (
                      <li key={dataset.id} className="flex items-center justify-between gap-3 p-3">
                        <Link
                          href={`/datasets/${dataset.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-w-0 items-center gap-1.5 truncate text-sm text-primary hover:underline"
                        >
                          <span className="truncate">{dataset.title}</span>
                          <ExternalLink className="size-3.5 shrink-0 opacity-60" aria-hidden />
                        </Link>
                        <Button
                          size="sm"
                          variant={alreadyIn ? "secondary" : "outline"}
                          disabled={alreadyIn || addMutation.isPending}
                          onClick={() => handleAdd(dataset)}
                        >
                          {alreadyIn ? "Added" : "Add"}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              In this collection ({group?.datasets.length ?? 0})
            </p>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading...
              </div>
            ) : (group?.datasets ?? []).length === 0 ? (
              <p className="rounded-lg border p-4 text-sm text-muted-foreground">
                No datasets in this collection yet — search above to add one.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {group!.datasets.map((dataset) => (
                  <li key={dataset.id} className="flex items-center justify-between gap-3 p-3">
                    <Link
                      href={`/datasets/${dataset.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-primary hover:underline"
                    >
                      <span className="truncate">{dataset.title}</span>
                      <ExternalLink className="size-3.5 shrink-0 opacity-60" aria-hidden />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Remove ${dataset.title}`}
                      disabled={removeMutation.isPending}
                      onClick={() => handleRemove(dataset.id, dataset.title)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
