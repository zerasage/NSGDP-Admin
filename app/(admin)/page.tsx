"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { getPlatformKPIs, getReviewQueue, getActivityFeed, getSystemHealth } from "@/lib/mock";
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
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<Awaited<ReturnType<typeof getPlatformKPIs>> | null>(null);
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof getReviewQueue>>>([]);
  const [activity, setActivity] = useState<Awaited<ReturnType<typeof getActivityFeed>>>([]);
  const [health, setHealth] = useState<Awaited<ReturnType<typeof getSystemHealth>> | null>(null);

  useEffect(() => {
    Promise.all([getPlatformKPIs(), getReviewQueue(), getActivityFeed(), getSystemHealth()]).then(
      ([k, q, a, h]) => {
        setKpis(k);
        setQueue(q.slice(0, 5));
        setActivity(a);
        setHealth(h);
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const healthIcon = (status: string) =>
    status === "healthy" ? (
      <CheckCircle2 className="size-4 text-success" />
    ) : (
      <AlertTriangle className="size-4 text-warning" />
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and pending actions</p>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Published Datasets", value: kpis?.totalDatasets, icon: Database },
          { label: "Pending Review", value: kpis?.pendingReview, icon: FileCheck },
          { label: "Registered Users", value: kpis?.totalUsers, icon: Users },
          { label: "Total Downloads", value: kpis?.totalDownloads?.toLocaleString(), icon: Download },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{value}</p>
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
            <CardTitle className="text-base">Review Queue Preview</CardTitle>
            <Link href="/admin/datasets" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending submissions</p>
            ) : (
              <div className="space-y-3">
                {queue.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <Link href={`/admin/datasets/${d.id}/review`} className="font-medium hover:text-primary truncate block">
                        {d.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">{d.organisation.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <AgeBadge submittedAt={d.updatedAt} />
                      <StatusBadge status={d.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="size-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {activity.slice(0, 5).map((item) => (
                <li key={item.id} className="text-sm">
                  <p>{item.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.userName && `${item.userName} · `}
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityGraph
            data7d={generateActivityData(7)}
            data30d={generateActivityData(30)}
          />
        </CardContent>
      </Card>

      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(health).map(([key, status]) => (
                <div key={key} className="flex items-center gap-2 rounded-lg border p-3 text-sm capitalize">
                  {healthIcon(status)}
                  <span className="font-medium">{key}</span>
                  <span className="ml-auto text-muted-foreground">{status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
