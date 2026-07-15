import type { UserGroup, PermissionGrant } from "@/types/permissions";

export const mockUserGroups: UserGroup[] = [
  {
    id: "grp-perm-1",
    name: "DPRS Team",
    description: "Directorate of Planning, Research and Statistics — senior M&E officers",
    memberIds: ["user-002", "user-005"],
    delegatedPermissions: ["approve:datasets", "view:restricted"],
    createdAt: "2026-01-10T09:00:00Z",
    createdBy: "user-004",
  },
  {
    id: "grp-perm-2",
    name: "WHO Nigeria Partners",
    description: "Development partner staff with data-sharing agreement",
    memberIds: ["user-006"],
    delegatedPermissions: ["view:restricted", "download:restricted"],
    createdAt: "2026-02-14T11:30:00Z",
    createdBy: "user-004",
  },
  {
    id: "grp-perm-3",
    name: "Programme Leads",
    description: "Programme managers who can upload reports to their programmes",
    memberIds: ["user-007", "user-008"],
    delegatedPermissions: ["create:programs", "edit:programs", "upload:programs"],
    createdAt: "2026-03-01T08:00:00Z",
    createdBy: "user-004",
  },
  {
    id: "grp-perm-4",
    name: "Repository Custodians",
    description: "Dataset custodians with archive authority for their assigned dataset families",
    memberIds: ["user-009"],
    delegatedPermissions: ["archive:datasets"],
    createdAt: "2026-04-05T14:00:00Z",
    createdBy: "user-004",
  },
];

export const mockPermissionGrants: PermissionGrant[] = mockUserGroups.flatMap((grp) =>
  grp.delegatedPermissions.map((action, i) => ({
    id: `grant-${grp.id}-${i}`,
    groupId: grp.id,
    action,
    grantedBy: "user-004",
    grantedAt: grp.createdAt,
  }))
);
