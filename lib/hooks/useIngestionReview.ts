import { keepPreviousData, useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import * as api from '../api/ingestion-review';
import { isLiveAnalyticsStatus } from '../utils/analytics-publish-ui';

const REVIEW_QUEUE_KEY = 'ingestion-review-queue';
const REPORT_KEY = 'ingestion-report';
export const ANALYTICS_PUBLISH_STATUS_KEY = 'analytics-publish-status';
export const ANALYTICS_WAREHOUSE_KEY = 'analytics-warehouse';
export const PIPELINE_ATTENTION_KEY = 'pipeline-attention';
export const PIPELINE_COMPLETED_KEY = 'pipeline-completed';
const COVERAGE_KEY = 'ingestion-coverage';
const RELATED_KEY = 'ingestion-related-datasets';
export const INGESTION_PROGRESS_KEY = 'ingestion-progress';
export const IN_FLIGHT_JOBS_KEY = 'ingestion-jobs-in-flight';

export function invalidateDatasetWorkspace(
  queryClient: QueryClient,
  opts: { slug?: string; datasetId?: string } = {},
) {
  if (opts.slug) {
    queryClient.invalidateQueries({ queryKey: ['dataset', opts.slug] });
  } else {
    queryClient.invalidateQueries({ queryKey: ['dataset'] });
  }
  queryClient.invalidateQueries({
    queryKey: opts.datasetId
      ? [ANALYTICS_PUBLISH_STATUS_KEY, opts.datasetId]
      : [ANALYTICS_PUBLISH_STATUS_KEY],
  });
  queryClient.invalidateQueries({ queryKey: [ANALYTICS_WAREHOUSE_KEY] });
  queryClient.invalidateQueries({
    queryKey: opts.datasetId
      ? [INGESTION_PROGRESS_KEY, opts.datasetId]
      : [INGESTION_PROGRESS_KEY],
  });
  queryClient.invalidateQueries({ queryKey: [REPORT_KEY] });
  queryClient.invalidateQueries({ queryKey: [REVIEW_QUEUE_KEY] });
  queryClient.invalidateQueries({ queryKey: [COVERAGE_KEY] });
  queryClient.invalidateQueries({ queryKey: [PIPELINE_ATTENTION_KEY] });
  queryClient.invalidateQueries({ queryKey: [PIPELINE_COMPLETED_KEY] });
  queryClient.invalidateQueries({ queryKey: [IN_FLIGHT_JOBS_KEY] });
  queryClient.invalidateQueries({ queryKey: ['admin', 'datasets'] });
}

function isActiveProgressStatus(status: api.IngestionJobStatus | undefined): boolean {
  return status === 'pending' || status === 'validating' || status === 'processing';
}

export function useReviewQueue(
  datasetId?: string,
  options?: {
    global?: boolean;
    limit?: number;
    enabled?: boolean;
    mode?: api.ReviewQueueMode;
    /** Poll every few seconds (e.g. while ingestion is running). */
    activePoll?: boolean;
  }
) {
  const global = options?.global === true;
  const mode = options?.mode ?? 'pending';
  return useQuery({
    queryKey: [REVIEW_QUEUE_KEY, global ? 'global' : datasetId, options?.limit, mode],
    queryFn: () =>
      api.getReviewQueue(global ? undefined : datasetId, options?.limit, mode),
    enabled:
      options?.enabled !== false && (global || !!datasetId),
    staleTime: 0,
    refetchInterval: options?.activePoll ? 4000 : false,
  });
}

export function useIngestionReport(
  datasetId: string | undefined,
  options?: { activePoll?: boolean },
) {
  return useQuery({
    queryKey: [REPORT_KEY, datasetId],
    queryFn: () => api.getIngestionReport(datasetId!),
    enabled: !!datasetId,
    staleTime: 0,
    refetchInterval: options?.activePoll ? 4000 : false,
  });
}

export function useAnalyticsPublishStatus(datasetId: string | undefined) {
  return useQuery({
    queryKey: [ANALYTICS_PUBLISH_STATUS_KEY, datasetId],
    queryFn: () => api.getAnalyticsPublishStatus(datasetId!),
    enabled: !!datasetId,
    refetchInterval: (query) =>
      isLiveAnalyticsStatus(query.state.data) ? 1500 : false,
  });
}

export function useAnalyticsWarehouse(
  filter: api.AnalyticsWarehouseFilter = 'in_warehouse',
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [ANALYTICS_WAREHOUSE_KEY, filter],
    queryFn: () => api.listAnalyticsWarehouse({ filter, limit: 200 }),
    enabled: options?.enabled !== false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    // Hold the previous filter's rows/summary while the new filter loads so the
    // panel doesn't flash a skeleton / collapse when switching tabs.
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const data = query.state.data;
      if ((data?.summary.loading ?? 0) > 0) return 3000;
      const items = data?.items ?? [];
      const active = items.some(
        (row) =>
          row.phase === 'loading' ||
          row.phase === 'updating' ||
          row.phase === 'retracting' ||
          row.ingestionStatus === 'retracting' ||
          row.publicationStatus === 'publishing' ||
          row.publicationStatus === 'retracting',
      );
      return active ? 2000 : false;
    },
  });
}

