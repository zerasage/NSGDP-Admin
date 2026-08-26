"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Database,
  Layers,
  ShieldAlert,
  Sparkles,
  Tags,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeaderSkeleton } from "@/components/feedback/skeletons";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  DataTableShell,
  MetricCard,
  Panel,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import {
  useDatasetPipelineStats,
  useGovernanceAnalytics,
} from "@/lib/hooks/useGovernance";
import { cn } from "@/lib/utils";

function StatRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: MetricTone;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "destructive" && "text-destructive",
          tone === "warning" && "text-amber-700 dark:text-warning",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function missingPctTone(pct: number): MetricTone {
  if (pct >= 25) return "destructive";
  if (pct >= 10) return "warning";
  if (pct > 0) return "info";
  return "success";
}

export default function GovernancePage() {
  const pipeline = useDatasetPipelineStats();
  const governance = useGovernanceAnalytics();
  const loading = pipeline.isLoading || governance.isLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = pipeline.data;
  const gov = governance.data;
  const autoResolutionPct = Math.round((gov?.aliasResolution.autoResolutionRate ?? 0) * 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Governance</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Dataset pipeline health, update freshness, alias resolution, and burden-data completeness
          across published indicators.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total datasets"
          value={stats?.total ?? 0}
          hint="All statuses across the platform"
          icon={Database}
          tone="primary"
        />
        <MetricCard
          label="Pending review"
          value={stats?.pending ?? 0}
          hint="Awaiting approval or publish"
          icon={Clock}
          tone="warning"
        />
        <MetricCard
          label="Overdue updates"
          value={stats?.staleness.overdue ?? 0}
          hint="Published datasets past their schedule"
          icon={AlertTriangle}
          tone="destructive"
        />
        <MetricCard
          label="Open conflicts"
          value={gov?.openConflicts ?? 0}
          hint="Observation conflicts needing resolution"
          icon={ShieldAlert}
          tone="info"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Datasets by status"
          description="Current pipeline distribution."
          icon={Layers}
          tone="primary"
        >
          <div className="space-y-2">
            {Object.entries(stats?.byStatus ?? {}).length === 0 ? (
              <p className="text-sm text-muted-foreground">No datasets yet.</p>
            ) : (
              Object.entries(stats?.byStatus ?? {}).map(([status, count]) => (
                <StatRow
                  key={status}
                  label={status.replace(/_/g, " ")}
                  value={count}
                />
              ))
            )}
          </div>
        </Panel>

        <Panel
          title="Published dataset freshness"
          description="How current published catalogue entries are."
          icon={Clock}
          tone="warning"
        >
          <div className="space-y-2">
            <StatRow label="Published total" value={stats?.staleness.publishedTotal ?? 0} />
            <StatRow
              label="Overdue"
              value={stats?.staleness.overdue ?? 0}
              tone="destructive"
            />
            <StatRow
              label="Due within 7 days"
              value={stats?.staleness.dueSoon ?? 0}
              tone="warning"
            />
            <StatRow label="No update schedule" value={stats?.staleness.noSchedule ?? 0} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="By category"
          description="Dataset counts grouped by catalogue category."
          icon={Tags}
          tone="info"
        >
          {(stats?.byCategory ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories with datasets yet.</p>
          ) : (
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats?.byCategory ?? []).map((row) => (
                    <TableRow key={row.categoryId ?? row.categoryName}>
                      <TableCell className="font-medium">{row.categoryName}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableShell>
          )}
        </Panel>

        <Panel
          title="Ingestion quality"
          description="Alias resolution and staging backlog."
          icon={Sparkles}
          tone="success"
        >
          <div className="space-y-2">
            <StatRow
              label="Auto-resolution rate"
              value={`${autoResolutionPct}%`}
              tone={autoResolutionPct >= 80 ? "success" : autoResolutionPct >= 50 ? "warning" : "destructive"}
            />
            <StatRow
              label="Pending indicator aliases"
              value={gov?.aliasResolution.pendingIndicatorAliases ?? 0}
            />
            <StatRow
              label="Pending org-unit aliases"
              value={gov?.aliasResolution.pendingOrgunitAliases ?? 0}
            />
            <StatRow label="Confirmed indicator aliases" value={gov?.aliasResolution.confirmedIndicatorAliases ?? 0} />
            <StatRow label="Staging rows" value={gov?.stagingTotal ?? 0} />
          </div>
        </Panel>
      </div>

      <Panel
        title="Missing burden rows by indicator"
        description="Share of ingested disease-burden observations marked missing — gaps where source files had no reported value for that LGA, ward, or period."
        icon={BarChart3}
        tone="destructive"
      >
        {(gov?.burdenQuality ?? []).length === 0 ? (
          <EmptyState
            title="No burden data yet"
            description="Once datasets are ingested and published to the indicator warehouse, completeness metrics appear here."
          />
        ) : (
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicator</TableHead>
                  <TableHead className="text-right">Missing %</TableHead>
                  <TableHead className="text-right">Total rows</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(gov?.burdenQuality ?? []).map((row) => {
                  const tone = missingPctTone(row.missingPct);
                  return (
                    <TableRow key={row.indicatorSlug}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{row.indicatorName}</p>
                          <p className="truncate text-xs text-muted-foreground">{row.indicatorSlug}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "tabular-nums",
                            tone === "destructive" && "border-destructive/30 bg-destructive/10 text-destructive",
                            tone === "warning" && "border-warning/30 bg-warning/10 text-amber-800 dark:text-warning",
                            tone === "info" && "border-info/30 bg-info/10 text-info",
                            tone === "success" && "border-success/30 bg-success/10 text-success",
                          )}
                        >
                          {row.missingPct}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.totalRows.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataTableShell>
        )}
      </Panel>
    </div>
  );
}
