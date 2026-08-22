import { apiClient } from './client';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface ReviewQueueCandidate {
  indicatorId: string;
  name: string;
  score: number;
  method: string;
}

export interface ReviewQueueItem {
  id: string;
  // Org-unit items appear in this same queue but have no confirm/reject
  // action here — org-unit resolution reuses GisReferenceService, so those
  // are resolved from the existing GIS Reference Layers page instead.
  kind: 'indicator' | 'orgunit';
  rawText: string;
  normalized: string;
  sheetName?: string;
  cellRef?: string;
  datasetId?: string;
  candidates: ReviewQueueCandidate[] | null;
  method: string;
  confidence: string | null;
  indicatorId: string | null;
}

export interface IngestionReport {
  datasetId: string;
  ingestionStatus: string;
  report: Record<string, unknown> | null;
  stagingTotal: number;
  resolved: number;
  byHoldReason: Record<string, number>;
  flagged: number;
}

export interface CoverageRegisterRow {
  id: string;
  dataset_id: string;
  sheet_name: string;
  species: 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'UNKNOWN';
  handler: string | null;
  columns_seen: number | null;
  rows_emitted: number;
  distinct_indicators: number | null;
  resolution_rate: string | null;
  processed_at: string;
}

export interface DatasetRelation {
  id: string;
  dataset_a_id: string;
  dataset_b_id: string;
  overlap_ratio: string;
  shared_keys: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'inactive';
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

export type RelationStatus = 'pending' | 'confirmed' | 'rejected' | 'inactive';

export interface RelationView {
  id: string;
  datasetAId: string;
  datasetATitle: string;
  datasetASlug: string;
  datasetBId: string;
  datasetBTitle: string;
  datasetBSlug: string;
  overlapRatio: string;
  sharedKeys: number;
  status: RelationStatus;
  createdAt: string;
}

export async function getReviewQueue(datasetId?: string, limit?: number): Promise<ReviewQueueItem[]> {
  const response = await apiClient.get<ApiResponse<ReviewQueueItem[]>>(
    '/admin/governance/ingestion/review-queue',
    { params: { datasetId, limit } }
  );
  return response.data.data;
}

export async function confirmIndicatorAlias(aliasId: string, indicatorId: string): Promise<{ promoted: number }> {
  const response = await apiClient.post<ApiResponse<{ promoted: number }>>(
    `/admin/governance/ingestion/aliases/${aliasId}/confirm`,
    { indicatorId }
  );
  return response.data.data;
}

export async function rejectIndicatorAlias(aliasId: string): Promise<void> {
  await apiClient.post(`/admin/governance/ingestion/aliases/${aliasId}/reject`, {});
}

export async function getIngestionReport(datasetId: string): Promise<IngestionReport> {
  const response = await apiClient.get<ApiResponse<IngestionReport>>(
    `/admin/governance/ingestion/datasets/${datasetId}/report`
  );
  return response.data.data;
}

export async function getCoverageRegister(datasetId: string): Promise<CoverageRegisterRow[]> {
  const response = await apiClient.get<ApiResponse<CoverageRegisterRow[]>>(
    `/admin/governance/ingestion/datasets/${datasetId}/coverage`
  );
  return response.data.data;
}

export async function narrateIngestion(datasetId: string): Promise<{ summary: string }> {
  const response = await apiClient.post<ApiResponse<{ summary: string }>>(
    `/admin/governance/ingestion/datasets/${datasetId}/narrate`,
    {}
  );
  return response.data.data;
}

// Lists every status (pending/confirmed/rejected), scoped to one dataset,
// with both dataset titles already joined in for display.
export async function listRelations(params?: {
  datasetId?: string;
  status?: RelationStatus;
}): Promise<RelationView[]> {
  const response = await apiClient.get<ApiResponse<RelationView[]>>(
    '/admin/governance/ingestion/relations',
    { params }
  );
  return response.data.data;
}

export async function confirmRelation(id: string): Promise<DatasetRelation> {
  const response = await apiClient.post<ApiResponse<DatasetRelation>>(
    `/admin/governance/ingestion/relations/${id}/confirm`,
    {}
  );
  return response.data.data;
}

export async function rejectRelation(id: string): Promise<DatasetRelation> {
  const response = await apiClient.post<ApiResponse<DatasetRelation>>(
    `/admin/governance/ingestion/relations/${id}/reject`,
    {}
  );
  return response.data.data;
}
