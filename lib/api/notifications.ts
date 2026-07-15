import { apiClient } from './client';
import { API_ROUTES } from './routes';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Get user notifications
 */
export async function getNotifications(
  page = 1,
  limit = 20,
  unreadOnly = false
): Promise<NotificationsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (unreadOnly) {
    params.append('unread_only', 'true');
  }

  const response = await apiClient.get<ApiResponse<NotificationsResponse>>(
    `${API_ROUTES.notifications.list}?${params.toString()}`
  );
  return response.data.data;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(id: string): Promise<{ message: string }> {
  const response = await apiClient.patch<ApiResponse<{ message: string }>>(
    API_ROUTES.notifications.markRead(id)
  );
  return response.data.data;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{ message: string; updated: number }> {
  const response = await apiClient.patch<ApiResponse<{ message: string; updated: number }>>(
    API_ROUTES.notifications.markAllRead
  );
  return response.data.data;
}
