"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Eye, FileWarning, Map } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminDatasetPreview, type DatasetPreviewResult } from "@/lib/api/dataset-preview";

export function DatasetPreviewCard({ slug }: { slug: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dataset-preview", "admin", slug],
    queryFn: () => getAdminDatasetPreview(slug),
    retry: 1,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="size-4" />
          Data Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : error || !data ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Preview unavailable for this dataset.
          </p>
        ) : (
          <PreviewBody preview={data.preview} />
        )}
      </CardContent>
    </Card>
  );
}

function PreviewBody({ preview }: { preview: DatasetPreviewResult['preview'] }) {
  if (preview.type === "tabular") {
    if (!preview.rows || preview.rows.length === 0) {
      return <p className="text-sm text-muted-foreground">{preview.message || "No rows to preview."}</p>;
    }
    return (
      <div className="space-y-2">
        <div className="overflow-x-auto rounded-lg border max-h-80">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/60">
              <tr>
                {preview.columns?.map((col) => (
                  <th key={col} className="px-3 py-2 text-left font-medium whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.rows.slice(0, 20).map((row, i) => (
                <tr key={i} className="border-t">
                  {preview.columns?.map((col) => (
                    <td key={col} className="px-3 py-1.5 whitespace-nowrap">{String(row[col] ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {Math.min(20, preview.rows.length)} of {preview.totalRows ?? preview.rows.length} rows
          {preview.isPartialPreview ? " (partial preview — file too large to load in full)" : ""}
        </p>
      </div>
    );
  }

  if (preview.type === "geojson") {
    return (
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Map className="size-4 text-muted-foreground" />
          <span>{preview.totalFeatures ?? preview.features?.length ?? 0} feature(s)</span>
        </div>
        {preview.bbox && (
          <p className="text-xs text-muted-foreground">Bounding box: {preview.bbox.join(", ")}</p>
        )}
        <p className="text-xs text-muted-foreground">Showing first {preview.features?.length ?? 0} feature(s) of the file.</p>
      </div>
    );
  }

  if (preview.type === "json") {
    const rows = preview.records ?? (preview.data ? [preview.data] : []);
    return (
      <div className="space-y-2">
        <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
          {JSON.stringify(rows.slice(0, 20), null, 2)}
        </pre>
        {preview.totalRecords !== undefined && (
          <p className="text-xs text-muted-foreground">
            Showing {Math.min(20, rows.length)} of {preview.totalRecords} record(s)
          </p>
        )}
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground flex items-center gap-2">
      <FileWarning className="size-4" />
      {preview.message || "Preview not available for this format."}
    </p>
  );
}
