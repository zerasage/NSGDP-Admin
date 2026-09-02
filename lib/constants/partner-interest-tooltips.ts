export const PARTNER_INTEREST_PAGE_TIP =
  "Organisations express interest in contributing data via the public portal. Review submissions here — approving records your decision but does not create an org or send email automatically.";

export const PARTNER_INTEREST_INFO_TIP =
  "After approval, follow up manually: create the organisation in Admin, then send an invite. Declining does not notify the contact — email them if you want to explain.";

export const PARTNER_INTEREST_PANEL_TIP =
  "Filter by status or search organisation name, contact name, email, or message text. Work the Pending queue first.";

export const PARTNER_INTEREST_TAB_TIPS = {
  pending: "New submissions waiting for approve or decline.",
  approved: "Vetted — follow up with org setup and invite when ready.",
  declined: "Rejected — contact was not notified automatically.",
  all: "Every submission regardless of outcome.",
} as const;

export const PARTNER_INTEREST_APPROVE_TIP =
  "Marks the submission approved for internal tracking. Create the organisation and invite the contact separately.";

export const PARTNER_INTEREST_DECLINE_TIP =
  "Marks the submission declined. Add a comment (required, min 20 characters) for your audit trail — email the contact yourself if needed.";

export const PARTNER_INTEREST_COMMENT_TIP =
  "Optional on approve. Required on decline — explain why (e.g. out of scope, incomplete details). Minimum 20 characters when declining.";
