import { apiClient } from './client';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface DatasetPreviewResult {
  dataset: unknown;
  preview: {
    type: 'tabular' | 'geojson' | 'json' | 'spatial' | 'document' | 'unknown' | 'error';
    format?: string;
    message?: string;
    columns?: string[];
    rows?: Record<string, unknown>[];
    totalRows?: number | string;
    previewRows?: number;
    isPartialPreview?: boolean;
    features?: unknown[];
    totalFeatures?: number;
    bbox?: number[];
    records?: Record<string, unknown>[];
    totalRecords?: number;
    data?: unknown;
    keys?: string[];
    totalKeys?: number;
    error?: string;
  };
  cached: boolean;
  rowCount?: number;
}

/**
 * Preview a dataset regardless of status/organisation/ownership — for admin
 * review, where the dataset being previewed is by definition not yet approved.
 */
export async function getAdminDatasetPreview(slug: string): Promise<DatasetPreviewResult> {
  const response = await apiClient.get<ApiResponse<DatasetPreviewResult>>(
    `/admin/datasets/${slug}/preview`
  );
  return response.data.data;
}
