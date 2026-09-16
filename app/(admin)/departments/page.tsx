"use client";

import { useMemo, useState } from "react";
import { Building2, Lock, Plus, Users } from "lucide-react";
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
import { useDepartments, useMyDepartments } from "@/lib/hooks/useDepartments";
import { Skeleton } from "@/components/ui/skeleton";

export default function DepartmentsPage() {
  const { isSuperAdmin, can, isLoading: permissionsLoading } = useAdminAccess();
  const canManageDepartmentMembers = can("manage:department-members");
  const [createOpen, setCreateOpen] = useState(false);

  const allDepartments = useDepartments();
  const myDepartments = useMyDepartments();
  const { data: departments, isLoading: departmentsLoading } = isSuperAdmin
    ? allDepartments
    : myDepartments;

  const stats = useMemo(() => {
    const list = departments ?? [];
    return {
      total: list.length,
      active: list.filter((d) => d.is_active).length,
      members: list.reduce((sum, d) => sum + (d.member_count ?? 0), 0),
    };
  }, [departments]);

  if (!permissionsLoading && !isSuperAdmin && !canManageDepartmentMembers) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="Viewing departments requires manage:department-members (or super_admin). Ask a super_admin to grant your group this permission."
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

      {departmentsLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label={isSuperAdmin ? "Total departments" : "Your departments"}
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
            hint="Staff across these departments"
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
          createOpen={createOpen}
          onCreateOpenChange={setCreateOpen}
        />
      </Panel>
    </div>
    </TooltipProvider>
  );
}
