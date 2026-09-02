"use client";

import { useQueries } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import {
  fetchAccessRequestsBadgeCount,
  fetchContactMessagesBadgeCount,
  fetchDatasetReviewBadgeCount,
  fetchDocumentReviewBadgeCount,
  fetchPartnerInterestBadgeCount,
} from "@/lib/api/nav-badges";

const BADGE_STALE_MS = 60_000;

export type AdminNavBadgeKey =
  | "datasetReviewQueue"
  | "documentReviewQueue"
  | "accessRequests"
  | "partnerInterest"
  | "contactMessages";

export type AdminNavBadgeCounts = Partial<Record<AdminNavBadgeKey, number>>;

export function useAdminNavBadges(): {
  counts: AdminNavBadgeCounts;
  isLoading: boolean;
} {
  const { user } = useAuth();
  const { can, canAny } = useAdminAccess();
  const isSuperAdmin = user?.role === "super_admin";

  const canDatasetQueue = isSuperAdmin || canAny("approve:datasets", "publish:datasets");
  const canDocumentQueue = isSuperAdmin || can("manage:documents");
  const canAccessRequests =
    isSuperAdmin || canAny("view:access-requests", "approve:access-requests");
  const canPartnerInterest =
    isSuperAdmin || canAny("view:partner-interest", "review:partner-interest");
  const canContact =
    isSuperAdmin || canAny("view:contact-messages", "review:contact-messages");

  const results = useQueries({
    queries: [
      {
        queryKey: ["admin-nav-badge", "datasetReviewQueue"],
        queryFn: fetchDatasetReviewBadgeCount,
        enabled: canDatasetQueue,
        staleTime: BADGE_STALE_MS,
        refetchInterval: BADGE_STALE_MS,
      },
      {
        queryKey: ["admin-nav-badge", "documentReviewQueue"],
        queryFn: fetchDocumentReviewBadgeCount,
        enabled: canDocumentQueue,
        staleTime: BADGE_STALE_MS,
        refetchInterval: BADGE_STALE_MS,
      },
      {
        queryKey: ["admin-nav-badge", "accessRequests"],
        queryFn: fetchAccessRequestsBadgeCount,
        enabled: canAccessRequests,
        staleTime: BADGE_STALE_MS,
        refetchInterval: BADGE_STALE_MS,
      },
      {
        queryKey: ["admin-nav-badge", "partnerInterest"],
        queryFn: fetchPartnerInterestBadgeCount,
        enabled: canPartnerInterest,
        staleTime: BADGE_STALE_MS,
        refetchInterval: BADGE_STALE_MS,
      },
      {
        queryKey: ["admin-nav-badge", "contactMessages"],
        queryFn: fetchContactMessagesBadgeCount,
        enabled: canContact,
        staleTime: BADGE_STALE_MS,
        refetchInterval: BADGE_STALE_MS,
      },
    ],
  });

  const counts: AdminNavBadgeCounts = {};
  if (canDatasetQueue && (results[0].data ?? 0) > 0) {
    counts.datasetReviewQueue = results[0].data;
  }
  if (canDocumentQueue && (results[1].data ?? 0) > 0) {
    counts.documentReviewQueue = results[1].data;
  }
  if (canAccessRequests && (results[2].data ?? 0) > 0) {
    counts.accessRequests = results[2].data;
  }
  if (canPartnerInterest && (results[3].data ?? 0) > 0) {
    counts.partnerInterest = results[3].data;
  }
  if (canContact && (results[4].data ?? 0) > 0) {
    counts.contactMessages = results[4].data;
  }

  return {
    counts,
    isLoading: results.some((q) => q.isLoading),
  };
}
