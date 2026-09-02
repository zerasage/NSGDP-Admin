"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Download,
  Loader2,
  Lock,
  RotateCcw,
  Search,
  UserCheck,
  UserRound,
  Users,
  UserX,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import {
  useDeactivateUserDelegated,
  useUpdateUserStatus,
  useUserStats,
  useUsers,
} from "@/lib/hooks/useAdmin";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import type { AdminUser } from "@/lib/api/admin";
import type { UserRole } from "@/types";
import { RoleBadge } from "@/components/data/role-badge";
import { Pagination } from "@/components/data/pagination";
import { EmptyState } from "@/components/feedback/empty-state";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DataTableShell,
  METRIC_TONE,
  MetricCard,
  Panel,
  tabToneClass,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import { HelpTip } from "@/components/admin/help-tip";
import {
  USERS_EXPORT_TIP,
  USERS_METRIC_TIPS,
  USERS_PAGE_TIP,
  USERS_PANEL_TIP,
  USERS_REACTIVATE_TIP,
  USERS_ROLE_FILTER_TIP,
  USERS_SUSPEND_TIP,
  USERS_TAB_TIPS,
} from "@/lib/constants/users-tooltips";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";

type UserStatus = AdminUser["status"];

const STATUS_CONFIG: Record<UserStatus, { label: string; tone: MetricTone }> = {
  pending: { label: "Signup incomplete", tone: "muted" },
  active: { label: "Active", tone: "success" },
  suspended: { label: "Suspended", tone: "destructive" },
  archived: { label: "Archived", tone: "muted" },
};

