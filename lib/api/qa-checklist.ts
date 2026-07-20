import { apiClient } from './client';
import type { QAResult } from '@/components/data/qa-checklist-item';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface QAChecklistItemPayload {
  dimensionId: string;
  result: QAResult;
  notes?: string;
}

export interface SubmissionTicket {
  id: string;
  dataset_id: string;
  status: string;
  qa_checklist: QAChecklistItemPayload[] | null;
}

export async function saveQAChecklist(
  slug: string,
  items: QAChecklistItemPayload[]
): Promise<SubmissionTicket> {
  const response = await apiClient.patch<ApiResponse<SubmissionTicket>>(
    `/admin/datasets/${slug}/qa-checklist`,
    { items }
  );
  return response.data.data;
}
