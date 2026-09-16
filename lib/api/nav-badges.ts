import { adminApi } from "./admin";
import { getDocumentReviewQueue } from "./documents";
import { getAccessRequests } from "./access-requests";
import { getPartnerInterests } from "./partner-interest";
import { getArchiveRequestsPendingCount } from "./archive-requests";
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

/**
 * Dataset submissions awaiting the caller's own action — pending +
 * under-review counts only for a Validator (validate:datasets), the
 * validated count only for an Approver (approve:datasets), both for anyone
 * holding both. Which counts to fetch is passed in rather than inferred
 * here, since the two now hit differently-gated endpoints and a holder of
 * only one would 403 on the other's queries.
 */
export async function fetchDatasetReviewBadgeCount(options: {
  includeValidatorCounts: boolean;
  includeApproverCount: boolean;
}): Promise<number> {
  const requests: Promise<number>[] = [];
  if (options.includeValidatorCounts) {
    requests.push(
      fetchAdminListTotal("/admin/review-queue"),
      fetchAdminListTotal("/admin/review-queue/under-review"),
    );
  }
  if (options.includeApproverCount) {
    requests.push(fetchAdminListTotal("/admin/review-queue/validated"));
  }
  const totals = await Promise.all(requests);
  return totals.reduce((sum, n) => sum + n, 0);
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

export async function fetchArchiveRequestsBadgeCount(): Promise<number> {
  return getArchiveRequestsPendingCount();
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
