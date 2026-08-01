"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UserPlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePermissionGroup,
  useAssignGroupMember,
} from "@/lib/hooks/usePermissionGroups";
import { useStaffMembers } from "@/lib/hooks/useStaff";
import { useToast } from "@/lib/hooks/use-toast";

export function MemberManager({ groupId, disabled = false }: { groupId: string; disabled?: boolean }) {
  const { data: group, isLoading } = usePermissionGroup(groupId);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: staffData, isLoading: staffLoading, isFetching: staffFetching, isError: staffError } = useStaffMembers({ limit: 20, search: debouncedSearch || undefined });
  const staff = useMemo(() => staffData?.data ?? [], [staffData]);
  const [movingId, setMovingId] = useState<string | null>(null);
  const assignMember = useAssignGroupMember();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAdd = (member: { id: string; fullName: string; groupId: string | null }) => {
    const onAdded = () => {
      setMovingId(null);
      setSearch("");
      toast({ title: `Added ${member.fullName}` });
    };
    const onFailed = (error: unknown) => {
      setMovingId(null);
      toast({
        title: "Couldn't add member",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    };

    setMovingId(member.id);
    assignMember.mutate({ targetGroupId: groupId, userId: member.id, expectedCurrentGroupId: member.groupId },
      { onSuccess: onAdded, onError: onFailed });
  };

  const existingIds = useMemo(
    () => new Set((group?.members ?? []).map((m) => m.user_id)),
    [group],
  );

  const candidates = useMemo(() => {
    const pool = staff.filter((s) => !existingIds.has(s.id));
    // Eligible (no group yet) first, then everyone else already spoken for
    return [...pool].sort((a, b) => {
      const aFree = a.groupId === null ? 0 : 1;
      const bFree = b.groupId === null ? 0 : 1;
      return aFree - bFree;
    });
  }, [staff, existingIds]);

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
          <p className="text-sm text-muted-foreground italic">No members yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {group.members.map((member) => (
              <li key={member.id} className="flex flex-col gap-2 rounded-xl border px-3 py-2 text-sm sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <Link href={`/users/${member.user_id}`} className="font-medium underline-offset-4 hover:underline focus-visible:outline-2">{member.first_name} {member.last_name}</Link>
                  <span className="block break-all text-muted-foreground sm:ml-2 sm:inline">{member.email}</span>
                  <Badge variant="outline" className="ml-2 text-xs capitalize">{member.role}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assign or move staff</p>
        <p className="mb-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 mt-0.5 shrink-0" />
          Every staff member must belong to one active group. Moving someone here transfers their membership to {group.name} in one safe operation.
        </p>

        {!staffLoading && staff.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
            No agency staff exist yet.{" "}
            <Link href="/agency" className="text-primary underline underline-offset-2">
              Invite one
            </Link>{" "}
            first, then come back here to assign them a group.
          </p>
        ) : (
          <>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff by name or email..."
              className="mb-2"
            />
            {staffLoading || staffFetching || search.trim() !== debouncedSearch ? (
              <Skeleton className="h-10" />
            ) : staffError ? (
              <p className="rounded-xl border border-destructive/40 p-3 text-sm text-destructive">Staff matches could not be loaded. Try your search again.</p>
            ) : candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {search ? "No matching staff." : "Every staff member is already in this group."}
              </p>
            ) : (
              <ul className="space-y-1.5 max-h-72 overflow-y-auto">
                {candidates.map((member) => {
                  const takenElsewhere = member.groupId !== null;
                  return (
                    <li
                      key={member.id}
                      className="flex flex-col gap-2 rounded-xl border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <span className="font-medium">{member.fullName}</span>
                        <span className="block break-all text-muted-foreground sm:ml-2 sm:inline">{member.email}</span>
                        {member.status !== "active" && (
                          <Badge variant="destructive" className="ml-2 text-xs capitalize">
                            {member.status}
                          </Badge>
                        )}
                        {takenElsewhere && (
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            Currently in <span className="font-medium">{member.groupName}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 w-full shrink-0 sm:h-8 sm:w-auto"
                        onClick={() => handleAdd(member)}
                        disabled={disabled || movingId === member.id || (assignMember.isPending && !movingId)}
                      >
                        <UserPlus className="size-3.5 mr-1" />
                        {movingId === member.id ? "Moving..." : takenElsewhere ? "Move here" : "Assign"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
      {disabled && <p className="border-l-4 border-amber-500 pl-3 text-sm">Members cannot be changed while this group is inactive.</p>}
    </div>
  );
}
