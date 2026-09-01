"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Activity, BarChart3, CheckCircle2, Clock, Database, GitBranch, Link2, Loader2, RotateCcw, ShieldAlert, Sparkles, TrendingUp, Trash2, XCircle, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useObservability,
  useQueueHealth,
  useDeadLetterJobs,
  useRetryDeadLetterJob,
  useDiscardDeadLetterJob,
  useAiSpend,
  useRunCalibration,
  useRunShiftDetection,
  useRunChangepointScan,
  useRunRelationMatch,
  useSuccessionCandidates,
  useConfirmSuccession,
  useRejectSuccession,
  useChangepoints,
  useConfirmChangepoint,
  useRejectChangepoint,
} from "@/lib/hooks/useIngestionOps";
import {
  useBackfillIngestion,
  useInFlightIngestionJobs,
  useReviewQueue,
} from "@/lib/hooks/useIngestionReview";
import { DataReviewQueueTab } from "@/components/admin/data-review-queue-tab";
import { IndicatorsRegistryTab } from "@/components/admin/indicators-registry-tab";
import { DatasetCompareTab } from "@/components/admin/dataset-compare-tab";
import { IngestionOpsTabsNav } from "@/components/admin/ingestion-ops-tabs-nav";
import { MetricCard, Panel, DataTableShell, type MetricTone } from "@/components/admin/admin-analytics-ui";
import { SpeciesDistributionChart } from "@/components/charts/ingestion-charts";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const OPS_TABS = [
  "observability",
  "active",
  "aliases",
  "indicators",
  "compare",
  "ai-spend",
  "calibration",
  "stage8",
  "queue-health",
  "dead-letter",
] as const;

type OpsTab = (typeof OPS_TABS)[number];

function parseOpsTab(value: string | null): OpsTab {
  if (value && (OPS_TABS as readonly string[]).includes(value)) {
    return value as OpsTab;
  }
  return "observability";
}

function jobStatusLabel(status: string): string {
  if (status === "pending") return "Queued";
  if (status === "validating") return "Validating";
  if (status === "processing") return "Running";
  return status;
}