const TABS: Array<{
  key: UserStatus | "all";
  label: string;
  tone: MetricTone;
  tip: string;
}> = [
  { key: "all", label: "All users", tone: "muted", tip: USERS_TAB_TIPS.all },
  { key: "active", label: "Active", tone: "success", tip: USERS_TAB_TIPS.active },
  { key: "suspended", label: "Suspended", tone: "destructive", tip: USERS_TAB_TIPS.suspended },
  { key: "archived", label: "Archived", tone: "muted", tip: USERS_TAB_TIPS.archived },
];

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "public", label: "Public" },
  { value: "registered", label: "Registered" },
  { value: "contributor", label: "Contributor" },
  { value: "admin", label: "Organisation admin" },
  { value: "staff", label: "Agency staff" },
  { value: "super_admin", label: "Super admin" },
];

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { isLoading: permissionsLoading, canAny, isSuperAdmin } = useAdminAccess();
  const canViewUsers = canAny(
    "invite:users",
    "promote:org-admin",
    "demote:org-admin",
    "remove:org-members",
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [role, setRole] = useState<UserRole | "all">("all");
  const [status, setStatus] = useState<UserStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const {
    data: usersData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useUsers(
    {
      page,
      limit: pageSize,
      role: role === "all" ? undefined : role,
      status: status === "all" ? undefined : status,
      search: debouncedQuery || undefined,
    },
    canViewUsers,
  );
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: organisationsData } = useOrganisations(1, 200);
  const updateStatusMutation = useUpdateUserStatus();
  const deactivateMutation = useDeactivateUserDelegated();

  const users = usersData?.data ?? [];
  const total = usersData?.total ?? 0;
  const totalPages = usersData?.totalPages ?? 1;
  const isSearchPending = query.trim() !== debouncedQuery;
  const hasFilters = !!query || !!debouncedQuery || role !== "all" || status !== "all";
  const organisationNames = new Map(
    (organisationsData?.data ?? []).map((organisation) => [organisation.id, organisation.name]),
  );
  const organisationName = (id: string | null) =>
    (id ? organisationNames.get(id) : undefined) ?? "No organisation";

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setRole("all");
    setStatus("all");
    setPage(1);
  };

  const exportCurrentPage = () => {
    if (users.length === 0) {
      toast.error("No users to export");
      return;
    }

    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Role",
      "Status",
      "Organisation",
      "Last Login",
      "Created",
    ];
    const rows = users.map((listedUser) => [
      listedUser.first_name,
      listedUser.last_name,
      listedUser.email,
      listedUser.phone_number ?? "",
      listedUser.role,
      listedUser.status,
      organisationName(listedUser.organisation_id),
      listedUser.last_login_at ? formatDate(listedUser.last_login_at) : "Never",
      formatDate(listedUser.created_at),
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `users-page-${page}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${users.length} users from this page`);
  };

  const changeStatus = (listedUser: AdminUser, nextStatus: AdminUser["status"]) => {
    updateStatusMutation.mutate(
      { userId: listedUser.id, data: { status: nextStatus } },
      {
        onSuccess: () => {
          const verb = listedUser.status === "suspended" ? "Reactivated" : "Updated";
          toast.success(`${verb} ${listedUser.first_name} ${listedUser.last_name}`);
          setSuspendTarget(null);
        },
        onError: () => toast.error("Failed to update status"),
      },
    );
  };

  const suspendUser = (listedUser: AdminUser) => {
    deactivateMutation.mutate(
      { userId: listedUser.id },
      {
        onSuccess: () => {
          toast.success(`Suspended ${listedUser.first_name} ${listedUser.last_name}`);
          setSuspendTarget(null);
        },
        onError: () => toast.error("Failed to suspend user"),
      },
    );
  };

  const renderActions = (listedUser: AdminUser, mobile = false) => (
    <UserActions
      listedUser={listedUser}
      currentUserId={user?.id}
      isSuperAdmin={isSuperAdmin}
      mobile={mobile}
      statusUpdatePending={updateStatusMutation.isPending}
      suspendPending={deactivateMutation.isPending}
      onSuspend={() => setSuspendTarget(listedUser)}
      onReactivate={() => changeStatus(listedUser, "active")}
    />
  );

  if (!permissionsLoading && !canViewUsers) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="Viewing users requires invite:users, promote:org-admin, demote:org-admin, or remove:org-members. Ask a super admin to grant your group one of these permissions."
        />
      </div>
    );
  }

  return (
    <TooltipProvider delay={200}>
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            Users
            <HelpTip content={USERS_PAGE_TIP} label="About users" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review platform accounts, access roles, and account status
          </p>
        </div>
        {!isLoading && (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium tabular-nums">
            {total} {total === 1 ? "user" : "users"}
          </Badge>
        )}
      </div>

      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            label="Total users"
            value={stats?.total ?? 0}
            hint="All registered accounts"
            tip={USERS_METRIC_TIPS.total}
            icon={Users}
            tone="primary"
          />
          <MetricCard
            label="Active"
            value={stats?.byStatus.active ?? 0}
            hint="Can sign in today"
            tip={USERS_METRIC_TIPS.active}
            icon={UserCheck}
            tone="success"
          />
          <MetricCard
            label="Suspended"
            value={stats?.byStatus.suspended ?? 0}
            hint="Access revoked"
            tip={USERS_METRIC_TIPS.suspended}
            icon={UserX}
            tone="destructive"
          />
        </div>
      )}

      <Panel
        title="User directory"
        titleTip={USERS_PANEL_TIP}
        description="Filter by status or role, or search by name or email."
        icon={Users}
        tone="info"
        action={
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              className="h-9 w-full sm:w-auto"
              onClick={exportCurrentPage}
              disabled={users.length === 0}
            >
              <Download className="size-4" aria-hidden="true" />
              Export page
            </Button>
            <HelpTip content={USERS_EXPORT_TIP} label="About export page" />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="scrollbar-hide overflow-x-auto rounded-xl border bg-muted/30 p-1">
            <div className="flex w-max min-w-full flex-nowrap gap-1" role="tablist" aria-label="User status">
              {TABS.map((tab) => (
                <div key={tab.key} className="inline-flex flex-none items-center gap-0.5">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={status === tab.key}
                    onClick={() => {
                      setStatus(tab.key);
                      setPage(1);
                    }}
                    className={cn(
                      "min-h-9 flex-none rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                      status === tab.key
                        ? cn("shadow-sm", tabToneClass(tab.tone))
                        : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                  {status === tab.key ? (
                    <HelpTip content={tab.tip} label={`About ${tab.label}`} />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:max-w-sm">
                <Search
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name or email"
                  className="h-10 pl-9 pr-10"
                  aria-label="Search users"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="Clear user search"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Select
                  value={role}
                  onValueChange={(value) => {
                    setRole(value as UserRole | "all");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-10 w-full sm:w-52" aria-label="Filter users by role">
                    <SelectValue>
                      {(v: string) =>
                        v === "all"
                          ? "All roles"
                          : (roleOptions.find((option) => option.value === v)?.label ?? v)
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <HelpTip content={USERS_ROLE_FILTER_TIP} label="About role filter" className="hidden sm:inline-flex" />
              </div>

              {hasFilters && (
                <Button variant="ghost" className="h-10" onClick={clearFilters}>
                  <X className="size-4" aria-hidden="true" />
                  Clear filters
                </Button>
              )}
            </div>

            <div className="flex min-h-5 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
              {(isSearchPending || (isFetching && !isLoading)) && (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              )}
              <span>
                {isSearchPending ? "Searching" : isFetching && !isLoading ? "Updating" : "Found"}{" "}
                <span className="font-semibold tabular-nums text-foreground">{total}</span>{" "}
                {total === 1 ? "user" : "users"}
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <div aria-busy={isLoading || isFetching || isSearchPending} className="space-y-4">
        {isError ? (
          <div className="rounded-2xl border bg-card px-4 py-12 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-semibold">Could not load users</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Check your connection and try loading the user directory again.
            </p>
            <Button variant="outline" className="mt-5 h-11 sm:h-8" onClick={() => refetch()}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <>
            <div className="hidden overflow-hidden rounded-2xl border bg-card xl:block">
              <Table>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <TableRowSkeleton key={index} cols={7} />
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid grid-cols-1 gap-3 xl:hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-64 rounded-xl" />
              ))}
            </div>
          </>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border bg-card">
            <EmptyState
              icon={UserRound}
              title={hasFilters ? "No matching users" : "No users yet"}
              description={
                hasFilters
                  ? "Try a different search term, status, or account role."
                  : "User accounts will appear here after registration."
              }
              action={hasFilters ? { label: "Clear filters", onClick: clearFilters } : undefined}
            />
          </div>
        ) : (
          <>
            <DataTableShell>
              <div className="hidden xl:block">
                <Table>
                  <TableHeader>
                    <TableRow className="h-11 bg-muted/40 text-[11px] uppercase tracking-wide hover:bg-muted/40">
                      <TableHead className="h-11 px-4">User</TableHead>
                      <TableHead className="h-11 px-4">Organisation</TableHead>
                      <TableHead className="h-11 px-4">Role</TableHead>
                      <TableHead className="h-11 px-4">Status</TableHead>
                      <TableHead className="h-11 px-4">Last login</TableHead>
                      <TableHead className="h-11 px-4">Joined</TableHead>
                      <TableHead className="h-11 px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((listedUser) => (
                      <TableRow key={listedUser.id} className="hover:bg-muted/30">
                        <TableCell className="max-w-sm px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={listedUser} />
                            <div className="min-w-0">
                              <Link
                                href={`/users/${listedUser.id}`}
                                className="line-clamp-1 font-semibold hover:underline"
                              >
                                {listedUser.first_name} {listedUser.last_name}
                              </Link>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                <a
                                  href={`mailto:${listedUser.email}`}
                                  className="hover:underline"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {listedUser.email}
                                </a>
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-56 px-4 py-3.5 text-xs text-muted-foreground">
                          <span className="line-clamp-2">
                            {organisationName(listedUser.organisation_id)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <RoleBadge role={listedUser.role} />
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <UserStatusBadge status={listedUser.status} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                          {listedUser.last_login_at ? formatDate(listedUser.last_login_at) : "Never"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-4 py-3.5 text-xs text-muted-foreground">
                          {formatDate(listedUser.created_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-right">
                          {renderActions(listedUser)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DataTableShell>

            <div className="grid grid-cols-1 gap-3 xl:hidden">
              {users.map((listedUser) => (
                <article key={listedUser.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar user={listedUser} mobile />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/users/${listedUser.id}`}
                        className="line-clamp-2 text-sm font-semibold leading-5 hover:underline"
                      >
                        {listedUser.first_name} {listedUser.last_name}
                      </Link>
                      <a
                        href={`mailto:${listedUser.email}`}
                        className="mt-1 block truncate text-xs text-muted-foreground hover:underline"
                      >
                        {listedUser.email}
                      </a>
                    </div>
                    <UserStatusBadge status={listedUser.status} />
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y py-3">
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Role
                      </dt>
                      <dd className="mt-1 truncate">
                        <RoleBadge role={listedUser.role} />
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Last login
                      </dt>
                      <dd className="mt-1 truncate text-xs font-medium">
                        {listedUser.last_login_at ? formatDate(listedUser.last_login_at) : "Never"}
                      </dd>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Organisation
                      </dt>
                      <dd className="mt-1 truncate text-xs font-medium">
                        {organisationName(listedUser.organisation_id)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4">{renderActions(listedUser, true)}</div>
                </article>
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={Math.max(1, totalPages)}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              className="rounded-xl border bg-card px-4 py-3"
            />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!suspendTarget}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
        title="Suspend user?"
        description={`"${suspendTarget?.first_name} ${suspendTarget?.last_name}" will immediately lose access and be unable to log in until reactivated.`}
        confirmLabel="Suspend"
        variant="destructive"
        loading={deactivateMutation.isPending}
        onConfirm={() => suspendTarget && suspendUser(suspendTarget)}
      />
    </div>
    </TooltipProvider>
  );
}

function UserActions({
  listedUser,
  currentUserId,
  isSuperAdmin,
  mobile = false,
  statusUpdatePending,
  suspendPending,
  onSuspend,
  onReactivate,
}: {
  listedUser: AdminUser;
  currentUserId?: string;
  isSuperAdmin: boolean;
  mobile?: boolean;
  statusUpdatePending: boolean;
  suspendPending: boolean;
  onSuspend: () => void;
  onReactivate: () => void;
}) {
  if (!isSuperAdmin || listedUser.id === currentUserId || listedUser.status === "archived" || listedUser.status === "pending") {
    return <span className="text-xs text-muted-foreground">No actions</span>;
  }

  const className = mobile ? "h-11 w-full" : undefined;

  if (listedUser.status === "active") {
    return (
      <div className={cn("flex items-center gap-1", mobile && "w-full")}>
        <Button variant="outline" className={className} disabled={suspendPending} onClick={onSuspend}>
          Suspend
        </Button>
        {!mobile ? <HelpTip content={USERS_SUSPEND_TIP} label="About suspend" /> : null}
      </div>
    );
  }
  if (listedUser.status === "suspended") {
    return (
      <div className={cn("flex items-center gap-1", mobile && "w-full")}>
        <Button variant="outline" className={className} disabled={statusUpdatePending} onClick={onReactivate}>
          Reactivate
        </Button>
        {!mobile ? <HelpTip content={USERS_REACTIVATE_TIP} label="About reactivate" /> : null}
      </div>
    );
  }

  return <span className="text-xs text-muted-foreground">No actions</span>;
}

function UserAvatar({ user, mobile = false }: { user: AdminUser; mobile?: boolean }) {
  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary",
        mobile ? "size-10 text-xs" : "size-9 text-[11px]",
      )}
      aria-hidden="true"
    >
      {initials || <UserRound className="size-4" />}
    </div>
  );
}

function UserStatusBadge({ status }: { status: AdminUser["status"] }) {
  const { label, tone } = STATUS_CONFIG[status];
  const t = METRIC_TONE[tone];
  return (
    <Badge variant="outline" className={cn("border text-xs capitalize", t.well, t.icon)}>
      {label}
    </Badge>
  );
}
