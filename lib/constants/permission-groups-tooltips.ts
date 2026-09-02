export const PERMISSION_GROUPS_PAGE_TIP =
  "Delegate admin capabilities to agency staff by grouping permissions and members. Staff inherit actions from their groups — effective access is the union of all group grants. Super-admin only; delegating this page would create a privilege-escalation path.";

export const PERMISSION_GROUPS_METRIC_TIPS = {
  total: "Every permission group defined on the platform, active or inactive.",
  active: "Groups currently delegating permissions to their members.",
  members: "Staff accounts assigned across all groups — one person can appear in multiple groups.",
  grants: "Total permission assignments across groups — the same action granted to three groups counts three times here.",
} as const;

export const PERMISSION_GROUPS_WORKSPACE_TIP =
  "Configure groups and membership on the Groups tab, or compare effective delegated access on the Permission matrix tab.";

export const PERMISSION_GROUPS_TAB_TIPS = {
  groups: "Create groups, assign permissions, and add or remove staff members.",
  matrix: "Read-only grid of which groups hold which actions — useful for audits and gap checks.",
} as const;

export const PERMISSION_GROUPS_NEW_GROUP_TIP =
  "Create a named bundle of permissions. Add grants and members after saving — inactive groups delegate nothing.";

export const PERMISSION_GROUPS_PERMISSIONS_TAB_TIP =
  "Toggle which admin actions this group may perform. Powerful permissions are flagged — grant sparingly.";

export const PERMISSION_GROUPS_MEMBERS_TAB_TIP =
  "Staff users who receive this group's permissions. Removing a member revokes only this group's grants.";

export const PERMISSION_GROUPS_MATRIX_TIP =
  "Each card is one permission group; checkmarks show delegated actions by area (datasets, orgs, users, etc.).";

export const PERMISSION_GROUPS_DEACTIVATE_TIP =
  "Disables the group and blocks sign-in for linked staff until reactivated — does not delete the group or change individual account status.";

export const PERMISSION_GROUPS_DELETE_TIP =
  "Permanent removal — only allowed when the group has zero members. Move staff to another group first.";
