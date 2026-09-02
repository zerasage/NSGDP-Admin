"use client";

import { Fragment } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Database,
  GitBranch,
  GitCompare,
  Link2,
  Network,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { TabsTrigger } from "@/components/ui/tabs";
import { usePipelineAttention } from "@/lib/hooks/useIngestionReview";
import {
  AdminSectionTabsNav,
  ADMIN_TAB_TRIGGER_BASE,
  AdminTabCount,
} from "@/components/admin/admin-section-tabs-nav";
import { tabToneClass, type MetricTone } from "@/components/admin/admin-analytics-ui";
import { cn } from "@/lib/utils";

type TabDef = {
  value: string;
  label: string;
  icon: LucideIcon;
  tone: MetricTone;
  superAdminOnly?: boolean;
  countKey?: "pipeline" | "aliases" | "conflicts";
};

const OPS_TAB_GROUPS: { tabs: TabDef[] }[] = [
  {
    tabs: [
      { value: "observability", label: "Metrics", icon: Activity, tone: "primary" },
      { value: "pipeline", label: "Pipeline", icon: GitBranch, tone: "info", countKey: "pipeline" },
      { value: "aliases", label: "Aliases", icon: Link2, tone: "warning", countKey: "aliases" },
      { value: "conflicts", label: "Conflicts", icon: ShieldAlert, tone: "destructive", countKey: "conflicts" },
      { value: "ai-spend", label: "AI spend", icon: Sparkles, tone: "destructive" },
    ],
  },
  {
    tabs: [
      { value: "indicators", label: "Indicators", icon: Network, tone: "success" },
      { value: "warehouse", label: "Warehouse", icon: Database, tone: "primary" },
      { value: "compare", label: "Compare", icon: GitCompare, tone: "info", superAdminOnly: true },
    ],
  },
  {
    tabs: [
      { value: "stage8", label: "Stage 8", icon: GitBranch, tone: "info", superAdminOnly: true },
    ],
  },
];

type IngestionOpsTabsNavProps = {
  isSuperAdmin: boolean;
  pendingAliasCount: number;
  openConflictCount: number;
  activeTab: string;
};

export function IngestionOpsTabsNav({
  isSuperAdmin,
  pendingAliasCount,
  openConflictCount,
  activeTab,
}: IngestionOpsTabsNavProps) {
  const { data: pipelineAttention } = usePipelineAttention("all");
  const pipelineAttentionCount = pipelineAttention?.total ?? 0;

  const counts: Record<NonNullable<TabDef["countKey"]>, number> = {
    pipeline: pipelineAttentionCount,
    aliases: pendingAliasCount,
    conflicts: openConflictCount,
  };

  const visibleGroups = OPS_TAB_GROUPS.map((group) => ({
    tabs: group.tabs.filter((tab) => !tab.superAdminOnly || isSuperAdmin),
  })).filter((group) => group.tabs.length > 0);

  return (
    <AdminSectionTabsNav>
      {visibleGroups.map((group, groupIndex) => (
        <Fragment key={groupIndex}>
          {groupIndex > 0 ? (
            <div
              className="mx-0.5 flex flex-none items-stretch self-center py-1"
              aria-hidden
            >
              <div className="h-7 w-px bg-border/80" />
            </div>
          ) : null}
          {group.tabs.map((tab) => {
            const Icon = tab.icon;
            const count = tab.countKey ? counts[tab.countKey] : 0;
            const isActive = activeTab === tab.value;

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(ADMIN_TAB_TRIGGER_BASE, tabToneClass(tab.tone))}
              >
                <Icon className="size-3.5 shrink-0 sm:size-4" aria-hidden />
                {tab.label}
                {count > 0 ? <AdminTabCount count={count} active={isActive} /> : null}
              </TabsTrigger>
            );
          })}
        </Fragment>
      ))}
    </AdminSectionTabsNav>
  );
}
