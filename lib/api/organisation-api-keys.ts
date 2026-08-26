import { apiClient } from './client';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface OrganisationApiKeyListItem {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface GeneratedOrganisationApiKey {
  id: string;
  name: string;
  key: string; // raw secret — shown once, never retrievable again
  keyPrefix: string;
  createdAt: string;
}

export async function getOrganisationApiKeys(
  organisationId: string
): Promise<OrganisationApiKeyListItem[]> {
  const response = await apiClient.get<ApiResponse<OrganisationApiKeyListItem[]>>(
    `/admin/organisations/${organisationId}/api-keys`
  );
  return response.data.data;
}

export async function createOrganisationApiKey(
  organisationId: string,
  name: string
): Promise<GeneratedOrganisationApiKey> {
  const response = await apiClient.post<ApiResponse<GeneratedOrganisationApiKey>>(
    `/admin/organisations/${organisationId}/api-keys`,
    { name }
  );
  return response.data.data;
}

export async function revokeOrganisationApiKey(
  organisationId: string,
  keyId: string
): Promise<void> {
  await apiClient.delete(`/admin/organisations/${organisationId}/api-keys/${keyId}`);
}
