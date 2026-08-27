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

export type DocumentStatus =
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'archived';

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
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
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
  organisationId?: string;
  programmeId?: string;
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

export async function submitDocumentForReview(slug: string): Promise<AdminDocument> {
  const response = await apiClient.post<ApiResponse<AdminDocument>>(
    `/documents/${slug}/submit-for-review`,
    {}
  );
  return response.data.data;
}

export async function archiveDocument(slug: string): Promise<void> {
  await apiClient.delete(`/documents/${slug}`);
}

export async function getDocumentReviewQueue(params?: {
  page?: number;
  limit?: number;
  status?: 'pending' | 'under_review' | 'approved';
  search?: string;
}): Promise<PaginatedResponse<AdminDocument>> {
  const response = await apiClient.get<ApiResponse<DocumentListApiPayload>>(
    '/admin/documents/review-queue',
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        status: params?.status ?? 'pending',
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

export async function markDocumentUnderReview(slug: string): Promise<AdminDocument> {
  const response = await apiClient.post<ApiResponse<AdminDocument>>(
    `/admin/documents/${slug}/mark-under-review`,
    {}
  );
  return response.data.data;
}

export async function approveDocument(
  slug: string,
  comment?: string
): Promise<AdminDocument> {
  const response = await apiClient.post<ApiResponse<AdminDocument>>(
    `/admin/documents/${slug}/approve`,
    comment ? { comment } : {}
  );
  return response.data.data;
}

export async function rejectDocument(slug: string, reason: string): Promise<AdminDocument> {
  const response = await apiClient.post<ApiResponse<AdminDocument>>(
    `/admin/documents/${slug}/reject`,
    { reason }
  );
  return response.data.data;
}

export async function requestDocumentRevision(
  slug: string,
  comment: string
): Promise<AdminDocument> {
  const response = await apiClient.post<ApiResponse<AdminDocument>>(
    `/admin/documents/${slug}/request-revision`,
    { comment }
  );
  return response.data.data;
}

export async function publishDocument(slug: string): Promise<AdminDocument> {
  const response = await apiClient.post<ApiResponse<AdminDocument>>(
    `/admin/documents/${slug}/publish`,
    {}
  );
  return response.data.data;
}

export async function unpublishDocument(slug: string): Promise<AdminDocument> {
  const response = await apiClient.post<ApiResponse<AdminDocument>>(
    `/admin/documents/${slug}/unpublish`,
    {}
  );
  return response.data.data;
}

export async function downloadDocument(
  slug: string
): Promise<{ downloadUrl: string; fileName: string }> {
  const response = await apiClient.post<
    ApiResponse<{ downloadUrl: string; fileName: string }>
  >(`/documents/${slug}/download`);
  return response.data.data;
}
