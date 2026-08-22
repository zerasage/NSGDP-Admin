import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/ingestion-review';

const REVIEW_QUEUE_KEY = 'ingestion-review-queue';
const REPORT_KEY = 'ingestion-report';
const COVERAGE_KEY = 'ingestion-coverage';
const RELATED_KEY = 'ingestion-related-datasets';

export function useReviewQueue(datasetId?: string) {
  return useQuery({
    queryKey: [REVIEW_QUEUE_KEY, datasetId],
    queryFn: () => api.getReviewQueue(datasetId),
    enabled: !!datasetId,
  });
}

export function useIngestionReport(datasetId: string) {
  return useQuery({
    queryKey: [REPORT_KEY, datasetId],
    queryFn: () => api.getIngestionReport(datasetId),
    enabled: !!datasetId,
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
      queryClient.invalidateQueries({ queryKey: [REVIEW_QUEUE_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: [REPORT_KEY, datasetId] });
      queryClient.invalidateQueries({ queryKey: ['dataset'] });
    },
  });
}

export function useRejectIndicatorAlias(datasetId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (aliasId: string) => api.rejectIndicatorAlias(aliasId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REVIEW_QUEUE_KEY, datasetId] });
    },
  });
}

export function useNarrateIngestion() {
  return useMutation({
    mutationFn: (datasetId: string) => api.narrateIngestion(datasetId),
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
