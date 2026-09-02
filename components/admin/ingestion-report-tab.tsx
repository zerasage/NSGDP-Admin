"use client";

import { Sparkles, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";
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
  DataTableShell,
  MetricCard,
  Panel,
} from "@/components/admin/admin-analytics-ui";
import {
  useIngestionReport,
  useCoverageRegister,
  useNarrateIngestion,
} from "@/lib/hooks/useIngestionReview";
import { IngestionFitnessPanel } from "@/components/admin/ingestion-fitness-panel";
import { INGESTION_REPORT_TIPS } from "@/lib/constants/dataset-tooltips";
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

  const autoRate =
    report.stagingTotal > 0
      ? `${Math.round((report.resolved / report.stagingTotal) * 100)}%`
      : "—";

  const handleNarrate = () => {
    narrateMutation.mutate(datasetId, {
      onError: (error: unknown) =>
        toast.error(error instanceof Error ? error.message : "Failed to generate summary"),
    });
  };

  return (
    <div className="space-y-4">
      <IngestionFitnessPanel fitness={report.fitness} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Staging rows" value={report.stagingTotal} tip={INGESTION_REPORT_TIPS.staging_rows} icon={FileSpreadsheet} tone="info" />
        <MetricCard label="Resolved" value={report.resolved} tip={INGESTION_REPORT_TIPS.resolved} icon={CheckCircle2} tone="success" />
        <MetricCard label="Flagged" value={report.flagged} tip={INGESTION_REPORT_TIPS.flagged} icon={AlertTriangle} tone="warning" />
        <MetricCard label="Auto-resolution" value={autoRate} tip={INGESTION_REPORT_TIPS.auto_resolution} icon={Sparkles} tone="primary" />
      </div>

      {Object.keys(report.byHoldReason).length > 0 && (
        <Panel title="Held for review, by reason" titleTip={INGESTION_REPORT_TIPS.held_for_review} icon={AlertTriangle} tone="warning">
          <div className="flex flex-wrap gap-2">
            {Object.entries(report.byHoldReason).map(([reason, count]) => (
              <Badge key={reason} variant="outline" className="border-warning/30 bg-warning/10">
                {reason}: {count}
              </Badge>
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title="Per-sheet coverage"
        titleTip={INGESTION_REPORT_TIPS.per_sheet_coverage}
        icon={FileSpreadsheet}
        tone="info"
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={handleNarrate}
            disabled={narrateMutation.isPending}
          >
            <Sparkles className="size-4" />
            Generate Summary
          </Button>
        }
      >
        {!coverage || coverage.length === 0 ? (
          <EmptyState title="No sheets processed yet" />
        ) : (
          <DataTableShell>
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
          </DataTableShell>
        )}
      </Panel>

      {narrateMutation.data && (
        <Panel title="AI Summary" titleTip={INGESTION_REPORT_TIPS.ai_summary} icon={Sparkles} tone="primary" className="border-primary/30">
          <p className="text-sm leading-6">{narrateMutation.data.summary}</p>
        </Panel>
      )}
    </div>
  );
}
