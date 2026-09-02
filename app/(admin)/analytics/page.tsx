"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Clock,
  Database,
  Download,
  Layers,
  ShieldAlert,
  Tags,
  TrendingUp,
  Upload,
  Users,
  RotateCcw,
} from "lucide-react";
import { useAdminAnalytics, downloadAnalyticsCsv, useRefreshAnalyticsCache } from "@/lib/hooks/useAnalytics";
import { useDashboardActivity } from "@/lib/hooks/useDashboard";
import {
  useDatasetPipelineStats,
  useGovernanceAnalytics,
} from "@/lib/hooks/useGovernance";
import {
  UploadsOverTimeChart,
  DownloadsByDatasetChart,
  NewUsersOverTimeChart,
} from "@/components/charts/analytics-charts";
import { ActivityGraph } from "@/components/charts/activity-graph";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeaderSkeleton } from "@/components/feedback/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataTableShell,
  MetricCard,
  Panel,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import { HelpTip } from "@/components/admin/help-tip";
import {
  ANALYTICS_EXPORT_TIP,
  ANALYTICS_METRIC_TIPS,
  ANALYTICS_PAGE_TIP,
  ANALYTICS_PANEL_TIPS,
  ANALYTICS_RANGE_TIP,
  ANALYTICS_REFRESH_TIP,
} from "@/lib/constants/analytics-tooltips";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const RANGE_TO_MONTHS: Record<string, number> = {
  "1m": 1,
  "3m": 3,
  "6m": 6,
  "1y": 12,
};

const RANGE_LABEL: Record<string, string> = {
  "1m": "last month",
  "3m": "last 3 months",
  "6m": "last 6 months",
  "1y": "last year",
};

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

function sumUploads(data: Array<{ uploads: number }> | undefined) {
  return data?.reduce((total, row) => total + row.uploads, 0) ?? 0;
}

