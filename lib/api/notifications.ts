import { apiClient } from './client';
import { API_ROUTES } from './routes';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

// Mirrors backend NotificationType (src/modules/notifications/entities/notification.entity.ts)
export type NotificationType =
  | 'dataset_approved'
  | 'dataset_rejected'
  | 'dataset_revision_requested'
  | 'account_approved'
  | 'account_suspended'
  | 'new_dataset_available'
  | 'system_announcement'
  | 'dataset_published'
  | 'new_organisation'
  | 'new_user'
  | 'admin_invited';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  data?: Record<string, unknown>;
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
 * Convert legacy notification links into routes owned by the standalone admin app.
 * Older backend notifications included the API's `/admin` prefix, while this
 * frontend mounts admin pages directly at the root.
 */
export function getAdminNotificationHref(link: string | null): string {
  if (!link) return '/notifications';
  if (link === '/admin/review-queue' || link === '/review-queue') return '/datasets';
  if (link === '/admin') return '/';
  if (link.startsWith('/admin/')) return link.slice('/admin'.length);
  return link;
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
