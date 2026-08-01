"use client";

import {
  Check,
  Database,
  Building2,
  Users,
  FolderKanban,
  UserCheck,
  ShieldCheck,
  Layers,
  Star,
} from "lucide-react";
import {
  PERMISSION_ACTION_LABELS,
  PERMISSION_ACTION_GROUPS,
  POWERFUL_PERMISSION_ACTIONS,
} from "@/types/permissions";
import type { PermissionActionKey } from "@/lib/api/permissions";
import { usePermissionMatrix } from "@/lib/hooks/usePermissionGroups";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statusSurface } from "@/lib/constants/status-surfaces";
import { cn } from "@/lib/utils";

const SECTION_ICONS: Record<string, typeof Database> = {
  Datasets: Database,
  Organisations: Building2,
  Users: Users,
  Programmes: FolderKanban,
  "Access Requests": UserCheck,
};

// Cycles through the app's existing dark-mode-aware badge palette, keyed by
// section so every group's cards read the same way at a glance.
const SECTION_COLORS: Record<string, keyof typeof statusSurface> = {
  Datasets: "blue",
  Organisations: "purple",
  Users: "emerald",
  Programmes: "amber",
  "Access Requests": "teal",
};

// Mirrors the "Powerful: grant only to specific vetted staff, never seed by
// default" callouts in types/permissions.ts's own descriptions — unscoped,
// platform-wide-once-held actions that deserve a visible flag wherever they
// show up, not just in a tooltip nobody reads.
export function PermissionMatrix() {
  const { data, isLoading, isError, refetch } = usePermissionMatrix();

  if (isError) return <div className="min-h-40 border border-destructive/40 p-8 text-center"><p className="mb-4 text-sm">The permission matrix could not be loaded.</p><button className="min-h-11 rounded-md border px-4 focus-visible:outline-2" onClick={() => refetch()}>Retry</button></div>;

  if (isLoading || !data) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-40" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (data.delegations.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No permission groups yet"
        description="Create a permission group and grant it some actions on the Groups tab to see them here."
      />
    );
  }

  const actions = data.actions.map((a) => a.key);
  const totalActions = actions.length;

  return (
    <div className="space-y-5">
      {/* Overview table — every group vs every action, at a glance */}
      <div className="space-y-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-600" /> Granted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-muted-foreground/30">—</span> Not granted
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="size-3 text-amber-500 fill-amber-500" /> Powerful
          </span>
        </div>

        <div className="hidden overflow-x-auto rounded-lg border xl:block">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-muted/60">
                <th className="sticky left-0 z-10 bg-muted/60 border-b border-r px-4 py-3 text-left font-semibold">
                  Permission Group
                </th>
                {actions.map((action) => (
                  <th
                    key={action}
                    className="border-b border-r px-3 py-3 text-center font-medium last:border-r-0 max-w-24"
                  >
                    <span
                      className="flex items-center justify-center gap-1 truncate max-w-[110px]"
                      title={
                        POWERFUL_PERMISSION_ACTIONS.has(action)
                          ? `${PERMISSION_ACTION_LABELS[action]} — powerful, grant sparingly`
                          : PERMISSION_ACTION_LABELS[action]
                      }
                    >
                      {POWERFUL_PERMISSION_ACTIONS.has(action) && (
                        <Star className="size-3 shrink-0 text-amber-500 fill-amber-500" />
                      )}
                      <span className="truncate">
                        {PERMISSION_ACTION_LABELS[action]}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.delegations.map((group, i) => {
                const granted = new Set(group.actions);
                return (
                  <tr
                    key={group.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td
                      className={cn(
                        "sticky left-0 z-10 border-b border-r px-4 py-2.5 font-medium",
                        i % 2 === 0 ? "bg-background" : "bg-muted/10",
                      )}
                    >
                      {group.name}
                    </td>
                    {actions.map((action) => (
                      <td
                        key={action}
                        className="border-b border-r px-3 py-2.5 text-center last:border-r-0"
                      >
                        {granted.has(action) ? (
                          <Check
                            className="mx-auto size-3.5 text-emerald-600"
                            aria-label="Granted"
                          />
                        ) : (
                          <span
                            className="text-muted-foreground/30"
                            aria-label="Not granted"
                          >
                            —
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-group cards — same data, grouped and readable instead of a wall of columns */}
      <div className="space-y-3 xl:hidden">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="size-4" />
          {data.delegations.length} permission group
          {data.delegations.length !== 1 ? "s" : ""} · {totalActions} delegable
          actions total
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.delegations.map((group) => {
            const granted = new Set(group.actions);
            const sectionsWithGrants = PERMISSION_ACTION_GROUPS.map(
              (section) => ({
                ...section,
                grantedActions: section.actions.filter((a) => granted.has(a)),
              }),
            ).filter((section) => section.grantedActions.length > 0);

            return (
              <Card key={group.id} className="shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold leading-tight">
                      {group.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs font-normal"
                    >
                      {group.actions.length} / {totalActions}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {sectionsWithGrants.length === 0 ? (
                    <p className="text-sm italic text-muted-foreground">
                      No permissions granted yet
                    </p>
                  ) : (
                    sectionsWithGrants.map((section) => {
                      const SectionIcon = SECTION_ICONS[section.label];
                      const color = SECTION_COLORS[section.label] ?? "gray";
                      return (
                        <div key={section.label}>
                          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            {SectionIcon && (
                              <SectionIcon className="size-3.5" />
                            )}
                            {section.label}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {section.grantedActions.map(
                              (action: PermissionActionKey) => (
                                <Badge
                                  key={action}
                                  variant="outline"
                                  className={cn(
                                    "text-xs font-normal gap-1",
                                    statusSurface[color],
                                  )}
                                >
                                  {POWERFUL_PERMISSION_ACTIONS.has(action) && (
                                    <Star className="size-2.5 fill-amber-500 text-amber-500" />
                                  )}
                                  {PERMISSION_ACTION_LABELS[action]}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <p className="text-xs italic text-muted-foreground">
        Inactive groups are omitted. super_admin always has every permission and isn&apos;t shown here — it isn&apos;t a group.
      </p>
    </div>
  );
}