function sumUsers(data: Array<{ users: number }> | undefined) {
  return data?.reduce((total, row) => total + row.users, 0) ?? 0;
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState("6m");
  const [exporting, setExporting] = useState(false);
  const months = RANGE_TO_MONTHS[range] ?? 6;
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const { can } = useAdminAccess();
  const canRefresh = can("manage:analytics");

  const analytics = useAdminAnalytics(months);
  const activity = useDashboardActivity();
  const pipeline = useDatasetPipelineStats();
  const governance = useGovernanceAnalytics({ enabled: isSuperAdmin });
  const refreshCache = useRefreshAnalyticsCache();

  const loading =
    analytics.isLoading ||
    activity.isLoading ||
    pipeline.isLoading ||
    (isSuperAdmin && governance.isLoading);

  const data = analytics.data;
  const stats = pipeline.data;
  const gov = governance.data;

  const uploadsInPeriod = useMemo(
    () => sumUploads(data?.uploadsOverTime),
    [data?.uploadsOverTime],
  );
  const newUsersInPeriod = useMemo(
    () => sumUsers(data?.newUsersOverTime),
    [data?.newUsersOverTime],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadAnalyticsCsv(months);
      toast.success("Analytics exported successfully");
    } catch {
      toast.error("Failed to export analytics");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const popularChartData = (data?.popularDatasets ?? []).map((d) => ({
    name: d.title.length > 28 ? `${d.title.slice(0, 28)}…` : d.title,
    fullName: d.title,
    downloads: d.downloads,
  }));

  return (
    <TooltipProvider delay={200}>
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            Analytics & Reports
            <HelpTip content={ANALYTICS_PAGE_TIP} label="About analytics and reports" />
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Platform growth, catalogue usage, partner contributions, and ingestion health —
            scoped to the {RANGE_LABEL[range] ?? "selected period"} where noted.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Select value={range} onValueChange={(v) => v && setRange(v)}>
              <SelectTrigger className="w-36" aria-label="Analytics date range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Last month</SelectItem>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <HelpTip content={ANALYTICS_RANGE_TIP} label="About date range" />
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              <Download className="size-4" />
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
            <HelpTip content={ANALYTICS_EXPORT_TIP} label="About export CSV" />
          </div>
          {canRefresh ? (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                onClick={() =>
                  refreshCache.mutate(undefined, {
                    onSuccess: () => toast.success("Analytics cache refreshed"),
                    onError: () => toast.error("Failed to refresh analytics cache"),
                  })
                }
                disabled={refreshCache.isPending}
              >
                <RotateCcw className={cn("size-4", refreshCache.isPending && "animate-spin")} />
                {refreshCache.isPending ? "Refreshing…" : "Refresh cache"}
              </Button>
              <HelpTip content={ANALYTICS_REFRESH_TIP} label="About refresh cache" />
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total users"
          value={data?.headline.totalUsers ?? 0}
          hint="Registered accounts"
          tip={ANALYTICS_METRIC_TIPS.totalUsers}
          icon={Users}
          tone="primary"
        />
        <MetricCard
          label="Total datasets"
          value={data?.headline.totalDatasets ?? 0}
          hint="All statuses"
          tip={ANALYTICS_METRIC_TIPS.totalDatasets}
          icon={Database}
          tone="info"
        />
        <MetricCard
          label="Total downloads"
          value={(data?.headline.totalDownloads ?? 0).toLocaleString()}
          hint="All-time catalogue downloads"
          tip={ANALYTICS_METRIC_TIPS.totalDownloads}
          icon={Download}
          tone="success"
        />
        <MetricCard
          label="Downloads this month"
          value={(data?.headline.downloadsThisMonth ?? 0).toLocaleString()}
          hint="Current calendar month"
          tip={ANALYTICS_METRIC_TIPS.downloadsThisMonth}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pending review"
          value={data?.headline.pendingReview ?? 0}
          hint="Awaiting approval"
          tip={ANALYTICS_METRIC_TIPS.pendingReview}
          icon={Clock}
          tone="warning"
        />
        <MetricCard
          label={`Uploads (${RANGE_LABEL[range]})`}
          value={uploadsInPeriod}
          hint="New datasets created in range"
          tip={ANALYTICS_METRIC_TIPS.uploadsInRange}
          icon={Upload}
          tone="info"
        />
        <MetricCard
          label={`New users (${RANGE_LABEL[range]})`}
          value={newUsersInPeriod}
          hint="Accounts created in range"
          tip={ANALYTICS_METRIC_TIPS.newUsersInRange}
          icon={Users}
          tone="primary"
        />
        {isSuperAdmin ? (
          <MetricCard
            label="Datasets with conflicts"
            value={gov?.datasetsWithOpenConflicts ?? 0}
            hint={
              (gov?.openConflicts ?? 0) > 0
                ? `${(gov?.openConflicts ?? 0).toLocaleString()} clashing keys (Stored vs Upload)`
                : "No stored vs upload disagreements"
            }
            tip={ANALYTICS_METRIC_TIPS.openConflicts}
            icon={ShieldAlert}
            tone={(gov?.datasetsWithOpenConflicts ?? 0) > 0 ? "destructive" : "muted"}
          />
        ) : null}
      </div>

      <Panel
        title="Daily platform activity"
        titleTip={ANALYTICS_PANEL_TIPS.dailyActivity}
        description="Dataset views and downloads over the last 7 or 30 days."
        icon={BarChart3}
        tone="primary"
      >
        <ActivityGraph
          data7d={activity.data?.data7d ?? []}
          data30d={activity.data?.data30d ?? []}
        />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Uploads over time"
          titleTip={ANALYTICS_PANEL_TIPS.uploadsOverTime}
          description={`Monthly dataset creations — ${RANGE_LABEL[range]}.`}
          icon={Upload}
          tone="info"
        >
          <UploadsOverTimeChart data={data?.uploadsOverTime ?? []} />
        </Panel>
        <Panel
          title="New users over time"
          titleTip={ANALYTICS_PANEL_TIPS.newUsersOverTime}
          description={`Monthly account registrations — ${RANGE_LABEL[range]}.`}
          icon={Users}
          tone="primary"
        >
          <NewUsersOverTimeChart data={data?.newUsersOverTime ?? []} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Panel
          title="Top downloads by dataset"
          titleTip={ANALYTICS_PANEL_TIPS.topDownloads}
          description="Most downloaded catalogue entries (all time)."
          icon={Download}
          tone="success"
        >
          <DownloadsByDatasetChart
            data={popularChartData.map((d) => ({
              name: d.name,
              downloads: d.downloads,
            }))}
          />
        </Panel>

        <Panel
          title="Download leaderboard"
          titleTip={ANALYTICS_PANEL_TIPS.downloadLeaderboard}
          description="Ranked list with exact counts."
          icon={TrendingUp}
          tone="success"
        >
          {(data?.popularDatasets ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No downloads recorded yet.</p>
          ) : (
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Dataset</TableHead>
                    <TableHead className="text-right">Downloads</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.popularDatasets ?? []).map((row, index) => (
                    <TableRow key={row.datasetId}>
                      <TableCell>
                        <Badge variant="outline" className="tabular-nums">
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-medium" title={row.title}>
                        {row.title}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.downloads.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableShell>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Datasets by organisation"
          titleTip={ANALYTICS_PANEL_TIPS.byOrganisation}
          description="Partner and agency contributions to the catalogue."
          icon={Building2}
          tone="info"
        >
          {(stats?.byOrganisation ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No organisation data yet.</p>
          ) : (
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead className="text-right">Datasets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats?.byOrganisation ?? []).map((row) => (
                    <TableRow key={row.orgId}>
                      <TableCell className="font-medium">{row.orgName}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableShell>
          )}
        </Panel>

        <Panel
          title="Datasets by category"
          titleTip={ANALYTICS_PANEL_TIPS.byCategory}
          description="Catalogue spread across health domains."
          icon={Tags}
          tone="warning"
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Pipeline by status"
          titleTip={ANALYTICS_PANEL_TIPS.pipelineByStatus}
          description="Where datasets sit in the review workflow."
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
          title="Published freshness"
          titleTip={ANALYTICS_PANEL_TIPS.publishedFreshness}
          description="Update schedule health for live catalogue entries."
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
            {isSuperAdmin ? (
              <>
                <StatRow
                  label="Auto-resolution rate"
                  value={`${Math.round((gov?.aliasResolution.autoResolutionRate ?? 0) * 100)}%`}
                  tone={
                    (gov?.aliasResolution.autoResolutionRate ?? 0) >= 0.8
                      ? "success"
                      : "warning"
                  }
                />
                <StatRow
                  label="Pending indicator aliases"
                  value={gov?.aliasResolution.pendingIndicatorAliases ?? 0}
                />
              </>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
    </TooltipProvider>
  );
}
