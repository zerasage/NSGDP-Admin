"use client";

import { Check, Minus, Star } from "lucide-react";
import { PERMISSION_ACTION_LABELS } from "@/types/permissions";
import type { PermissionActionKey } from "@/lib/api/permissions";
import { usePermissionMatrix } from "@/lib/hooks/usePermissionGroups";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  public: "Public Visitor",
  registered: "Registered User",
  contributor: "Contributor",
  admin: "Org Admin",
  super_admin: "Super Admin (Owner)",
};

function Cell({ has, isDelegatable }: { has: boolean; isDelegatable?: boolean }) {
  return (
    <td className="border-b border-r px-3 py-2.5 text-center last:border-r-0">
      {has ? (
        <span className="inline-flex items-center justify-center">
          <Check className="size-3.5 text-emerald-600" aria-label="Granted" />
        </span>
      ) : isDelegatable ? (
        <span className="inline-flex items-center justify-center">
          <Star className="size-3 text-amber-400" aria-label="Delegatable" />
        </span>
      ) : (
        <span className="inline-flex items-center justify-center">
          <Minus className="size-3 text-muted-foreground/40" aria-label="Not available" />
        </span>
      )}
    </td>
  );
}

export function PermissionMatrix() {
  const { data, isLoading } = usePermissionMatrix();

  if (isLoading || !data) {
    return <Skeleton className="h-64" />;
  }

  const actions = data.actions.map((a) => a.key);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <Check className="size-3.5 text-emerald-600" /> Base permission (always granted)
        </span>
        <span className="flex items-center gap-1.5">
          <Star className="size-3 text-amber-400" /> Delegatable (Super Admin may grant to a group)
        </span>
        <span className="flex items-center gap-1.5">
          <Minus className="size-3 text-muted-foreground/40" /> Not available for this role
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs whitespace-nowrap">
          <thead>
            <tr className="bg-muted/60">
              <th className="sticky left-0 z-10 bg-muted/60 border-b border-r px-4 py-3 text-left font-semibold">
                Role
              </th>
              {actions.map((action) => (
                <th
                  key={action}
                  className="border-b border-r px-3 py-3 text-center font-medium last:border-r-0 max-w-24"
                >
                  <span className="block truncate max-w-[100px]" title={PERMISSION_ACTION_LABELS[action]}>
                    {PERMISSION_ACTION_LABELS[action]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.roles.map((def, i) => (
              <tr
                key={def.role}
                className={cn(
                  "hover:bg-muted/30 transition-colors",
                  def.role === "super_admin" && "bg-primary/5 font-medium"
                )}
              >
                <td className={cn(
                  "sticky left-0 z-10 border-b border-r px-4 py-2.5 font-medium",
                  i % 2 === 0 ? "bg-background" : "bg-muted/10",
                  def.role === "super_admin" && "bg-primary/5"
                )}>
                  {ROLE_LABELS[def.role] ?? def.role}
                </td>
                {actions.map((action) => {
                  const has = def.actions[action];
                  const canDelegate = !has && def.role !== "super_admin";
                  return <Cell key={action} has={has} isDelegatable={canDelegate} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.delegations.length > 0 && (
        <div className="rounded-lg border p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Active delegations by group
          </p>
          <ul className="space-y-1.5 text-sm">
            {data.delegations.map((group) => (
              <li key={group.id}>
                <span className="font-medium">{group.name}</span>
                {group.actions.length > 0 ? (
                  <span className="text-muted-foreground">
                    {" "}
                    — {group.actions.map((a: PermissionActionKey) => PERMISSION_ACTION_LABELS[a]).join(", ")}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic"> — no active grants</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
