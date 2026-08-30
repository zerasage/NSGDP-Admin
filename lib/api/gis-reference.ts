import { apiClient, apiUpload } from './client';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

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

/** Layers whose raw LGA/ward strings can be reconciled against the gazetteer. */
export const GIS_RECONCILABLE_SLOTS = [
  'ward_boundaries',
  'facility_registry',
  'settlements',
] as const satisfies readonly GisReferenceSlot[];

export type GisReconcilableSlot = (typeof GIS_RECONCILABLE_SLOTS)[number];

export function isGisReconcilableSlot(slot: GisReferenceSlot): slot is GisReconcilableSlot {
  return (GIS_RECONCILABLE_SLOTS as readonly GisReferenceSlot[]).includes(slot);
}

export const GIS_SLOT_LABELS: Record<GisReferenceSlot, string> = {
  lga_boundaries: 'LGA Boundaries',
  ward_boundaries: 'Ward Boundaries',
  facility_registry: 'Health Facility Registry',
  population: 'LGA Population Estimates',
  settlements: 'Settlements (MLoS)',
};

export const GIS_SLOT_ACCEPT: Record<GisReferenceSlot, string> = {
  lga_boundaries: '.gpkg',
  ward_boundaries: '.gpkg',
  facility_registry: '.gpkg',
  population: '.csv, .xlsx',
  settlements: '.gpkg',
};

export interface GisReferenceLayer {
  slot: GisReferenceSlot;
  source: 'file' | 'dataset' | null;
  fileId: string | null;
  filename: string | null;
  label: string | null;
  datasetId: string | null;
  datasetName: string | null;
  datasetSlug: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface GisResolutionCandidate {
  wardCode: string;
  wardName: string;
  lgaName: string;
  score: number;
}

export interface GisResolutionReport {
  slot: GisReferenceSlot;
  totalPairs: number;
  matched: number;
  unmatched: Array<{
    lga: string;
    ward: string;
    candidates: GisResolutionCandidate[];
  }>;
  matchRate: number;
  belowCoverageThreshold: boolean;
}

export interface RebuildCanonicalWardsResult {
  created: number;
  updated: number;
  total: number;
}

export interface GisUploadResult {
  slot: GisReferenceSlot;
  fileId: string;
  filename: string;
  label: string | null;
  updatedAt: string;
  jobId: string | null;
  rebuildStatus: 'queued' | 'refreshed' | 'skipped';
}

export interface GisJobStatus {
  jobId: string;
  status: string;
  progress: number;
  stage?: string | null;
  queued?: boolean;
  failedReason?: string | null;
}

export interface WardSearchResult {
  wardId: string;
  wardName: string;
  lgaName: string;
  score: number;
}

export async function getGisReferenceLayers(): Promise<GisReferenceLayer[]> {
  const response = await apiClient.get<ApiResponse<GisReferenceLayer[]>>(
    '/admin/gis-reference-layers',
  );
  return response.data.data;
}

export async function uploadGisReferenceLayer(
  slot: GisReferenceSlot,
  file: File,
  label?: string,
): Promise<GisUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (label?.trim()) formData.append('label', label.trim());
  const response = await apiUpload<ApiResponse<GisUploadResult>>(
    `/admin/gis-reference-layers/${slot}/upload`,
    formData,
  );
  return response.data;
}

export async function getGisJobStatus(jobId: string): Promise<GisJobStatus> {
  const response = await apiClient.get<ApiResponse<GisJobStatus>>(
    `/admin/gis-reference-layers/jobs/${encodeURIComponent(jobId)}`,
  );
  return response.data.data;
}

/** Deprecated escape hatch — catalogue dataset assignment */
export async function setGisReferenceLayer(
  slot: GisReferenceSlot,
  datasetId: string,
): Promise<unknown> {
  const response = await apiClient.put<ApiResponse<unknown>>(
    `/admin/gis-reference-layers/${slot}`,
    { datasetId },
  );
  return response.data.data;
}

export async function rebuildCanonicalWards(): Promise<RebuildCanonicalWardsResult> {
  const response = await apiClient.post<ApiResponse<RebuildCanonicalWardsResult>>(
    '/admin/gis-reference-layers/rebuild',
  );
  return response.data.data;
}

export async function getGisResolutionReport(
  slot: GisReferenceSlot,
): Promise<GisResolutionReport> {
  const response = await apiClient.get<ApiResponse<GisResolutionReport>>(
    `/admin/gis-reference-layers/${slot}/resolution-report`,
  );
  return response.data.data;
}

export async function searchWardsInLga(
  lga: string,
  q?: string,
): Promise<WardSearchResult[]> {
  const response = await apiClient.get<ApiResponse<WardSearchResult[]>>(
    '/admin/gis-reference-layers/wards/search',
    { params: { lga, q } },
  );
  return response.data.data;
}

export async function confirmGisWardAlias(params: {
  rawLga: string;
  rawWard: string;
  wardId: string;
}): Promise<void> {
  await apiClient.post('/admin/gis-reference-layers/wards/confirm', params);
}

export async function addWardNameVariant(
  wardCode: string,
  variant: string,
): Promise<void> {
  await apiClient.post(`/admin/gis-reference-layers/wards/${wardCode}/variants`, {
    variant,
  });
}
