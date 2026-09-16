"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDepartment,
  useAddDepartmentMember,
  useRemoveDepartmentMember,
} from "@/lib/hooks/useDepartments";
import { useStaffMembers } from "@/lib/hooks/useStaff";
import { useToast } from "@/lib/hooks/use-toast";

export function DepartmentMemberManager({
  departmentId,
  disabled = false,
  canManage,
}: {
  departmentId: string;
  disabled?: boolean;
  /** Add/remove controls only render for super_admin or a manage:department-members holder. */
  canManage: boolean;
}) {
  const { data: department, isLoading } = useDepartment(departmentId);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data: staffData, isLoading: staffLoading, isFetching: staffFetching, isError: staffError } = useStaffMembers(
    {
      page: 1,
      limit: 20,
      search: debouncedSearch || undefined,
      status: "active",
    },
    canManage,
  );
  const staff = useMemo(() => staffData?.data ?? [], [staffData]);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const addMember = useAddDepartmentMember();
  const removeMember = useRemoveDepartmentMember();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleAdd = (member: { id: string; fullName: string }) => {
    const onAdded = () => {
      setActioningId(null);
      setSearch("");
      toast({ title: `Added ${member.fullName}` });
    };
    const onFailed = (error: unknown) => {
      setActioningId(null);
      toast({
        title: "Couldn't add member",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    };

    setActioningId(member.id);
    addMember.mutate({ departmentId, userId: member.id }, { onSuccess: onAdded, onError: onFailed });
  };

  const handleRemove = (member: { user_id: string; full_name: string }) => {
    const onRemoved = () => {
      setActioningId(null);
      toast({ title: `Removed ${member.full_name}` });
    };
    const onFailed = (error: unknown) => {
      setActioningId(null);
      toast({
        title: "Couldn't remove member",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    };

    setActioningId(member.user_id);
    removeMember.mutate({ departmentId, userId: member.user_id }, { onSuccess: onRemoved, onError: onFailed });
  };

  const existingIds = useMemo(
    () => new Set((department?.members ?? []).map((m) => m.user_id)),
    [department],
  );

  const candidates = useMemo(() => {
    return staff.filter((member) => !existingIds.has(member.id));
  }, [staff, existingIds]);

  if (isLoading || !department) {
    return <Skeleton className="h-24" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Members ({department.members.length})
        </p>
        {department.members.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No members yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {department.members.map((member) => (
              <li key={member.id} className="flex flex-col gap-2 rounded-xl border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/users/${member.user_id}`} className="font-medium underline-offset-4 hover:underline focus-visible:outline-2">{member.full_name}</Link>
                  <div className="mt-0.5 text-xs text-muted-foreground">{member.email}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Added {new Date(member.joined_at).toLocaleDateString()}
                  </div>
                </div>
                {canManage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 w-full shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive sm:h-8 sm:w-auto"
                  onClick={() => handleRemove(member)}
                  disabled={disabled || actioningId === member.user_id || (removeMember.isPending && !actioningId)}
                >
                  <X className="size-3.5 mr-1" />
                  {actioningId === member.user_id ? "Removing..." : "Remove"}
                </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {canManage && (
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add staff</p>
        <p className="mb-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5 mt-0.5 shrink-0" />
          Only existing agency staff accounts can be added. New staff accounts are created via the Agency page&apos;s staff invite.
        </p>

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
            {search ? "No matching staff." : "No staff available to add."}
          </p>
        ) : (
          <ul className="space-y-1.5 max-h-72 overflow-y-auto">
            {candidates.map((member) => (
              <li
                key={member.id}
                className="flex flex-col gap-2 rounded-xl border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <span className="font-medium">{member.fullName}</span>
                  <div className="mt-0.5 text-xs text-muted-foreground">{member.email}</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 w-full shrink-0 sm:h-8 sm:w-auto"
                  onClick={() => handleAdd(member)}
                  disabled={disabled || actioningId === member.id || (addMember.isPending && !actioningId)}
                >
                  <Plus className="size-3.5 mr-1" />
                  {actioningId === member.id ? "Adding..." : "Add"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      )}
      {canManage && disabled && <p className="border-l-4 border-amber-500 pl-3 text-sm">Members cannot be changed while this department is inactive.</p>}
      {!canManage && <p className="text-xs text-muted-foreground">You can view this department because you&apos;re a member. Managing membership requires the manage:department-members permission.</p>}
    </div>
  );
}
