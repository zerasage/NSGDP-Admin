import { adminApi } from "./admin";
import { getDocumentReviewQueue } from "./documents";
import { getAccessRequests } from "./access-requests";
import { getPartnerInterests } from "./partner-interest";
import { getContactMessageStats } from "./contact";

interface PaginatedMeta {
  meta: { total: number };
}

async function fetchAdminListTotal(path: string): Promise<number> {
  const response = await adminApi.get<{ data: PaginatedMeta }>(
    `${path}?page=1&limit=1`,
  );
  return response.data.data.meta.total;
}

/** Pending + under-review dataset submissions awaiting staff action. */
export async function fetchDatasetReviewBadgeCount(): Promise<number> {
  const [pending, underReview] = await Promise.all([
    fetchAdminListTotal("/admin/review-queue"),
    fetchAdminListTotal("/admin/review-queue/under-review"),
  ]);
  return pending + underReview;
}

export async function fetchDocumentReviewBadgeCount(): Promise<number> {
  const [pending, underReview] = await Promise.all([
    getDocumentReviewQueue({ page: 1, limit: 1, status: "pending" }),
    getDocumentReviewQueue({ page: 1, limit: 1, status: "under_review" }),
  ]);
  return pending.total + underReview.total;
}

export async function fetchAccessRequestsBadgeCount(): Promise<number> {
  const result = await getAccessRequests({ status: "pending", page: 1, limit: 1 });
  return result.meta.total;
}

export async function fetchPartnerInterestBadgeCount(): Promise<number> {
  const result = await getPartnerInterests({ status: "pending", page: 1, limit: 1 });
  return result.total;
}

/** Unread contact form submissions. */
export async function fetchContactMessagesBadgeCount(): Promise<number> {
  const stats = await getContactMessageStats();
  return stats.new;
}
