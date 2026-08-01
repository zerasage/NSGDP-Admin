// NSPHCDA Data Portal — permission & user-group types (PRD v3.0)

/**
 * Atomic actions that the Super Admin can delegate to a user group
 * beyond their core role's default permissions.
 */
export type PermissionAction =
  | "approve:datasets"       // Advance dataset to Approved after QA checklist
  | "publish:datasets"       // Move approved dataset to Published
  | "invite:users"           // Invite new users (org-scoped)
  | "promote:org-admin"      // Promote a user to admin within their own organisation
  | "demote:org-admin"       // Demote an org admin back to contributor
  | "remove:org-members"     // Detach a member from their organisation
  | "archive:datasets"       // Move datasets to Archived state
  | "view:restricted"        // View restricted-access datasets
  | "download:restricted"    // Download restricted-access datasets
  | "create:programs"        // Register new programme records
  | "edit:programs"          // Update programme metadata and status
  | "delete:programs"        // Remove or archive programme records
  | "upload:programs"        // Upload reports/documents to programme records
  | "approve:access-requests" // Approve/deny restricted-dataset access requests
  | "view:access-requests"   // Read-only: see the access-request list without adjudicating
  | "create:organisations"   // Register new organisations on the platform
  | "edit:organisations"     // Update any organisation's profile
  | "deactivate:organisations" // Enable/disable any organisation
  | "delete:organisations"   // Soft-delete an organisation and everything it owns
  | "manage:organisation-agreements" // Upload/replace/download data-sharing agreements
  | "create:datasets";       // Upload a dataset on behalf of an organisation

export const PROGRAM_PERMISSION_ACTIONS: PermissionAction[] = [
  "create:programs",
  "edit:programs",
  "delete:programs",
  "upload:programs",
];

export const POWERFUL_PERMISSION_ACTIONS = new Set<PermissionAction>([
  "promote:org-admin",
  "demote:org-admin",
  "delete:organisations",
]);

export const isPowerfulPermission = (action: PermissionAction) =>
  POWERFUL_PERMISSION_ACTIONS.has(action);

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  "approve:datasets": "Approve Datasets",
  "publish:datasets": "Publish Datasets",
  "invite:users": "Invite Users (org-scoped)",
  "promote:org-admin": "Promote to Org Admin",
  "demote:org-admin": "Demote Org Admin",
  "remove:org-members": "Remove Org Member",
  "archive:datasets": "Archive Datasets",
  "view:restricted": "View Restricted Data",
  "download:restricted": "Download Restricted Data",
  "create:programs": "Create Programmes",
  "edit:programs": "Edit Programmes",
  "delete:programs": "Delete Programmes",
  "upload:programs": "Upload Programme Reports",
  "approve:access-requests": "Approve Access Requests",
  "view:access-requests": "View Access Requests",
  "create:organisations": "Create Organisations",
  "edit:organisations": "Edit Organisations",
  "deactivate:organisations": "Deactivate Organisations",
  "delete:organisations": "Delete Organisations",
  "manage:organisation-agreements": "Manage Org Agreements",
  "create:datasets": "Upload Dataset for Org",
};

export const PERMISSION_ACTION_DESCRIPTIONS: Record<PermissionAction, string> = {
  "approve:datasets":
    "Can mark a dataset as validated after the QA checklist and advance it to Approved.",
  "publish:datasets":
    "Can move a director-approved dataset to Published status in the public catalogue.",
  "invite:users":
    "Can invite new users into their own organisation.",
  "promote:org-admin":
    "Can promote a user to admin, scoped strictly to that user's own existing organisation — never cross-org, never to super_admin. Powerful: grant only to specific vetted staff, never seed by default.",
  "demote:org-admin":
    "Can demote an org admin back to contributor, scoped to that admin's own organisation. Can't demote the last remaining admin of an org. Powerful: grant only to specific vetted staff, never seed by default.",
  "remove:org-members":
    "Can detach a member from their organisation without deleting their account.",
  "archive:datasets":
    "Can mark obsolete datasets as Archived, removing them from the active catalogue.",
  "view:restricted":
    "Can view datasets flagged as internally restricted (not visible to public or registered users).",
  "download:restricted":
    "Can download restricted-access dataset files (requires view:restricted to also be granted).",
  "create:programs":
    "Can register new health programmes (campaigns, surveillance, training, etc.) in the portal.",
  "edit:programs":
    "Can update programme metadata, milestones, coverage figures, and lifecycle status.",
  "delete:programs":
    "Can remove draft or erroneous programme records (Repository Admin and above).",
  "upload:programs":
    "Can upload campaign reports, monitoring reports, and evaluation documents to programme records.",
  "approve:access-requests":
    "Can approve or deny a user's request for access to a restricted-visibility dataset. Includes viewing the request list.",
  "view:access-requests":
    "Can see the list of access requests (requester, dataset, reason, status) without being able to approve or deny them.",
  "create:organisations":
    "Can register new organisations on the platform.",
  "edit:organisations":
    "Can update the profile of any organisation, not just one they belong to.",
  "deactivate:organisations":
    "Can enable or disable any organisation.",
  "delete:organisations":
    "Can soft-delete an organisation and everything it owns — members, datasets, and pending invites. Powerful: grant only to specific vetted staff, never seed by default.",
  "manage:organisation-agreements":
    "Can upload, replace, and download the signed data-sharing agreement for any organisation.",
  "create:datasets":
    "Can upload a dataset on behalf of an organisation they aren't a member of.",
};

/**
 * Groups related permissions together for display (mirrors the backend's
 * resourceType on each PERMISSION_ACTION_MAP entry). Order here is the
 * display order in every permission picker/list in the app.
 */
export const PERMISSION_ACTION_GROUPS: Array<{ label: string; actions: PermissionAction[] }> = [
  {
    label: "Datasets",
    actions: [
      "create:datasets",
      "approve:datasets",
      "publish:datasets",
      "archive:datasets",
      "view:restricted",
      "download:restricted",
    ],
  },
  {
    label: "Organisations",
    actions: [
      "create:organisations",
      "edit:organisations",
      "deactivate:organisations",
      "delete:organisations",
      "manage:organisation-agreements",
      "invite:users",
      "promote:org-admin",
      "demote:org-admin",
      "remove:org-members",
    ],
  },
  {
    label: "Programmes",
    actions: ["create:programs", "edit:programs", "delete:programs", "upload:programs"],
  },
  {
    label: "Access Requests",
    actions: ["view:access-requests", "approve:access-requests"],
  },
];

/** A single permission grant assigned to a user group */
export interface PermissionGrant {
  id: string;
  groupId: string;
  action: PermissionAction;
  grantedBy: string;     // super_admin user ID
  grantedAt: string;     // ISO date
}

/** A named user group with aggregate permissions */
export interface UserGroup {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  /** Permissions explicitly delegated to this group by Super Admin */
  delegatedPermissions: PermissionAction[];
  createdAt: string;
  createdBy: string;
}
