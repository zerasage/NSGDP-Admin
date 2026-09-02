"use client";

import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  Database,
  FileCheck,
  Users,
  Download,
  AlertTriangle,
  Building2,
  Megaphone,
  RotateCcw,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDashboardStats, useDashboardActivity } from "@/lib/hooks/useDashboard";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { getAdminNotificationHref } from "@/lib/api/notifications";
import { ActivityGraph } from "@/components/charts/activity-graph";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeaderSkeleton } from "@/components/feedback/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  METRIC_TONE,
  Panel,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import { HelpTip } from "@/components/admin/help-tip";
import { DASHBOARD_DATASET_OVERVIEW_TIP, DASHBOARD_PAGE_TIP } from "@/lib/constants/dashboard-tooltips";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function getActivityIcon(type: string) {
  if (type.includes("rejected") || type.includes("suspended")) return AlertTriangle;
  if (type === "system_announcement") return Megaphone;
  if (type.includes("organisation")) return Building2;
  if (type.includes("user") || type.includes("account") || type.includes("admin")) return Users;
  if (type.includes("approved") || type.includes("published")) return FileCheck;
  return Database;
}

const STATUS_TONE: Record<string, MetricTone> = {
  pending: "warning",
  under_review: "info",
  approved: "success",
  rejected: "destructive",
  draft: "muted",
  archived: "muted",
  published: "success",
};

