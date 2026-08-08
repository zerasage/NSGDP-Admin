import { apiClient } from './client';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

// Mirrors nsgdp-backend src/modules/gis/entities/gis-reference-layer.entity.ts
export type GisReferenceSlot =
  | 'lga_boundaries'
  | 'ward_boundaries'
  | 'facility_registry'
  | 'population'
  | 'settlements';

export const GIS_REFERENCE_SLOTS: GisReferenceSlot[] = [
  'lga_boundaries',
  'ward_boundaries',
  'facility_registry',
  'population',
  'settlements',
];

export const GIS_SLOT_LABELS: Record<GisReferenceSlot, string> = {
  lga_boundaries: 'LGA Boundaries',
  ward_boundaries: 'Ward Boundaries',
  facility_registry: 'Health Facility Registry',
  population: 'LGA Population Estimates',
  settlements: 'Settlements (MLoS)',
};

export interface GisReferenceLayer {
  slot: GisReferenceSlot;
  datasetId: string | null;
  datasetName: string | null;
  datasetSlug: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface GisResolutionReport {
  slot: GisReferenceSlot;
  totalPairs: number;
  matched: number;
  unmatched: Array<{ lga: string; ward: string }>;
}

export interface RebuildCanonicalWardsResult {
  created: number;
  updated: number;
  total: number;
}

export async function getGisReferenceLayers(): Promise<GisReferenceLayer[]> {
  const response = await apiClient.get<ApiResponse<GisReferenceLayer[]>>(
    '/admin/gis-reference-layers'
  );
  return response.data.data;
}

export async function setGisReferenceLayer(
  slot: GisReferenceSlot,
  datasetId: string
): Promise<GisReferenceLayer> {
  const response = await apiClient.put<ApiResponse<GisReferenceLayer>>(
    `/admin/gis-reference-layers/${slot}`,
    { datasetId }
  );
  return response.data.data;
}

export async function rebuildCanonicalWards(): Promise<RebuildCanonicalWardsResult> {
  const response = await apiClient.post<ApiResponse<RebuildCanonicalWardsResult>>(
    '/admin/gis-reference-layers/rebuild'
  );
  return response.data.data;
}

export async function getGisResolutionReport(
  slot: GisReferenceSlot
): Promise<GisResolutionReport> {
  const response = await apiClient.get<ApiResponse<GisResolutionReport>>(
    `/admin/gis-reference-layers/${slot}/resolution-report`
  );
  return response.data.data;
}

export async function addWardNameVariant(
  wardCode: string,
  variant: string
): Promise<void> {
  await apiClient.post(`/admin/gis-reference-layers/wards/${wardCode}/variants`, {
    variant,
  });
}
