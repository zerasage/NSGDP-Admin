// NSPHCDA Data Portal — permission & user-group types (PRD v3.0)

/**
 * Atomic actions that the Super Admin can delegate to a user group
 * beyond their core role's default permissions.
 */
export type PermissionAction =
  | "approve:datasets"       // Advance dataset to Approved after QA checklist
  | "publish:datasets"       // Move approved dataset to Published
  | "invite:users"           // Invite new users (org-scoped)
  | "invite:staff"           // Invite/manage agency staff invites and view the staff roster
  | "promote:org-admin"      // Promote a user to admin within their own development partner
  | "demote:org-admin"       // Demote an org admin back to contributor
  | "remove:org-members"     // Detach a member from their development partner
  | "archive:datasets"       // Move datasets to Archived state
  | "view:datasets"          // Read-only: see the review queue without approving/publishing/archiving
  | "view:restricted"        // View restricted-access datasets
  | "download:restricted"    // Download restricted-access datasets
  | "create:programs"        // Register new programme records
  | "edit:programs"          // Update programme metadata and status
  | "delete:programs"        // Remove or archive programme records
  | "upload:programs"        // Upload reports/documents to programme records
  | "approve:access-requests" // Approve/deny restricted-dataset access requests
  | "view:access-requests"   // Read-only: see the access-request list without adjudicating
  | "view:partner-interest"  // Read-only: see partner interest submissions
  | "review:partner-interest" // Approve/decline partner interest submissions
  | "view:contact-messages"  // Read-only: see public contact-form inbox
  | "review:contact-messages" // Update contact-form status and staff notes
  | "create:development-partners"   // Register new development partners on the platform
  | "edit:development-partners"     // Update any development partner's profile
  | "deactivate:development-partners" // Enable/disable any development partner
  | "delete:development-partners"   // Soft-delete a development partner and everything it owns
  | "manage:development-partner-agreements" // Upload/replace/download data-sharing agreements
  | "create:datasets"        // Upload a dataset on behalf of a development partner
  | "manage:documents"       // Create/edit/archive documents (SOPs, policies, reports)
  | "manage:groups"          // Create/edit/delete curated dataset/document groups
  | "manage:analytics"       // Force-refresh the platform analytics dashboard cache
  | "manage:gis-reference-data" // Choose active GIS layer datasets, reconcile ward names
  | "manage:partner-api-keys" // Generate/revoke a development partner's programmatic API key
  | "manage:indicators"; // Manage the canonical indicator registry, alias review queue, and AI-assisted resolution admin

export const PROGRAM_PERMISSION_ACTIONS: PermissionAction[] = [
  "create:programs",
  "edit:programs",
  "delete:programs",
  "upload:programs",
];

export const POWERFUL_PERMISSION_ACTIONS = new Set<PermissionAction>([
  "promote:org-admin",
  "demote:org-admin",
  "delete:development-partners",
]);

export const isPowerfulPermission = (action: PermissionAction) =>
  POWERFUL_PERMISSION_ACTIONS.has(action);

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  "approve:datasets": "Approve Datasets",
  "publish:datasets": "Publish Datasets",
  "invite:users": "Invite Users (org-scoped)",
  "invite:staff": "Invite Agency Staff",
  "promote:org-admin": "Promote to Org Admin",
  "demote:org-admin": "Demote Org Admin",
  "remove:org-members": "Remove Org Member",
  "archive:datasets": "Archive Datasets",
  "view:datasets": "View Review Queue",
  "view:restricted": "View Restricted Data",
  "download:restricted": "Download Restricted Data",
  "create:programs": "Create Programmes",
  "edit:programs": "Edit Programmes",
  "delete:programs": "Delete Programmes",
  "upload:programs": "Upload Programme Reports",
  "approve:access-requests": "Approve Access Requests",
  "view:access-requests": "View Access Requests",
  "view:partner-interest": "View Partner Interest",
  "review:partner-interest": "Review Partner Interest",
  "view:contact-messages": "View Contact Messages",
  "review:contact-messages": "Review Contact Messages",
  "create:development-partners": "Create Development Partners",
  "edit:development-partners": "Edit Development Partners",
  "deactivate:development-partners": "Deactivate Development Partners",
  "delete:development-partners": "Delete Development Partners",
  "manage:development-partner-agreements": "Manage Development Partner Agreements",
  "create:datasets": "Upload Dataset for Org",
  "manage:documents": "Manage Documents",
  "manage:groups": "Manage Collections",
  "manage:analytics": "Manage Analytics",
  "manage:gis-reference-data": "Manage GIS Reference Layers",
  "manage:partner-api-keys": "Manage Partner API Keys",
  "manage:indicators": "Manage Indicators",
};

