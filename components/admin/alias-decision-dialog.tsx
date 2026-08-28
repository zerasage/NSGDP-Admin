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
import { useCreateIndicator, useIndicators } from "@/lib/hooks/useIndicators";
import type { ReviewQueueItem } from "@/lib/api/ingestion-review";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { extractLlmProposal } from "@/lib/utils/indicator-suggestion";
import { detectMeasureKind } from "@/lib/utils/measure-kind";
import { AliasReviewContextPanel } from "@/components/admin/alias-review-context-panel";

interface AliasDecisionDialogProps {
  item: ReviewQueueItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (indicatorId: string) => void;
  isSaving?: boolean;
}

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
  const llmProposal = useMemo(
    () => extractLlmProposal(item.candidates as unknown[] | null),
    [item.candidates],
  );
  const suggestedName =
    llmProposal?.proposedName ?? item.suggestedRegistryName ?? null;
  const [newName, setNewName] = useState(() => {
    const fallback =
      item.rawText.replace(/\s+\d{4}\s*$/, "").trim() || item.rawText;
    return suggestedName ?? fallback;
  });

  const filtered = useMemo(() => {
    if (!indicators) return [];
    const q = search.trim().toLowerCase();
    const limit = q ? 30 : 8;
    if (!q) return indicators.slice(0, limit);
    return indicators.filter((i) => i.name.toLowerCase().includes(q)).slice(0, limit);
  }, [indicators, search]);

  const measure = detectMeasureKind(item.rawText);

  const busy = isSaving || createMutation.isPending;

  const handleCreateAndConfirm = (nameOverride?: string) => {
    const name = (nameOverride ?? newName).trim();
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
        category: llmProposal?.category ?? measure.category ?? undefined,
        unit:
          llmProposal?.unit ??
          (measure.kind === "cases" ? "cases" : measure.unit),
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
    <DialogContent className="flex max-h-[min(92vh,44rem)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
      <DialogHeader className="shrink-0 space-y-2 border-b px-5 py-4 pr-12 text-left">
        <DialogTitle>Confirm indicator mapping</DialogTitle>
        <DialogDescription>
          Pick the registry indicator this sheet label should count as.
          Suggestions are text-similarity guesses — verify the concept before
          confirming.
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 pb-5">
        {measure.kind !== "cases" ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left text-sm text-amber-900 dark:text-amber-100">
            Detected as <strong>{measure.label}</strong> (unit{" "}
            <strong>{measure.unit}</strong>
            {measure.category ? `, category ${measure.category}` : ""}). This is
            not a disease case count — map to a matching registry indicator or
            create one with the correct unit.
          </div>
        ) : null}
        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Sheet label
          </p>
          <p className="mt-0.5 break-words text-sm font-medium leading-snug text-foreground">
            {item.rawText}
          </p>
          <p className="mt-1 break-words text-[12px] text-muted-foreground">
            Normalized: {item.normalized}
            {measure.kind !== "cases" ? ` · ${measure.label}` : ""}
          </p>
        </div>
        <AliasReviewContextPanel item={item} />

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
          <div className="max-h-44 overflow-y-auto rounded-lg border">
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
          {!search.trim() && (indicators?.length ?? 0) > 8 ? (
            <p className="text-[11px] text-muted-foreground">
              Showing first 8 indicators — search to find more.
            </p>
          ) : null}
        </div>

        {llmProposal ? (
            <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    LLM suggested name
                  </p>
                  <p className="mt-1 text-sm font-medium leading-snug">
                    {llmProposal.proposedName}
                  </p>
                  {llmProposal.category || llmProposal.unit ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {llmProposal.category ? `Category: ${llmProposal.category}` : ""}
                      {llmProposal.category && llmProposal.unit ? " · " : ""}
                      {llmProposal.unit ? `Unit: ${llmProposal.unit}` : ""}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  disabled={busy}
                  onClick={() => handleCreateAndConfirm(llmProposal.proposedName)}
                >
                  <Plus className="size-4" aria-hidden />
                  Create and map
                </Button>
              </div>
            </div>
          ) : suggestedName ? (
            <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Suggested registry name
                  </p>
                  <p className="mt-1 text-sm font-medium leading-snug">
                    {suggestedName}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    From sheet context (not LLM). Review before creating.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  disabled={busy}
                  onClick={() => handleCreateAndConfirm(suggestedName)}
                >
                  <Plus className="size-4" aria-hidden />
                  Create and map
                </Button>
              </div>
            </div>
          ) : null}

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
                onClick={() => handleCreateAndConfirm()}
              >
                <Plus className="size-4" aria-hidden />
                Create and map
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Creates an active registry entry
              {measure.kind !== "cases"
                ? ` with category “${measure.category}” and unit “${measure.unit}”`
                : ""}
              , then confirms this alias against it. Prefer mapping to an existing
              indicator when the concept already exists.
            </p>
          </div>
      </div>

      <DialogFooter className="mx-0 mb-0 shrink-0 gap-3 border-t bg-background px-6 py-5 sm:justify-between">
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
