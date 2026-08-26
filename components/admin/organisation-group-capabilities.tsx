"use client";

import { FolderKanban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/utils/date";
import type { OrganisationGroup, OrganisationGroupCapability } from "@/lib/api/organisation-groups";
import {
  useOrganisationGroup,
  useGrantCapability,
  useRevokeCapability,
} from "@/lib/hooks/useOrganisationGroups";
import {
  ORGANISATION_CAPABILITIES,
  ORGANISATION_CAPABILITY_LABELS,
  ORGANISATION_CAPABILITY_DESCRIPTIONS,
  type OrganisationCapabilityKey,
} from "@/types/organisation-capabilities";
import { useToast } from "@/lib/hooks/use-toast";

export function OrganisationGroupCapabilities({ group }: { group: OrganisationGroup }) {
  const { data: detail, refetch } = useOrganisationGroup(group.id);
  const grant = useGrantCapability();
  const revoke = useRevokeCapability();
  const { toast } = useToast();

  if (!detail) return <Skeleton className="h-40" />;

  const grantedCapabilities = new Map(
    detail.capabilities.map((c: OrganisationGroupCapability) => [c.capability as OrganisationCapabilityKey, c.id] as const)
  );

  const toggleCapability = (capability: OrganisationCapabilityKey) => {
    const existingGrantId = grantedCapabilities.get(capability);

    if (existingGrantId) {
      revoke.mutate(
        { groupId: group.id, capabilityId: existingGrantId },
        {
          onSuccess: () => {
            toast({ title: `Revoked "${ORGANISATION_CAPABILITY_LABELS[capability]}" for ${group.name}` });
            refetch();
          },
          onError: (error: unknown) =>
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : undefined,
              variant: "destructive",
            }),
        }
      );
    } else {
      grant.mutate(
        { groupId: group.id, capability },
        {
          onSuccess: () => {
            toast({ title: `Granted "${ORGANISATION_CAPABILITY_LABELS[capability]}" for ${group.name}` });
            refetch();
          },
          onError: (error: unknown) =>
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : undefined,
              variant: "destructive",
            }),
        }
      );
    }
  };

  return (
    <>
      <div className="rounded-lg border bg-muted/30 p-4 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Organisation Capabilities
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/80">
              <FolderKanban className="size-3.5" />
              Programmes
            </p>
          </div>
          {ORGANISATION_CAPABILITIES.map((capability) => {
            const checked = grantedCapabilities.has(capability);
            return (
              <label key={capability} className="flex items-start gap-3 cursor-pointer group/cap">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleCapability(capability)}
                  disabled={!group.is_active || grant.isPending || revoke.isPending}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium group-hover/cap:text-primary transition-colors">
                    {ORGANISATION_CAPABILITY_LABELS[capability]}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ORGANISATION_CAPABILITY_DESCRIPTIONS[capability]}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
      {!group.is_active && <p className="mt-3 border-l-4 border-amber-500 pl-3 text-sm">This group is inactive and read-only. Configured capabilities confer no access.</p>}
      <p className="mt-3 text-xs text-muted-foreground">Created {formatDate(detail.created_at)}</p>
    </>
  );
}
