export const ORGANISATIONS_PAGE_TIP =
  "Partner organisations contribute datasets to the portal. Each org needs a signed data-sharing agreement on file — upload it from the organisation detail page. The platform-owning agency (NSPHCDA) is managed separately under Agency.";

export const ORGANISATIONS_METRIC_TIPS = {
  total: "All partner organisations registered on the platform, regardless of status.",
  active: "Organisations enabled to upload datasets and appear in public listings.",
  inactive: "Disabled or suspended organisations — their datasets may still exist but the org is hidden.",
  missingAgreements:
    "Partners without a signed data-sharing agreement PDF on file. Upload from the organisation detail page.",
} as const;

export const ORGANISATIONS_PANEL_TIP =
  "Browse partner organisations, filter by status or type, and search by name, acronym, or email.";

export const ORGANISATIONS_TAB_TIPS = {
  all: "Every partner organisation on the platform.",
  active: "Organisations currently enabled.",
  inactive: "Organisations that have been deactivated.",
} as const;

export const ORGANISATIONS_ADD_TIP =
  "Register a new partner organisation. You can upload their data-sharing agreement and invite members from the detail page.";

export const ORGANISATION_DETAIL_PAGE_TIP =
  "Manage this partner's profile, signed agreement, members, invitations, datasets, and API keys from one workspace.";

export const ORGANISATION_SUMMARY_TIPS = {
  members: "People with accounts linked to this organisation.",
  datasets: "Datasets owned by this organisation across all workflow statuses.",
  pendingInvites: "Outstanding invitations not yet accepted — click to filter the invitations tab.",
  orgAdmins: "Members with org admin role who can manage users and settings for this organisation.",
} as const;

export const ORGANISATION_CONTACT_PANEL_TIP =
  "Official contact details and the internal organisation ID used in API calls and audit logs.";

export const ORGANISATION_AGREEMENT_TIP =
  "Signed PDF data-sharing agreement required before partner datasets can be fully onboarded. Store the signed copy here for compliance.";

export const ORGANISATION_WORKSPACE_TIP =
  "Switch between members, invitations, datasets, and API keys. Summary cards above jump to the matching section.";

export const ORGANISATION_MEMBERS_PANEL_TIP =
  "Manage who belongs to this organisation. Org admins can invite users; contributors can upload datasets.";

export const ORGANISATION_INVITES_PANEL_TIP =
  "Track pending and historical invitations. Resend or revoke invites before they are accepted.";

export const ORGANISATION_DATASETS_PANEL_TIP =
  "All datasets attributed to this organisation. Open a record for review, ingestion, or publishing.";

export const ORGANISATION_API_KEYS_TIP =
  "Programmatic access for this organisation's systems — scoped to their own data, the public catalogue, and approved restricted datasets.";
