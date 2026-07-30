"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trash2, UserPlus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePermissionGroup,
  useAddGroupMember,
  useRemoveGroupMember,
} from "@/lib/hooks/usePermissionGroups";
import { useStaffMembers } from "@/lib/hooks/useStaff";
import { useToast } from "@/lib/hooks/use-toast";

export function MemberManager({ groupId }: { groupId: string }) {
  const { data: group, isLoading } = usePermissionGroup(groupId);
  const { data: staff, isLoading: staffLoading } = useStaffMembers();
  const [search, setSearch] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);
  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();
  const { toast } = useToast();

  // addMember alone 409s if the staff member already belongs to a group —
  // the backend enforces one group at a time and won't silently reassign.
  // Do the reassignment explicitly here: remove from their current group,
  // then add to this one.
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

    if (member.groupId === null) {
      addMember.mutate({ groupId, userId: member.id }, { onSuccess: onAdded, onError: onFailed });
      return;
    }

    setMovingId(member.id);
    removeMember.mutate(
      { groupId: member.groupId, userId: member.id },
      {
        onSuccess: () => addMember.mutate({ groupId, userId: member.id }, { onSuccess: onAdded, onError: onFailed }),
        onError: onFailed,
      },
    );
  };

  const existingIds = useMemo(
    () => new Set((group?.members ?? []).map((m) => m.user_id)),
    [group],
  );

  const candidates = useMemo(() => {
    const pool = (staff ?? []).filter((s) => !existingIds.has(s.id));
    const q = search.trim().toLowerCase();
    const filtered = q
      ? pool.filter(
          (s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
        )
      : pool;
    // Eligible (no group yet) first, then everyone else already spoken for
    return [...filtered].sort((a, b) => {
      const aFree = a.groupId === null ? 0 : 1;
      const bFree = b.groupId === null ? 0 : 1;
      return aFree - bFree;
    });
  }, [staff, existingIds, search]);

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
              <li key={member.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{member.first_name} {member.last_name}</span>
                  <span className="text-muted-foreground ml-2">{member.email}</span>
                  <Badge variant="outline" className="ml-2 text-xs capitalize">{member.role}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    removeMember.mutate(
                      { groupId, userId: member.user_id },
                      { onSuccess: () => toast({ title: "Member removed" }) }
                    )
                  }
                  disabled={removeMember.isPending}
                  aria-label="Remove member"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add member</p>
        <p className="mb-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 mt-0.5 shrink-0" />
          Only agency staff can be added, and each staff member belongs to one group at a time —
          adding them here moves them out of any other group.
        </p>

        {!staffLoading && (staff ?? []).length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
            No agency staff exist yet.{" "}
            <Link href="/staff" className="text-primary underline underline-offset-2">
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
            {staffLoading ? (
              <Skeleton className="h-10" />
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
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <span className="font-medium">{member.fullName}</span>
                        <span className="text-muted-foreground ml-2">{member.email}</span>
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
                        className="shrink-0"
                        onClick={() => handleAdd(member)}
                        disabled={movingId === member.id || (addMember.isPending && !movingId)}
                      >
                        <UserPlus className="size-3.5 mr-1" />
                        {movingId === member.id ? "Moving..." : takenElsewhere ? "Move here" : "Add"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
