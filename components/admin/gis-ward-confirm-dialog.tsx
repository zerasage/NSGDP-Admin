"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  useConfirmGisWardAlias,
  useSearchWardsInLga,
} from "@/lib/hooks/useGisReference";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GisWardConfirmDialogProps {
  lga: string;
  ward: string;
  open: boolean;
  onClose: () => void;
}

export function GisWardConfirmDialog({
  lga,
  ward,
  open,
  onClose,
}: GisWardConfirmDialogProps) {
  const [search, setSearch] = useState(ward);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: wards, isLoading } = useSearchWardsInLga(lga, search, open);
  const confirmMutation = useConfirmGisWardAlias();

  const candidates = useMemo(() => wards ?? [], [wards]);

  const handleConfirm = async () => {
    if (!selectedId) return;
    try {
      await confirmMutation.mutateAsync({
        rawLga: lga,
        rawWard: ward,
        wardId: selectedId,
      });
      toast.success(`"${ward}" now resolves to the selected ward`);
      onClose();
    } catch {
      toast.error("Could not confirm this spelling");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm ward spelling</DialogTitle>
          <DialogDescription>
            Search wards in <span className="font-medium">{lga}</span> and confirm that
            &quot;{ward}&quot; maps to a canonical ward. This writes to{" "}
            <code className="text-xs">orgunit_aliases</code> and refreshes ingestion staging.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ward-search">Search wards</Label>
            <Input
              id="ward-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by ward name"
            />
          </div>
          <div className="max-h-56 overflow-y-auto rounded-lg border">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : candidates.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No wards found — check the LGA name or{" "}
                <Link href="/ingestion-ops" className="text-primary underline-offset-4 hover:underline">
                  Data Review
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y">
                {candidates.map((w) => (
                  <li key={w.wardId}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/60",
                        selectedId === w.wardId && "bg-primary/10",
                      )}
                      onClick={() => setSelectedId(w.wardId)}
                    >
                      <span>
                        <span className="font-medium">{w.wardName}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{w.lgaName}</span>
                      </span>
                      {search.trim() ? (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(w.score * 100)}%
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedId || confirmMutation.isPending}
          >
            {confirmMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirm mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
