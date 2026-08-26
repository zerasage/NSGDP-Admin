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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Permission Groups</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Manage groups of staff users, their membership, and the delegated permissions granted to them.
        </p>
      </div>

      <div className="rounded-xl border border-warning/30 bg-warning/[0.08] px-4 py-3 text-sm text-muted-foreground">
        Staff permission groups delegate admin actions (approve datasets, review access requests, etc.).
        This page is super-admin only — delegating group management would create a privilege-escalation path.
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
            icon={ShieldCheck}
            tone="primary"
          />
          <MetricCard
            label="Active groups"
            value={stats.active}
            hint="Currently delegating permissions"
            icon={Users}
            tone="success"
          />
          <MetricCard
            label="Staff members"
            value={stats.members}
            hint="Across all groups"
            icon={Users}
            tone="info"
          />
          <MetricCard
            label="Delegated grants"
            value={stats.grants}
            hint="Permission assignments total"
            icon={KeyRound}
            tone="warning"
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Access-control workspace</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Configure staff groups or compare effective delegated access.
              </p>
            </div>
            {activeTab === "groups" && (
              <Button className="h-9 w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                New group
              </Button>
            )}
          </div>

          <AdminSectionTabsNav className="mt-4">
            <TabsTrigger
              value="groups"
              className={cn(ADMIN_TAB_TRIGGER_BASE, tabToneClass("primary"))}
            >
              <Users className="size-3.5 shrink-0 sm:size-4" />
              Groups
            </TabsTrigger>
            <TabsTrigger
              value="matrix"
              className={cn(ADMIN_TAB_TRIGGER_BASE, tabToneClass("info"))}
            >
              <Grid3X3 className="size-3.5 shrink-0 sm:size-4" />
              Permission matrix
            </TabsTrigger>
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
  );
}
