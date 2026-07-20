import { apiClient } from './client';
import type { PaginatedResponse } from '../types/common';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export type AccessRequestStatus = 'pending' | 'approved' | 'denied';

export interface AccessRequest {
  id: string;
  dataset_id: string;
  requester_id: string;
  reason: string;
  status: AccessRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
  requester_email: string;
  requester_name: string;
  dataset_title: string;
  dataset_slug: string;
}

export async function getAccessRequests(params?: {
  status?: AccessRequestStatus;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AccessRequest>> {
  const response = await apiClient.get<ApiResponse<PaginatedResponse<AccessRequest>>>(
    '/admin/access-requests',
    { params: params as Record<string, unknown> }
  );
  return response.data.data;
}

export async function approveAccessRequest(id: string): Promise<AccessRequest> {
  const response = await apiClient.post<ApiResponse<AccessRequest>>(
    `/admin/access-requests/${id}/approve`
  );
  return response.data.data;
}

export async function denyAccessRequest(id: string, comment: string): Promise<AccessRequest> {
  const response = await apiClient.post<ApiResponse<AccessRequest>>(
    `/admin/access-requests/${id}/deny`,
    { comment }
  );
  return response.data.data;
}
