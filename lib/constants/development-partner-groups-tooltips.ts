export const ORG_GROUPS_PAGE_TIP =
  "Batch capability grants across development partners (e.g. programme creation). Unlike staff permission groups, these are structural policy decisions — super-admin only.";

export const ORG_GROUPS_METRIC_TIPS = {
  total: "Every development partner group defined on the platform, active or inactive.",
  active: "Groups currently granting capabilities to member development partners.",
  members: "Development partners assigned across all groups — one partner can belong to multiple groups.",
} as const;

export const ORG_GROUPS_WORKSPACE_PANEL_TIP =
  "Create groups, add member development partners, and toggle which high-level capabilities they share.";

export const ORG_GROUPS_NEW_GROUP_TIP =
  "Name a policy bundle for partners. Add members and capabilities after saving — inactive groups grant nothing.";

export const ORG_GROUPS_MEMBERS_TAB_TIP =
  "Development partners in this group. Removing a member revokes only this group's capabilities from that partner.";

export const ORG_GROUPS_CAPABILITIES_TAB_TIP =
  "High-level actions member development partners may perform together — e.g. creating programmes. Toggle sparingly.";

export const ORG_GROUPS_DEACTIVATE_TIP =
  "Stops capability grants for all members but keeps the group and membership for later reactivation.";

export const ORG_GROUPS_DELETE_TIP =
  "Permanent removal — only when the group has no members and you are sure the policy bundle is obsolete.";
