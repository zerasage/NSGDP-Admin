import { apiClient } from "./client";

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export type ArchiveRequestStatus = "pending" | "approved" | "denied";

export interface DatasetArchiveRequest {
  id: string;
  dataset_id: string;
  requester_id: string;
  reason: string;
  status: ArchiveRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
  dataset?: {
    id: string;
    title: string;
    slug: string;
    status: string;
    development_partner_id: string;
    published_at: string | null;
  } | null;
  requester?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface ArchiveRequestsResponse {
  data: DatasetArchiveRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function getArchiveRequests(params?: {
  status?: ArchiveRequestStatus | "all";
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ArchiveRequestsResponse> {
  const response = await apiClient.get<ApiResponse<ArchiveRequestsResponse>>(
    "/admin/archive-requests",
    { params },
  );
  return response.data.data;
}

export async function getArchiveRequestsPendingCount(): Promise<number> {
  const response = await apiClient.get<ApiResponse<{ count: number }>>(
    "/admin/archive-requests/pending-count",
  );
  return response.data.data.count;
}

export async function approveArchiveRequest(
  id: string,
  reviewComment?: string,
): Promise<DatasetArchiveRequest> {
  const response = await apiClient.post<ApiResponse<DatasetArchiveRequest>>(
    `/admin/archive-requests/${id}/approve`,
    { reviewComment },
  );
  return response.data.data;
}

export async function denyArchiveRequest(
  id: string,
  reviewComment?: string,
): Promise<DatasetArchiveRequest> {
  const response = await apiClient.post<ApiResponse<DatasetArchiveRequest>>(
    `/admin/archive-requests/${id}/deny`,
    { reviewComment },
  );
  return response.data.data;
}
