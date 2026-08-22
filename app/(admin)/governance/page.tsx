"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  useDatasetPipelineStats,
  useGovernanceAnalytics,
} from "@/lib/hooks/useGovernance";

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
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const stats = pipeline.data;
  const gov = governance.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Data Governance</h1>
        <p className="mt-1 text-muted-foreground">
          Dataset pipeline health, staleness, and ingestion quality metrics
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total datasets", stats?.total ?? 0],
          ["Pending review", stats?.pending ?? 0],
          ["Overdue updates", stats?.staleness.overdue ?? 0],
          ["Open conflicts", gov?.openConflicts ?? 0],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datasets by status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(stats?.byStatus ?? {}).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className="capitalize text-muted-foreground">
                  {status.replace(/_/g, " ")}
                </span>
                <span className="font-medium tabular-nums">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Published dataset freshness</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Published total", stats?.staleness.publishedTotal],
              ["Overdue", stats?.staleness.overdue],
              ["Due within 7 days", stats?.staleness.dueSoon],
              ["No update schedule", stats?.staleness.noSchedule],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{value ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By category</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <TableCell>{row.categoryName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ingestion quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auto-resolution rate</span>
              <span className="font-medium">
                {Math.round((gov?.aliasResolution.autoResolutionRate ?? 0) * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending indicator aliases</span>
              <span className="font-medium tabular-nums">
                {gov?.aliasResolution.pendingIndicatorAliases ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending org-unit aliases</span>
              <span className="font-medium tabular-nums">
                {gov?.aliasResolution.pendingOrgunitAliases ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Staging rows</span>
              <span className="font-medium tabular-nums">{gov?.stagingTotal ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Missing burden rows by indicator</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Indicator</TableHead>
                <TableHead className="text-right">Missing %</TableHead>
                <TableHead className="text-right">Rows</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(gov?.burdenQuality ?? []).map((row) => (
                <TableRow key={row.indicatorSlug}>
                  <TableCell>{row.indicatorName}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.missingPct}%
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.totalRows.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
