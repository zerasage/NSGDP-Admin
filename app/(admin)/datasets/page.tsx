'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Archive, ArchiveRestore, Eye, Globe, Lock, Database, Loader2, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StatusBadge } from '@/components/data/status-badge';
import { VisibilityBadge } from '@/components/data/visibility-badge';
import { AgeBadge } from '@/components/data/age-badge';
import { Pagination } from '@/components/data/pagination';
import { TableRowSkeleton } from '@/components/feedback/skeletons';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { adminApi, archiveDataset, publishDataset, unarchiveDataset } from '@/lib/api/admin';
import type { DatasetStatus } from '@/lib/api/datasets';
import type { Visibility } from '@/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/date';
import Link from 'next/link';

interface Dataset {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: DatasetStatus;
  format: string;
  visibility: Visibility;
  owner_id: string;
  organisation_id: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface Organisation {
  id: string;
  name: string;
  slug: string;
}

interface DatasetPage {
  data: Dataset[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const TABS: Array<{ key: DatasetStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'archived', label: 'Archived' },
];

export default function DatasetsReviewPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission, isLoading: permissionsLoading } = usePermissions();
  const isSuperAdmin = user?.role === 'super_admin';
  const canViewQueue = isSuperAdmin || hasAnyPermission('approve:datasets', 'publish:datasets');
  const canPublish = isSuperAdmin || hasPermission('publish:datasets');
  const canArchive = isSuperAdmin || hasPermission('archive:datasets');

