"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Database,
  FileCheck,
  Users,
  Download,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  BarChart3,
  Upload,
  Building2,
} from "lucide-react";
import { useDashboardStats } from "@/lib/hooks/useDashboard";
import { ActivityGraph } from "@/components/charts/activity-graph";
import { generateActivityData } from "@/lib/mock/activity";
import { AgeBadge } from "@/components/data/age-badge";
import { StatusBadge } from "@/components/data/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PageHeaderSkeleton } from "@/components/feedback/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and key metrics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Public Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Leave the admin console to view the public-facing data portal.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/", label: "Portal Home", icon: ExternalLink },
              { href: "/dataportal", label: "Browse Datasets", icon: Database },
              { href: "/analytics", label: "Health Analytics", icon: BarChart3 },
              { href: "/submit", label: "Submit Dataset", icon: Upload },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1.5"
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Users", value: stats?.totalUsers, icon: Users },
          { label: "Organisations", value: stats?.totalOrganisations, icon: Building2 },
          { label: "Total Datasets", value: stats?.totalDatasets, icon: Database },
          { label: "Pending Review", value: stats?.pendingDatasets, icon: FileCheck },
          { label: "Total Downloads", value: stats?.totalDownloads?.toLocaleString(), icon: Download },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <ul className="space-y-3">
                {stats.recentActivity.slice(0, 5).map((item) => (
                  <li key={item.id} className="text-sm">
                    <p className="font-medium">{item.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.userName} · {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Downloaded Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.downloadStats.topDatasets || stats.downloadStats.topDatasets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No download data available</p>
            ) : (
              <ul className="space-y-3">
                {stats.downloadStats.topDatasets.slice(0, 5).map((item) => (
                  <li key={item.datasetId} className="text-sm flex justify-between items-center">
                    <span className="truncate flex-1 font-medium">{item.datasetTitle}</span>
                    <span className="text-muted-foreground ml-2">{item.downloads.toLocaleString()} downloads</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Activity (Mock Data)</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityGraph
            data7d={generateActivityData(7)}
            data30d={generateActivityData(30)}
          />
          <p className="text-xs text-muted-foreground mt-4">
            Note: Activity graph uses mock data. Real-time activity tracking will be added in a future update.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datasets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.datasetStats.byStatus && Object.entries(stats.datasetStats.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center text-sm">
                  <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span>Total Uploads</span>
                <span className="font-medium">{stats?.uploadStats.total ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>This Month</span>
                <span className="font-medium">{stats?.uploadStats.thisMonth ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>This Week</span>
                <span className="font-medium">{stats?.uploadStats.thisWeek ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
