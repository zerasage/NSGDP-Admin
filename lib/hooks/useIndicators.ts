import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/indicators';
import type { CreateIndicatorPayload, UpdateIndicatorPayload } from '../api/indicators';

const QUERY_KEY = 'indicators';
const REVISIONS_KEY = 'indicator-revisions';

export function useIndicators() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: api.getIndicators,
  });
}

export function useIndicatorRevisions(id: string) {
  return useQuery({
    queryKey: [REVISIONS_KEY, id],
    queryFn: () => api.getIndicatorRevisions(id),
    enabled: !!id,
  });
}

export function useCreateIndicator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIndicatorPayload) => api.createIndicator(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateIndicator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateIndicatorPayload }) =>
      api.updateIndicator(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [REVISIONS_KEY, variables.id] });
    },
  });
}

export function useActivateIndicator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.activateIndicator(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [REVISIONS_KEY, id] });
    },
  });
}

export function useArchiveIndicator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.archiveIndicator(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [REVISIONS_KEY, id] });
    },
  });
}
