"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, Download, Edit, FileText, MoreVertical, RefreshCw,
  Send, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useDocumentBySlug,
  useArchiveDocument,
  useSubmitDocumentForReview,
} from "@/lib/hooks/useDocuments";
import { publishDocument, unpublishDocument } from "@/lib/api/documents";
import { useAuth } from "@/lib/auth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { DocumentFormModal } from "@/components/admin/document-form-modal";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import type { DocumentStatus, DocumentType } from "@/lib/api/documents";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe } from "lucide-react";

const statusColors: Record<DocumentStatus, string> = {
  published: "bg-green-500/10 text-green-700 dark:text-green-400",
  draft: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  under_review: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  approved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  rejected: "bg-red-500/10 text-red-700 dark:text-red-400",
  archived: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

const typeLabels: Record<DocumentType, string> = {
  sop: "SOP",
  policy: "Policy",
  guideline: "Guideline",
  report: "Report",
  research: "Research",
  training: "Training",
  evaluation: "Evaluation",
  other: "Other",
};

function fileSizeLabel(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

export default function DocumentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { can } = useAdminAccess();
  const canManage = can("manage:documents");

  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const documentQuery = useDocumentBySlug(slug);
  const archiveMutation = useArchiveDocument();
  const submitMutation = useSubmitDocumentForReview();
  const queryClient = useQueryClient();

  const publishMutation = useMutation({
    mutationFn: () => publishDocument(slug),
    onSuccess: () => {
      toast.success("Document published");
      queryClient.invalidateQueries({ queryKey: ["document", slug] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: Error) => toast.error(error.message || "Publish failed"),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishDocument(slug),
    onSuccess: () => {
      toast.success("Document unpublished");
      queryClient.invalidateQueries({ queryKey: ["document", slug] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: Error) => toast.error(error.message || "Unpublish failed"),
  });

  const document = documentQuery.data;
  const isLoading = documentQuery.isLoading;
  const isError = documentQuery.isError;

  const handleSubmitForReview = () => {
    submitMutation.mutate(slug, {
      onSuccess: () => {
        toast.success("Submitted for review");
        router.push(`/documents/${slug}/review`);
      },
      onError: (error) => {
        const err = error as { message?: string };
        toast.error(err?.message || "Failed to submit for review");
      },
    });
  };

  const handleArchive = () => {
    archiveMutation.mutate(slug, {
      onSuccess: () => {
        toast.success("Document archived");
        setArchiveOpen(false);
        router.push("/documents");
      },
      onError: (error) => {
        const err = error as { message?: string };
        toast.error(err?.message || "Failed to archive document");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border bg-card">
        <div className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <FileText className="size-8" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Document not found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            The document may have been removed or the URL may be incorrect.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => documentQuery.refetch()}>
              <RefreshCw className="size-4" />
              Try again
            </Button>
            <Link href="/documents" className={buttonVariants({ variant: "default" })}>
              <ArrowLeft className="size-4" />
              Back to documents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <DocumentFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        document={document}
      />

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive document?"
        description={`Archive "${document.title}"? It will be removed from the public catalogue but can be restored later.`}
        confirmLabel="Archive"
        variant="destructive"
        loading={archiveMutation.isPending}
        onConfirm={handleArchive}
      />

      {/* Header */}
      <header className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b px-4 py-3 sm:px-5">
          <Link href="/documents" className={cn(buttonVariants({ variant: "ghost" }), "-ml-3 h-11 sm:h-8")}>
            <ArrowLeft className="size-4" />
            Documents
          </Link>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-primary/10 text-primary">
              <FileText className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold leading-8">{document.title}</h1>
                <Badge variant="secondary" className="text-[11px]">
                  {typeLabels[document.type]}
                </Badge>
                <Badge className={cn("capitalize text-[11px]", statusColors[document.status])}>
                  {document.status}
                </Badge>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {document.description}
              </p>
            </div>
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2">
              {(document.status === "draft" || document.status === "rejected") && (
                <Button
                  className="h-11 flex-1 sm:h-9 sm:flex-none"
                  onClick={handleSubmitForReview}
                  disabled={submitMutation.isPending || !document.file_path}
                  title={
                    document.file_path
                      ? undefined
                      : "Attach a file before submitting for review"
                  }
                >
                  <Send className="size-4" />
                  {submitMutation.isPending ? "Submitting…" : "Submit for review"}
                </Button>
              )}
              {(document.status === "pending" ||
                document.status === "under_review" ||
                document.status === "approved") && (
                <Link
                  href={`/documents/${slug}/review`}
                  className={buttonVariants({ variant: "default", className: "h-11 sm:h-9" })}
                >
                  Review
                </Link>
              )}
              {(document.status === "approved" ||
                (document.status === "draft" && document.file_path)) && (
                <Button
                  variant={document.status === "draft" ? "outline" : "default"}
                  className="h-11 flex-1 sm:h-9 sm:flex-none"
                  onClick={() => publishMutation.mutate()}
                  disabled={publishMutation.isPending}
                >
                  <Globe className="size-4" />
                  {document.status === "draft" ? "Publish (skip review)" : "Publish"}
                </Button>
              )}
              {document.status === "published" && (
                <Button
                  variant="outline"
                  className="h-11 flex-1 sm:h-9 sm:flex-none"
                  onClick={() => unpublishMutation.mutate()}
                  disabled={unpublishMutation.isPending}
                >
                  Unpublish
                </Button>
              )}
              <Button
                variant="outline"
                className="h-11 flex-1 sm:h-9 sm:flex-none"
                onClick={() => setEditOpen(true)}
              >
                <Edit className="size-4" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex h-11 items-center justify-center rounded-md border px-4 sm:h-9">
                  <MoreVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setArchiveOpen(true)}
                    disabled={document.status === "archived"}
                  >
                    <Trash2 className="size-4" />
                    Archive document
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      {/* Metrics Grid */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Document metrics">
        <MetricCard
          label="File Size"
          value={fileSizeLabel(document.file_size)}
          icon={FileText}
          description={document.file_name || "No file"}
        />
        <MetricCard
          label="Downloads"
          value={document.download_count.toLocaleString()}
          icon={Download}
          description="Total downloads"
        />
        {document.version && (
          <MetricCard
            label="Version"
            value={document.version}
            icon={FileText}
            description="Document version"
          />
        )}
        {document.published_at && (
          <MetricCard
            label="Published"
            value={formatDate(document.published_at)}
            icon={Calendar}
            description="Publication date"
          />
        )}
      </section>

      {/* File Download Section */}
      {document.file_path && document.file_name && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>File Access</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{document.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {fileSizeLabel(document.file_size)} • {document.mime_type || "Unknown type"}
                  </p>
                </div>
              </div>
              <Button className="h-11 sm:h-9">
                <Download className="size-4" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Document Information */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Document Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <InfoRow label="Title" value={document.title} />
            <InfoRow label="Type" value={typeLabels[document.type]} />
            <InfoRow label="Status" value={document.status} className="capitalize" />
            {document.version && <InfoRow label="Version" value={document.version} />}
            {document.author && <InfoRow label="Author" value={document.author} />}
            <InfoRow label="Created" value={formatDate(document.created_at)} />
            <InfoRow label="Last Updated" value={formatDate(document.updated_at)} />
          </CardContent>
        </Card>

        {/* Publishing & Attribution */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Publishing Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <InfoRow
              label="Publication Date"
              value={document.published_at ? formatDate(document.published_at) : "Not published"}
            />
            <InfoRow label="Uploaded By" value={document.uploaded_by || "Unknown"} />
            <InfoRow label="Total Downloads" value={document.download_count.toString()} />
            {document.organisation_id && (
              <InfoRow label="Organisation" value={document.organisation_id} />
            )}
            {document.programme_id && (
              <InfoRow label="Programme" value={document.programme_id} />
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="border-b">
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, description }: { label: string; value: string; icon: React.ElementType; description?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground truncate">{description}</p>
            )}
          </div>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className={cn("text-right font-medium", className)}>{value}</span>
    </div>
  );
}