export function usePipelineAttention(
  filter: api.PipelineAttentionFilter = 'all',
  options?: { enabled?: boolean; activePoll?: boolean },
) {
  return useQuery({
    queryKey: [PIPELINE_ATTENTION_KEY, filter],
    queryFn: () => api.listPipelineAttention({ filter, limit: 200 }),
    enabled: options?.enabled !== false,
    // Ops board: always fresh on mount / focus, and poll faster while any
    // ingestion job is in flight (rows move here the moment one fails).
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: options?.activePoll ? 5_000 : 20_000,
    // Keep the previous filter's rows/summary on screen while the new filter
    // loads — no skeleton flash or count-to-zero flicker on sub-filter change.
    placeholderData: keepPreviousData,
  });
}

export function usePipelineCompleted(options?: {
  enabled?: boolean;
  activePoll?: boolean;
}) {
  return useQuery({
    queryKey: [PIPELINE_COMPLETED_KEY],
    queryFn: () => api.listPipelineCompleted({ limit: 200 }),
    enabled: options?.enabled !== false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: options?.activePoll ? 5_000 : 25_000,
    placeholderData: keepPreviousData,
  });
}

export function useIngestionProgress(
  datasetId: string | undefined,
  options?: { pollWhileActive?: boolean }
) {
  const pollWhileActive = options?.pollWhileActive !== false;
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [INGESTION_PROGRESS_KEY, datasetId],
    queryFn: () => {
      if (!datasetId) throw new Error('datasetId required');
      return api.getIngestionProgress(datasetId);
    },
    enabled: !!datasetId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    // 1.5s while a run is active; otherwise a slow baseline so a run started
    // from another page / by another admin is still noticed within ~10s.
    refetchInterval: (q) => {
      if (!pollWhileActive) return false;
      return isActiveProgressStatus(q.state.data?.status) ? 1500 : 10_000;
    },
  });

  const prevStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const status = query.data?.status;
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    // Only react to a real transition into a terminal state — not every poll.
    if (
      status !== prev &&
      (status === 'failed' || status === 'cancelled' || status === 'completed')
    ) {
      queryClient.invalidateQueries({ queryKey: ['dataset'] });
      queryClient.invalidateQueries({
        queryKey: [ANALYTICS_PUBLISH_STATUS_KEY, datasetId],
      });
      queryClient.invalidateQueries({ queryKey: [REPORT_KEY] });
      queryClient.invalidateQueries({ queryKey: [REVIEW_QUEUE_KEY] });
      queryClient.invalidateQueries({ queryKey: [COVERAGE_KEY] });
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_WAREHOUSE_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_COMPLETED_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_ATTENTION_KEY] });
      queryClient.invalidateQueries({ queryKey: [IN_FLIGHT_JOBS_KEY] });
    }
  }, [query.data?.status, datasetId, queryClient]);

  return query;
}

