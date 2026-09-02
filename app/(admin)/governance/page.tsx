"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Database,
  Layers,
  Lock,
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
import { HelpTip } from "@/components/admin/help-tip";
import {
  GOVERNANCE_METRIC_TIPS,
  GOVERNANCE_PAGE_TIP,
  GOVERNANCE_PANEL_TIPS,
} from "@/lib/constants/governance-tooltips";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
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
  const { user } = useAuth();
  const pipeline = useDatasetPipelineStats();
  const governance = useGovernanceAnalytics();
  const loading = pipeline.isLoading || governance.isLoading;

  if (user?.role !== "super_admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="Data governance metrics are super-admin only — they expose platform-wide pipeline health and conflict data."
        />
      </div>
    );
  }

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
    <TooltipProvider delay={200}>
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          Data Governance
          <HelpTip content={GOVERNANCE_PAGE_TIP} label="About data governance" />
        </h1>
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
          tip={GOVERNANCE_METRIC_TIPS.total}
        />
        <MetricCard
          label="Pending review"
          value={stats?.pending ?? 0}
          hint="Awaiting approval or publish"
          icon={Clock}
          tone="warning"
          tip={GOVERNANCE_METRIC_TIPS.pending}
        />
        <MetricCard
          label="Overdue updates"
          value={stats?.staleness.overdue ?? 0}
          hint="Published datasets past their schedule"
          icon={AlertTriangle}
          tone="destructive"
          tip={GOVERNANCE_METRIC_TIPS.overdue}
        />
        <MetricCard
          label="Datasets with conflicts"
          value={gov?.datasetsWithOpenConflicts ?? 0}
          hint={
            (gov?.openConflicts ?? 0) > 0
              ? `${(gov?.openConflicts ?? 0).toLocaleString()} clashing keys`
              : "No stored vs upload disagreements"
          }
          icon={ShieldAlert}
          tone={(gov?.datasetsWithOpenConflicts ?? 0) > 0 ? "destructive" : "info"}
          tip={GOVERNANCE_METRIC_TIPS.conflicts}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Datasets by status"
          description="Current pipeline distribution."
          icon={Layers}
          tone="primary"
          titleTip={GOVERNANCE_PANEL_TIPS.byStatus}
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
          titleTip={GOVERNANCE_PANEL_TIPS.freshness}
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
          titleTip={GOVERNANCE_PANEL_TIPS.byCategory}
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
          titleTip={GOVERNANCE_PANEL_TIPS.ingestionQuality}
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
        titleTip={GOVERNANCE_PANEL_TIPS.burdenQuality}
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
    </TooltipProvider>
  );
}
