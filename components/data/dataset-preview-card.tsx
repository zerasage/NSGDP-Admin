"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download, Eye, FileWarning, Loader2, Map } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminDatasetPreview, type DatasetPreviewResult } from "@/lib/api/dataset-preview";
import { useDownloadDataset } from "@/lib/hooks/useDatasets";
import { useToast } from "@/lib/hooks/use-toast";

function DownloadFileButton({ slug, className }: { slug: string; className?: string }) {
  const { toast } = useToast();
  const downloadMutation = useDownloadDataset();

  const handleDownload = () => {
    downloadMutation.mutate(
      { slug, mode: "download" },
      {
        onSuccess: (data) => {
          window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
          toast({ title: "Success", description: `Downloading ${data.fileName}` });
        },
        onError: (error: unknown) =>
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to generate download link",
            variant: "destructive",
          }),
      }
    );
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={handleDownload}
      disabled={downloadMutation.isPending}
    >
      {downloadMutation.isPending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="size-3.5" aria-hidden="true" />
      )}
      Download file
    </Button>
  );
}

export function DatasetPreviewCard({ slug, showDownload = false }: { slug: string; showDownload?: boolean }) {
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
        {showDownload && (
          <CardAction>
            <DownloadFileButton slug={slug} />
          </CardAction>
        )}
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

export function DatasetPreviewDialog({
  slug,
  title,
  open,
  onOpenChange,
  showDownload = false,
}: {
  slug: string;
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showDownload?: boolean;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dataset-preview", "admin", slug],
    queryFn: () => getAdminDatasetPreview(slug),
    enabled: open,
    retry: 1,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-none">
        <DialogHeader className="border-b px-5 py-4 pr-14">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Eye className="size-5 text-muted-foreground" aria-hidden="true" />
              {title}
            </DialogTitle>
            {showDownload && <DownloadFileButton slug={slug} />}
          </div>
          <DialogDescription>Browser preview of the uploaded dataset file</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-auto p-4 sm:p-5">
          {isLoading ? (
            <Skeleton className="h-full min-h-80 rounded-xl" />
          ) : error || !data ? (
            <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
              <AlertTriangle className="mr-2 size-4" aria-hidden="true" />
              Preview unavailable for this dataset.
            </div>
          ) : (
            <PreviewBody preview={data.preview} expanded />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({
  preview,
  expanded = false,
}: {
  preview: DatasetPreviewResult['preview'];
  expanded?: boolean;
}) {
  if (preview.type === "tabular") {
    if (!preview.rows || preview.rows.length === 0) {
      return <p className="text-sm text-muted-foreground">{preview.message || "No rows to preview."}</p>;
    }
    const visibleRows = expanded ? preview.rows : preview.rows.slice(0, 20);
    return (
      <div className="space-y-2">
        <div className={expanded ? "overflow-auto rounded-xl border" : "max-h-80 overflow-auto rounded-lg border"}>
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/60">
              <tr>
                {preview.columns?.map((col) => (
                  <th key={col} className="px-3 py-2 text-left font-medium whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, i) => (
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
          Showing {visibleRows.length} of {preview.totalRows ?? preview.rows.length} rows
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
    const visibleRows = expanded ? rows : rows.slice(0, 20);
    return (
      <div className="space-y-2">
        <pre className={expanded ? "overflow-auto rounded-xl border bg-muted/30 p-4 text-xs" : "max-h-80 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs"}>
          {JSON.stringify(visibleRows, null, 2)}
        </pre>
        {preview.totalRecords !== undefined && (
          <p className="text-xs text-muted-foreground">
            Showing {visibleRows.length} of {preview.totalRecords} record(s)
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
