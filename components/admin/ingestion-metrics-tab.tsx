"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Clock,
  Database,
  GitBranch,
  Link2,
  Loader2,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  MetricCard,
  Panel,
  DataTableShell,
} from "@/components/admin/admin-analytics-ui";
import { METRICS_CARD_TIPS, METRICS_PANEL_TIPS } from "@/lib/constants/ingestion-ops-tooltips";
import { SpeciesDistributionChart } from "@/components/charts/ingestion-charts";
import { useObservability } from "@/lib/hooks/useIngestionOps";
import {
  useAnalyticsWarehouse,
  useInFlightIngestionJobs,
  usePipelineAttention,
} from "@/lib/hooks/useIngestionReview";

function TabLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-8 items-center gap-1 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {label}
      <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

export function IngestionMetricsTab() {
  const observability = useObservability();
  const runningJobs = useInFlightIngestionJobs();
  const pipelineAttention = usePipelineAttention("all");
  const warehouse = useAnalyticsWarehouse("in_warehouse");

  const isLoading =
    observability.isLoading ||
    runningJobs.isLoading ||
    pipelineAttention.isLoading ||
    warehouse.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const data = observability.data;
  if (!data) {
    return <EmptyState title="No observability data available" />;
  }

  const runningCount = runningJobs.data?.length ?? 0;
  const attentionCount = pipelineAttention.data?.total ?? 0;
  const warehouseSummary = warehouse.data?.summary;
  const pendingIndicatorAliases = data.reviewQueueAge.pendingAliases;
  const pendingOrgunitAliases = data.reviewQueueAge.pendingOrgunitAliases;
  const pendingAliasesTotal =
    pendingIndicatorAliases + pendingOrgunitAliases;

  return (
    <div className="space-y-4">
      <Panel
        title="Pipeline"
        titleTip={METRICS_PANEL_TIPS.pipeline}
        description="Canonicalization jobs — workbook parsing into staging."
        icon={GitBranch}
        tone="info"
        action={<TabLink href="/ingestion-ops?tab=pipeline" label="Open Pipeline" />}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Running now"
            value={runningCount}
            hint={
              runningCount > 0
                ? "Queued or processing on workers"
                : "Nothing in flight"
            }
            icon={Loader2}
            tone="info"
          />
          <MetricCard
            label="Needs attention"
            value={attentionCount}
            hint="Failed, stuck, or never started"
            icon={AlertTriangle}
            tone={attentionCount > 0 ? "destructive" : "muted"}
          />
          <MetricCard
            label="Staging rows"
            value={data.stagingTotal.toLocaleString()}
            hint={`${data.indicatorPending.toLocaleString()} indicator holds`}
            tip={METRICS_CARD_TIPS.staging_rows}
            icon={Database}
            tone="primary"
          />
          <MetricCard
            label="Auto-resolution"
            value={`${Math.round(data.autoResolutionRate * 100)}%`}
            hint={`Target >${Math.round(data.targets.month1AutoResolution * 100)}% (M1)`}
            tip={METRICS_CARD_TIPS.auto_resolution}
            icon={Zap}
            tone="success"
          />
        </div>
      </Panel>

      <Panel
        title="Analytics warehouse"
        titleTip={METRICS_PANEL_TIPS.warehouse}
        description="Resolved staging loaded into disease_burden for public analytics."
        icon={Database}
        tone="success"
        action={<TabLink href="/ingestion-ops?tab=warehouse" label="Open Warehouse" />}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="In warehouse"
            value={warehouseSummary?.inWarehouse ?? 0}
            icon={Database}
            tone="success"
          />
          <MetricCard
            label="Ready to load"
            value={warehouseSummary?.readyToLoad ?? 0}
            icon={Activity}
            tone="warning"
          />
          <MetricCard
            label="Loading now"
            value={warehouseSummary?.loading ?? 0}
            icon={Loader2}
            tone="info"
          />
          <MetricCard
            label="Failed loads"
            value={warehouseSummary?.failed ?? 0}
            icon={AlertTriangle}
            tone={
              (warehouseSummary?.failed ?? 0) > 0 ? "destructive" : "muted"
            }
          />
        </div>
      </Panel>

      <Panel
        title="Review & quality"
        titleTip={METRICS_PANEL_TIPS.review}
        description="Alias backlog, queue latency, and cross-dataset conflicts."
        icon={Link2}
        tone="warning"
        action={<TabLink href="/ingestion-ops?tab=aliases" label="Open Aliases" />}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Pending aliases"
            value={pendingAliasesTotal}
            hint={`${pendingIndicatorAliases} indicator · ${pendingOrgunitAliases} org-unit`}
            icon={Link2}
            tone={pendingAliasesTotal > 0 ? "warning" : "muted"}
          />
          <MetricCard
            label="Review queue p50"
            value={`${Math.round(data.reviewQueueAge.p50Seconds)}s`}
            hint={`p95 ${Math.round(data.reviewQueueAge.p95Seconds)}s`}
            tip={METRICS_CARD_TIPS.review_queue_p50}
            icon={Clock}
            tone="muted"
          />
          <MetricCard
            label="Open conflicts"
            value={data.openConflictsTotal}
            hint={
              data.openConflictsTotal > 0
                ? "Distinct keys — charts keep stored values until you pick in Conflicts"
                : "No stored vs upload disagreements"
            }
            tip={METRICS_CARD_TIPS.open_conflicts}
            icon={AlertTriangle}
            tone={data.openConflictsTotal > 0 ? "destructive" : "muted"}
          />
          <MetricCard
            label="Resolution target"
            value={`>${Math.round(data.targets.month3AutoResolution * 100)}%`}
            hint={`Month 1 >${Math.round(data.targets.month1AutoResolution * 100)}%`}
            tip={METRICS_CARD_TIPS.resolution_target}
            icon={TrendingUp}
            tone="primary"
          />
        </div>

        {data.conflictsPerDataset.length > 0 ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Top conflict datasets</h3>
              <Link
                href="/ingestion-ops?tab=conflicts"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Open conflicts queue
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dataset</TableHead>
                    <TableHead className="text-right">Open conflicts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.conflictsPerDataset.map((row) => (
                    <TableRow key={row.datasetId}>
                      <TableCell>
                        <Link
                          href={`/ingestion-ops?tab=conflicts&datasetBId=${row.datasetId}`}
                          className="font-medium hover:underline"
                        >
                          {row.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.conflicts}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableShell>
          </div>
        ) : null}
      </Panel>

      <Panel
        title="AI usage (30 days)"
        titleTip={METRICS_PANEL_TIPS.ai}
        description="Canonicalization assist calls, cache efficiency, and spend."
        icon={Sparkles}
        tone="destructive"
        action={<TabLink href="/ingestion-ops?tab=ai-spend" label="Open AI spend" />}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard
            label="API calls"
            value={data.ai.calls30d.toLocaleString()}
            icon={Sparkles}
            tone="primary"
          />
          <MetricCard
            label="Cache hit rate"
            value={`${Math.round(data.ai.cacheHitRate * 100)}%`}
            tip={METRICS_CARD_TIPS.cache_hit_rate}
            icon={Zap}
            tone="success"
          />
          <MetricCard
            label="Spend"
            value={`$${data.ai.spendUsd30d.toFixed(2)}`}
            icon={BarChart3}
            tone="warning"
          />
        </div>
      </Panel>

      {data.speciesDistribution.length > 0 ? (
        <Panel
          title="Species distribution"
          titleTip={METRICS_PANEL_TIPS.species}
          description="Workbook layout types seen during ingestion."
          icon={BarChart3}
          tone="info"
        >
          <SpeciesDistributionChart data={data.speciesDistribution} />
        </Panel>
      ) : null}
    </div>
  );
}
