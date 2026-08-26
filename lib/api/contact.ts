import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '../types/common';

export type ContactMessageStatus = 'new' | 'open' | 'closed';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  staff_notes: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactMessageStats {
  total: number;
  new: number;
  open: number;
  closed: number;
}

export interface GetContactMessagesParams {
  page?: number;
  limit?: number;
  status?: ContactMessageStatus;
  search?: string;
}

export interface UpdateContactMessagePayload {
  status?: ContactMessageStatus;
  staffNotes?: string;
}

interface ContactListApiPayload {
  data: ContactMessage[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function getContactMessages(
  params?: GetContactMessagesParams
): Promise<PaginatedResponse<ContactMessage>> {
  const response = await apiClient.get<ApiResponse<ContactListApiPayload>>(
    '/contact',
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

export async function getContactMessageStats(): Promise<ContactMessageStats> {
  const response = await apiClient.get<ApiResponse<ContactMessageStats>>('/contact/stats');
  return response.data.data;
}

export async function updateContactMessage(
  id: string,
  data: UpdateContactMessagePayload
): Promise<ContactMessage> {
  const response = await apiClient.patch<ApiResponse<ContactMessage>>(
    `/contact/${id}`,
    data
  );
  return response.data.data;
}
