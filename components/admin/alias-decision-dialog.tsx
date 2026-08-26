"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useCreateIndicator, useIndicators } from "@/lib/hooks/useIndicators";
import type { ReviewQueueItem } from "@/lib/api/ingestion-review";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  hasDiseaseFamilyConflict,
  tokenOverlapScore,
} from "@/lib/utils/indicator-suggestion";

interface AliasDecisionDialogProps {
  item: ReviewQueueItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (indicatorId: string) => void;
  isSaving?: boolean;
}

/** Minimum name↔label overlap to keep a stored fuzzy suggestion visible. */
const MIN_SUGGESTION_OVERLAP = 0.2;

export function AliasDecisionDialog({
  item,
  onOpenChange,
  onConfirm,
  isSaving,
}: AliasDecisionDialogProps) {
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      {item ? (
        <AliasDecisionDialogContent
          key={item.id}
          item={item}
          onOpenChange={onOpenChange}
          onConfirm={onConfirm}
          isSaving={isSaving}
        />
      ) : null}
    </Dialog>
  );
}

function AliasDecisionDialogContent({
  item,
  onOpenChange,
  onConfirm,
  isSaving,
}: {
  item: ReviewQueueItem;
  onOpenChange: (open: boolean) => void;
  onConfirm: (indicatorId: string) => void;
  isSaving?: boolean;
}) {
  const { data: indicators } = useIndicators();
  const createMutation = useCreateIndicator();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState(
    () => item.rawText.replace(/\s+\d{4}\s*$/, "").trim() || item.rawText,
  );

  const indicatorsById = useMemo(() => {
    const map = new Map<string, { name: string; is_active: boolean }>();
    for (const row of indicators ?? []) {
      map.set(row.id, { name: row.name, is_active: row.is_active });
    }
    return map;
  }, [indicators]);

  const suggested = useMemo(() => {
    if (!item?.candidates?.length) return [];
    const query = `${item.rawText} ${item.normalized}`;
    return item.candidates
      .map((c) => {
        const registry = indicatorsById.get(c.indicatorId);
        const displayName = registry?.name ?? c.name;
        const nameScore = tokenOverlapScore(query, displayName);
        const matchedAs =
          registry && c.name && c.name !== registry.name ? c.name : null;
        return {
          ...c,
          displayName,
          matchedAs,
          isActive: registry?.is_active,
          nameScore,
          conflict: hasDiseaseFamilyConflict(query, displayName),
        };
      })
      .filter((c) => !c.conflict && c.nameScore >= MIN_SUGGESTION_OVERLAP)
      .sort((a, b) => b.nameScore - a.nameScore || b.score - a.score);
  }, [item, indicatorsById]);

  const filtered = useMemo(() => {
    if (!indicators) return [];
    const q = search.trim().toLowerCase();
    if (!q) return indicators.slice(0, 20);
    return indicators.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 20);
  }, [indicators, search]);

  const busy = isSaving || createMutation.isPending;

  const handleCreateAndConfirm = () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Enter a name for the new indicator");
      return;
    }
    createMutation.mutate(
      {
        name,
        isActive: true,
        canonicalSource: "local",
        description: `Created from alias review for “${item.rawText}”`,
      },
      {
        onSuccess: (created) => {
          toast.success(`Created “${created.name}”`);
          onConfirm(created.id);
        },
        onError: (error: unknown) =>
          toast.error(
            error instanceof Error ? error.message : "Failed to create indicator"
          ),
      }
    );
  };

  return (
    <DialogContent className="flex max-h-[min(92vh,44rem)] w-full flex-col gap-4 overflow-hidden p-5 sm:max-w-3xl">
        <DialogHeader className="shrink-0 space-y-2 pr-8 text-left">
          <DialogTitle>Confirm indicator mapping</DialogTitle>
          <DialogDescription>
            Pick the registry indicator this sheet label should count as.
            Suggestions are text-similarity guesses — verify the concept before
            confirming.
          </DialogDescription>
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sheet label
            </p>
            <p className="mt-0.5 break-words text-sm font-medium leading-snug text-foreground">
              {item.rawText}
            </p>
            <p className="mt-1 break-words text-[12px] text-muted-foreground">
              Normalized: {item.normalized}
            </p>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-0.5">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Suggested registry indicators
              </p>
              {suggested.length === 0 ? (
                <div className="rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">
                  No trustworthy automatic suggestions for this label. Search the
                  registry or create a new indicator.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-lg border lg:max-h-72">
                  {suggested.map((c) => {
                    const selected = selectedId === c.indicatorId;
                    return (
                      <button
                        key={c.indicatorId}
                        type="button"
                        onClick={() => setSelectedId(c.indicatorId)}
                        className={cn(
                          "flex w-full items-start gap-3 border-b px-3 py-3 text-left text-sm last:border-b-0 hover:bg-muted",
                          selected && "bg-muted"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-snug">{c.displayName}</p>
                          {c.matchedAs ? (
                            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                              Engine also saw similar past label: {c.matchedAs}
                            </p>
                          ) : null}
                          {c.isActive === false ? (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Inactive in registry
                            </p>
                          ) : null}
                        </div>
                        <Badge
                          variant={selected ? "default" : "outline"}
                          className="shrink-0 tabular-nums"
                        >
                          {Math.round(Math.max(c.nameScore, c.score) * 100)}%
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Search registry
              </p>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search indicators..."
                className="h-9"
              />
              <div className="max-h-56 overflow-y-auto rounded-lg border lg:max-h-72">
                {filtered.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    No matching indicators. Create a new one below.
                  </p>
                ) : (
                  filtered.map((indicator) => (
                    <button
                      key={indicator.id}
                      type="button"
                      onClick={() => setSelectedId(indicator.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 border-b px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-muted",
                        selectedId === indicator.id && "bg-muted"
                      )}
                    >
                      <span className="min-w-0 leading-snug">{indicator.name}</span>
                      {!indicator.is_active && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          inactive
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-dashed p-4">
            <p className="text-xs font-medium text-muted-foreground">
              No match? Create a new indicator
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New indicator name"
                className="h-9 sm:flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 shrink-0 gap-1.5"
                disabled={busy || !newName.trim()}
                onClick={handleCreateAndConfirm}
              >
                <Plus className="size-4" aria-hidden />
                Create and map
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Creates an active registry entry, then confirms this alias against it.
              Prefer mapping to an existing indicator when the concept already exists.
            </p>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedId && onConfirm(selectedId)}
            disabled={!selectedId || busy}
          >
            Confirm mapping
          </Button>
        </DialogFooter>
    </DialogContent>
  );
}