export function useInFlightIngestionJobs(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const prevIdsRef = useRef<Set<string>>(new Set());

  const query = useQuery({
    queryKey: [IN_FLIGHT_JOBS_KEY],
    queryFn: () => api.listInFlightIngestionJobs(50),
    enabled: options?.enabled !== false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    // 2s while jobs are running, 4s when idle so a freshly-enqueued or
    // retried job shows up promptly.
    refetchInterval: (query) =>
      (query.state.data?.length ?? 0) > 0 ? 2000 : 4000,
  });

  // When a job drops out of the in-flight list it has finished or failed —
  // push the Completed / Needs-attention / Warehouse views to refresh now
  // instead of waiting for their own interval.
  useEffect(() => {
    const ids = new Set((query.data ?? []).map((job) => job.jobId));
    const prev = prevIdsRef.current;
    let left = false;
    for (const id of prev) {
      if (!ids.has(id)) {
        left = true;
        break;
      }
    }
    prevIdsRef.current = ids;
    if (left) {
      queryClient.invalidateQueries({ queryKey: [PIPELINE_COMPLETED_KEY] });
      queryClient.invalidateQueries({ queryKey: [PIPELINE_ATTENTION_KEY] });
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_WAREHOUSE_KEY] });
    }
  }, [query.data, queryClient]);

  return query;
}

export function useCoverageRegister(datasetId: string) {
  return useQuery({
    queryKey: [COVERAGE_KEY, datasetId],
    queryFn: () => api.getCoverageRegister(datasetId),
    enabled: !!datasetId,
  });
}

export function useRelations(datasetId: string) {
  return useQuery({
    queryKey: [RELATED_KEY, datasetId],
    queryFn: () => api.listRelations({ datasetId }),
    enabled: !!datasetId,
  });
}

export function useConfirmIndicatorAlias(datasetId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ aliasId, indicatorId }: { aliasId: string; indicatorId: string }) =>
      api.confirmIndicatorAlias(aliasId, indicatorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REVIEW_QUEUE_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPORT_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset'] });
      queryClient.invalidateQueries({ queryKey: ['ingestion-observability'] });
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_PUBLISH_STATUS_KEY] });
    },
  });
}

export function useConfirmOrgunitAlias(datasetId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ aliasId, orgunitId }: { aliasId: string; orgunitId: string }) =>
      api.confirmOrgunitAlias(aliasId, orgunitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REVIEW_QUEUE_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPORT_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: ['gis-resolution-report'] });
      queryClient.invalidateQueries({ queryKey: ['ingestion-observability'] });
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_PUBLISH_STATUS_KEY] });
    },
  });
}

export function useRejectIndicatorAlias(datasetId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (aliasId: string) => api.rejectIndicatorAlias(aliasId),
    onMutate: async (aliasId) => {
      await queryClient.cancelQueries({ queryKey: [REVIEW_QUEUE_KEY] });
      const previous = queryClient.getQueriesData<api.ReviewQueueItem[]>({
        queryKey: [REVIEW_QUEUE_KEY],
      });
      queryClient.setQueriesData<api.ReviewQueueItem[]>(
        { queryKey: [REVIEW_QUEUE_KEY] },
        (old) => old?.filter((item) => item.id !== aliasId),
      );
      return { previous };
    },
    onError: (_error, _aliasId, context) => {
      context?.previous?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [REVIEW_QUEUE_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPORT_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset'] });
      queryClient.invalidateQueries({ queryKey: ['ingestion-observability'] });
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_PUBLISH_STATUS_KEY] });
    },
  });
}

