import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '../types/common';

export type PartnerInterestStatus = 'pending' | 'approved' | 'declined';

export interface PartnerInterest {
  id: string;
  organisation_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  message: string;
  status: PartnerInterestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetPartnerInterestsParams {
  page?: number;
  limit?: number;
  status?: PartnerInterestStatus;
  search?: string;
}

export interface ReviewPartnerInterestPayload {
  status: 'approved' | 'declined';
  reviewComment?: string;
}

interface PartnerInterestListApiPayload {
  data: PartnerInterest[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function getPartnerInterests(
  params?: GetPartnerInterestsParams
): Promise<PaginatedResponse<PartnerInterest>> {
  const response = await apiClient.get<ApiResponse<PartnerInterestListApiPayload>>(
    '/partner-interest',
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        status: params?.status,
        search: params?.search,
      },
    }
  );
  const result = response.data.data;
  return {
    data: result.data,
    page: result.meta.page,
    limit: result.meta.limit,
    total: result.meta.total,
    totalPages: result.meta.totalPages,
  };
}

export async function getPartnerInterestById(id: string): Promise<PartnerInterest> {
  const response = await apiClient.get<ApiResponse<PartnerInterest>>(
    `/partner-interest/${id}`
  );
  return response.data.data;
}

export async function reviewPartnerInterest(
  id: string,
  data: ReviewPartnerInterestPayload
): Promise<PartnerInterest> {
  const response = await apiClient.patch<ApiResponse<PartnerInterest>>(
    `/partner-interest/${id}`,
    data
  );
  return response.data.data;
}
