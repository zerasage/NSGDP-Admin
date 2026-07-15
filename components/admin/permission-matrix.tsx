import { Check, Minus, Star } from "lucide-react";
import type { PermissionAction } from "@/types/permissions";
import { PERMISSION_ACTION_LABELS } from "@/types/permissions";
import { cn } from "@/lib/utils";

const ROLE_DEFINITIONS: Array<{
  role: string;
  label: string;
  basePermissions: PermissionAction[];
  delegatable: boolean;
}> = [
  { role: "public",      label: "Public Visitor",           basePermissions: [],                                                                                           delegatable: false },
  { role: "registered",  label: "Registered User",          basePermissions: [],                                                                                           delegatable: true  },
  { role: "contributor", label: "Data Contributor",         basePermissions: ["upload:programs"],                                                                          delegatable: true  },
  { role: "contributor",   label: "Dataset Custodian",        basePermissions: ["upload:programs", "archive:datasets"],                                                      delegatable: true  },
  { role: "contributor",   label: "Data Validator",           basePermissions: ["approve:datasets", "view:restricted"],                                                      delegatable: true  },
  { role: "admin",   label: "Organisation Admin",       basePermissions: ["create:programs", "edit:programs", "upload:programs", "approve:datasets", "manage:users", "view:restricted"], delegatable: true  },
  { role: "admin",  label: "Repository Admin",         basePermissions: ["create:programs", "edit:programs", "delete:programs", "upload:programs", "approve:datasets", "publish:datasets", "archive:datasets", "view:restricted", "download:restricted"], delegatable: false },
  { role: "admin",   label: "ICT Administrator",        basePermissions: ["manage:users", "view:restricted"],                                                          delegatable: false },
  { role: "super_admin", label: "Super Admin (Owner)",      basePermissions: Object.keys(PERMISSION_ACTION_LABELS) as PermissionAction[],                                  delegatable: false },
];

const ALL_ACTIONS = Object.keys(PERMISSION_ACTION_LABELS) as PermissionAction[];

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
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <Check className="size-3.5 text-emerald-600" /> Base permission (always granted)
        </span>
        <span className="flex items-center gap-1.5">
          <Star className="size-3 text-amber-400" /> Delegatable (Super Admin may grant)
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
              {ALL_ACTIONS.map((action) => (
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
            {ROLE_DEFINITIONS.map((def, i) => (
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
                  {def.label}
                </td>
                {ALL_ACTIONS.map((action) => {
                  const has = def.basePermissions.includes(action);
                  const canDelegate = !has && def.delegatable;
                  return (
                    <Cell key={action} has={has} isDelegatable={canDelegate} />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
