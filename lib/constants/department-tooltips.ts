export const DEPARTMENTS_PAGE_TIP =
  "Which directorate each staff member belongs to. A staff member holding manage:department-members can view and manage members of their own department(s) only — full department management (create/edit/delete) stays super_admin-only.";

export const DEPARTMENTS_METRIC_TIPS = {
  total: "Every department defined on the platform, active or inactive.",
  active: "Departments currently open to membership changes.",
  members: "Staff assigned across all departments — one staff member can belong to multiple departments.",
} as const;

export const DEPARTMENTS_WORKSPACE_PANEL_TIP =
  "Create departments and manage which existing staff belong to each one.";

export const DEPARTMENTS_NEW_DEPARTMENT_TIP =
  "Name a directorate. Add member staff after saving — inactive departments can't have membership changed.";
