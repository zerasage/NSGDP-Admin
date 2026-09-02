"use client";

import { useMemo, useState } from "react";
import { Building2, Lock, Network, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganisationGroupsPanel } from "@/components/admin/organisation-groups-panel";
import { HelpTip } from "@/components/admin/help-tip";
import { EmptyState } from "@/components/feedback/empty-state";
import { MetricCard, Panel } from "@/components/admin/admin-analytics-ui";
import {
  ORG_GROUPS_METRIC_TIPS,
  ORG_GROUPS_NEW_GROUP_TIP,
  ORG_GROUPS_PAGE_TIP,
  ORG_GROUPS_WORKSPACE_PANEL_TIP,
} from "@/lib/constants/organisation-groups-tooltips";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import { useOrganisationGroups } from "@/lib/hooks/useOrganisationGroups";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganisationGroupsPage() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: groups, isLoading } = useOrganisationGroups();

  const stats = useMemo(() => {
    const list = groups ?? [];
    return {
      total: list.length,
      active: list.filter((g) => g.is_active).length,
      members: list.reduce((sum, g) => sum + (g.member_count ?? 0), 0),
    };
  }, [groups]);

  if (user?.role !== "super_admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="Organisation groups can only be managed by super_admin. This ensures capability grants remain under central policy control."
        />
      </div>
    );
  }

  return (
    <TooltipProvider delay={200}>
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          Organisation Groups
          <HelpTip content={ORG_GROUPS_PAGE_TIP} label="About organisation groups" />
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Manage groups of organisations, their membership, and the capabilities granted to them.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard
            label="Total groups"
            value={stats.total}
            hint="Active and inactive"
            icon={Network}
            tone="primary"
            tip={ORG_GROUPS_METRIC_TIPS.total}
          />
          <MetricCard
            label="Active groups"
            value={stats.active}
            hint="Currently granting capabilities"
            icon={Building2}
            tone="success"
            tip={ORG_GROUPS_METRIC_TIPS.active}
          />
          <MetricCard
            label="Total members"
            value={stats.members}
            hint="Organisations across all groups"
            icon={Users}
            tone="info"
            tip={ORG_GROUPS_METRIC_TIPS.members}
          />
        </div>
      )}

      <Panel
        title="Organisation capability workspace"
        description="Configure which organisations can create programmes and other high-level actions."
        icon={Network}
        tone="primary"
        titleTip={ORG_GROUPS_WORKSPACE_PANEL_TIP}
        action={
          <div className="flex items-center gap-1">
            <Button className="h-9 w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New group
            </Button>
            <HelpTip content={ORG_GROUPS_NEW_GROUP_TIP} label="About new group" />
          </div>
        }
      >
        <OrganisationGroupsPanel createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
      </Panel>
    </div>
    </TooltipProvider>
  );
}
