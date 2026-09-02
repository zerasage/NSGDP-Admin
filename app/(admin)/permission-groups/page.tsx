"use client";

import { useMemo, useState } from "react";
import { Grid3X3, KeyRound, Lock, Plus, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { PermissionMatrix } from "@/components/admin/permission-matrix";
import { PermissionGroupsPanel } from "@/components/admin/permission-groups-panel";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  MetricCard,
  tabToneClass,
} from "@/components/admin/admin-analytics-ui";
import { HelpTip } from "@/components/admin/help-tip";
import {
  PERMISSION_GROUPS_METRIC_TIPS,
  PERMISSION_GROUPS_NEW_GROUP_TIP,
  PERMISSION_GROUPS_PAGE_TIP,
  PERMISSION_GROUPS_TAB_TIPS,
  PERMISSION_GROUPS_WORKSPACE_TIP,
} from "@/lib/constants/permission-groups-tooltips";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  AdminSectionTabsNav,
  ADMIN_TAB_TRIGGER_BASE,
} from "@/components/admin/admin-section-tabs-nav";
import { useAuth } from "@/lib/auth";
import { usePermissionGroups } from "@/lib/hooks/usePermissionGroups";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function PermissionGroupsPage() {
  const { user } = useAuth();

  if (user?.role !== "super_admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="Permission groups can only be managed by super_admin — this is deliberately never delegatable, to avoid a privilege-escalation path."
        />
      </div>
    );
  }

  return <PermissionWorkspace />;
}

function PermissionWorkspace() {
  const [activeTab, setActiveTab] = useState("groups");
  const [createOpen, setCreateOpen] = useState(false);
  const { data: groups, isLoading } = usePermissionGroups();

  const stats = useMemo(() => {
    const list = groups ?? [];
    return {
      total: list.length,
      active: list.filter((g) => g.is_active).length,
      members: list.reduce((sum, g) => sum + (g.member_count ?? 0), 0),
      grants: list.reduce((sum, g) => sum + (g.grant_count ?? 0), 0),
    };
  }, [groups]);

  return (
    <TooltipProvider delay={200}>
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          Permission Groups
          <HelpTip content={PERMISSION_GROUPS_PAGE_TIP} label="About permission groups" />
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Manage groups of staff users, their membership, and the delegated permissions granted to them.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total groups"
            value={stats.total}
            hint="Active and inactive"
            tip={PERMISSION_GROUPS_METRIC_TIPS.total}
            icon={ShieldCheck}
            tone="primary"
          />
          <MetricCard
            label="Active groups"
            value={stats.active}
            hint="Currently delegating permissions"
            tip={PERMISSION_GROUPS_METRIC_TIPS.active}
            icon={Users}
            tone="success"
          />
          <MetricCard
            label="Staff members"
            value={stats.members}
            hint="Across all groups"
            tip={PERMISSION_GROUPS_METRIC_TIPS.members}
            icon={Users}
            tone="info"
          />
          <MetricCard
            label="Delegated grants"
            value={stats.grants}
            hint="Permission assignments total"
            tip={PERMISSION_GROUPS_METRIC_TIPS.grants}
            icon={KeyRound}
            tone="warning"
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                Access-control workspace
                <HelpTip content={PERMISSION_GROUPS_WORKSPACE_TIP} label="About workspace" />
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Configure staff groups or compare effective delegated access.
              </p>
            </div>
            {activeTab === "groups" && (
              <div className="flex items-center gap-1">
                <Button className="h-9 w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" />
                  New group
                </Button>
                <HelpTip content={PERMISSION_GROUPS_NEW_GROUP_TIP} label="About new group" />
              </div>
            )}
          </div>

          <AdminSectionTabsNav className="mt-4">
            <div className="inline-flex flex-none items-center gap-0.5">
              <TabsTrigger
                value="groups"
                className={cn(ADMIN_TAB_TRIGGER_BASE, tabToneClass("primary"))}
              >
                <Users className="size-3.5 shrink-0 sm:size-4" />
                Groups
              </TabsTrigger>
              {activeTab === "groups" ? (
                <HelpTip content={PERMISSION_GROUPS_TAB_TIPS.groups} label="About groups tab" />
              ) : null}
            </div>
            <div className="inline-flex flex-none items-center gap-0.5">
              <TabsTrigger
                value="matrix"
                className={cn(ADMIN_TAB_TRIGGER_BASE, tabToneClass("info"))}
              >
                <Grid3X3 className="size-3.5 shrink-0 sm:size-4" />
                Permission matrix
              </TabsTrigger>
              {activeTab === "matrix" ? (
                <HelpTip content={PERMISSION_GROUPS_TAB_TIPS.matrix} label="About permission matrix tab" />
              ) : null}
            </div>
          </AdminSectionTabsNav>
        </div>

        <TabsContent value="groups" className="mt-0 bg-background p-4 sm:p-5">
          <PermissionGroupsPanel createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
        </TabsContent>
        <TabsContent value="matrix" className="mt-0 bg-background p-4 sm:p-5">
          <PermissionMatrix />
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  );
}
