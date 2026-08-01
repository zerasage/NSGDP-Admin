"use client";

import Link from "next/link";
import {
  Database,
  FileCheck,
  Users,
  Download,
  AlertTriangle,
  Building2,
  Megaphone,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useDashboardStats, useDashboardActivity } from "@/lib/hooks/useDashboard";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { getAdminNotificationHref } from "@/lib/api/notifications";
import { ActivityGraph } from "@/components/charts/activity-graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeaderSkeleton } from "@/components/feedback/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

function getActivityIcon(type: string) {
  if (type.includes("rejected") || type.includes("suspended")) return AlertTriangle;
  if (type === "system_announcement") return Megaphone;
  if (type.includes("organisation")) return Building2;
  if (type.includes("user") || type.includes("account") || type.includes("admin")) return Users;
  if (type.includes("approved") || type.includes("published")) return FileCheck;
  return Database;
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading, isError, error, refetch, isFetching } =
    useDashboardStats();
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
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platform overview and key metrics</p>
        </div>
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Unable to load dashboard statistics</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error instanceof Error ? error.message : "The dashboard API request failed."}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              {isFetching ? "Retrying..." : "Retry"}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const topDatasets = stats?.downloadStats?.topDatasets?.slice(0, 5) ?? [];
  const maxDownloads = Math.max(...topDatasets.map((item) => item.downloads), 1);
  const statusEntries = Object.entries(stats?.datasetStats?.byStatus ?? {});
  const totalStatuses = Math.max(
    statusEntries.reduce((total, [, count]) => total + count, 0),
    1
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform overview and key metrics</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="md:col-span-2 xl:row-span-2">
          <CardContent className="h-full">
            <div className="flex min-h-[188px] h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Data catalogue
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">Total datasets on the platform</p>
                </div>
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <Database className="size-7 text-primary" aria-hidden="true" />
                </div>
              </div>
              <div>
                <p className="text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
                  {stats?.totalDatasets ?? '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {[
          { label: "Total Users", value: stats?.totalUsers, icon: Users },
          { label: "Organisations", value: stats?.totalOrganisations, icon: Building2 },
          { label: "Pending Review", value: stats?.pendingDatasets, icon: FileCheck },
          { label: "Total Downloads", value: stats?.totalDownloads?.toLocaleString(), icon: Download },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} size="sm">
            <CardContent>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-2 text-xl font-bold tabular-nums md:text-2xl">
                    {value ?? '—'}
                  </p>
                </div>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 md:size-10">
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Views &amp; Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            {isActivityLoading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : (
              <ActivityGraph
                data7d={activity?.data7d ?? []}
                data30d={activity?.data30d ?? []}
              />
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link href="/notifications" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {!notifications?.data || notifications.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <ul className="scrollbar-slim max-h-72 space-y-1 overflow-y-auto pr-1">
                {notifications.data.map((item) => {
                  const Icon = getActivityIcon(item.type);

                  return (
                    <li key={item.id}>
                      <Link
                        href={getAdminNotificationHref(item.link)}
                        className={`group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/70 ${
                          !item.is_read ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background transition-transform group-hover:scale-105">
                          <Icon className="size-4 text-primary" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-semibold leading-5">{item.title}</p>
                            {!item.is_read && (
                              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
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
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,1fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Top Downloaded Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            {topDatasets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No download data available</p>
            ) : (
              <ol className="space-y-4">
                {topDatasets.map((item, index) => (
                  <li key={item.datasetId} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2">
                    <span className="row-span-2 flex size-6 items-center justify-center rounded-md bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="truncate text-sm font-medium">{item.datasetTitle}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {item.downloads.toLocaleString()}
                    </span>
                    <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max((item.downloads / maxDownloads) * 100, 4)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dataset Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {statusEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No dataset statistics available</p>
            ) : (
              <div className="space-y-3">
                {statusEntries.map(([status, count]) => (
                  <div key={status}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="capitalize text-muted-foreground">{status.replace(/_/g, ' ')}</span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max((count / totalStatuses) * 100, count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 grid grid-cols-3 border-t pt-4 text-center">
              {[
                { label: "Uploads", value: stats?.uploadStats?.total ?? 0 },
                { label: "Month", value: stats?.uploadStats?.thisMonth ?? 0 },
                { label: "Week", value: stats?.uploadStats?.thisWeek ?? 0 },
              ].map(({ label, value }, index) => (
                <div key={label} className={index > 0 ? "border-l" : undefined}>
                  <p className="text-lg font-bold tabular-nums">{value}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
