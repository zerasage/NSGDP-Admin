"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useOrganisationGroup,
  useAddGroupMember,
  useRemoveGroupMember,
} from "@/lib/hooks/useOrganisationGroups";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import { useToast } from "@/lib/hooks/use-toast";

export function OrganisationGroupMemberManager({ groupId, disabled = false }: { groupId: string; disabled?: boolean }) {
  const { data: group, isLoading } = useOrganisationGroup(groupId);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: orgsData, isLoading: orgsLoading, isFetching: orgsFetching, isError: orgsError } = useOrganisations(
    1,
    20,
    undefined,
    { search: debouncedSearch || undefined }
  );
  const organisations = useMemo(() => orgsData?.data ?? [], [orgsData]);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAdd = (org: { id: string; name: string }) => {
    const onAdded = () => {
      setActioningId(null);
      setSearch("");
      toast({ title: `Added ${org.name}` });
    };
    const onFailed = (error: unknown) => {
      setActioningId(null);
      toast({
        title: "Couldn&apos;t add member",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    };

    setActioningId(org.id);
    addMember.mutate({ groupId, organisationId: org.id }, { onSuccess: onAdded, onError: onFailed });
  };

  const handleRemove = (member: { organisation_id: string; organisation_name: string }) => {
    const onRemoved = () => {
      setActioningId(null);
      toast({ title: `Removed ${member.organisation_name}` });
    };
    const onFailed = (error: unknown) => {
      setActioningId(null);
      toast({
        title: "Couldn&apos;t remove member",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    };

    setActioningId(member.organisation_id);
    removeMember.mutate({ groupId, organisationId: member.organisation_id }, { onSuccess: onRemoved, onError: onFailed });
  };

  const existingIds = useMemo(
    () => new Set((group?.members ?? []).map((m) => m.organisation_id)),
    [group],
  );

  const candidates = useMemo(() => {
    return organisations.filter((org) => !existingIds.has(org.id));
  }, [organisations, existingIds]);

  if (isLoading || !group) {
    return <Skeleton className="h-24" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Members ({group.members.length})
        </p>
        {group.members.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No member organisations yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {group.members.map((member) => (
              <li key={member.id} className="flex flex-col gap-2 rounded-xl border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/organisations/${member.organisation_id}`} className="font-medium underline-offset-4 hover:underline focus-visible:outline-2">{member.organisation_name}</Link>
                  {member.organisation_acronym && (
                    <Badge variant="outline" className="ml-2 text-xs">{member.organisation_acronym}</Badge>
                  )}
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Added {new Date(member.joined_at).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 w-full shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive sm:h-8 sm:w-auto"
                  onClick={() => handleRemove(member)}
                  disabled={disabled || actioningId === member.organisation_id || (removeMember.isPending && !actioningId)}
                >
                  <X className="size-3.5 mr-1" />
                  {actioningId === member.organisation_id ? "Removing..." : "Remove"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add organisations</p>
        <p className="mb-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 mt-0.5 shrink-0" />
          Organisations in this group gain all capabilities granted to the group. They can be added or removed as needed.
        </p>

        {!orgsLoading && organisations.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
            No organisations exist yet.{" "}
            <Link href="/organisations" className="text-primary underline underline-offset-2">
              Create one
            </Link>{" "}
            first, then come back here to add them to a group.
          </p>
        ) : (
          <>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organisations by name..."
              className="mb-2"
            />
            {orgsLoading || orgsFetching || search.trim() !== debouncedSearch ? (
              <Skeleton className="h-10" />
            ) : orgsError ? (
              <p className="rounded-xl border border-destructive/40 p-3 text-sm text-destructive">Organisation matches could not be loaded. Try your search again.</p>
            ) : candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {search ? "No matching organisations." : "Every organisation is already in this group."}
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-72 overflow-y-auto">
                {candidates.map((org) => (
                  <li
                    key={org.id}
                    className="flex flex-col gap-2 rounded-xl border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <span className="font-medium">{org.name}</span>
                      {org.acronym && (
                        <Badge variant="outline" className="ml-2 text-xs">{org.acronym}</Badge>
                      )}
                      {org.type && (
                        <div className="mt-0.5 text-xs text-muted-foreground capitalize">
                          {org.type}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 w-full shrink-0 sm:h-8 sm:w-auto"
                      onClick={() => handleAdd(org)}
                      disabled={disabled || actioningId === org.id || (addMember.isPending && !actioningId)}
                    >
                      <Plus className="size-3.5 mr-1" />
                      {actioningId === org.id ? "Adding..." : "Add"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      {disabled && <p className="border-l-4 border-amber-500 pl-3 text-sm">Members cannot be changed while this group is inactive.</p>}
    </div>
  );
}
