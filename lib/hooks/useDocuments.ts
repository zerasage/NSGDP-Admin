import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocuments,
  getDocumentBySlug,
  createDocument,
  updateDocument,
  archiveDocument,
  submitDocumentForReview,
  downloadDocument,
  type CreateDocumentPayload,
  type UpdateDocumentPayload,
  type GetDocumentsParams,
} from '../api/documents';

export function useDocuments(params?: GetDocumentsParams) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => getDocuments(params),
    placeholderData: keepPreviousData,
  });
}

export function useDocumentBySlug(slug: string) {
  return useQuery({
    queryKey: ['document', slug],
    queryFn: () => getDocumentBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDocumentPayload) => createDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateDocumentPayload }) =>
      updateDocument(slug, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.slug] });
    },
  });
}

export function useSubmitDocumentForReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => submitDocumentForReview(slug),
    onSuccess: (_result, slug) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', slug] });
    },
  });
}

export function useArchiveDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => archiveDocument(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useDownloadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      slug,
      mode,
    }: {
      slug: string;
      mode?: 'view' | 'download';
    }) => downloadDocument(slug, mode),
    onSuccess: (_, { slug, mode }) => {
      if (mode !== 'view') {
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['document', slug] });
      }
    },
  });
}
