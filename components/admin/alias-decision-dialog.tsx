"use client";

import { useMemo, useState } from "react";
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
import { useIndicators } from "@/lib/hooks/useIndicators";
import type { ReviewQueueItem } from "@/lib/api/ingestion-review";

interface AliasDecisionDialogProps {
  item: ReviewQueueItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (indicatorId: string) => void;
  isSaving?: boolean;
}

export function AliasDecisionDialog({ item, onOpenChange, onConfirm, isSaving }: AliasDecisionDialogProps) {
  const { data: indicators } = useIndicators();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!indicators) return [];
    const q = search.trim().toLowerCase();
    if (!q) return indicators.slice(0, 20);
    return indicators.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 20);
  }, [indicators, search]);

  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm indicator mapping</DialogTitle>
          <DialogDescription>
            &quot;{item.rawText}&quot; normalizes to &quot;{item.normalized}&quot;. Pick the
            canonical indicator it represents.
          </DialogDescription>
        </DialogHeader>

        {item.candidates && item.candidates.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Suggested candidates</p>
            <div className="flex flex-wrap gap-1.5">
              {item.candidates.map((c) => (
                <button
                  key={c.indicatorId}
                  type="button"
                  onClick={() => setSelectedId(c.indicatorId)}
                  className="rounded-full"
                >
                  <Badge
                    variant={selectedId === c.indicatorId ? "default" : "outline"}
                    className="cursor-pointer gap-1"
                  >
                    {c.name}
                    <span className="opacity-70">{Math.round(c.score * 100)}%</span>
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search indicators..."
            className="h-9"
          />
          <div className="max-h-48 overflow-y-auto rounded-lg border">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">No matching indicators.</p>
            ) : (
              filtered.map((indicator) => (
                <button
                  key={indicator.id}
                  type="button"
                  onClick={() => setSelectedId(indicator.id)}
                  className={`flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted ${
                    selectedId === indicator.id ? "bg-muted" : ""
                  }`}
                >
                  <span>{indicator.name}</span>
                  {!indicator.is_active && (
                    <span className="text-xs text-muted-foreground">inactive</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => selectedId && onConfirm(selectedId)}
            disabled={!selectedId || isSaving}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
