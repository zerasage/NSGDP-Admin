import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGisReferenceLayers,
  setGisReferenceLayer,
  rebuildCanonicalWards,
  getGisResolutionReport,
  addWardNameVariant,
  type GisReferenceSlot,
} from '../api/gis-reference';

export function useGisReferenceLayers() {
  return useQuery({
    queryKey: ['gis-reference-layers'],
    queryFn: getGisReferenceLayers,
  });
}

export function useSetGisReferenceLayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slot, datasetId }: { slot: GisReferenceSlot; datasetId: string }) =>
      setGisReferenceLayer(slot, datasetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gis-reference-layers'] });
    },
  });
}

export function useRebuildCanonicalWards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rebuildCanonicalWards,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gis-resolution-report'] });
    },
  });
}

export function useGisResolutionReport(slot: GisReferenceSlot | null) {
  return useQuery({
    queryKey: ['gis-resolution-report', slot],
    queryFn: () => getGisResolutionReport(slot as GisReferenceSlot),
    enabled: !!slot,
  });
}

export function useAddWardNameVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ wardCode, variant }: { wardCode: string; variant: string }) =>
      addWardNameVariant(wardCode, variant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gis-resolution-report'] });
    },
  });
}
