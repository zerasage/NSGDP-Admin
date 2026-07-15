// NSPHCDA Data Portal — permission & user-group types (PRD v3.0)

/**
 * Atomic actions that the Super Admin can delegate to a user group
 * beyond their core role's default permissions.
 */
export type PermissionAction =
  | "approve:datasets"       // Advance dataset to Approved after QA checklist
  | "publish:datasets"       // Move approved dataset to Published
  | "manage:users"           // Invite/deactivate users (org-scoped)
  | "archive:datasets"       // Move datasets to Archived state
  | "view:restricted"        // View restricted-access datasets
  | "download:restricted"    // Download restricted-access datasets
  | "create:programs"        // Register new programme records
  | "edit:programs"          // Update programme metadata and status
  | "delete:programs"        // Remove or archive programme records
  | "upload:programs";       // Upload reports/documents to programme records

export const PROGRAM_PERMISSION_ACTIONS: PermissionAction[] = [
  "create:programs",
  "edit:programs",
  "delete:programs",
  "upload:programs",
];

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  "approve:datasets": "Approve Datasets",
  "publish:datasets": "Publish Datasets",
  "manage:users": "Manage Users (org-scoped)",
  "archive:datasets": "Archive Datasets",
  "view:restricted": "View Restricted Data",
  "download:restricted": "Download Restricted Data",
  "create:programs": "Create Programmes",
  "edit:programs": "Edit Programmes",
  "delete:programs": "Delete Programmes",
  "upload:programs": "Upload Programme Reports",
};

export const PERMISSION_ACTION_DESCRIPTIONS: Record<PermissionAction, string> = {
  "approve:datasets":
    "Can mark a dataset as validated after the QA checklist and advance it to Approved.",
  "publish:datasets":
    "Can move a director-approved dataset to Published status in the public catalogue.",
  "manage:users":
    "Can invite, deactivate, and change roles of users within their own organisation only.",
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
};

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
