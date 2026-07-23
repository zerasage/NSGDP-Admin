"use client";

import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePermissionGroup,
  useAddGroupMember,
  useRemoveGroupMember,
} from "@/lib/hooks/usePermissionGroups";
import { useUsers } from "@/lib/hooks/useAdmin";
import { useToast } from "@/lib/hooks/use-toast";

export function MemberManager({ groupId }: { groupId: string }) {
  const { data: group, isLoading } = usePermissionGroup(groupId);
  const [search, setSearch] = useState("");
  const { data: userResults } = useUsers({ search, limit: 5 });
  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();
  const { toast } = useToast();

  if (isLoading || !group) {
    return <Skeleton className="h-24" />;
  }

  const existingIds = new Set(group.members.map((m) => m.user_id));

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
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add member</p>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="mb-2"
        />
        {search.length > 1 && (
          <ul className="space-y-1.5">
            {(userResults?.data ?? [])
              .filter((u) => !existingIds.has(u.id))
              .map((user) => (
                <li key={user.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{user.first_name} {user.last_name}</span>
                    <span className="text-muted-foreground ml-2">{user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      addMember.mutate(
                        { groupId, userId: user.id },
                        { onSuccess: () => { setSearch(""); toast({ title: "Member added" }); } }
                      )
                    }
                    disabled={addMember.isPending}
                  >
                    <UserPlus className="size-3.5 mr-1" />
                    Add
                  </Button>
                </li>
              ))}
            {(userResults?.data ?? []).filter((u) => !existingIds.has(u.id)).length === 0 && (
              <p className="text-sm text-muted-foreground italic">No matching users.</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