export const PERMISSION_ACTION_DESCRIPTIONS: Record<PermissionAction, string> = {
  "approve:datasets":
    "Can mark a dataset as validated after the QA checklist and advance it to Approved.",
  "publish:datasets":
    "Can move a director-approved dataset to Published status in the public catalogue.",
  "invite:users":
    "Can invite new users into their own development partner.",
  "invite:staff":
    "Can send, resend, and revoke agency staff invites, and view the current staff roster. Cannot revoke an existing staff member's access or change anyone's role — those stay super_admin-only.",
  "promote:org-admin":
    "Can promote a user to admin, scoped strictly to that user's own existing development partner — never cross-org, never to super_admin. Powerful: grant only to specific vetted staff, never seed by default.",
  "demote:org-admin":
    "Can demote an org admin back to contributor, scoped to that admin's own development partner. Can't demote the last remaining admin of an org. Powerful: grant only to specific vetted staff, never seed by default.",
  "remove:org-members":
    "Can detach a member from their development partner without deleting their account.",
  "archive:datasets":
    "Can mark obsolete datasets as Archived, removing them from the active catalogue.",
  "view:datasets":
    "Can see the dataset review queue (pending/under-review lists, dataset detail, preview) without being able to approve, publish, or archive anything.",
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
  "view:partner-interest":
    "Can see the list of partner interest submissions (organisation, contact, message, status) without being able to approve or decline them.",
  "review:partner-interest":
    "Can approve or decline partner interest submissions. Does not automatically create development partners or send invites — review stays a manual staff intent check.",
  "view:contact-messages":
    "Can see messages submitted through the public contact form without changing their status.",
  "review:contact-messages":
    "Can mark contact messages as open or closed and add internal staff notes. Does not send a reply automatically.",
  "create:development-partners":
    "Can register new development partners on the platform.",
  "edit:development-partners":
    "Can update the profile of any development partner, not just one they belong to.",
  "deactivate:development-partners":
    "Can enable or disable any development partner.",
  "delete:development-partners":
    "Can soft-delete a development partner and everything it owns — members, datasets, and pending invites. Powerful: grant only to specific vetted staff, never seed by default.",
  "manage:development-partner-agreements":
    "Can upload, replace, and download the signed data-sharing agreement for any development partner.",
  "create:datasets":
    "Can upload a dataset on behalf of a development partner they aren't a member of.",
  "manage:documents":
    "Can create, edit, and archive documents (SOPs, policies, guidelines, reports, research) in the document repository.",
  "manage:groups":
    "Can create, edit, and delete curated topic collections of datasets and documents, and control which datasets/documents belong to them.",
  "manage:analytics":
    "Can force an immediate recompute of the platform analytics dashboard cache.",
  "manage:gis-reference-data":
    "Can choose which dataset backs each GIS map layer, rebuild the canonical ward table, and reconcile raw LGA/ward spellings.",
  "manage:partner-api-keys":
    "Can generate and revoke a development partner's programmatic API key for pulling data outside the browser.",
  "manage:indicators":
    "Can manage the canonical indicator registry (create/edit/activate), resolve pending indicator and org-unit aliases in the ingestion review queue, and run Stage 8 / calibration / AI admin tools.",
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
      "view:datasets",
      "view:restricted",
      "download:restricted",
    ],
  },
  {
    label: "Development Partners",
    actions: [
      "create:development-partners",
      "edit:development-partners",
      "deactivate:development-partners",
      "delete:development-partners",
      "manage:development-partner-agreements",
      "invite:users",
      "promote:org-admin",
      "demote:org-admin",
      "remove:org-members",
    ],
  },
  {
    label: "Agency Staff",
    actions: ["invite:staff"],
  },
  {
    label: "Programmes",
    actions: ["create:programs", "edit:programs", "delete:programs", "upload:programs"],
  },
  {
    label: "Documents",
    actions: ["manage:documents"],
  },
  {
    label: "Collections",
    actions: ["manage:groups"],
  },
  {
    label: "Access Requests",
    actions: ["view:access-requests", "approve:access-requests"],
  },
  {
    label: "Partner Interest",
    actions: ["view:partner-interest", "review:partner-interest"],
  },
  {
    label: "Contact",
    actions: ["view:contact-messages", "review:contact-messages"],
  },
  {
    label: "Analytics",
    actions: ["manage:analytics"],
  },
  {
    label: "GIS",
    actions: ["manage:gis-reference-data"],
  },
  {
    label: "Partner API",
    actions: ["manage:partner-api-keys"],
  },
  {
    label: "Indicators",
    actions: ["manage:indicators"],
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
