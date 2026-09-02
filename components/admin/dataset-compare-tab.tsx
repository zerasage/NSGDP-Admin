"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, BarChart3, GitCompare, Layers } from "lucide-react";
import { useDatasets } from "@/lib/hooks/useDatasets";
import { useDatasetCompare } from "@/lib/hooks/useGovernance";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MetricCard, Panel } from "@/components/admin/admin-analytics-ui";
import { COMPARE_TAB_TIP } from "@/lib/constants/ingestion-ops-tooltips";
import type { DatasetCompareMode } from "@/lib/api/admin";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function DatasetCompareTab() {
  const [datasetA, setDatasetA] = useState<string>("");
  const [datasetB, setDatasetB] = useState<string>("");
  const [rawMode, setRawMode] = useState(false);
  const [submitted, setSubmitted] = useState<{
    a: string;
    b: string;
    mode: DatasetCompareMode;
  } | null>(null);

  const { data: listData, isLoading: listLoading } = useDatasets({
    status: "approved",
    limit: 100,
  });

  const published = listData?.data ?? [];

  const compare = useDatasetCompare(submitted?.a, submitted?.b, submitted?.mode ?? "live");

  const handleCompare = () => {
    if (!datasetA || !datasetB || datasetA === datasetB) return;
    setSubmitted({ a: datasetA, b: datasetB, mode: rawMode ? "raw" : "live" });
  };

  const result = compare.data;

  return (
    <div className="space-y-4">
      <Panel
        title="Select datasets"
        titleTip={COMPARE_TAB_TIP}
        description="Compare two datasets over shared disease-burden keys. Portal view matches public charts; raw warehouse includes retracted or archived sources."
        icon={GitCompare}
        tone="info"
      >
        {listLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Dataset A
                </label>
                <Select value={datasetA} onValueChange={(v) => v && setDatasetA(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose dataset A" />
                  </SelectTrigger>
                  <SelectContent>
                    {published.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Dataset B
                </label>
                <Select value={datasetB} onValueChange={(v) => v && setDatasetB(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose dataset B" />
                  </SelectTrigger>
                  <SelectContent>
                    {published.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="compare-raw-mode"
                  checked={rawMode}
                  onCheckedChange={(checked) => setRawMode(checked === true)}
                />
                <Label htmlFor="compare-raw-mode" className="text-sm font-normal">
                  Raw warehouse rows (include inactive sources)
                </Label>
              </div>
              <Button
                onClick={handleCompare}
                disabled={!datasetA || !datasetB || datasetA === datasetB}
              >
                <ArrowLeftRight className="size-4" />
                Compare
              </Button>
            </div>

            {datasetA && datasetA === datasetB && (
              <Alert>
                <AlertDescription>Select two different datasets.</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </Panel>

      {compare.isLoading && submitted && <Skeleton className="h-48 rounded-2xl" />}

      {compare.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Compare failed. Check that both datasets exist and have burden rows
            {submitted?.mode === "live" ? " from live catalogue sources" : ""}.
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <>
          <p className="text-xs text-muted-foreground">
            View: {result.mode === "raw" ? "Raw warehouse rows" : "Portal view (live sources only)"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard label="Keys in A" value={result.keysA} icon={Layers} tone="info" />
            <MetricCard label="Keys in B" value={result.keysB} icon={Layers} tone="info" />
            <MetricCard label="Shared keys" value={result.sharedKeys} icon={GitCompare} tone="success" />
            <MetricCard label="Conflicts" value={result.conflicts} icon={BarChart3} tone="destructive" />
            <MetricCard
              label="Coverage overlap"
              value={`${Math.round(result.coverageOverlap * 100)}%`}
              icon={BarChart3}
              tone="primary"
            />
            <MetricCard
              label="Completeness A"
              value={result.completenessA != null ? `${Math.round(result.completenessA * 100)}%` : "—"}
              icon={BarChart3}
              tone="warning"
            />
            <MetricCard
              label="Completeness B"
              value={result.completenessB != null ? `${Math.round(result.completenessB * 100)}%` : "—"}
              icon={BarChart3}
              tone="warning"
            />
          </div>
        </>
      )}

      <p className="text-sm text-muted-foreground">
        Related:{" "}
        <Link
          href="/governance"
          className="text-primary underline-offset-4 hover:underline"
        >
          Data Governance
        </Link>
        .
      </p>
    </div>
  );
}
