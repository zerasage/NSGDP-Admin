import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import * as api from '../api/ingestion-review';

const REVIEW_QUEUE_KEY = 'ingestion-review-queue';
const REPORT_KEY = 'ingestion-report';
export const ANALYTICS_PUBLISH_STATUS_KEY = 'analytics-publish-status';
const COVERAGE_KEY = 'ingestion-coverage';
const RELATED_KEY = 'ingestion-related-datasets';
export const INGESTION_PROGRESS_KEY = 'ingestion-progress';
export const IN_FLIGHT_JOBS_KEY = 'ingestion-jobs-in-flight';

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
  });
}

export function useIngestionReport(datasetId: string | undefined) {
  return useQuery({
    queryKey: [REPORT_KEY, datasetId],
    queryFn: () => api.getIngestionReport(datasetId!),
    enabled: !!datasetId,
  });
}

export function useAnalyticsPublishStatus(datasetId: string | undefined) {
  return useQuery({
    queryKey: [ANALYTICS_PUBLISH_STATUS_KEY, datasetId],
    queryFn: () => api.getAnalyticsPublishStatus(datasetId!),
    enabled: !!datasetId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.phase === 'loading' || data?.phase === 'updating') return 2000;
      if (data?.ingestionInProgress) return 2000;
      return false;
    },
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
    refetchInterval: (q) => {
      if (!pollWhileActive) return false;
      return isActiveProgressStatus(q.state.data?.status) ? 2000 : false;
    },
  });

  useEffect(() => {
    const status = query.data?.status;
    if (
      status === 'failed' ||
      status === 'cancelled' ||
      status === 'completed'
    ) {
      queryClient.invalidateQueries({ queryKey: ['dataset'] });
      queryClient.invalidateQueries({
        queryKey: [ANALYTICS_PUBLISH_STATUS_KEY, datasetId],
      });
    }
  }, [query.data?.status, datasetId, queryClient]);

  return query;
}

export function useInFlightIngestionJobs(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [IN_FLIGHT_JOBS_KEY],
    queryFn: () => api.listInFlightIngestionJobs(50),
    enabled: options?.enabled !== false,
    refetchInterval: (query) =>
      (query.state.data?.length ?? 0) > 0 ? 2000 : 10_000,
  });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REVIEW_QUEUE_KEY] });
      queryClient.invalidateQueries({ queryKey: [REPORT_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset'] });
      queryClient.invalidateQueries({ queryKey: ['ingestion-observability'] });
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_PUBLISH_STATUS_KEY] });
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
      queryClient.invalidateQueries({ queryKey: [REPORT_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: [REVIEW_QUEUE_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: [INGESTION_PROGRESS_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_PUBLISH_STATUS_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: [IN_FLIGHT_JOBS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['dataset'] });
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
      queryClient.invalidateQueries({ queryKey: [REPORT_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: [REVIEW_QUEUE_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: [INGESTION_PROGRESS_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_PUBLISH_STATUS_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: [IN_FLIGHT_JOBS_KEY] });
      queryClient.invalidateQueries({ queryKey: ['dataset'] });
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
