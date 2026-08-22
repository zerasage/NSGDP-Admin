"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Archive,
  ArchiveRestore,
  Building2,
  Calendar,
  Download,
  Eye,
  FileStack,
  FolderOpen,
  Globe,
  History,
  Loader2,
  Lock,
  MapPin,
  MessageSquareWarning,
  Tag,
  Undo2,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/data/status-badge";
import { VisibilityBadge } from "@/components/data/visibility-badge";
import { apiClient } from "@/lib/api/client";
import { adminApi, archiveDataset, getUserById, publishDataset, unarchiveDataset, unpublishDataset, retractDataset, type RetractDatasetPayload } from "@/lib/api/admin";
import { RetractDatasetDialog } from "@/components/admin/retract-dataset-dialog";
import { getCategories } from "@/lib/api/categories";
import { useDatasetVersions, useDownloadDataset, useDatasetFiles } from "@/lib/hooks/useDatasets";
import type { DatasetFile, DatasetStatus } from "@/lib/api/datasets";
import type { Visibility } from "@/types";
import { useToast } from "@/lib/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { DatasetPreviewCard, DatasetPreviewDialog } from "@/components/data/dataset-preview-card";
import { formatDate } from "@/lib/utils/date";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IngestionReportTab } from "@/components/admin/ingestion-report-tab";
import { DataReviewQueueTab } from "@/components/admin/data-review-queue-tab";
import { RelatedDatasetsTab } from "@/components/admin/related-datasets-tab";

