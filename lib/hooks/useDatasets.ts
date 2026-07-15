import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDatasets,
  getDatasetBySlug,
  createDataset,
  updateDataset,
  deleteDataset,
  submitDataset,
  downloadDataset,
  getDatasetVersions,
  getDatasetPreview,
  type DatasetListParams,
  type CreateDatasetDto,
  type UpdateDatasetDto,
} from '../api/datasets';

/**
 * Hook to fetch datasets with filters and pagination
 */
export function useDatasets(params?: DatasetListParams) {
  return useQuery({
    queryKey: ['datasets', params],
    queryFn: () => getDatasets(params),
    staleTime: 2 * 60 * 1000, // 2 minutes - datasets change frequently
  });
}

/**
 * Hook to fetch a single dataset by slug
 */
export function useDataset(slug: string) {
  return useQuery({
    queryKey: ['dataset', slug],
    queryFn: () => getDatasetBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create a new dataset
 */
export function useCreateDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDatasetDto) => createDataset(data),
    onSuccess: () => {
      // Invalidate datasets list to refetch
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}

/**
 * Hook to update a dataset
 */
export function useUpdateDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateDatasetDto }) =>
      updateDataset(slug, data),
    onSuccess: (_, variables) => {
      // Invalidate specific dataset and list
      queryClient.invalidateQueries({ queryKey: ['dataset', variables.slug] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}

/**
 * Hook to delete a dataset
 */
export function useDeleteDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => deleteDataset(slug),
    onSuccess: () => {
      // Invalidate datasets list
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}

/**
 * Hook to submit a dataset for review
 */
export function useSubmitDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => submitDataset(slug),
    onSuccess: (_, slug) => {
      // Invalidate specific dataset to show updated status
      queryClient.invalidateQueries({ queryKey: ['dataset', slug] });
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    },
  });
}

/**
 * Hook to download a dataset
 */
export function useDownloadDataset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => downloadDataset(slug),
    onSuccess: (_, slug) => {
      // Invalidate to update download count
      queryClient.invalidateQueries({ queryKey: ['dataset', slug] });
    },
  });
}

/**
 * Hook to fetch dataset version history
 */
export function useDatasetVersions(slug: string) {
  return useQuery({
    queryKey: ['dataset-versions', slug],
    queryFn: () => getDatasetVersions(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch dataset preview
 */
export function useDatasetPreview(slug: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['dataset-preview', slug],
    queryFn: () => getDatasetPreview(slug),
    enabled: !!slug && enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - previews are cached
  });
}
