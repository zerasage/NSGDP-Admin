'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Archive, Eye, Globe, Lock } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StatusBadge } from '@/components/data/status-badge';
import { AgeBadge } from '@/components/data/age-badge';
import { TableRowSkeleton } from '@/components/feedback/skeletons';
import { EmptyState } from '@/components/feedback/empty-state';
import { useToast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { adminApi, archiveDataset, publishDataset } from '@/lib/api/admin';
import type { DatasetStatus } from '@/lib/api/datasets';
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
  visibility: string;
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [archiveTarget, setArchiveTarget] = useState<Dataset | null>(null);

  const archiveMutation = useMutation({
    mutationFn: (slug: string) => archiveDataset(slug),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Dataset archived' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'datasets', 'queue'] });
    },
    onError: (error: unknown) =>
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to archive dataset',
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

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'datasets', 'queue', tab, query],
    enabled: canViewQueue,
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '100' });
      if (query) params.append('search', query);

      // Pending and Under Review are driven by the review-queue endpoints
      // (ticket-backed); everything else is a plain status filter.
      if (tab === 'pending') {
        const response = await adminApi.get<{ data: { data: Dataset[] } }>(`/admin/review-queue?${params}`);
        return response.data.data.data;
      }
      if (tab === 'under_review') {
        const response = await adminApi.get<{ data: { data: Dataset[] } }>(`/admin/review-queue/under-review?${params}`);
        return response.data.data.data;
      }
      if (tab !== 'all') params.append('status', tab);
      const response = await adminApi.get<{ data: { data: Dataset[] } }>(`/admin/datasets?${params}`);
      return response.data.data.data;
    },
  });

  const { data: organisationsData } = useQuery({
    queryKey: ['admin', 'organisations'],
    queryFn: async () => {
      const response = await adminApi.get<{ data: { data: Organisation[] } }>('/admin/organisations?page=1&limit=100');
      return response.data.data;
    },
  });

  const datasets = data ?? [];

  const toggleSelected = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
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
      <div>
        <h1 className="text-2xl font-bold">Review Queue</h1>
        <p className="text-muted-foreground mt-1">Manage dataset submissions through the approval pipeline</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search datasets…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 w-10">
                <Checkbox aria-label="Select all" />
              </th>
              <th className="px-4 py-3 font-medium">Dataset Title</th>
              <th className="px-4 py-3 font-medium">Organisation</th>
              <th className="px-4 py-3 font-medium">Format</th>
              <th className="px-4 py-3 font-medium">Visibility</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Age</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={8} />)
            ) : datasets.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-muted-foreground">
                  <p className="text-lg">Queue is empty</p>
                  <p className="text-sm mt-2">No datasets match your filters</p>
                </td>
              </tr>
            ) : (
              datasets.map((dataset) => {
                const org = organisationsData?.data?.find((o) => o.id === dataset.organisation_id);
                return (
                  <tr key={dataset.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(dataset.id)}
                        onCheckedChange={(checked) => toggleSelected(dataset.id, !!checked)}
                        aria-label={`Select ${dataset.title}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium max-w-xs">
                      <Link href={`/datasets/${dataset.slug}`} className="line-clamp-1 hover:underline">
                        {dataset.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{org ? org.name : 'Unknown'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{dataset.format?.toUpperCase()}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize">{dataset.visibility}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={dataset.status} publishedAt={dataset.published_at} />
                    </td>
                    <td className="px-4 py-3">
                      {dataset.status === 'pending' || dataset.status === 'under_review' ? (
                        <AgeBadge submittedAt={dataset.submitted_at || dataset.created_at} />
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {formatDate(dataset.submitted_at || dataset.created_at)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link
                          href={
                            dataset.status === 'pending' || dataset.status === 'under_review'
                              ? `/datasets/${dataset.slug}/review`
                              : `/datasets/${dataset.slug}`
                          }
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                        >
                          <Eye className="size-3.5 mr-1" />
                          {dataset.status === 'pending' || dataset.status === 'under_review' ? 'Review' : 'View'}
                        </Link>
                        {dataset.status === 'approved' && !dataset.published_at && canPublish && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => publishMutation.mutate(dataset.slug)}
                            disabled={publishMutation.isPending}
                            aria-label={`Publish ${dataset.title}`}
                          >
                            <Globe className="size-3.5 mr-1" />
                            Publish
                          </Button>
                        )}
                        {canArchive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setArchiveTarget(dataset)}
                            aria-label={`Archive ${dataset.title}`}
                          >
                            <Archive className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title="Archive dataset?"
        description={`"${archiveTarget?.title}" will be removed from the public catalogue but remains accessible to admins.`}
        confirmLabel="Archive"
        variant="destructive"
        loading={archiveMutation.isPending}
        onConfirm={() => {
          if (!archiveTarget) return;
          archiveMutation.mutate(archiveTarget.slug);
        }}
      />
    </div>
  );
}
