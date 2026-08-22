"use client";

import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  useIngestionReport,
  useCoverageRegister,
  useNarrateIngestion,
} from "@/lib/hooks/useIngestionReview";
import { toast } from "sonner";

const SPECIES_LABELS: Record<string, string> = {
  F1: "Wide pivot",
  F2: "Grouped year",
  F3: "Nested period",
  F4: "Repeating block",
  F5: "Survey (Kobo/ODK)",
  F6: "Pivot output",
  F7: "Lookup sheet",
  F8: "Flat long",
  UNKNOWN: "Unrecognised",
};

export function IngestionReportTab({ datasetId }: { datasetId: string }) {
  const { data: report, isLoading: reportLoading } = useIngestionReport(datasetId);
  const { data: coverage, isLoading: coverageLoading } = useCoverageRegister(datasetId);
  const narrateMutation = useNarrateIngestion();

  if (reportLoading || coverageLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!report) {
    return <EmptyState title="No ingestion report available" />;
  }

  const handleNarrate = () => {
    narrateMutation.mutate(datasetId, {
      onError: (error: unknown) =>
        toast.error(error instanceof Error ? error.message : "Failed to generate summary"),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Staging rows", report.stagingTotal],
          ["Resolved", report.resolved],
          ["Flagged", report.flagged],
          [
            "Auto-resolution",
            report.stagingTotal > 0
              ? `${Math.round((report.resolved / report.stagingTotal) * 100)}%`
              : "—",
          ],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <CardContent className="pt-5">
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(report.byHoldReason).length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Held for review, by reason</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-4">
            {Object.entries(report.byHoldReason).map(([reason, count]) => (
              <Badge key={reason} variant="outline">
                {reason}: {count}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Per-sheet coverage</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNarrate}
              disabled={narrateMutation.isPending}
            >
              <Sparkles className="size-4" />
              Generate Summary
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!coverage || coverage.length === 0 ? (
            <EmptyState title="No sheets processed yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sheet</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Handler</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead className="text-right">Indicators</TableHead>
                  <TableHead className="text-right">Resolution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverage.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.sheet_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={row.species === "UNKNOWN" ? "destructive" : "outline"}
                        className="text-[11px]"
                      >
                        {SPECIES_LABELS[row.species] ?? row.species}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.handler ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.rows_emitted}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.distinct_indicators ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.resolution_rate != null ? `${row.resolution_rate}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {narrateMutation.data && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="border-b border-primary/20">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4" />
              AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm leading-6">{narrateMutation.data.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
