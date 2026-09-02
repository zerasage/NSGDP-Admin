export const USERS_PAGE_TIP =
  "Platform accounts — registrants, partner contributors, org admins, and agency staff. Super admins can suspend or reactivate access here; org role changes are managed from each organisation's member list.";

export const USERS_METRIC_TIPS = {
  total: "Every registered account on the platform, regardless of status.",
  active: "Users who can sign in today.",
  suspended: "Access revoked — cannot sign in until reactivated.",
} as const;

export const USERS_PANEL_TIP =
  "Filter by status or role, or search by name or email. Open a row to see full account details.";

export const USERS_TAB_TIPS = {
  all: "Every user regardless of account status.",
  active: "Verified accounts with current access.",
  suspended: "Blocked from signing in — review before reactivating.",
  archived: "Retired accounts kept for audit history.",
} as const;

export const USERS_ROLE_FILTER_TIP =
  "Platform role controls what the user can do — org admin and contributor roles also require membership on an organisation.";

export const USERS_EXPORT_TIP =
  "Downloads the users currently shown on this page as CSV — filters apply, but only this page of results is exported.";

export const USERS_SUSPEND_TIP =
  "Immediately blocks sign-in. The user keeps their record; reactivate later if access should be restored.";

export const USERS_REACTIVATE_TIP =
  "Restores sign-in for a suspended account. Confirm the user should have access again before reactivating.";

export const USER_DETAIL_PAGE_TIP =
  "Full profile for one platform account — contact details, organisation link, access role, verification state, and audit timestamps.";

export const USER_DETAIL_ACCOUNT_ACTIONS_TIP =
  "Super admins can suspend or reactivate accounts. Status changes take effect immediately and are recorded in the audit log.";

export const USER_DETAIL_ACCOUNT_INFO_TIP =
  "Contact and affiliation details supplied at registration. Email and phone links open your mail or phone app.";

export const USER_DETAIL_TIMELINE_TIP =
  "Key lifecycle dates — when the account was created, last signed in, and last updated.";

export const USER_DETAIL_ACCESS_SUMMARY_TIP =
  "Role and security posture at a glance. Role changes for org members are usually managed from the organisation workspace.";

export const USER_DETAIL_EMAIL_VERIFIED_TIP =
  "Invited users are verified automatically. Self-registered users must confirm via the link sent to their email before they can sign in.";

export const USER_DETAIL_MFA_TIP =
  "Whether multi-factor authentication is enabled on this account — recommended for staff and admin roles.";

export const USER_DETAIL_RECORD_TIP =
  "Internal user ID used in API calls, audit logs, and support lookups — not shown to the user on the public portal.";
