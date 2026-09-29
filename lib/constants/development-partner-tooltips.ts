export const DEVELOPMENT_PARTNERS_PAGE_TIP =
  "Development partners contribute datasets to the portal. Each partner needs a signed data-sharing agreement on file — upload it from the development partner detail page. The platform-owning agency (NSPHCDA) is managed separately under Agency.";

export const DEVELOPMENT_PARTNERS_METRIC_TIPS = {
  total: "All development partners registered on the platform, regardless of status.",
  active: "Development partners enabled to upload datasets and appear in public listings.",
  inactive: "Disabled or suspended development partners — their datasets may still exist but the partner is hidden.",
  missingAgreements:
    "Partners without a signed data-sharing agreement PDF on file. Upload from the development partner detail page.",
} as const;

export const DEVELOPMENT_PARTNERS_PANEL_TIP =
  "Browse development partners, filter by status or type, and search by name, acronym, or email.";

export const DEVELOPMENT_PARTNERS_TAB_TIPS = {
  all: "Every development partner on the platform.",
  active: "Development partners currently enabled.",
  inactive: "Development partners that have been deactivated.",
} as const;

export const DEVELOPMENT_PARTNERS_ADD_TIP =
  "Register a new development partner. You can upload their data-sharing agreement and invite members from the detail page.";

export const DEVELOPMENT_PARTNER_DETAIL_PAGE_TIP =
  "Manage this partner's profile, signed agreement, members, invitations, datasets, and API keys from one workspace.";

export const DEVELOPMENT_PARTNER_SUMMARY_TIPS = {
  members: "People with accounts linked to this development partner.",
  datasets: "Datasets owned by this development partner across all workflow statuses.",
  pendingInvites: "Outstanding invitations not yet accepted — click to filter the invitations tab.",
  orgAdmins: "Members with admin role who can manage users and settings for this development partner.",
} as const;

export const DEVELOPMENT_PARTNER_CONTACT_PANEL_TIP =
  "Official contact details and the internal development partner ID used in API calls and audit logs.";

export const DEVELOPMENT_PARTNER_AGREEMENT_TIP =
  "Signed PDF data-sharing agreement required before partner datasets can be fully onboarded. Store the signed copy here for compliance.";

export const DEVELOPMENT_PARTNER_WORKSPACE_TIP =
  "Switch between members, invitations, datasets, and API keys. Summary cards above jump to the matching section.";

export const DEVELOPMENT_PARTNER_MEMBERS_PANEL_TIP =
  "Manage who belongs to this development partner. Admins can invite users; contributors can upload datasets.";

export const DEVELOPMENT_PARTNER_INVITES_PANEL_TIP =
  "Track pending and historical invitations. Resend or revoke invites before they are accepted.";

export const DEVELOPMENT_PARTNER_DATASETS_PANEL_TIP =
  "All datasets attributed to this development partner. Open a record for review, ingestion, or publishing.";
