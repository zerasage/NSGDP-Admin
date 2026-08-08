import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '../types/common';

export type DocumentType =
  | 'sop'
  | 'policy'
  | 'guideline'
  | 'report'
  | 'research'
  | 'training'
  | 'evaluation'
  | 'other';

export type DocumentStatus = 'draft' | 'published' | 'archived';

export interface AdminDocument {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: DocumentType;
  status: DocumentStatus;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  version: string | null;
  author: string | null;
  organisation_id: string | null;
  programme_id: string | null;
  tags: string[] | null;
  download_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
}

export interface GetDocumentsParams {
  page?: number;
  limit?: number;
  type?: DocumentType;
  status?: DocumentStatus;
  search?: string;
}

export interface CreateDocumentPayload {
  title: string;
  description: string;
  type: DocumentType;
  version?: string;
  author?: string;
  tags?: string[];
}

export interface UpdateDocumentPayload extends Partial<CreateDocumentPayload> {
  status?: DocumentStatus;
}

interface DocumentListApiPayload {
  data: AdminDocument[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export async function getDocuments(
  params?: GetDocumentsParams
): Promise<PaginatedResponse<AdminDocument>> {
  const response = await apiClient.get<ApiResponse<DocumentListApiPayload>>('/documents', {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      type: params?.type,
      status: params?.status,
      search: params?.search,
    },
  });
  const result = response.data.data;
  return {
    data: result.data,
    page: result.meta.page,
    limit: result.meta.limit,
    total: result.meta.total,
    totalPages: result.meta.totalPages,
  };
}

export async function getDocumentBySlug(slug: string): Promise<AdminDocument> {
  const response = await apiClient.get<ApiResponse<AdminDocument>>(`/documents/${slug}`);
  return response.data.data;
}

export async function createDocument(data: CreateDocumentPayload): Promise<AdminDocument> {
  const response = await apiClient.post<ApiResponse<AdminDocument>>('/documents', data);
  return response.data.data;
}

export async function updateDocument(
  slug: string,
  data: UpdateDocumentPayload
): Promise<AdminDocument> {
  const response = await apiClient.patch<ApiResponse<AdminDocument>>(`/documents/${slug}`, data);
  return response.data.data;
}

export async function archiveDocument(slug: string): Promise<void> {
  await apiClient.delete(`/documents/${slug}`);
}
