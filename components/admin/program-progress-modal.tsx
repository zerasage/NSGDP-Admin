"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, TrendingUp } from "lucide-react";
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
import { useUpdateProgram } from "@/lib/hooks/usePrograms";
import type { AdminProgramme, ProgrammeStatus } from "@/lib/api/programs";
import { toast } from "sonner";

const STATUSES: Array<{ value: ProgrammeStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "suspended", label: "Suspended" },
];

function parseOptionalInt(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : undefined;
}

interface ProgramProgressModalProps {
  open: boolean;
  onClose: () => void;
  programme: AdminProgramme;
}

/** Lightweight reach/target/status updater — mirrors portal my-programs progress edits. */
export function ProgramProgressModal({
  open,
  onClose,
  programme,
}: ProgramProgressModalProps) {
  const updateMutation = useUpdateProgram();
  const [targetCount, setTargetCount] = useState("");
  const [reachCount, setReachCount] = useState("");
  const [lgasCoveredCount, setLgasCoveredCount] = useState("");
  const [status, setStatus] = useState<ProgrammeStatus>("active");
  const [primaryMetric, setPrimaryMetric] = useState("");

  useEffect(() => {
    if (!open) return;
    setTargetCount(programme.target_count?.toString() ?? "");
    setReachCount(programme.reach_count?.toString() ?? "");
    setLgasCoveredCount(programme.lgas_covered_count?.toString() ?? "");
    setStatus(
      programme.status === "archived" ? "active" : programme.status
    );
    setPrimaryMetric(programme.primary_metric ?? "");
  }, [open, programme]);

  const target = parseOptionalInt(targetCount);
  const reach = parseOptionalInt(reachCount);
  const pct =
    target != null && target > 0 && reach != null
      ? Math.min(100, Math.round((reach / target) * 100))
      : null;

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        slug: programme.slug,
        data: {
          targetCount: target,
          reachCount: reach,
          lgasCoveredCount: parseOptionalInt(lgasCoveredCount),
          primaryMetric: primaryMetric.trim() || undefined,
          status: programme.status === "archived" ? undefined : status,
        },
      });
      toast.success("Programme progress updated");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update progress"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Update progress
          </DialogTitle>
          <DialogDescription>
            Update reach against target for “{programme.name}”. Same fields
            programme owners edit on the public portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="progress-metric">Primary metric</Label>
            <Input
              id="progress-metric"
              className="mt-1.5"
              placeholder="e.g. children vaccinated"
              value={primaryMetric}
              onChange={(e) => setPrimaryMetric(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="progress-target">Target</Label>
              <Input
                id="progress-target"
                type="number"
                min={0}
                className="mt-1.5"
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="progress-reach">Reached</Label>
              <Input
                id="progress-reach"
                type="number"
                min={0}
                className="mt-1.5"
                value={reachCount}
                onChange={(e) => setReachCount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="progress-lgas">LGAs covered</Label>
            <Input
              id="progress-lgas"
              type="number"
              min={0}
              className="mt-1.5"
              value={lgasCoveredCount}
              onChange={(e) => setLgasCoveredCount(e.target.value)}
            />
          </div>

          {programme.status !== "archived" && (
            <div>
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ProgrammeStatus)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {pct != null && (
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-semibold tabular-nums">{pct}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save progress
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
