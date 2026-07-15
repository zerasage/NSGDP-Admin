"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { getAdminAnalytics } from "@/lib/mock";
import {
  UploadsOverTimeChart,
  DownloadsByDatasetChart,
  NewUsersOverTimeChart,
} from "@/components/charts/analytics-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeaderSkeleton } from "@/components/feedback/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdminAnalytics>> | null>(null);
  const [range, setRange] = useState("6m");

  useEffect(() => {
    getAdminAnalytics().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <div className="grid gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-1">Platform usage and growth metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={range} onValueChange={(v) => v && setRange(v)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last month</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => toast.success("CSV export started (mock)")}>
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", value: data?.kpis.totalUsers },
          { label: "Total Datasets", value: data?.kpis.totalDatasets },
          { label: "Downloads (Month)", value: data?.kpis.downloadsThisMonth?.toLocaleString() },
          { label: "Pending Review", value: data?.kpis.pendingReview },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Uploads Over Time</CardTitle></CardHeader>
          <CardContent>
            <UploadsOverTimeChart data={data?.uploadsOverTime ?? []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">New Users Over Time</CardTitle></CardHeader>
          <CardContent>
            <NewUsersOverTimeChart data={data?.newUsersOverTime ?? []} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Top 10 Downloads by Dataset</CardTitle></CardHeader>
        <CardContent>
          <DownloadsByDatasetChart data={data?.downloadsByDataset ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
