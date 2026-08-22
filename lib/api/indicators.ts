import { apiClient } from './client';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export type IndicatorCanonicalSource = 'nhmis-dhis2' | 'ocl' | 'local';

export interface Indicator {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  unit: string | null;
  description: string | null;
  dhis2_data_element_id: string | null;
  dhis2_indicator_id: string | null;
  is_active: boolean;
  display_order: number;
  succeeds_indicator_id: string | null;
  canonical_source: IndicatorCanonicalSource | null;
  first_seen_dataset_id: string | null;
  created_at: string;
  updated_at: string;
  revisionCount: number;
}

export interface IndicatorRevision {
  id: string;
  indicator_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface CreateIndicatorPayload {
  name: string;
  slug?: string;
  category?: string;
  unit?: string;
  description?: string;
  dhis2DataElementId?: string;
  dhis2IndicatorId?: string;
  canonicalSource?: IndicatorCanonicalSource;
  succeedsIndicatorId?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export type UpdateIndicatorPayload = Partial<CreateIndicatorPayload>;

// No single-indicator GET exists on the backend — the list is the only
// source of truth, same as OrganisationGroups before it grew a detail
// endpoint. Callers find-by-id against the already-fetched list.
export async function getIndicators(): Promise<Indicator[]> {
  const response = await apiClient.get<ApiResponse<Indicator[]>>('/admin/governance/indicators');
  return response.data.data;
}

export async function createIndicator(payload: CreateIndicatorPayload): Promise<Indicator> {
  const response = await apiClient.post<ApiResponse<Indicator>>('/admin/governance/indicators', payload);
  return response.data.data;
}

export async function updateIndicator(id: string, payload: UpdateIndicatorPayload): Promise<Indicator> {
  const response = await apiClient.patch<ApiResponse<Indicator>>(`/admin/governance/indicators/${id}`, payload);
  return response.data.data;
}

// The backend's DELETE route archives (is_active=false) rather than
// hard-deleting — there is no destructive delete for indicators, since
// staging/burden rows and confirmed aliases can reference one.
export async function archiveIndicator(id: string): Promise<Indicator> {
  const response = await apiClient.delete<ApiResponse<Indicator>>(`/admin/governance/indicators/${id}`);
  return response.data.data;
}

export async function activateIndicator(id: string): Promise<Indicator> {
  return updateIndicator(id, { isActive: true });
}

export async function getIndicatorRevisions(id: string): Promise<IndicatorRevision[]> {
  const response = await apiClient.get<ApiResponse<IndicatorRevision[]>>(
    `/admin/governance/indicators/${id}/revisions`
  );
  return response.data.data;
}
