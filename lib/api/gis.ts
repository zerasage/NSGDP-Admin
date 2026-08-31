import { apiClient } from './client';
import type { ApiResponse } from '../types/common';

export interface LgaOption {
  name: string;
  code: string | null;
}

interface LgaGisFeatureCollection {
  features: Array<{
    properties: { lga: string; lgaCode: string | null };
  }>;
}

export async function getLgaGisSummary(): Promise<LgaGisFeatureCollection> {
  const response = await apiClient.get<ApiResponse<LgaGisFeatureCollection>>(
    '/gis/lga-summary',
  );
  return response.data.data;
}

export function lgaOptionsFromSummary(
  summary: LgaGisFeatureCollection,
): LgaOption[] {
  return summary.features
    .map((feature) => ({
      name: feature.properties.lga,
      code: feature.properties.lgaCode,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
