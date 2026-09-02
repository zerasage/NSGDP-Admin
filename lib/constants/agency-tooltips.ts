export const AGENCY_PAGE_TIP =
  "NSPHCDA is the platform-owning agency — separate from partner organisations (managed under Organisations). Staff belong here and receive admin capabilities through permission groups, not individual role picks. Super admin only.";

export const AGENCY_METRIC_TIPS = {
  staff: "Agency staff accounts with the staff role — access comes from permission groups they belong to.",
  invites: "Outstanding staff invitations not yet accepted.",
  datasets: "Datasets owned by the platform agency (not partner uploads).",
  status: "Whether the agency organisation record is active on the platform.",
} as const;

export const AGENCY_PROFILE_PANEL_TIP =
  "Public-facing contact details for the platform owner shown on the portal. Edit to update name, description, email, phone, website, and address.";

export const AGENCY_EDIT_PROFILE_TIP =
  "Opens the organisation editor for the agency record — changes apply to how the platform owner appears publicly.";

export const AGENCY_STAFF_WORKFLOW_PANEL_TIP =
  "Agency workspace — invite staff, assign them to permission groups elsewhere, and manage agency-owned datasets.";

export const AGENCY_STAFF_TAB_TIPS = {
  staff: "Active agency staff — suspend or revoke access; group membership is managed under Permission Groups.",
  invites: "Pending and historical staff invitations — resend or revoke before acceptance.",
  datasets: "Catalogue datasets owned by the agency — upload, publish, or archive platform data.",
} as const;

export const AGENCY_INVITE_STAFF_TIP =
  "Send an email invitation. The recipient becomes agency staff and must be added to a permission group to receive admin capabilities.";

export const AGENCY_UPLOAD_DATASET_TIP =
  "Upload a dataset attributed to the platform agency — it enters the same review and ingestion pipeline as partner uploads.";