  const [tab, setTab] = useState<DatasetStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [archiveTarget, setArchiveTarget] = useState<Dataset | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const archiveMutation = useMutation({
    mutationFn: (slug: string) => archiveDataset(slug),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Dataset archived' });
      setArchiveTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'datasets', 'queue'] });
    },
    onError: (error: unknown) =>
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to archive dataset',
        variant: 'destructive',
      }),
  });

  const unarchiveMutation = useMutation({
    mutationFn: (slug: string) => unarchiveDataset(slug),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Dataset restored from archive' });
      setArchiveTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'datasets', 'queue'] });
    },
    onError: (error: unknown) =>
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to restore dataset',
        variant: 'destructive',
      }),
  });

  const publishMutation = useMutation({
    mutationFn: (slug: string) => publishDataset(slug),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Dataset published to the public catalogue' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'datasets', 'queue'] });
    },
    onError: (error: unknown) =>
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to publish dataset',
        variant: 'destructive',
      }),
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'datasets', 'queue', tab, debouncedQuery, page, pageSize],
    enabled: canViewQueue,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (debouncedQuery) params.append('search', debouncedQuery);

      // Pending and Under Review are driven by the review-queue endpoints
      // (ticket-backed); everything else is a plain status filter.
      if (tab === 'pending') {
        const response = await adminApi.get<{ data: DatasetPage }>(`/admin/review-queue?${params}`);
        return response.data.data;
      }
      if (tab === 'under_review') {
        const response = await adminApi.get<{ data: DatasetPage }>(`/admin/review-queue/under-review?${params}`);
        return response.data.data;
      }
      if (tab !== 'all') params.append('status', tab);
      const response = await adminApi.get<{ data: DatasetPage }>(`/admin/datasets?${params}`);
      return response.data.data;
    },
    placeholderData: keepPreviousData,
  });

  const { data: organisationsData } = useQuery({
    queryKey: ['admin', 'organisations'],
    queryFn: async () => {
      const response = await adminApi.get<{ data: { data: Organisation[] } }>('/admin/organisations?page=1&limit=100');
      return response.data.data;
    },
  });

  const datasets = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;
  const isSearchPending = query.trim() !== debouncedQuery;

  const renderActions = (dataset: Dataset, mobile = false) => {
    const isReviewable = dataset.status === 'pending' || dataset.status === 'under_review';

    return (
      <div className={cn('flex items-center gap-1.5', mobile && 'w-full')}>
        <Link
          href={isReviewable ? `/datasets/${dataset.slug}/review` : `/datasets/${dataset.slug}`}
          className={cn(
            buttonVariants({ variant: isReviewable ? 'default' : 'outline', size: 'sm' }),
            'gap-1.5',
            mobile && 'h-11 flex-1'
          )}
        >
          <Eye className="size-3.5" aria-hidden="true" />
          {isReviewable ? 'Review' : 'View'}
        </Link>
        {dataset.status === 'approved' && !dataset.published_at && canPublish && (
          <Button
            size="sm"
            variant="outline"
            className={cn('gap-1.5', mobile && 'h-11 flex-1')}
            onClick={() => publishMutation.mutate(dataset.slug)}
            disabled={publishMutation.isPending}
            aria-label={`Publish ${dataset.title}`}
          >
            <Globe className="size-3.5" aria-hidden="true" />
            Publish
          </Button>
        )}
        {canArchive && (
          dataset.status === 'archived' ? (
            <Button
              size={mobile ? 'default' : 'icon-sm'}
              variant="ghost"
              className={mobile ? 'size-11 shrink-0' : undefined}
              onClick={() => setArchiveTarget(dataset)}
              aria-label={`Restore ${dataset.title}`}
              title="Restore dataset"
            >
              <ArchiveRestore className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              size={mobile ? 'default' : 'icon-sm'}
              variant="ghost"
              className={mobile ? 'size-11 shrink-0' : undefined}
              onClick={() => setArchiveTarget(dataset)}
              aria-label={`Archive ${dataset.title}`}
              title="Archive dataset"
            >
              <Archive className="size-4" aria-hidden="true" />
            </Button>
          )
        )}
      </div>
    );
  };

  if (!permissionsLoading && !canViewQueue) {
    return (
      <EmptyState
        icon={Lock}
        title="Access restricted"
        description="Viewing the review queue requires approve:datasets or publish:datasets. Ask a super_admin to grant your group one of these."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Review Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage dataset submissions through the approval pipeline
          </p>
        </div>
        {!isLoading && (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium tabular-nums">
            {total} {total === 1 ? 'dataset' : 'datasets'}
          </Badge>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="scrollbar-slim overflow-x-auto border-b px-4">
          <div className="flex min-w-max gap-1" role="tablist" aria-label="Dataset status">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => {
                  setTab(t.key);
                  setPage(1);
                }}
                className={cn(
                  'relative px-3 py-3 text-sm font-medium transition-colors',
                  tab === t.key
                    ? 'text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search title, format or organisation"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 pl-9 pr-10"
              aria-label="Search datasets"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="flex min-h-5 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            {(isSearchPending || (isFetching && !isLoading)) && (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            )}
            <span>
              {isSearchPending ? 'Searching' : isFetching && !isLoading ? 'Updating' : 'Found'}{' '}
              <span className="font-semibold tabular-nums text-foreground">{total}</span>{' '}
              {total === 1 ? 'result' : 'results'}
            </span>
          </div>
        </div>
      </div>

      <div aria-busy={isFetching || isSearchPending} className="space-y-4">
      {isLoading ? (
        <>
          <div className="hidden overflow-hidden rounded-2xl border bg-card xl:block">
            <table className="w-full text-sm">
              <tbody>{[...Array(6)].map((_, i) => <TableRowSkeleton key={i} cols={7} />)}</tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 gap-3 xl:hidden">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl" />
            ))}
          </div>
        </>
      ) : datasets.length === 0 ? (
        <div className="rounded-2xl border bg-card">
          <EmptyState
            icon={Database}
            title={query ? 'No matching datasets' : 'Queue is empty'}
            description={query ? 'Try a different search term or status filter.' : 'There are no datasets in this status.'}
            action={query ? { label: 'Clear search', onClick: () => setQuery('') } : undefined}
          />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border bg-card xl:block">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="h-11 border-b bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 font-semibold">Dataset</th>
                  <th className="px-4 font-semibold">Organisation</th>
                  <th className="px-4 font-semibold">Format</th>
                  <th className="px-4 font-semibold">Visibility</th>
                  <th className="px-4 font-semibold">Status</th>
                  <th className="px-4 font-semibold">Submitted</th>
                  <th className="px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((dataset) => {
                  const org = organisationsData?.data?.find((o) => o.id === dataset.organisation_id);
                  return (
                    <tr key={dataset.id} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                      <td className="max-w-sm px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Database className="size-4 text-primary" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <Link href={`/datasets/${dataset.slug}`} className="line-clamp-1 font-semibold hover:underline">
                              {dataset.title}
                            </Link>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {dataset.description || 'No description provided'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-48 px-4 py-3.5 text-muted-foreground">
                        <span className="line-clamp-2">{org ? org.name : 'Unknown organisation'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className="rounded-full text-[11px] font-semibold">
                          {dataset.format?.toUpperCase() || '?'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <VisibilityBadge visibility={dataset.visibility} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={dataset.status} publishedAt={dataset.published_at} />
                      </td>
                      <td className="px-4 py-3.5">
                        {dataset.status === 'pending' || dataset.status === 'under_review' ? (
                          <AgeBadge submittedAt={dataset.submitted_at || dataset.created_at} />
                        ) : (
                          <span className="whitespace-nowrap text-xs text-muted-foreground">
                            {formatDate(dataset.submitted_at || dataset.created_at)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">{renderActions(dataset)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:hidden">
            {datasets.map((dataset) => {
              const org = organisationsData?.data?.find((o) => o.id === dataset.organisation_id);
              return (
                <article key={dataset.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Database className="size-5 text-primary" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/datasets/${dataset.slug}`} className="line-clamp-2 text-sm font-semibold leading-5 hover:underline">
                        {dataset.title}
                      </Link>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {org ? org.name : 'Unknown organisation'}
                      </p>
                    </div>
                    <StatusBadge status={dataset.status} publishedAt={dataset.published_at} className="shrink-0" />
                  </div>

                  {dataset.description && (
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {dataset.description}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-2 border-y py-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Format</p>
                      <p className="mt-1 truncate text-xs font-medium">{dataset.format?.toUpperCase() || '?'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Visibility</p>
                      <div className="mt-1 truncate"><VisibilityBadge visibility={dataset.visibility} /></div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Submitted</p>
                      <div className="mt-1 truncate">
                        {dataset.status === 'pending' || dataset.status === 'under_review' ? (
                          <AgeBadge submittedAt={dataset.submitted_at || dataset.created_at} />
                        ) : (
                          <p className="truncate text-xs font-medium">{formatDate(dataset.submitted_at || dataset.created_at)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">{renderActions(dataset, true)}</div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {!isLoading && datasets.length > 0 && (
        <Pagination
          page={page}
          totalPages={Math.max(1, totalPages)}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          className="rounded-xl border bg-card px-4 py-3"
        />
      )}
      </div>

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title={archiveTarget?.status === 'archived' ? 'Restore dataset?' : 'Archive dataset?'}
        description={
          archiveTarget?.status === 'archived'
            ? `"${archiveTarget?.title}" will be restored to its previous workflow status.`
            : `"${archiveTarget?.title}" will be removed from the public catalogue but remains accessible to admins.`
        }
        confirmLabel={archiveTarget?.status === 'archived' ? 'Restore' : 'Archive'}
        variant={archiveTarget?.status === 'archived' ? 'default' : 'destructive'}
        loading={archiveMutation.isPending || unarchiveMutation.isPending}
        onConfirm={() => {
          if (!archiveTarget) return;
          if (archiveTarget.status === 'archived') {
            unarchiveMutation.mutate(archiveTarget.slug);
          } else {
            archiveMutation.mutate(archiveTarget.slug);
          }
        }}
      />
    </div>
  );
}