export function useRejectIndicatorAliases(datasetId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['reject-indicator-aliases', datasetId ?? 'global'],
    mutationFn: (aliasIds: string[]) => api.rejectIndicatorAliases(aliasIds),
    onMutate: (aliasIds) => {
      const n = aliasIds.length;
      return {
        toastId: toast.loading(
          `Marking ${n.toLocaleString()} label${n === 1 ? "" : "s"} as not an indicator…`,
        ),
      };
    },
    onSuccess: (result, _aliasIds, context) => {
      toast.success(
        `${result.rejected.toLocaleString()} label${
          result.rejected === 1 ? "" : "s"
        } excluded` +
          (result.skipped
            ? ` — ${result.skipped.toLocaleString()} skipped`
            : ""),
        { id: context?.toastId },
      );
      queryClient.invalidateQueries({ queryKey: [REVIEW_QUEUE_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPORT_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset'] });
      queryClient.invalidateQueries({ queryKey: ['ingestion-observability'] });
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_PUBLISH_STATUS_KEY] });
    },
    onError: (error: unknown, _aliasIds, context) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to mark selected labels as not an indicator",
        { id: context?.toastId },
      );
    },
  });
}

export function useAcceptAutoMatchedAliases(datasetId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['accept-auto-matched-aliases', datasetId ?? 'global'],
    mutationFn: (aliasIds: string[]) => api.acceptAutoMatchedAliases(aliasIds),
    onMutate: (aliasIds) => {
      const n = aliasIds.length;
      return {
        toastId: toast.loading(
          `Accepting ${n.toLocaleString()} auto-matched alias${n === 1 ? "" : "es"}…`,
        ),
      };
    },
    onSuccess: (result, _aliasIds, context) => {
      toast.success(
        `Accepted ${result.accepted.toLocaleString()} auto-matched alias${
          result.accepted === 1 ? "" : "es"
        }` +
          (result.skipped
            ? ` — ${result.skipped.toLocaleString()} skipped`
            : ""),
        { id: context?.toastId },
      );
      queryClient.invalidateQueries({ queryKey: [REVIEW_QUEUE_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPORT_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset'] });
      queryClient.invalidateQueries({ queryKey: ['ingestion-observability'] });
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_PUBLISH_STATUS_KEY] });
    },
    onError: (error: unknown, _aliasIds, context) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to accept selected aliases",
        { id: context?.toastId },
      );
    },
  });
}

export function useNarrateIngestion() {
  return useMutation({
    mutationFn: (datasetId: string) => api.narrateIngestion(datasetId),
  });
}

export function useRunDatasetIngestion(datasetId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (opts: { force?: boolean } = {}) => {
      if (!datasetId) throw new Error('datasetId required');
      return api.runDatasetIngestion(datasetId, opts);
    },
    onSuccess: () => {
      invalidateDatasetWorkspace(queryClient, { datasetId });
      // The worker takes a beat to claim the job and flip the status — nudge
      // the progress / in-flight views so the run is tracked without waiting
      // for a poll.
      for (const ms of [1500, 4000]) {
        window.setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: datasetId
              ? [INGESTION_PROGRESS_KEY, datasetId]
              : [INGESTION_PROGRESS_KEY],
          });
          queryClient.invalidateQueries({ queryKey: [IN_FLIGHT_JOBS_KEY] });
          queryClient.invalidateQueries({ queryKey: ['dataset'] });
        }, ms);
      }
    },
  });
}

export function useCancelDatasetIngestion(datasetId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!datasetId) throw new Error('datasetId required');
      return api.cancelDatasetIngestion(datasetId);
    },
    onSuccess: () => {
      invalidateDatasetWorkspace(queryClient, { datasetId });
    },
  });
}

export function useBackfillIngestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (limit?: number) => api.backfillIngestion(limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataset'] });
      queryClient.invalidateQueries({ queryKey: [REPORT_KEY] });
      queryClient.invalidateQueries({ queryKey: [INGESTION_PROGRESS_KEY] });
      queryClient.invalidateQueries({ queryKey: [IN_FLIGHT_JOBS_KEY] });
    },
  });
}

export function useConfirmRelation(datasetId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.confirmRelation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RELATED_KEY, datasetId] });
    },
  });
}

export function useRejectRelation(datasetId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.rejectRelation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RELATED_KEY, datasetId] });
    },
  });
}
