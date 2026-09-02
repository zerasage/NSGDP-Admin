"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Download, Expand, Eye, FileWarning, Loader2 } from "lucide-react";
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
import { HelpTip } from "@/components/admin/help-tip";
import { downloadDocument, getDocumentTextPreview } from "@/lib/api/documents";
import { DOCUMENT_PREVIEW_TIP } from "@/lib/constants/documents-tooltips";
import { useDownloadDocument } from "@/lib/hooks/useDocuments";
import { useToast } from "@/lib/hooks/use-toast";
import {
  DOCUMENT_PREVIEW_SUPPORTED_LABEL,
  DOCUMENT_PREVIEW_UNSUPPORTED_LABEL,
  getDocumentPreviewKind,
} from "@/lib/utils/document-preview";
import { cn } from "@/lib/utils";

function useDocumentViewUrl(slug: string, enabled: boolean) {
  return useQuery({
    queryKey: ["document-preview", "view-url", slug],
    queryFn: () => downloadDocument(slug, "view"),
    enabled,
    staleTime: 30 * 60 * 1000,
  });
}

function DownloadFileButton({ slug, className }: { slug: string; className?: string }) {
  const { toast } = useToast();
  const downloadMutation = useDownloadDocument();

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
      },
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

function TextContentPreview({
  slug,
  fileName,
  mimeType,
  expanded = false,
}: {
  slug: string;
  fileName?: string | null;
  mimeType?: string | null;
  expanded?: boolean;
}) {
  const kind = getDocumentPreviewKind(fileName, mimeType);
  const { data, isLoading, error } = useQuery({
    queryKey: ["document-preview", "text", slug],
    queryFn: () => getDocumentTextPreview(slug),
    enabled: kind === "text",
    staleTime: 30 * 60 * 1000,
  });

  const frameClass = expanded ? "min-h-[70vh]" : "max-h-80";

  if (isLoading) {
    return <Skeleton className={cn(frameClass, "w-full rounded-xl")} />;
  }

  if (error || !data) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileWarning className="size-4" aria-hidden="true" />
        Couldn&apos;t load text preview. Try downloading the file instead.
      </p>
    );
  }

  let formatted = data.content;
  if (data.kind === "json") {
    try {
      formatted = JSON.stringify(JSON.parse(data.content), null, 2);
    } catch {
      // Keep raw text when the file is not valid JSON.
    }
  }

  return (
    <div className="space-y-2">
      {data.truncated ? (
        <p className="text-xs text-muted-foreground">
          Showing the first 1 MB of this file. Download for the full content.
        </p>
      ) : null}
      <pre
        className={cn(
          frameClass,
          "overflow-auto rounded-xl border bg-muted/30 p-3 text-xs sm:p-4",
        )}
      >
        {formatted}
      </pre>
    </div>
  );
}

function DocumentPreviewBody({
  slug,
  fileName,
  mimeType,
  expanded = false,
}: {
  slug: string;
  fileName?: string | null;
  mimeType?: string | null;
  expanded?: boolean;
}) {
  const kind = getDocumentPreviewKind(fileName, mimeType);
  const needsViewUrl = kind === "pdf" || kind === "image";
  const { data, isLoading, error } = useDocumentViewUrl(slug, needsViewUrl);

  const frameClass = expanded ? "h-full min-h-[70vh]" : "h-80";

  if (kind === "unsupported") {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <FileWarning className="size-4 shrink-0" aria-hidden="true" />
          Preview is not available for this file type. Download the file to open it locally.
        </p>
        <p className="text-xs">
          <span className="font-medium text-foreground">Supported:</span>{" "}
          {DOCUMENT_PREVIEW_SUPPORTED_LABEL}
        </p>
        <p className="text-xs">{DOCUMENT_PREVIEW_UNSUPPORTED_LABEL}</p>
      </div>
    );
  }

  if (kind === "text") {
    return (
      <TextContentPreview
        slug={slug}
        fileName={fileName}
        mimeType={mimeType}
        expanded={expanded}
      />
    );
  }

  if (isLoading) {
    return <Skeleton className={cn(frameClass, "w-full rounded-xl")} />;
  }

  if (error || !data?.downloadUrl) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileWarning className="size-4" aria-hidden="true" />
        Couldn&apos;t load the preview. Try downloading the file instead.
      </p>
    );
  }

  if (kind === "pdf") {
    return (
      <iframe
        src={data.downloadUrl}
        title="Document preview"
        className={cn(frameClass, "w-full rounded-xl border")}
      />
    );
  }

  return (
    <div
      className={cn(
        expanded ? "flex h-full min-h-[70vh] items-center justify-center" : "h-80",
        "overflow-hidden rounded-xl border bg-muted/20",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={data.downloadUrl}
        alt={fileName ?? "Document preview"}
        className={cn(
          expanded ? "max-h-full max-w-full object-contain" : "h-full w-full object-contain",
        )}
      />
    </div>
  );
}

export function DocumentPreviewCard({
  slug,
  fileName,
  mimeType,
  hasFile,
  showDownload = true,
  onExpand,
}: {
  slug: string;
  fileName?: string | null;
  mimeType?: string | null;
  hasFile: boolean;
  showDownload?: boolean;
  onExpand?: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Eye className="size-4" aria-hidden="true" />
          Document preview
          <HelpTip content={DOCUMENT_PREVIEW_TIP} label="About document preview" />
        </CardTitle>
        {hasFile && (
          <CardAction className="flex items-center gap-2">
            {onExpand ? (
              <Button variant="outline" size="sm" onClick={onExpand}>
                <Expand className="size-3.5" aria-hidden="true" />
                Expand
              </Button>
            ) : null}
            {showDownload ? <DownloadFileButton slug={slug} /> : null}
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {!hasFile ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="size-4" aria-hidden="true" />
            No file uploaded yet. Edit this document to attach a file.
          </p>
        ) : (
          <DocumentPreviewBody slug={slug} fileName={fileName} mimeType={mimeType} />
        )}
      </CardContent>
    </Card>
  );
}

export function DocumentPreviewDialog({
  slug,
  title,
  fileName,
  mimeType,
  hasFile,
  open,
  onOpenChange,
  showDownload = true,
}: {
  slug: string;
  title: string;
  fileName?: string | null;
  mimeType?: string | null;
  hasFile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showDownload?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-none">
        <DialogHeader className="border-b px-5 py-4 pr-14">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Eye className="size-5 text-muted-foreground" aria-hidden="true" />
              {title}
            </DialogTitle>
            {hasFile && showDownload ? <DownloadFileButton slug={slug} /> : null}
          </div>
          <DialogDescription>Browser preview of the uploaded document file</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-auto p-4 sm:p-5">
          {!hasFile ? (
            <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
              <AlertTriangle className="mr-2 size-4" aria-hidden="true" />
              No file uploaded yet.
            </div>
          ) : (
            <DocumentPreviewBody
              slug={slug}
              fileName={fileName}
              mimeType={mimeType}
              expanded
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
