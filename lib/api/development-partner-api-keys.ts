import { apiClient } from './client';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface DevelopmentPartnerApiKeyListItem {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface GeneratedDevelopmentPartnerApiKey {
  id: string;
  name: string;
  key: string; // raw secret — shown once, never retrievable again
  keyPrefix: string;
  createdAt: string;
}

export async function getDevelopmentPartnerApiKeys(
  developmentPartnerId: string
): Promise<DevelopmentPartnerApiKeyListItem[]> {
  const response = await apiClient.get<ApiResponse<DevelopmentPartnerApiKeyListItem[]>>(
    `/admin/development-partners/${developmentPartnerId}/api-keys`
  );
  return response.data.data;
}

export async function createDevelopmentPartnerApiKey(
  developmentPartnerId: string,
  name: string
): Promise<GeneratedDevelopmentPartnerApiKey> {
  const response = await apiClient.post<ApiResponse<GeneratedDevelopmentPartnerApiKey>>(
    `/admin/development-partners/${developmentPartnerId}/api-keys`,
    { name }
  );
  return response.data.data;
}

export async function revokeDevelopmentPartnerApiKey(
  developmentPartnerId: string,
  keyId: string
): Promise<void> {
  await apiClient.delete(`/admin/development-partners/${developmentPartnerId}/api-keys/${keyId}`);
}