export default function AdminDashboardPage() {
  const { can, canAny } = useAdminAccess();
  const canReviewQueue = canAny("approve:datasets", "publish:datasets");
  const canUpload = can("create:datasets");
  const { data: stats, isLoading, isError, error, refetch, isFetching } = useDashboardStats();
  const { data: activity, isLoading: isActivityLoading } = useDashboardActivity();
  const { data: notifications } = useNotifications(1, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-[220px] rounded-2xl md:col-span-2 xl:row-span-2" />
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform overview and key metrics</p>
        </div>
        <div className="rounded-2xl border bg-card px-4 py-12 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-7" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-base font-semibold">Could not load dashboard</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "The dashboard API request failed."}
          </p>
          <Button
            variant="outline"
            className="mt-5 h-11 sm:h-8"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            {isFetching ? "Retrying…" : "Try again"}
          </Button>
        </div>
      </div>
    );
  }

  const topDatasets = stats?.downloadStats?.topDatasets?.slice(0, 5) ?? [];
  const maxDownloads = Math.max(...topDatasets.map((item) => item.downloads), 1);
  const statusEntries = Object.entries(stats?.datasetStats?.byStatus ?? {});
  const totalStatuses = Math.max(
    statusEntries.reduce((total, [, count]) => total + count, 0),
    1,
  );
  const pendingCount = stats?.pendingDatasets ?? 0;
  const heroTone = METRIC_TONE.primary;
  const statCards = [
    { label: "Total Users", value: stats?.totalUsers, icon: Users, tone: "info" as const },
    {
      label: "Organisations",
      value: stats?.totalOrganisations,
      icon: Building2,
      tone: "success" as const,
    },
    {
      label: "Pending Review",
      value: stats?.pendingDatasets,
      icon: FileCheck,
      tone: "warning" as const,
    },
    {
      label: "Total Downloads",
      value: stats?.totalDownloads?.toLocaleString(),
      icon: Download,
      tone: "primary" as const,
    },
  ] satisfies Array<{
    label: string;
    value: string | number | undefined;
    icon: LucideIcon;
    tone: MetricTone;
  }>;

  return (
    <TooltipProvider delay={200}>
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            Platform Dashboard
            <HelpTip content={DASHBOARD_PAGE_TIP} label="About the dashboard" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform overview and key metrics</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canReviewQueue && (
            <Link href="/datasets" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}>
              <FileCheck className="size-4" aria-hidden="true" />
              Review queue
              {pendingCount > 0 ? ` (${pendingCount})` : ""}
            </Link>
          )}
          <Link href="/analytics" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}>
            <BarChart3 className="size-4" aria-hidden="true" />
            Analytics
          </Link>
          {canUpload && (
            <Link href="/upload" className={cn(buttonVariants({ size: "sm" }), "h-9")}>
              <Upload className="size-4" aria-hidden="true" />
              Upload dataset
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className={cn("md:col-span-2 xl:row-span-2", heroTone.card)}>
          <CardContent className="h-full">
            <div className="flex min-h-[188px] h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Data catalogue
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Total datasets on the platform
                  </p>
                </div>
                <div
                  className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-2xl border",
                    heroTone.well,
                  )}
                >
                  <Database className={cn("size-7", heroTone.icon)} aria-hidden="true" />
                </div>
              </div>
              <div>
                <p
                  className={cn(
                    "text-4xl font-bold tracking-tight tabular-nums sm:text-5xl",
                    heroTone.value,
                  )}
                >
                  {stats?.totalDatasets ?? "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {statCards.map(({ label, value, icon: Icon, tone }) => {
          const t = METRIC_TONE[tone];
          return (
            <Card key={label} size="sm" className={t.card}>
              <CardContent>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <p className={cn("mt-2 text-xl font-bold tabular-nums md:text-2xl", t.value)}>
                      {value ?? "—"}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg border md:size-10",
                      t.well,
                    )}
                  >
                    <Icon className={cn("size-5", t.icon)} aria-hidden="true" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <Panel title="Views & downloads" description="Daily portal activity over the last 7 and 30 days." icon={BarChart3} tone="primary">
          {isActivityLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <ActivityGraph data7d={activity?.data7d ?? []} data30d={activity?.data30d ?? []} />
          )}
        </Panel>

        <Panel
          title="Recent activity"
          description="Latest notifications across the platform."
          icon={Megaphone}
          tone="info"
          action={
            <Link href="/notifications" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          }
        >
          {!notifications?.data || notifications.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            <ul className="scrollbar-slim max-h-72 space-y-1 overflow-y-auto pr-1">
              {notifications.data.map((item) => {
                const Icon = getActivityIcon(item.type);
                const t = METRIC_TONE.info;

                return (
                  <li key={item.id}>
                    <Link
                      href={getAdminNotificationHref(item.link)}
                      className={cn(
                        "group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/70",
                        !item.is_read && "bg-primary/5",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-105",
                          t.well,
                        )}
                      >
                        <Icon className={cn("size-4", t.icon)} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold leading-5">{item.title}</p>
                          {!item.is_read && (
                            <span
                              className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                              aria-label="Unread"
                            />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-muted-foreground">
                          {item.message}
                        </p>
                        <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/70">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        <Panel title="Top downloaded datasets" description="Most popular catalogue entries by download count." icon={Download} tone="success">
          {topDatasets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No download data available</p>
          ) : (
            <ol className="space-y-4">
              {topDatasets.map((item, index) => (
                <li
                  key={item.datasetId}
                  className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2"
                >
                  <span className="row-span-2 flex size-6 items-center justify-center rounded-md bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="truncate text-sm font-medium">{item.datasetTitle}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {item.downloads.toLocaleString()}
                  </span>
                  <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-success"
                      style={{ width: `${Math.max((item.downloads / maxDownloads) * 100, 4)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Dataset overview" titleTip={DASHBOARD_DATASET_OVERVIEW_TIP} description="Breakdown by workflow status and upload cadence." icon={Database} tone="info">
          {statusEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No dataset statistics available</p>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => {
                const tone = STATUS_TONE[status] ?? "primary";
                const barColor =
                  tone === "primary"
                    ? "bg-primary"
                    : tone === "success"
                      ? "bg-success"
                      : tone === "warning"
                        ? "bg-warning"
                        : tone === "destructive"
                          ? "bg-destructive"
                          : tone === "info"
                            ? "bg-info"
                            : "bg-muted-foreground";

                return (
                  <div key={status}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="capitalize text-muted-foreground">
                        {status.replace(/_/g, " ")}
                      </span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", barColor)}
                        style={{
                          width: `${Math.max((count / totalStatuses) * 100, count > 0 ? 4 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 grid grid-cols-3 border-t pt-4 text-center">
            {[
              { label: "Uploads", value: stats?.uploadStats?.total ?? 0 },
              { label: "This month", value: stats?.uploadStats?.thisMonth ?? 0 },
              { label: "This week", value: stats?.uploadStats?.thisWeek ?? 0 },
            ].map(({ label, value }, index) => (
              <div key={label} className={index > 0 ? "border-l" : undefined}>
                <p className="text-lg font-bold tabular-nums">{value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
    </TooltipProvider>
  );
}
