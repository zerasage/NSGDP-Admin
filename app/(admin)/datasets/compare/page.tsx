"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { useDatasets } from "@/lib/hooks/useDatasets";
import { useDatasetCompare } from "@/lib/hooks/useGovernance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function DatasetComparePage() {
  const [datasetA, setDatasetA] = useState<string>("");
  const [datasetB, setDatasetB] = useState<string>("");
  const [submitted, setSubmitted] = useState<{ a: string; b: string } | null>(
    null
  );

  const { data: listData, isLoading: listLoading } = useDatasets({
    status: "approved",
    limit: 100,
  });

  const published = useMemo(
    () =>
      (listData?.data ?? []).filter(
        (d) => d.published_at && d.status === "approved"
      ),
    [listData]
  );

  const compare = useDatasetCompare(submitted?.a, submitted?.b);

  const handleCompare = () => {
    if (!datasetA || !datasetB || datasetA === datasetB) return;
    setSubmitted({ a: datasetA, b: datasetB });
  };

  const result = compare.data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dataset Compare</h1>
        <p className="mt-1 text-muted-foreground">
          Compare two published datasets over shared disease-burden observation keys
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select datasets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {listLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
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
          )}

          <Button
            onClick={handleCompare}
            disabled={!datasetA || !datasetB || datasetA === datasetB}
          >
            <ArrowLeftRight className="size-4" />
            Compare
          </Button>

          {datasetA && datasetA === datasetB && (
            <Alert>
              <AlertDescription>Select two different datasets.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {compare.isLoading && submitted && (
        <Skeleton className="h-48 rounded-2xl" />
      )}

      {compare.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Compare failed. Both datasets must have published burden rows.
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Keys in A", result.keysA],
            ["Keys in B", result.keysB],
            ["Shared keys", result.sharedKeys],
            ["Conflicts", result.conflicts],
            [
              "Coverage overlap",
              `${Math.round(result.coverageOverlap * 100)}%`,
            ],
            [
              "Completeness A",
              result.completenessA != null
                ? `${Math.round(result.completenessA * 100)}%`
                : "—",
            ],
            [
              "Completeness B",
              result.completenessB != null
                ? `${Math.round(result.completenessB * 100)}%`
                : "—",
            ],
          ].map(([label, value]) => (
            <Card key={label as string}>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold tabular-nums">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Need ingestion context? See{" "}
        <Link href="/ingestion-ops" className="text-primary underline-offset-4 hover:underline">
          Ingestion Ops
        </Link>{" "}
        or{" "}
        <Link href="/governance" className="text-primary underline-offset-4 hover:underline">
          Data Governance
        </Link>
        .
      </p>
    </div>
  );
}
