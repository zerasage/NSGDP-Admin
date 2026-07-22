"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Archive,
  Building2,
  Calendar,
  Download,
  Eye,
  FileStack,
  FolderOpen,
  Globe,
  History,
  MapPin,
  MessageSquareWarning,
  Tag,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiClient } from "@/lib/api/client";
import { adminApi, archiveDataset, getUserById, publishDataset, unpublishDataset } from "@/lib/api/admin";
import { getCategories } from "@/lib/api/categories";
import { useDatasetVersions, useDownloadDataset, useDatasetFiles } from "@/lib/hooks/useDatasets";
import type { DatasetFile } from "@/lib/api/datasets";
import { useToast } from "@/lib/hooks/use-toast";
import { DatasetPreviewCard } from "@/components/data/dataset-preview-card";
import { formatDate } from "@/lib/utils/date";

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
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
  visibility: string;
  status: string;
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
}

interface Organisation {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 border-gray-300",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  under_review: "bg-blue-100 text-blue-800 border-blue-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
  archived: "bg-gray-100 text-gray-600 border-gray-300",
};

export default function DatasetDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [archiveOpen, setArchiveOpen] = useState(false);

  const { data: dataset, isLoading, error } = useQuery({
    queryKey: ['dataset', slug],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Dataset }>(`/admin/datasets/${slug}`);
      return response.data.data;
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
      queryClient.invalidateQueries({ queryKey: ["dataset", slug] });
    },
    onError: (error: unknown) =>
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to archive dataset",
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

  const downloadMutation = useDownloadDataset();

  const handleView = () => {
    downloadMutation.mutate(
      { slug, mode: "view" },
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 -ml-3"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{dataset.title}</h1>
          <p className="text-muted-foreground mt-1">Dataset Details</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={
              dataset.status === 'approved' && !dataset.published_at
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : statusColors[dataset.status] || "bg-gray-100 text-gray-800"
            }
          >
            {dataset.status === 'approved'
              ? (dataset.published_at ? 'PUBLISHED' : 'APPROVED (NOT PUBLISHED)')
              : dataset.status.replace('_', ' ').toUpperCase()}
          </Badge>
          {(dataset.status === 'pending' || dataset.status === 'under_review') && (
            <Button size="sm" onClick={() => router.push(`/datasets/${slug}/review`)}>
              <Eye className="size-4 mr-1" />
              Review
            </Button>
          )}
          {dataset.status === 'approved' && !dataset.published_at && (
            <Button
              size="sm"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              <Globe className="size-4 mr-1" />
              Publish
            </Button>
          )}
          {dataset.status === 'approved' && dataset.published_at && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => unpublishMutation.mutate()}
              disabled={unpublishMutation.isPending}
            >
              <Globe className="size-4 mr-1" />
              Unpublish
            </Button>
          )}
          {(!files || files.length <= 1) && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleView}
                disabled={downloadMutation.isPending}
              >
                <Eye className="size-4 mr-1" />
                View File
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                disabled={downloadMutation.isPending}
              >
                <Download className="size-4 mr-1" />
                Download
              </Button>
            </>
          )}
          {dataset.status !== 'archived' && (
            <Button size="sm" variant="outline" onClick={() => setArchiveOpen(true)}>
              <Archive className="size-4 mr-1" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{dataset.description}</p>
            </CardContent>
          </Card>

          <DatasetPreviewCard slug={slug} />

          {files && files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileStack className="size-4" />
                  Files
                  {files.length > 1 && (
                    <Badge variant="secondary" className="ml-1">{files.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {files.map((file) => (
                    <li key={file.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{file.file_name}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="uppercase text-[10px]">
                            {file.format}
                          </Badge>
                          <span>{formatFileSize(file.file_size)}</span>
                          <span>·</span>
                          <span>{formatDate(file.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleFileView(file)}
                          disabled={downloadMutation.isPending}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleFileDownload(file)}
                          disabled={downloadMutation.isPending}
                        >
                          <Download className="size-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(dataset.status === 'rejected' || dataset.review_comment) && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader>
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
              <CardHeader>
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
              <CardHeader>
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
              <CardHeader>
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

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dataset Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="size-4 text-muted-foreground shrink-0" />
                <span>{organisation?.name ?? 'Unknown organisation'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <FolderOpen className="size-4 text-muted-foreground shrink-0" />
                <span>{category?.name ?? 'Uncategorised'}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <User className="size-4 text-muted-foreground shrink-0" />
                <span>
                  {owner ? `${owner.first_name} ${owner.last_name}` : 'Unknown submitter'}
                </span>
              </div>

              <div className="pt-2 border-t space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Format</p>
                  <Badge variant="secondary" className="uppercase">
                    {dataset.format}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Visibility</p>
                  <Badge variant="outline" className="capitalize">
                    {dataset.visibility}
                  </Badge>
                </div>

                {dataset.license && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">License</p>
                    <p className="text-sm">{dataset.license}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <Download className="size-4" />
                <span>{dataset.download_count || 0} downloads · {dataset.view_count || 0} views</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                <span>
                  {dataset.submitted_at
                    ? `Submitted ${formatDate(dataset.submitted_at)}`
                    : `Created ${formatDate(dataset.created_at)}`}
                </span>
              </div>

              {dataset.approved_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4" />
                  <span>Approved {formatDate(dataset.approved_at)}</span>
                </div>
              )}

              {dataset.status === 'approved' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="size-4" />
                  <span>
                    {dataset.published_at
                      ? `Published ${formatDate(dataset.published_at)}`
                      : 'Not yet published'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {versionHistory && versionHistory.versions.length > 0 && (
            <Card>
              <CardHeader>
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
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-800">
                  <strong>Draft Status:</strong> This dataset is not yet published and is only visible to administrators.
                </p>
              </CardContent>
            </Card>
          )}

          {dataset.status === 'pending' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-800">
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
        title="Archive dataset?"
        description={`"${dataset.title}" will be removed from the public catalogue but remains accessible to admins.`}
        confirmLabel="Archive"
        variant="destructive"
        loading={archiveMutation.isPending}
        onConfirm={() => archiveMutation.mutate()}
      />
    </div>
  );
}
