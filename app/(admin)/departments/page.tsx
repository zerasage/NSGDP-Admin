"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Building2, Lock, Plus, UserX, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DepartmentPanel } from "@/components/admin/department-panel";
import { HelpTip } from "@/components/admin/help-tip";
import { EmptyState } from "@/components/feedback/empty-state";
import { MetricCard, Panel } from "@/components/admin/admin-analytics-ui";
import {
  DEPARTMENTS_METRIC_TIPS,
  DEPARTMENTS_NEW_DEPARTMENT_TIP,
  DEPARTMENTS_PAGE_TIP,
  DEPARTMENTS_WORKSPACE_PANEL_TIP,
} from "@/lib/constants/department-tooltips";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { useAuth } from "@/lib/auth";
import {
  useDepartments,
  useMyDepartments,
  useDepartmentStats,
} from "@/lib/hooks/useDepartments";
import { getDepartment } from "@/lib/api/departments";
import { Skeleton } from "@/components/ui/skeleton";

export default function DepartmentsPage() {
  const { isSuperAdmin, can, isLoading: permissionsLoading } = useAdminAccess();
  const { user } = useAuth();
  const isStaff = user?.role === "staff";
  const canManageDepartmentMembers = can("manage:department-members");
  const [createOpen, setCreateOpen] = useState(false);

  const allDepartments = useDepartments();
  const myDepartments = useMyDepartments();
  const { data: departments, isLoading: departmentsLoading } = isSuperAdmin
    ? allDepartments
    : myDepartments;

  // Super admin: agency-wide deduped stats from the backend (summing each
  // department's member_count would double-count staff in 2+ departments).
  const agencyStats = useDepartmentStats(isSuperAdmin);

  // Non-super-admin staff: only ever a handful of "my" departments, so it's
  // cheap to fetch each one's member list here and dedupe client-side rather
  // than needing a "my-scoped" version of the stats endpoint.
  const myDepartmentDetails = useQueries({
    queries: (isSuperAdmin ? [] : departments ?? []).map((d) => ({
      queryKey: ["departments", d.id],
      queryFn: () => getDepartment(d.id),
    })),
  });
  const myUniqueMembers = useMemo(() => {
    if (isSuperAdmin) return 0;
    const ids = new Set<string>();
    for (const q of myDepartmentDetails) {
      for (const m of q.data?.members ?? []) ids.add(m.user_id);
    }
    return ids.size;
  }, [isSuperAdmin, myDepartmentDetails]);
  const myMembersLoading = !isSuperAdmin && myDepartmentDetails.some((q) => q.isLoading);

  const stats = useMemo(() => {
    const list = departments ?? [];
    return {
      total: list.length,
      active: list.filter((d) => d.is_active).length,
      members: myUniqueMembers,
    };
  }, [departments, myUniqueMembers]);

  // Viewing only requires being staff (or super_admin) — membership itself,
  // not manage:department-members, is what makes a department visible.
  // Managing members within it is a separate, narrower gate applied inside
  // DepartmentPanel/DepartmentMemberManager.
  if (!permissionsLoading && !isSuperAdmin && !isStaff) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="Departments are visible to agency staff and super admins only."
        />
      </div>
    );
  }

  return (
    <TooltipProvider delay={200}>
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          Departments
          <HelpTip content={DEPARTMENTS_PAGE_TIP} label="About departments" />
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {isSuperAdmin
            ? "Manage departments and which staff belong to each one."
            : "Manage staff membership within your own department(s)."}
        </p>
      </div>

      {isSuperAdmin ? (
        agencyStats.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
            <MetricCard
              label="Total departments"
              value={agencyStats.data?.totalDepartments ?? 0}
              hint="Active and inactive"
              icon={Building2}
              tone="primary"
              tip={DEPARTMENTS_METRIC_TIPS.total}
            />
            <MetricCard
              label="Active departments"
              value={agencyStats.data?.activeDepartments ?? 0}
              hint="Open to membership changes"
              icon={Building2}
              tone="success"
              tip={DEPARTMENTS_METRIC_TIPS.active}
            />
            <MetricCard
              label="Total members"
              value={agencyStats.data?.uniqueMembers ?? 0}
              hint="Distinct staff, deduped"
              icon={Users}
              tone="info"
              tip={DEPARTMENTS_METRIC_TIPS.members}
            />
            <MetricCard
              label="Staff in agency"
              value={agencyStats.data?.totalStaff ?? 0}
              hint="All active staff accounts"
              icon={Users}
              tone="muted"
              tip={DEPARTMENTS_METRIC_TIPS.totalStaff}
            />
            <MetricCard
              label="Staff without a department"
              value={agencyStats.data?.staffWithoutDepartment ?? 0}
              hint="Not yet assigned anywhere"
              icon={UserX}
              tone="warning"
              tip={DEPARTMENTS_METRIC_TIPS.staffWithoutDepartment}
            />
          </div>
        )
      ) : departmentsLoading || myMembersLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Your departments"
            value={stats.total}
            hint="Active and inactive"
            icon={Building2}
            tone="primary"
            tip={DEPARTMENTS_METRIC_TIPS.total}
          />
          <MetricCard
            label="Active departments"
            value={stats.active}
            hint="Open to membership changes"
            icon={Building2}
            tone="success"
            tip={DEPARTMENTS_METRIC_TIPS.active}
          />
          <MetricCard
            label="Total members"
            value={stats.members}
            hint="Distinct staff, deduped"
            icon={Users}
            tone="info"
            tip={DEPARTMENTS_METRIC_TIPS.members}
          />
        </div>
      )}

      <Panel
        title="Department workspace"
        description={
          isSuperAdmin
            ? "Create departments and manage staff membership."
            : "Manage staff membership within your own department(s)."
        }
        icon={Building2}
        tone="primary"
        titleTip={DEPARTMENTS_WORKSPACE_PANEL_TIP}
        action={
          isSuperAdmin ? (
            <div className="flex items-center gap-1">
              <Button className="h-9 w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                New department
              </Button>
              <HelpTip content={DEPARTMENTS_NEW_DEPARTMENT_TIP} label="About new department" />
            </div>
          ) : undefined
        }
      >
        <DepartmentPanel
          isSuperAdmin={isSuperAdmin}
          canManageMembers={isSuperAdmin || canManageDepartmentMembers}
          createOpen={createOpen}
          onCreateOpenChange={setCreateOpen}
        />
      </Panel>
    </div>
    </TooltipProvider>
  );
}
