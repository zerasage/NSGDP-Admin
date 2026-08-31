"use client";

import { useState } from "react";
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
import { LgaCoverageChecklist } from "@/components/admin/lga-coverage-checklist";
import {
  lgaCoverageCounts,
  lgaCoveragePercent,
  outcomeMetricPercent,
  tracksLgaCoverage,
  tracksOutcomeMetric,
} from "@/lib/constants/program-progress";
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

function ProgressBar({ label, pct, detail }: { label: string; pct: number; detail: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{pct}%</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ProgramProgressForm({
  programme,
  onClose,
}: {
  programme: AdminProgramme;
  onClose: () => void;
}) {
  const updateMutation = useUpdateProgram();
  const mode = programme.progress_mode ?? "lga_coverage";
  const showLga = tracksLgaCoverage(mode);
  const showOutcome = tracksOutcomeMetric(mode);

  const [reachCount, setReachCount] = useState(
    programme.reach_count?.toString() ?? "",
  );
  const [coveredLgas, setCoveredLgas] = useState<string[]>(
    programme.covered_lgas ?? [],
  );
  const [status, setStatus] = useState<ProgrammeStatus>(
    programme.status === "archived" ? "active" : programme.status,
  );

  const targetLgas = programme.target_lgas ?? [];
  const lgaCounts = lgaCoverageCounts({
    target_lgas: targetLgas,
    covered_lgas: coveredLgas,
  });
  const lgaPct = lgaCoveragePercent({
    target_lgas: targetLgas,
    covered_lgas: coveredLgas,
  });
  const outcomePct = outcomeMetricPercent({
    target_count: programme.target_count,
    reach_count: parseOptionalInt(reachCount) ?? programme.reach_count,
  });

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        slug: programme.slug,
        data: {
          coveredLgas: showLga ? coveredLgas : undefined,
          reachCount: showOutcome ? parseOptionalInt(reachCount) : undefined,
          status: programme.status === "archived" ? undefined : status,
        },
      });
      toast.success("Programme progress updated");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update progress",
      );
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <TrendingUp className="size-5" />
          Update progress
        </DialogTitle>
        <DialogDescription>
          Update progress for “{programme.name}”.
          {mode === "combined"
            ? " This programme tracks both LGA coverage and an outcome metric."
            : mode === "lga_coverage"
              ? " Progress is based on how many target LGAs are covered."
              : " Progress is based on the outcome count you set at create time."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {showLga && (
          <div>
            <Label>Covered LGAs</Label>
            <p className="mt-0.5 mb-1.5 text-xs text-muted-foreground">
              {lgaCounts.reach} of {lgaCounts.target} target LGAs covered
            </p>
            <LgaCoverageChecklist
              targetLgas={targetLgas}
              coveredLgas={coveredLgas}
              onChange={setCoveredLgas}
              disabled={updateMutation.isPending}
            />
          </div>
        )}

        {showOutcome && (
          <div>
            <Label htmlFor="progress-reach">
              {programme.primary_metric ?? "Outcome"} reached
            </Label>
            <Input
              id="progress-reach"
              type="number"
              min={0}
              className="mt-1.5"
              value={reachCount}
              onChange={(e) => setReachCount(e.target.value)}
            />
            {programme.target_count != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                Target: {programme.target_count.toLocaleString()}
              </p>
            )}
          </div>
        )}

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

        {showLga && lgaPct != null && (
          <ProgressBar
            label="LGA coverage"
            pct={lgaPct}
            detail={`${lgaCounts.reach} / ${lgaCounts.target} LGAs`}
          />
        )}

        {showOutcome && outcomePct != null && (
          <ProgressBar
            label={programme.primary_metric ?? "Outcome"}
            pct={outcomePct}
            detail={`${(parseOptionalInt(reachCount) ?? programme.reach_count ?? 0).toLocaleString()} / ${programme.target_count?.toLocaleString()} reached`}
          />
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
    </>
  );
}

export function ProgramProgressModal({
  open,
  onClose,
  programme,
}: ProgramProgressModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {open ? (
          <ProgramProgressForm key={programme.id} programme={programme} onClose={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
