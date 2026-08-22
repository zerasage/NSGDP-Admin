"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, GitBranch, Link2, RotateCcw, ShieldAlert, Sparkles, TrendingUp, Trash2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { SpeciesDistributionChart } from "@/components/charts/ingestion-charts";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";

function ObservabilityTab() {
  const { data, isLoading } = useObservability();

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!data) return <EmptyState title="No observability data available" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Auto-resolution rate", `${Math.round(data.autoResolutionRate * 100)}%`],
          ["Staging total", data.stagingTotal],
          ["Indicator pending", data.indicatorPending],
          ["Pending aliases", data.reviewQueueAge.pendingAliases],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardContent className="pt-5">
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-5 text-sm">
            <p className="font-medium">Review queue age</p>
            <p className="mt-1 text-muted-foreground">
              p50 {Math.round(data.reviewQueueAge.p50Seconds)}s · p95{" "}
              {Math.round(data.reviewQueueAge.p95Seconds)}s
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-sm">
            <p className="font-medium">Auto-resolution target</p>
            <p className="mt-1 text-muted-foreground">
              &gt;{Math.round(data.targets.month1AutoResolution * 100)}% month 1 · &gt;
              {Math.round(data.targets.month3AutoResolution * 100)}% month 3
            </p>
          </CardContent>
        </Card>
      </div>

      {data.speciesDistribution.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Species distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <SpeciesDistributionChart data={data.speciesDistribution} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QueueHealthTab() {
  const { data, isLoading } = useQueueHealth();

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!data) return <EmptyState title="No queue health data available" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge
          className={
            data.status === "healthy"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0"
              : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-0"
          }
        >
          {data.status === "healthy" ? "Healthy" : "Degraded"}
        </Badge>
        <span className="text-xs text-muted-foreground">Checked {formatDate(data.checkedAt)}</span>
      </div>

      {data.warnings.length > 0 && (
        <Card className="border-amber-300/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-2 pt-5 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <ul className="space-y-1">
              {data.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
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
                  <TableCell className="text-right tabular-nums">{q.failed}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {q.oldestWaitingAgeMs != null ? `${Math.round(q.oldestWaitingAgeMs / 1000)}s` : "—"}
                  </TableCell>
                  <TableCell>
                    {q.paused ? (
                      <Badge variant="outline" className="text-muted-foreground">Paused</Badge>
                    ) : (
                      <Badge variant="outline">Running</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
        <Card key={job.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
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
          </CardContent>
        </Card>
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Cost (7d)", `$${data.totalCostUsd.toFixed(2)}`],
          ["Tokens (7d)", data.totalTokens.toLocaleString()],
          ["Cache hit rate", `${Math.round(data.cacheHitRate * 100)}%`],
          ["Circuit", data.circuit.open ? "Open" : "Closed"],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardContent className="pt-5">
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">Spend by task</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.byTask.length === 0 ? (
            <EmptyState title="No AI calls in this period" />
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CalibrationTab() {
  const runMutation = useRunCalibration();

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
          <div>
            <p className="text-sm font-medium">Embedding threshold calibration</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sweeps auto-accept/review thresholds against confirmed alias pairs. Safe to
              re-run any time — results only take effect once reviewed.
            </p>
          </div>
          <Button onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
            <Sparkles className="size-4" />
            {runMutation.isPending ? "Running..." : "Run Calibration"}
          </Button>
        </CardContent>
      </Card>

      {runMutation.data && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Latest result</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 pt-4 text-sm sm:grid-cols-4">
            {[
              ["Auto threshold", runMutation.data.autoThreshold],
              ["Auto precision", `${Math.round(runMutation.data.autoPrecision * 100)}%`],
              ["Review threshold", runMutation.data.reviewThreshold],
              ["Pairs evaluated", runMutation.data.pairs],
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className="text-lg font-bold tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </CardContent>
        </Card>
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

  const tools = [
    {
      icon: TrendingUp,
      title: "Alias succession scan",
      description: "Finds an indicator likely replaced by another (name changed, form revised).",
      mutation: shiftMutation,
      label: "Run Shift Detection",
      list: <SuccessionCandidatesList />,
    },
    {
      icon: GitBranch,
      title: "Changepoint scan",
      description: "Flags a reporting-regime shift shared across most LGAs, so it reads as a form change, not an outbreak.",
      mutation: changepointMutation,
      label: "Run Changepoint Scan",
      list: <ChangepointsList />,
    },
    {
      icon: Link2,
      title: "Cross-dataset relation matching",
      description: "Finds the same study reported by a different organisation under different naming. Confirm/reject from each dataset's Related Datasets tab.",
      mutation: relationMutation,
      label: "Run Relation Matching",
      list: null,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        These run nightly/weekly on a schedule — use these buttons to run one immediately.
        Pending succession and changepoint candidates surface below each scan; relation
        candidates are actioned from each dataset&apos;s own Related Datasets tab.
      </p>
      {tools.map((tool) => (
        <Card key={tool.title}>
          <CardContent className="space-y-3 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <tool.icon className="size-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{tool.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{tool.description}</p>
                  {tool.mutation.data != null && (
                    <p className="mt-1 text-xs font-medium text-primary">
                      Last run: {tool.mutation.data} candidate(s) written
                    </p>
                  )}
                </div>
              </div>
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
            </div>
            {tool.list}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function IngestionOpsPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isSuperAdmin = user?.role === "super_admin";
  const canView = isSuperAdmin || hasPermission("manage:indicators");

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
      <div>
        <h1 className="text-2xl font-bold">Ingestion Ops</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Engine-wide health — not tied to any one dataset.
        </p>
      </div>

      <Tabs defaultValue="observability">
        <TabsList>
          <TabsTrigger value="observability">Observability</TabsTrigger>
          <TabsTrigger value="ai-spend">AI Spend</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="calibration">Calibration</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger value="stage8">Stage 8 Tools</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger value="queue-health">Queue Health</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger value="dead-letter">Dead-letter</TabsTrigger>}
        </TabsList>
        <TabsContent value="observability" className="mt-4">
          <ObservabilityTab />
        </TabsContent>
        <TabsContent value="ai-spend" className="mt-4">
          <AiSpendTab />
        </TabsContent>
        {isSuperAdmin && (
          <TabsContent value="calibration" className="mt-4">
            <CalibrationTab />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="stage8" className="mt-4">
            <Stage8ToolsTab />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="queue-health" className="mt-4">
            <QueueHealthTab />
          </TabsContent>
        )}
        {isSuperAdmin && (
          <TabsContent value="dead-letter" className="mt-4">
            <DeadLetterTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