function formatFileSize(bytes: number | string | null): string {
  // file_size is a Postgres bigint column — pg/TypeORM return bigint values
  // as strings at runtime (to avoid precision loss past Number.MAX_SAFE_INTEGER),
  // regardless of what the TS type says. Files under 1024 bytes never hit the
  // division below, so the string never gets coerced to a number, and
  // value.toFixed() throws.
  const numBytes = Number(bytes);
  if (!numBytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = numBytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

interface Dataset {
  id: string;
  title: string;
  slug: string;
  description: string;
  format: string;
  visibility: Visibility;
  status: DatasetStatus;
  tags: string[];
  geographic_coverage: string[];
  license: string;
  owner_id: string;
  organisation_id: string;
  category_id: string | null;
  view_count: number;
  download_count: number;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_by: string | null;
  published_at: string | null;
  archived_by: string | null;
  archived_at: string | null;
  archived_reason: string | null;
  created_at: string;
  updated_at: string;
  ingestion_status: "not_ingested" | "uploaded" | "processing" | "processed_pending_approval" | "published" | "retracting" | "retracted" | "failed";
}

interface Organisation {
  id: string;
  name: string;
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function DatasetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const isSuperAdmin = user?.role === "super_admin";
  const canView = isSuperAdmin || hasAnyPermission("approve:datasets", "publish:datasets");
  const canApprove = isSuperAdmin || hasPermission("approve:datasets");
  const canPublish = isSuperAdmin || hasPermission("publish:datasets");
  const canArchive = isSuperAdmin || hasPermission("archive:datasets");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: dataset, isLoading, error } = useQuery({
    queryKey: ['dataset', slug],
    enabled: canView,
    queryFn: async () => {
      const response = await apiClient.get<{ data: Dataset }>(`/admin/datasets/${slug}`);
      return response.data.data;
    },
    // Publish/retract run async on the worker — keep this on a short poll
    // while either is in flight so the status/tabs update without a manual
    // refresh, same reasoning as the ingestion progress stream on the
    // upload side.
    refetchInterval: (query) => {
      const status = query.state.data?.ingestion_status;
      return status === "processing" || status === "retracting" ? 3000 : false;
    },
  });

  const { data: versionHistory } = useDatasetVersions(slug);
  const { data: files } = useDatasetFiles(slug);

  const { data: organisationsData } = useQuery({
    queryKey: ["admin", "organisations"],
    queryFn: async () => {
      const response = await adminApi.get<{ data: { data: Organisation[] } }>("/admin/organisations?page=1&limit=100");
      return response.data.data;
    },
  });
  const organisation = organisationsData?.data?.find((o) => o.id === dataset?.organisation_id);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories({ page: 1, limit: 100 }),
  });
  const category = categoriesData?.data?.find((c) => c.id === dataset?.category_id);

  const { data: owner } = useQuery({
    queryKey: ["admin-user", dataset?.owner_id],
    queryFn: () => getUserById(dataset!.owner_id),
    enabled: !!dataset?.owner_id,
  });

  const { data: reviewer } = useQuery({
    queryKey: ["admin-user", dataset?.reviewed_by],
    queryFn: () => getUserById(dataset!.reviewed_by as string),
    enabled: !!dataset?.reviewed_by,
  });

  const { data: archiver } = useQuery({
    queryKey: ["admin-user", dataset?.archived_by],
    queryFn: () => getUserById(dataset!.archived_by as string),
    enabled: !!dataset?.archived_by,
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveDataset(slug),
    onSuccess: () => {
      toast({ title: "Success", description: "Dataset archived" });
      setArchiveOpen(false);
      queryClient.invalidateQueries({ queryKey: ["dataset", slug] });
      queryClient.invalidateQueries({ queryKey: ["admin", "datasets", "queue"] });
    },
    onError: (error: unknown) =>
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to archive dataset",
        variant: "destructive",
      }),
  });

  const unarchiveMutation = useMutation({
    mutationFn: () => unarchiveDataset(slug),
    onSuccess: () => {
      toast({ title: "Success", description: "Dataset restored from archive" });
      setArchiveOpen(false);
      queryClient.invalidateQueries({ queryKey: ["dataset", slug] });
      queryClient.invalidateQueries({ queryKey: ["admin", "datasets", "queue"] });
    },
    onError: (error: unknown) =>
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore dataset",
        variant: "destructive",
      }),
  });

  const publishMutation = useMutation({
    mutationFn: () => publishDataset(slug),
    onSuccess: () => {
      toast({ title: "Success", description: "Dataset published to the public catalogue" });
      queryClient.invalidateQueries({ queryKey: ["dataset", slug] });
    },
    onError: (error: unknown) =>
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish dataset",
        variant: "destructive",
      }),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishDataset(slug),
    onSuccess: () => {
      toast({ title: "Success", description: "Dataset unpublished — no longer visible to the public" });
      queryClient.invalidateQueries({ queryKey: ["dataset", slug] });
    },
    onError: (error: unknown) =>
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to unpublish dataset",
        variant: "destructive",
      }),
  });

  const [retractOpen, setRetractOpen] = useState(false);
  const retractMutation = useMutation({
    mutationFn: (payload: RetractDatasetPayload) => retractDataset(dataset!.id, payload),
    onSuccess: () => {
      toast({ title: "Retraction started", description: "Reversing this dataset's published effects — this dataset will update automatically as it completes." });
      setRetractOpen(false);
      queryClient.invalidateQueries({ queryKey: ["dataset", slug] });
    },
    onError: (error: unknown) =>
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to retract dataset",
        variant: "destructive",
      }),
  });

  const downloadMutation = useDownloadDataset();

  const handleView = () => {
    setPreviewOpen(true);
  };

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

  const handleFileView = (file: DatasetFile) => {
    downloadMutation.mutate(
      { slug, mode: "view", fileId: file.id },
      {
        onSuccess: (data) => window.open(data.downloadUrl, "_blank", "noopener,noreferrer"),
        onError: (error: unknown) =>
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to open file",
            variant: "destructive",
          }),
      }
    );
  };

  const handleFileDownload = (file: DatasetFile) => {
    downloadMutation.mutate(
      { slug, mode: "download", fileId: file.id },
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

  if (!canView) {
    return (
      <EmptyState
        icon={Lock}
        title="Access restricted"
        description="Viewing dataset details requires approve:datasets or publish:datasets. Ask a super_admin to grant your group one of these."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-full max-w-2xl" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
          <Skeleton className="h-[28rem] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Dataset not found or you don&apos;t have permission to view it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-3 gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Datasets
        </Button>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-8">{dataset.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {organisation?.name ?? "Unknown organisation"} · Updated {formatDate(dataset.updated_at)}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <StatusBadge status={dataset.status} publishedAt={dataset.published_at} />
            <VisibilityBadge visibility={dataset.visibility} />
            <Badge variant="outline" className="rounded-full text-[11px] font-semibold uppercase">
              {dataset.format}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-3 [&>button]:h-11 sm:p-4 sm:[&>button]:h-8">
          {canApprove && (dataset.status === 'pending' || dataset.status === 'under_review') && (
            <Button size="sm" className="gap-1.5" onClick={() => router.push(`/datasets/${slug}/review`)}>
              <Eye className="size-4" aria-hidden="true" />
              Review dataset
            </Button>
          )}
          {canPublish && dataset.status === 'approved' && !dataset.published_at && (
            <Button
              size="sm"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              <Globe className="size-4" aria-hidden="true" />
              Publish dataset
            </Button>
          )}
          {canPublish && dataset.status === 'approved' && dataset.published_at && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => unpublishMutation.mutate()}
              disabled={unpublishMutation.isPending}
            >
              <Globe className="size-4" aria-hidden="true" />
              Unpublish
            </Button>
          )}
          {canPublish && dataset.ingestion_status === 'published' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setRetractOpen(true)}
            >
              <Undo2 className="size-4" aria-hidden="true" />
              Retract
            </Button>
          )}
          {dataset.ingestion_status === 'retracting' && (
            <Badge variant="outline" className="gap-1.5">
              <Loader2 className="size-3 animate-spin" />
              Retracting…
            </Badge>
          )}
          {(!files || files.length <= 1) && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleView}
              >
                <Eye className="size-4" aria-hidden="true" />
                View file
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                disabled={downloadMutation.isPending}
              >
                <Download className="size-4" aria-hidden="true" />
                Download
              </Button>
            </>
          )}
          {canArchive && (
            <Button size="sm" variant="ghost" className="gap-1.5 sm:ml-auto" onClick={() => setArchiveOpen(true)}>
              {dataset.status === "archived" ? (
                <ArchiveRestore className="size-4" aria-hidden="true" />
              ) : (
                <Archive className="size-4" aria-hidden="true" />
              )}
              {dataset.status === "archived" ? "Restore" : "Archive"}
            </Button>
          )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {dataset.description || "No description was provided for this dataset."}
              </p>
            </CardContent>
          </Card>

          <DatasetPreviewCard slug={slug} />

          {files && files.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileStack className="size-4 text-muted-foreground" aria-hidden="true" />
                  Files
                  {files.length > 1 && (
                    <Badge variant="secondary" className="ml-1 rounded-full tabular-nums">{files.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="-my-4">
                <ul className="divide-y">
                  {files.map((file) => (
                    <li key={file.id} className="flex items-center justify-between gap-3 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <FileStack className="size-4 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{file.file_name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="rounded-full uppercase text-[10px]">
                            {file.format}
                          </Badge>
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>·</span>
                          <span>{formatDate(file.created_at)}</span>
                        </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleFileView(file)}
                          disabled={downloadMutation.isPending}
                          aria-label={`View ${file.file_name}`}
                        >
                          <Eye className="size-4" aria-hidden="true" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleFileDownload(file)}
                          disabled={downloadMutation.isPending}
                          aria-label={`Download ${file.file_name}`}
                        >
                          <Download className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {dataset.ingestion_status !== "not_ingested" && (
            <Card>
              <CardContent className="pt-5">
                <Tabs defaultValue="report">
                  <TabsList>
                    <TabsTrigger value="report">Ingestion Report</TabsTrigger>
                    <TabsTrigger value="review">Data Review Queue</TabsTrigger>
                    <TabsTrigger value="related">Related Datasets</TabsTrigger>
                  </TabsList>
                  <TabsContent value="report" className="mt-4">
                    <IngestionReportTab datasetId={dataset.id} />
                  </TabsContent>
                  <TabsContent value="review" className="mt-4">
                    <DataReviewQueueTab datasetId={dataset.id} />
                  </TabsContent>
                  <TabsContent value="related" className="mt-4">
                    <RelatedDatasetsTab datasetId={dataset.id} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {(dataset.status === 'rejected' || dataset.review_comment) && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="border-b border-destructive/20">
                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                  <MessageSquareWarning className="size-4" />
                  Review Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{dataset.review_comment || 'No comment provided.'}</p>
                {reviewer && dataset.reviewed_at && (
                  <p className="text-xs text-muted-foreground">
                    {reviewer.first_name} {reviewer.last_name} · {formatDate(dataset.reviewed_at)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {dataset.status === 'archived' && (dataset.archived_reason || dataset.archived_at) && (
            <Card className="border-muted bg-muted/30">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Archive className="size-4" />
                  Archive Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{dataset.archived_reason || 'No reason provided.'}</p>
                {archiver && dataset.archived_at && (
                  <p className="text-xs text-muted-foreground">
                    {archiver.first_name} {archiver.last_name} · {formatDate(dataset.archived_at)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {dataset.tags && dataset.tags.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Tag className="size-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dataset.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {dataset.geographic_coverage && dataset.geographic_coverage.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  Geographic Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dataset.geographic_coverage.map((location, index) => (
                    <Badge key={index} variant="outline">
                      {location}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Dataset information</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoRow icon={Building2} label="Organisation" value={organisation?.name ?? "Unknown organisation"} />
              <InfoRow icon={FolderOpen} label="Category" value={category?.name ?? "Uncategorised"} />
              <InfoRow
                icon={User}
                label="Submitted by"
                value={owner ? `${owner.first_name} ${owner.last_name}` : "Unknown submitter"}
              />
              {dataset.license && <InfoRow icon={Tag} label="License" value={dataset.license} />}
              <InfoRow
                icon={Download}
                label="Engagement"
                value={`${dataset.download_count || 0} downloads · ${dataset.view_count || 0} views`}
              />
              <InfoRow
                icon={Calendar}
                label={dataset.submitted_at ? "Submitted" : "Created"}
                value={formatDate(dataset.submitted_at || dataset.created_at)}
              />
              {dataset.approved_at && (
                <InfoRow icon={Calendar} label="Approved" value={formatDate(dataset.approved_at)} />
              )}
              {dataset.status === "approved" && (
                <InfoRow
                  icon={Globe}
                  label="Publication"
                  value={dataset.published_at ? formatDate(dataset.published_at) : "Not yet published"}
                />
              )}
            </CardContent>
          </Card>

          {versionHistory && versionHistory.versions.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="size-4" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {versionHistory.versions.map((v) => (
                    <li key={v.id} className="text-sm border-l-2 border-muted pl-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">v{v.version}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(v.created_at)}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">{v.changes}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {dataset.status === 'draft' && (
            <Card className="bg-muted/30">
              <CardContent>
                <p className="text-sm leading-5">
                  <strong>Draft Status:</strong> This dataset is not yet published and is only visible to administrators.
                </p>
              </CardContent>
            </Card>
          )}

          {dataset.status === 'pending' && (
            <Card className="bg-muted/30">
              <CardContent>
                <p className="text-sm leading-5">
                  <strong>Pending Review:</strong> This dataset is awaiting review and approval.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={dataset.status === "archived" ? "Restore dataset?" : "Archive dataset?"}
        description={
          dataset.status === "archived"
            ? `"${dataset.title}" will be restored to its previous workflow status.`
            : `"${dataset.title}" will be removed from the public catalogue but remains accessible to admins.`
        }
        confirmLabel={dataset.status === "archived" ? "Restore" : "Archive"}
        variant={dataset.status === "archived" ? "default" : "destructive"}
        loading={archiveMutation.isPending || unarchiveMutation.isPending}
        onConfirm={() => {
          if (dataset.status === "archived") {
            unarchiveMutation.mutate();
          } else {
            archiveMutation.mutate();
          }
        }}
      />
      <DatasetPreviewDialog
        slug={slug}
        title={dataset.title}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
      <RetractDatasetDialog
        open={retractOpen}
        onOpenChange={setRetractOpen}
        onConfirm={(payload) => retractMutation.mutate(payload)}
        isSaving={retractMutation.isPending}
      />
    </div>
  );
}
