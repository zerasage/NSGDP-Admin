"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useAdminAnalytics, downloadAnalyticsCsv } from "@/lib/hooks/useAnalytics";
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

const RANGE_TO_MONTHS: Record<string, number> = {
  "1m": 1,
  "3m": 3,
  "6m": 6,
  "1y": 12,
};

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState("6m");
  const [exporting, setExporting] = useState(false);
  const months = RANGE_TO_MONTHS[range] ?? 6;
  const { data, isLoading: loading } = useAdminAnalytics(months);

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
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download className="size-4" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", value: data?.headline.totalUsers },
          { label: "Total Datasets", value: data?.headline.totalDatasets },
          {
            label: "Downloads (Month)",
            value: data?.headline.downloadsThisMonth?.toLocaleString(),
          },
          { label: "Pending Review", value: data?.headline.pendingReview },
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
          <DownloadsByDatasetChart
            data={(data?.popularDatasets ?? []).map((d) => ({
              name: d.title,
              downloads: d.downloads,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