function ActiveJobsTab() {
  const { data, isLoading } = useInFlightIngestionJobs();

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Nothing queued or running"
        description="When datasets are submitted for review or catch-up is run, active ingestion jobs appear here."
      />
    );
  }

  return (
    <Panel
      title="Active ingestion jobs"
      description="Queued and running dataset uploads across the platform."
      icon={Loader2}
      tone="info"
    >
      <DataTableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dataset</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead className="text-right">Progress</TableHead>
            <TableHead>Queued</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((job) => {
            const pct = Math.min(100, Math.max(0, job.progress ?? 0));
            const stage =
              job.steps.find((s) => s.status === "running")?.label ??
              (job.status === "pending" ? "Waiting for worker" : "—");
            const href = job.datasetSlug
              ? `/datasets/${job.datasetSlug}/ingestion`
              : null;

            return (
              <TableRow key={job.jobId}>
                <TableCell className="max-w-70">
                  {href ? (
                    <Link
                      href={href}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {job.datasetTitle ?? job.datasetId ?? "Unknown dataset"}
                    </Link>
                  ) : (
                    <span className="font-medium">
                      {job.datasetTitle ?? job.datasetId ?? "Unknown dataset"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1.5 text-[10px] uppercase",
                      job.status === "processing" && "border-info/30 bg-info/10 text-info",
                      job.status === "pending" && "border-warning/30 bg-warning/10 text-amber-700 dark:text-warning"
                    )}
                  >
                    {(job.status === "processing" || job.status === "validating") && (
                      <Loader2 className="size-3 animate-spin" aria-hidden />
                    )}
                    {jobStatusLabel(job.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{stage}</TableCell>
                <TableCell className="text-right">
                  <div className="ml-auto flex w-28 flex-col items-end gap-1">
                    <span className="text-xs font-semibold tabular-nums">{pct}%</span>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-500",
                          job.status === "processing" ? "bg-info" : "bg-primary",
                          job.status === "pending" && pct === 0 && "min-w-1"
                        )}
                        style={{ width: `${job.status === "pending" && pct === 0 ? 4 : pct}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-muted-foreground">
                  {formatDate(job.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </DataTableShell>
    </Panel>
  );
}

function ObservabilityTab() {
  const { data, isLoading } = useObservability();

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!data) return <EmptyState title="No observability data available" />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Auto-resolution rate"
          value={`${Math.round(data.autoResolutionRate * 100)}%`}
          icon={Zap}
          tone="success"
        />
        <MetricCard
          label="Staging total"
          value={data.stagingTotal.toLocaleString()}
          icon={Database}
          tone="info"
        />
        <MetricCard
          label="Indicator pending"
          value={data.indicatorPending}
          icon={BarChart3}
          tone="warning"
        />
        <MetricCard
          label="Pending aliases"
          value={data.reviewQueueAge.pendingAliases}
          icon={Link2}
          tone="destructive"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          label="Review queue p50"
          value={`${Math.round(data.reviewQueueAge.p50Seconds)}s`}
          hint={`p95 ${Math.round(data.reviewQueueAge.p95Seconds)}s`}
          icon={Clock}
          tone="muted"
        />
        <MetricCard
          label="Auto-resolution target"
          value={`>${Math.round(data.targets.month1AutoResolution * 100)}%`}
          hint={`Month 3 target >${Math.round(data.targets.month3AutoResolution * 100)}%`}
          icon={TrendingUp}
          tone="primary"
        />
      </div>

      {data.speciesDistribution.length > 0 && (
        <Panel
          title="Species distribution"
          description="Workbook layout types seen during ingestion."
          icon={BarChart3}
          tone="info"
        >
          <SpeciesDistributionChart data={data.speciesDistribution} />
        </Panel>
      )}
    </div>
  );
}

function QueueHealthTab() {
  const { data, isLoading } = useQueueHealth();

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!data) return <EmptyState title="No queue health data available" />;

  const totalWaiting = data.queues.reduce((s, q) => s + q.waiting, 0);
  const totalActive = data.queues.reduce((s, q) => s + q.active, 0);
  const totalFailed = data.queues.reduce((s, q) => s + q.failed, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Queue status"
          value={data.status === "healthy" ? "Healthy" : "Degraded"}
          hint={`Checked ${formatDate(data.checkedAt)}`}
          icon={CheckCircle2}
          tone={data.status === "healthy" ? "success" : "warning"}
        />
        <MetricCard label="Waiting jobs" value={totalWaiting} icon={Clock} tone="warning" />
        <MetricCard label="Failed jobs" value={totalFailed} icon={AlertTriangle} tone="destructive" />
      </div>

      {data.warnings.length > 0 && (
        <div className="rounded-2xl border border-warning/30 bg-warning/[0.08] p-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-warning" />
            <ul className="space-y-1">
              {data.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Panel
        title="Queue breakdown"
        description={`${totalActive} job(s) active across ${data.queues.length} queue(s).`}
        icon={Activity}
        tone="success"
      >
        <DataTableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue</TableHead>
                <TableHead className="text-right">Waiting</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">Oldest waiting</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.queues.map((q) => (
                <TableRow key={q.queue}>
                  <TableCell className="font-medium">{q.queue}</TableCell>
                  <TableCell className="text-right tabular-nums">{q.waiting}</TableCell>
                  <TableCell className="text-right tabular-nums">{q.active}</TableCell>
                  <TableCell className={cn("text-right tabular-nums", q.failed > 0 && "font-semibold text-destructive")}>
                    {q.failed}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {q.oldestWaitingAgeMs != null ? `${Math.round(q.oldestWaitingAgeMs / 1000)}s` : "—"}
                  </TableCell>
                  <TableCell>
                    {q.paused ? (
                      <Badge variant="outline" className="border-warning/30 bg-warning/10 text-amber-700 dark:text-warning">
                        Paused
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                        Running
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableShell>
      </Panel>
    </div>
  );
}

function DeadLetterTab() {
  const { data: jobs, isLoading } = useDeadLetterJobs();
  const retryMutation = useRetryDeadLetterJob();
  const discardMutation = useDiscardDeadLetterJob();
  const [discardTarget, setDiscardTarget] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  if (!jobs || jobs.length === 0) {
    return <EmptyState title="No dead-lettered jobs" description="Everything is draining normally." />;
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-4 sm:p-5"
        >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{job.payload.jobName}</p>
                <Badge variant="outline" className="text-[10px]">{job.payload.queue}</Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {job.payload.attemptsMade} attempt(s)
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {job.payload.failedReason}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(job.createdAt)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  retryMutation.mutate(job.id, {
                    onSuccess: () => toast.success("Job re-enqueued"),
                    onError: (error: unknown) =>
                      toast.error(error instanceof Error ? error.message : "Failed to retry job"),
                  })
                }
                disabled={retryMutation.isPending}
              >
                <RotateCcw className="size-4" />
                Retry
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setDiscardTarget(job.id)}
              >
                <Trash2 className="size-4" />
                Discard
              </Button>
            </div>
          </div>
      ))}

      <ConfirmDialog
        open={!!discardTarget}
        onOpenChange={(open) => !open && setDiscardTarget(null)}
        title="Discard dead-lettered job?"
        description="This job will not be replayed. This cannot be undone."
        confirmLabel="Discard"
        variant="destructive"
        loading={discardMutation.isPending}
        onConfirm={() => {
          if (!discardTarget) return;
          discardMutation.mutate(discardTarget, {
            onSuccess: () => toast.success("Job discarded"),
            onError: (error: unknown) =>
              toast.error(error instanceof Error ? error.message : "Failed to discard job"),
          });
        }}
      />
    </div>
  );
}

function AiSpendTab() {
  const { data, isLoading } = useAiSpend(7);

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!data) return <EmptyState title="No AI spend data available" />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Cost (7d)"
          value={`$${data.totalCostUsd.toFixed(2)}`}
          icon={Sparkles}
          tone="destructive"
        />
        <MetricCard
          label="Tokens (7d)"
          value={data.totalTokens.toLocaleString()}
          icon={Database}
          tone="info"
        />
        <MetricCard
          label="Cache hit rate"
          value={`${Math.round(data.cacheHitRate * 100)}%`}
          icon={Zap}
          tone="success"
        />
        <MetricCard
          label="Circuit breaker"
          value={data.circuit.open ? "Open" : "Closed"}
          icon={Activity}
          tone={data.circuit.open ? "warning" : "muted"}
        />
      </div>

      <Panel title="Spend by task" icon={Sparkles} tone="destructive">
        {data.byTask.length === 0 ? (
          <EmptyState title="No AI calls in this period" />
        ) : (
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Cache hits</TableHead>
                  <TableHead className="text-right">Skipped</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Acceptance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byTask.map((t) => (
                  <TableRow key={t.task}>
                    <TableCell className="font-medium">{t.task}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.calls}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.cacheHits}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.skipped}</TableCell>
                    <TableCell className="text-right tabular-nums">${t.costUsd.toFixed(3)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {t.acceptanceRate != null ? `${Math.round(t.acceptanceRate * 100)}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableShell>
        )}
      </Panel>
    </div>
  );
}

function CalibrationTab() {
  const runMutation = useRunCalibration();

  return (
    <div className="space-y-4">
      <Panel
        title="Embedding threshold calibration"
        description="Sweeps auto-accept/review thresholds against confirmed alias pairs. Safe to re-run any time — results only take effect once reviewed."
        icon={TrendingUp}
        tone="primary"
        action={
          <Button onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
            <Sparkles className="size-4" />
            {runMutation.isPending ? "Running..." : "Run Calibration"}
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          Latest sweep results appear below after each run.
        </p>
      </Panel>

      {runMutation.data && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Auto threshold" value={runMutation.data.autoThreshold} icon={Zap} tone="success" />
          <MetricCard
            label="Auto precision"
            value={`${Math.round(runMutation.data.autoPrecision * 100)}%`}
            icon={CheckCircle2}
            tone="info"
          />
          <MetricCard label="Review threshold" value={runMutation.data.reviewThreshold} icon={TrendingUp} tone="warning" />
          <MetricCard label="Pairs evaluated" value={runMutation.data.pairs} icon={Database} tone="muted" />
        </div>
      )}
    </div>
  );
}

function SuccessionCandidatesList() {
  const { data: candidates, isLoading } = useSuccessionCandidates("pending");
  const confirmMutation = useConfirmSuccession();
  const rejectMutation = useRejectSuccession();

  if (isLoading) return <Skeleton className="h-24 rounded-xl" />;
  if (!candidates || candidates.length === 0) {
    return <p className="text-xs text-muted-foreground">No pending succession candidates.</p>;
  }

  return (
    <div className="space-y-2">
      {candidates.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <div className="min-w-0 text-sm">
            <p className="truncate">
              <span className="font-medium">{c.predecessorName}</span>
              {" → "}
              <span className="font-medium">{c.successorName}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              embedding similarity {c.embeddingSimilarity}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              onClick={() =>
                confirmMutation.mutate(c.id, {
                  onSuccess: () => toast.success("Succession confirmed"),
                  onError: (error: unknown) =>
                    toast.error(error instanceof Error ? error.message : "Failed to confirm"),
                })
              }
              disabled={confirmMutation.isPending}
            >
              <CheckCircle2 className="size-4" />
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() =>
                rejectMutation.mutate(c.id, {
                  onSuccess: () => toast.success("Succession rejected"),
                  onError: (error: unknown) =>
                    toast.error(error instanceof Error ? error.message : "Failed to reject"),
                })
              }
              disabled={rejectMutation.isPending}
            >
              <XCircle className="size-4" />
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChangepointsList() {
  const { data: points, isLoading } = useChangepoints("pending");
  const confirmMutation = useConfirmChangepoint();
  const rejectMutation = useRejectChangepoint();

  if (isLoading) return <Skeleton className="h-24 rounded-xl" />;
  if (!points || points.length === 0) {
    return <p className="text-xs text-muted-foreground">No pending changepoints.</p>;
  }

  return (
    <div className="space-y-2">
      {points.map((p) => (
        <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">
              {p.indicatorName} · {p.periodYear}
              {p.periodMonth != null ? `-${String(p.periodMonth).padStart(2, "0")}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {p.method} · {Math.round(Number(p.lgaShare) * 100)}% of LGAs affected
              {p.note ? ` · ${p.note}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              onClick={() =>
                confirmMutation.mutate(p.id, {
                  onSuccess: () => toast.success("Changepoint confirmed"),
                  onError: (error: unknown) =>
                    toast.error(error instanceof Error ? error.message : "Failed to confirm"),
                })
              }
              disabled={confirmMutation.isPending}
            >
              <CheckCircle2 className="size-4" />
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() =>
                rejectMutation.mutate(p.id, {
                  onSuccess: () => toast.success("Changepoint rejected"),
                  onError: (error: unknown) =>
                    toast.error(error instanceof Error ? error.message : "Failed to reject"),
                })
              }
              disabled={rejectMutation.isPending}
            >
              <XCircle className="size-4" />
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Stage8ToolsTab() {
  const shiftMutation = useRunShiftDetection();
  const changepointMutation = useRunChangepointScan();
  const relationMutation = useRunRelationMatch();

  const tools: {
    icon: typeof TrendingUp;
    title: string;
    description: string;
    mutation: ReturnType<typeof useRunShiftDetection>;
    label: string;
    list: React.ReactNode;
    tone: MetricTone;
  }[] = [
    {
      icon: TrendingUp,
      title: "Alias succession scan",
      description: "Finds an indicator likely replaced by another (name changed, form revised).",
      mutation: shiftMutation,
      label: "Run Shift Detection",
      list: <SuccessionCandidatesList />,
      tone: "primary",
    },
    {
      icon: GitBranch,
      title: "Changepoint scan",
      description: "Flags a reporting-regime shift shared across most LGAs, so it reads as a form change, not an outbreak.",
      mutation: changepointMutation,
      label: "Run Changepoint Scan",
      list: <ChangepointsList />,
      tone: "warning",
    },
    {
      icon: Link2,
      title: "Cross-dataset relation matching",
      description: "Finds the same study reported by a different organisation under different naming. Confirm/reject from each dataset's Related Datasets tab.",
      mutation: relationMutation,
      label: "Run Relation Matching",
      list: null,
      tone: "info",
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        These run nightly/weekly on a schedule — use these buttons to run one immediately.
        Pending succession and changepoint candidates surface below each scan; relation
        candidates are actioned from each dataset&apos;s own Related Datasets tab.
      </p>
      {tools.map((tool) => (
        <Panel
          key={tool.title}
          title={tool.title}
          description={tool.description}
          icon={tool.icon}
          tone={tool.tone}
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                tool.mutation.mutate(undefined, {
                  onError: (error: unknown) =>
                    toast.error(error instanceof Error ? error.message : "Scan failed"),
                })
              }
              disabled={tool.mutation.isPending}
            >
              {tool.mutation.isPending ? "Running..." : tool.label}
            </Button>
          }
        >
          {tool.mutation.data != null && (
            <p className="mb-3 text-xs font-medium text-primary">
              Last run: {tool.mutation.data} candidate(s) written
            </p>
          )}
          {tool.list}
        </Panel>
      ))}
    </div>
  );
}

export default function IngestionOpsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { can, isSuperAdmin } = useAdminAccess();
  const canView = can("manage:indicators");
  const backfillMutation = useBackfillIngestion();
  const tab = parseOpsTab(searchParams.get("tab"));
  const setTab = (value: string) => {
    const next = parseOpsTab(value);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "observability") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `/ingestion-ops?${qs}` : "/ingestion-ops");
  };
  const { data: globalAliases } = useReviewQueue(undefined, {
    global: true,
    limit: 200,
    enabled: canView,
  });
  const pendingAliasCount = globalAliases?.length ?? 0;

  if (!canView) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No access"
        description="You don't have permission to view ingestion operations."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ingestion Ops</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Pipeline health, alias review, indicator registry, and published-dataset compare.
          </p>
        </div>
        {isSuperAdmin && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={backfillMutation.isPending}
            onClick={() =>
              backfillMutation.mutate(50, {
                onSuccess: (result) =>
                  toast.success(
                    `Catch-up: ${result.enqueued} enqueued, ${result.alreadyQueued} already queued, ${result.skipped} skipped (${result.scanned} scanned)`
                  ),
                onError: (error: unknown) =>
                  toast.error(
                    error instanceof Error ? error.message : "Backfill failed"
                  ),
              })
            }
          >
            {backfillMutation.isPending ? "Backfilling…" : "Backfill catch-up"}
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <IngestionOpsTabsNav
          isSuperAdmin={isSuperAdmin}
          pendingAliasCount={pendingAliasCount}
          activeTab={tab}
        />
        <TabsContent value="active" className="mt-0">
          <ActiveJobsTab />
        </TabsContent>
        <TabsContent value="aliases" className="mt-0">
          <DataReviewQueueTab global />
        </TabsContent>
        <TabsContent value="indicators" className="mt-0">
          <IndicatorsRegistryTab />
        </TabsContent>
        {isSuperAdmin && (
          <TabsContent value="compare" className="mt-0">
            <DatasetCompareTab />
          </TabsContent>
        )}
        <TabsContent value="observability" className="mt-0">
          <ObservabilityTab />
        </TabsContent>
        <TabsContent value="ai-spend" className="mt-0">
          <AiSpendTab />
        </TabsContent>
        {isSuperAdmin && (
          <TabsContent value="calibration" className="mt-0">
            <CalibrationTab />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="stage8" className="mt-0">
            <Stage8ToolsTab />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="queue-health" className="mt-0">
            <QueueHealthTab />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="dead-letter" className="mt-0">
            <DeadLetterTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
