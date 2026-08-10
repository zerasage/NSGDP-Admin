import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProgrammes,
  getProgrammeBySlug,
  createProgramme,
  updateProgramme,
  archiveProgramme,
  type CreateProgrammePayload,
  type UpdateProgrammePayload,
  type GetProgrammesParams,
} from '../api/programs';

export function usePrograms(params?: GetProgrammesParams) {
  return useQuery({
    queryKey: ['programmes', params],
    queryFn: () => getProgrammes(params),
    placeholderData: keepPreviousData,
  });
}

export function useProgramBySlug(slug: string) {
  return useQuery({
    queryKey: ['programme', slug],
    queryFn: () => getProgrammeBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProgrammePayload) => createProgramme(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programmes'] });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateProgrammePayload }) =>
      updateProgramme(slug, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programmes'] });
      queryClient.invalidateQueries({ queryKey: ['programme', variables.slug] });
    },
  });
}

export function useArchiveProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => archiveProgramme(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programmes'] });
    },
  });
}
