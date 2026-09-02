export const ACCESS_REQUESTS_PAGE_TIP =
  "Users request access to restricted datasets from the public portal. Approving grants download rights for that dataset; denying requires a reason shown to the requester.";

export const ACCESS_REQUESTS_PANEL_TIP =
  "Filter by status or search requester name, email, or dataset title. Pending requests need a decision before the user can download.";

export const ACCESS_REQUESTS_TAB_TIPS = {
  pending: "Awaiting your approve or deny decision.",
  approved: "Access was granted — the requester can download the dataset.",
  denied: "Access was refused — the requester sees your denial reason.",
  all: "Every request regardless of outcome.",
} as const;

export const ACCESS_REQUESTS_APPROVE_TIP =
  "Grants the requester download access to this restricted dataset. They are notified by email when possible.";

export const ACCESS_REQUESTS_DENY_TIP =
  "Refuses access and prompts you for a reason. The requester sees your comment and may submit a new request later.";

export const ACCESS_REQUESTS_DENY_REASON_TIP =
  "Explain clearly why access cannot be granted — e.g. insufficient justification, wrong organisation, or data sensitivity. Minimum 20 characters.";
