"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  Ban,
  Database,
  Eye,
  Globe,
  Loader2,
  Mail,
  MailPlus,
  RotateCcw,
  RotateCw,
  Search,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { Pagination } from "@/components/data/pagination";
import { StatusBadge as DatasetStatusBadge } from "@/components/data/status-badge";
import { VisibilityBadge } from "@/components/data/visibility-badge";
import { AgeBadge } from "@/components/data/age-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { adminApi, archiveDataset, publishDataset, unarchiveDataset, updateUserStatus } from "@/lib/api/admin";
import { getPermissionGroups } from "@/lib/api/permissions";
import type { StaffInvite, StaffMember } from "@/lib/api/staff";
import type { DatasetStatus } from "@/lib/api/datasets";
import type { Visibility } from "@/types";
import {
  useCreateStaffInvite,
  useResendStaffInvite,
  useRevokeStaffInvite,
  useRevokeStaffStatus,
  useStaffInvites,
  useStaffMembers,
} from "@/lib/hooks/useStaff";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/utils/date";

interface AgencyDataset {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: DatasetStatus;
  format: string;
  visibility: Visibility;
  submitted_at: string;
  created_at: string;
  published_at: string | null;
}

interface AgencyDatasetPage {
  data: AgencyDataset[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const DATASET_STATUSES: Array<{ value: string; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

type StaffStatus = StaffMember["status"] | "all";
type InviteStatus = StaffInvite["status"] | "all";
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const STAFF_STATUSES: Array<{ value: StaffStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "archived", label: "Archived" },
];

const INVITE_STATUSES: Array<{ value: InviteStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
];

const STATUS_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: "Active", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  suspended: { label: "Suspended", variant: "destructive" },
  archived: { label: "Archived", variant: "outline" },
  accepted: { label: "Accepted", variant: "default" },
  expired: { label: "Expired", variant: "outline" },
  revoked: { label: "Revoked", variant: "destructive" },
};

export function StaffWorkflow({ organisationId }: { organisationId: string }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("staff");
  const [staffPage, setStaffPage] = useState(1);
  const [invitePage, setInvitePage] = useState(1);
  const [datasetsPage, setDatasetsPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [staffSearch, setStaffSearch] = useState("");
  const [inviteSearch, setInviteSearch] = useState("");
  const [datasetsSearch, setDatasetsSearch] = useState("");
  const [staffDebouncedSearch, setStaffDebouncedSearch] = useState("");
  const [inviteDebouncedSearch, setInviteDebouncedSearch] = useState("");
  const [datasetsDebouncedSearch, setDatasetsDebouncedSearch] = useState("");
  const [staffStatus, setStaffStatus] = useState<StaffStatus>("all");
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("all");
  const [datasetsStatus, setDatasetsStatus] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [groupId, setGroupId] = useState("");
  const [message, setMessage] = useState("");
  const [revokeStaffTarget, setRevokeStaffTarget] = useState<StaffMember | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<StaffMember | null>(null);
  const [revokeInviteTarget, setRevokeInviteTarget] = useState<StaffInvite | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AgencyDataset | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStaffDebouncedSearch(staffSearch.trim());
      setStaffPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [staffSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInviteDebouncedSearch(inviteSearch.trim());
      setInvitePage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [inviteSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDatasetsDebouncedSearch(datasetsSearch.trim());
      setDatasetsPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [datasetsSearch]);

  const staffQuery = useStaffMembers({
    page: staffPage,
    limit: pageSize,
    search: staffDebouncedSearch || undefined,
    status: staffStatus === "all" ? undefined : staffStatus,
  });
  const inviteQuery = useStaffInvites({
    page: invitePage,
    limit: pageSize,
    search: inviteDebouncedSearch || undefined,
    status: inviteStatus === "all" ? undefined : inviteStatus,
  });
  const datasetsQuery = useQuery({
    queryKey: ["agency", "datasets", organisationId, datasetsPage, pageSize, datasetsDebouncedSearch, datasetsStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(datasetsPage), limit: String(pageSize), organisationId });
      if (datasetsDebouncedSearch) params.append("search", datasetsDebouncedSearch);
      if (datasetsStatus !== "all") params.append("status", datasetsStatus);
      const response = await adminApi.get<{ data: AgencyDatasetPage }>(`/admin/datasets?${params}`);
      return response.data.data;
    },
    enabled: !!organisationId,
    placeholderData: keepPreviousData,
  });
  const groupsQuery = useQuery({ queryKey: ["permission-groups"], queryFn: getPermissionGroups });
  const createInvite = useCreateStaffInvite();
  const revokeInvite = useRevokeStaffInvite();
  const resendInvite = useResendStaffInvite();
  const revokeStatus = useRevokeStaffStatus();

  const invalidateDatasets = () => queryClient.invalidateQueries({ queryKey: ["agency", "datasets"] });
  const publishMutation = useMutation({
    mutationFn: (slug: string) => publishDataset(slug),
    onSuccess: () => { toast.success("Dataset published to the public catalogue"); invalidateDatasets(); },
    onError: (error) => toast.error(apiMessage(error, "Failed to publish dataset")),
  });
  const archiveMutation = useMutation({
    mutationFn: (slug: string) => archiveDataset(slug),
    onSuccess: () => { toast.success("Dataset archived"); setArchiveTarget(null); invalidateDatasets(); },
    onError: (error) => toast.error(apiMessage(error, "Failed to archive dataset")),
  });
  const unarchiveMutation = useMutation({
    mutationFn: (slug: string) => unarchiveDataset(slug),
    onSuccess: () => { toast.success("Dataset restored from archive"); setArchiveTarget(null); invalidateDatasets(); },
    onError: (error) => toast.error(apiMessage(error, "Failed to restore dataset")),
  });
  const suspendMutation = useMutation({
    mutationFn: (userId: string) => updateUserStatus(userId, { status: "suspended" }),
    onSuccess: () => {
      toast.success("Staff member suspended");
      setSuspendTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (error) => toast.error(apiMessage(error, "Failed to suspend staff member")),
  });
  const reactivateMutation = useMutation({
    mutationFn: (userId: string) => updateUserStatus(userId, { status: "active" }),
    onSuccess: () => {
      toast.success("Staff member reactivated");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (error) => toast.error(apiMessage(error, "Failed to reactivate staff member")),
  });

  const staff = staffQuery.data?.data ?? [];
  const invites = inviteQuery.data?.data ?? [];
  const datasets = datasetsQuery.data?.data ?? [];
  const activeGroups = (groupsQuery.data ?? []).filter((group) => group.is_active);
  const staffHasFilters = !!staffSearch || staffStatus !== "all";
  const inviteHasFilters = !!inviteSearch || inviteStatus !== "all";
  const datasetsHasFilters = !!datasetsSearch || datasetsStatus !== "all";

  const resetInviteForm = () => {
    setEmail("");
    setGroupId("");
    setMessage("");
  };

  const handleInvite = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!groupId) {
      toast.error("Please select a permission group for this staff member");
      return;
    }
    createInvite.mutate(
      { invited_email: email, target_group_id: groupId, message: message || undefined },
      {
        onSuccess: () => {
          toast.success(`Invite sent to ${email}`);
          setInviteOpen(false);
          resetInviteForm();
        },
        onError: (error) => toast.error(apiMessage(error, "Failed to send invite")),
      }
    );
  };

  const confirmRevokeStaff = () => {
    if (!revokeStaffTarget) return;
    revokeStatus.mutate(revokeStaffTarget.id, {
      onSuccess: () => {
        toast.success(`Revoked staff access for ${revokeStaffTarget.fullName}`);
        setRevokeStaffTarget(null);
      },
      onError: (error) => toast.error(apiMessage(error, "Failed to revoke staff status")),
    });
  };

  const confirmSuspend = () => {
    if (!suspendTarget) return;
    suspendMutation.mutate(suspendTarget.id);
  };

  const handleResendInvite = (invite: StaffInvite) => {
    resendInvite.mutate(invite.id, {
      onSuccess: () => toast.success(`Invite resent to ${invite.invitedEmail}`),
      onError: (error) => toast.error(apiMessage(error, "Failed to resend invite")),
    });
  };

  const confirmRevokeInvite = () => {
    if (!revokeInviteTarget) return;
    revokeInvite.mutate(revokeInviteTarget.id, {
      onSuccess: () => {
        toast.success(`Revoked invite for ${revokeInviteTarget.invitedEmail}`);
        setRevokeInviteTarget(null);
      },
      onError: (error) => toast.error(apiMessage(error, "Failed to revoke invite")),
    });
  };

  return (
    <section className="space-y-4" aria-labelledby="agency-workspace-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="agency-workspace-heading" className="text-lg font-semibold">Staff & datasets</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage agency staff, permission-group access, invitations, and the agency&apos;s own datasets.
          </p>
        </div>
        {activeTab === "datasets" ? (
          <Link href="/upload?agency=1" className={cn(buttonVariants({}), "h-11 w-full sm:h-9 sm:w-auto")}>
            <Upload className="size-4" aria-hidden="true" />
            Upload dataset
          </Link>
        ) : (
          <Button className="h-11 w-full sm:h-9 sm:w-auto" onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" aria-hidden="true" />
            Invite staff
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => value && setActiveTab(value)}>
        <div className="rounded-2xl border bg-card p-3 sm:p-4">
          <div className="mb-3 px-1">
            <h3 className="text-sm font-semibold">Agency workspace</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Choose a section to manage staff access, invitations, or datasets.</p>
          </div>
          <div className="scrollbar-hide overflow-x-auto rounded-xl bg-muted/70 p-1">
            <TabsList className="h-auto min-w-max justify-start gap-1 bg-transparent p-0">
              <TabsTrigger value="staff" className="min-h-11 flex-none gap-2 px-4 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none dark:data-active:bg-primary dark:data-active:text-primary-foreground">
                <Users className="size-4" aria-hidden="true" /> Staff
                <span className="rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] tabular-nums text-foreground">{staffQuery.data?.total ?? 0}</span>
              </TabsTrigger>
              <TabsTrigger value="invites" className="min-h-11 flex-none gap-2 px-4 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none dark:data-active:bg-primary dark:data-active:text-primary-foreground">
                <MailPlus className="size-4" aria-hidden="true" /> Invitations
                <span className="rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] tabular-nums text-foreground">{inviteQuery.data?.total ?? 0}</span>
              </TabsTrigger>
              <TabsTrigger value="datasets" className="min-h-11 flex-none gap-2 px-4 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none dark:data-active:bg-primary dark:data-active:text-primary-foreground">
                <Database className="size-4" aria-hidden="true" /> Datasets
                <span className="rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] tabular-nums text-foreground">{datasetsQuery.data?.meta.total ?? 0}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="staff" className="mt-3 overflow-hidden rounded-xl border">
            <DirectoryToolbar
              search={staffSearch}
              onSearchChange={setStaffSearch}
              searchLabel="Search staff"
              searchPlaceholder="Search name or email"
              status={staffStatus}
              statuses={STAFF_STATUSES}
              onStatusChange={(value) => { setStaffStatus(value as StaffStatus); setStaffPage(1); }}
              hasFilters={staffHasFilters}
              onClear={() => { setStaffSearch(""); setStaffDebouncedSearch(""); setStaffStatus("all"); setStaffPage(1); }}
              total={staffQuery.data?.total ?? 0}
              noun="staff member"
              pending={staffSearch.trim() !== staffDebouncedSearch || (staffQuery.isFetching && !staffQuery.isLoading)}
            />
          </TabsContent>

          <TabsContent value="invites" className="mt-3 overflow-hidden rounded-xl border">
            <DirectoryToolbar
              search={inviteSearch}
              onSearchChange={setInviteSearch}
              searchLabel="Search invitations"
              searchPlaceholder="Search email, inviter, or group"
              status={inviteStatus}
              statuses={INVITE_STATUSES}
              onStatusChange={(value) => { setInviteStatus(value as InviteStatus); setInvitePage(1); }}
              hasFilters={inviteHasFilters}
              onClear={() => { setInviteSearch(""); setInviteDebouncedSearch(""); setInviteStatus("all"); setInvitePage(1); }}
              total={inviteQuery.data?.total ?? 0}
              noun="invitation"
              pending={inviteSearch.trim() !== inviteDebouncedSearch || (inviteQuery.isFetching && !inviteQuery.isLoading)}
            />
          </TabsContent>

          <TabsContent value="datasets" className="mt-3 overflow-hidden rounded-xl border">
            <DirectoryToolbar
              search={datasetsSearch}
              onSearchChange={setDatasetsSearch}
              searchLabel="Search datasets"
              searchPlaceholder="Search title or description"
              status={datasetsStatus}
              statuses={DATASET_STATUSES}
              onStatusChange={(value) => { setDatasetsStatus(value); setDatasetsPage(1); }}
              hasFilters={datasetsHasFilters}
              onClear={() => { setDatasetsSearch(""); setDatasetsDebouncedSearch(""); setDatasetsStatus("all"); setDatasetsPage(1); }}
              total={datasetsQuery.data?.meta.total ?? 0}
              noun="dataset"
              pending={datasetsSearch.trim() !== datasetsDebouncedSearch || (datasetsQuery.isFetching && !datasetsQuery.isLoading)}
            />
          </TabsContent>
        </div>

        <TabsContent value="staff" className="mt-2">
          {staffQuery.isError ? (
            <LoadError title="Could not load agency staff" onRetry={() => staffQuery.refetch()} />
          ) : staffQuery.isLoading ? (
            <DirectorySkeleton columns={5} />
          ) : staff.length === 0 ? (
            <div className="rounded-2xl border bg-card">
              <EmptyState
                icon={Users}
                title={staffHasFilters ? "No matching staff" : "No staff members yet"}
                description={staffHasFilters ? "Try another name, email, or account status." : "Invite a staff member and assign a permission group to get started."}
              />
            </div>
          ) : (
            <>
              <StaffDirectory
                staff={staff}
                onRevoke={setRevokeStaffTarget}
                onSuspend={setSuspendTarget}
                onReactivate={(member) => reactivateMutation.mutate(member.id)}
                reactivatePending={reactivateMutation.isPending}
              />
              <Pagination
                page={staffPage}
                totalPages={Math.max(1, staffQuery.data?.totalPages ?? 1)}
                pageSize={pageSize}
                total={staffQuery.data?.total ?? 0}
                onPageChange={setStaffPage}
                onPageSizeChange={(size) => { setPageSize(size); setStaffPage(1); setInvitePage(1); setDatasetsPage(1); }}
                className="rounded-xl border bg-card px-4 py-3"
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="invites" className="mt-2">
          {inviteQuery.isError ? (
            <LoadError title="Could not load staff invitations" onRetry={() => inviteQuery.refetch()} />
          ) : inviteQuery.isLoading ? (
            <DirectorySkeleton columns={6} />
          ) : invites.length === 0 ? (
            <div className="rounded-2xl border bg-card">
              <EmptyState
                icon={MailPlus}
                title={inviteHasFilters ? "No matching invitations" : "No invitations yet"}
                description={inviteHasFilters ? "Try another email, inviter, permission group, or status." : "Staff invitations and their acceptance status will appear here."}
              />
            </div>
          ) : (
            <>
              <InviteDirectory
                invites={invites}
                onResend={handleResendInvite}
                onRevoke={setRevokeInviteTarget}
                resendPending={resendInvite.isPending}
              />
              <Pagination
                page={invitePage}
                totalPages={Math.max(1, inviteQuery.data?.totalPages ?? 1)}
                pageSize={pageSize}
                total={inviteQuery.data?.total ?? 0}
                onPageChange={setInvitePage}
                onPageSizeChange={(size) => { setPageSize(size); setStaffPage(1); setInvitePage(1); setDatasetsPage(1); }}
                className="rounded-xl border bg-card px-4 py-3"
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="datasets" className="mt-2">
          {datasetsQuery.isError ? (
            <LoadError title="Could not load agency datasets" onRetry={() => datasetsQuery.refetch()} />
          ) : datasetsQuery.isLoading ? (
            <DirectorySkeleton columns={6} />
          ) : datasets.length === 0 ? (
            <div className="rounded-2xl border bg-card">
              <EmptyState
                icon={Database}
                title={datasetsHasFilters ? "No matching datasets" : "No datasets yet"}
                description={datasetsHasFilters ? "Try another search term or status filter." : "Datasets uploaded to the agency will appear here."}
              />
            </div>
          ) : (
            <>
              <DatasetDirectory
                datasets={datasets}
                busy={publishMutation.isPending || archiveMutation.isPending || unarchiveMutation.isPending}
                onPublish={(slug) => publishMutation.mutate(slug)}
                onArchiveToggle={setArchiveTarget}
              />
              <Pagination
                page={datasetsPage}
                totalPages={Math.max(1, datasetsQuery.data?.meta.totalPages ?? 1)}
                pageSize={pageSize}
                total={datasetsQuery.data?.meta.total ?? 0}
                onPageChange={setDatasetsPage}
                onPageSizeChange={(size) => { setPageSize(size); setStaffPage(1); setInvitePage(1); setDatasetsPage(1); }}
                className="rounded-xl border bg-card px-4 py-3"
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={inviteOpen} onOpenChange={(open) => { if (!open) resetInviteForm(); setInviteOpen(open); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5" aria-hidden="true" /> Invite agency staff
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="staff-email">Email address <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="staff-email" type="email" placeholder="staff@example.com" className="pl-9" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-group">Permission group <span className="text-destructive">*</span></Label>
              <Select value={groupId} onValueChange={(value) => value && setGroupId(value)} disabled={groupsQuery.isLoading || groupsQuery.isError || activeGroups.length === 0}>
                <SelectTrigger id="staff-group" className="w-full"><SelectValue>{(v: string) => v ? (activeGroups.find((group) => group.id === v)?.name ?? v) : (groupsQuery.isLoading ? "Loading groups..." : "Select a group")}</SelectValue></SelectTrigger>
                <SelectContent>{activeGroups.map((group) => <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {groupsQuery.isError ? "Permission groups could not be loaded. Close this dialog and try again." : activeGroups.length === 0 && !groupsQuery.isLoading ? "Create an active permission group before inviting staff." : "This group defines the staff member’s administrative capabilities."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staff-message">Personal message (optional)</Label>
              <Textarea id="staff-message" placeholder="Welcome to the team!" value={message} onChange={(event) => setMessage(event.target.value)} rows={3} />
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="h-11 sm:h-9" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" className="h-11 sm:h-9" disabled={createInvite.isPending || activeGroups.length === 0}>
                {createInvite.isPending ? "Sending..." : "Send invitation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!revokeStaffTarget}
        onOpenChange={(open) => !open && setRevokeStaffTarget(null)}
        title="Revoke staff access?"
        description={`This does not delete ${revokeStaffTarget?.fullName ?? "this user"}'s account. They'll become a regular registered user, lose permission-group access, and be signed out everywhere. To temporarily block sign-in without changing their role, use Suspend instead.`}
        confirmLabel="Revoke access"
        variant="destructive"
        onConfirm={confirmRevokeStaff}
        loading={revokeStatus.isPending}
      />
      <ConfirmDialog
        open={!!suspendTarget}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
        title="Suspend staff member?"
        description={`${suspendTarget?.fullName ?? "This user"} will be immediately signed out and unable to log in until reactivated. Their role and permission group are unaffected — this is reversible at any time.`}
        confirmLabel="Suspend"
        variant="destructive"
        onConfirm={confirmSuspend}
        loading={suspendMutation.isPending}
      />
      <ConfirmDialog
        open={!!revokeInviteTarget}
        onOpenChange={(open) => !open && setRevokeInviteTarget(null)}
        title="Revoke invitation?"
        description={`The invitation link sent to ${revokeInviteTarget?.invitedEmail ?? "this email"} will stop working.`}
        confirmLabel="Revoke invitation"
        variant="destructive"
        onConfirm={confirmRevokeInvite}
        loading={revokeInvite.isPending}
      />
      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title={archiveTarget?.status === "archived" ? "Restore dataset?" : "Archive dataset?"}
        description={
          archiveTarget?.status === "archived"
            ? `"${archiveTarget?.title}" will be restored to its previous workflow status.`
            : `"${archiveTarget?.title}" will be removed from the public catalogue but remains accessible to admins.`
        }
        confirmLabel={archiveTarget?.status === "archived" ? "Restore" : "Archive"}
        variant={archiveTarget?.status === "archived" ? "default" : "destructive"}
        loading={archiveMutation.isPending || unarchiveMutation.isPending}
        onConfirm={() => {
          if (!archiveTarget) return;
          if (archiveTarget.status === "archived") {
            unarchiveMutation.mutate(archiveTarget.slug);
          } else {
            archiveMutation.mutate(archiveTarget.slug);
          }
        }}
      />
    </section>
  );
}

function DirectoryToolbar({ search, onSearchChange, searchLabel, searchPlaceholder, status, statuses, onStatusChange, hasFilters, onClear, total, noun, pending }: {
  search: string;
  onSearchChange: (value: string) => void;
  searchLabel: string;
  searchPlaceholder: string;
  status: string;
  statuses: Array<{ value: string; label: string }>;
  onStatusChange: (value: string) => void;
  hasFilters: boolean;
  onClear: () => void;
  total: number;
  noun: string;
  pending: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder={searchPlaceholder} className="h-11 pl-9 pr-10 sm:h-10" aria-label={searchLabel} />
          {search && <button type="button" onClick={() => onSearchChange("")} className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground sm:size-10" aria-label={`Clear ${searchLabel.toLowerCase()}`}><X className="size-4" /></button>}
        </div>
        <Select value={status} onValueChange={(value) => value && onStatusChange(value)}>
          <SelectTrigger className="h-11 w-full sm:h-10 sm:w-48" aria-label="Filter by status">
            <SelectValue>{(v: string) => statuses.find((option) => option.value === v)?.label ?? v}</SelectValue>
          </SelectTrigger>
          <SelectContent>{statuses.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
        </Select>
        {hasFilters && <Button variant="ghost" className="h-11 sm:h-10" onClick={onClear}><X className="size-4" /> Clear filters</Button>}
      </div>
      <div className="flex min-h-5 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
        {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
        <span>{pending ? "Updating" : "Found"} <span className="font-semibold tabular-nums text-foreground">{total}</span> {total === 1 ? noun : `${noun}s`}</span>
      </div>
    </div>
  );
}

function GroupDeactivatedBadge() {
  return (
    <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
      <AlertCircle className="size-3" aria-hidden="true" />
      Group deactivated
    </Badge>
  );
}

function StaffDirectory({ staff, onRevoke, onSuspend, onReactivate, reactivatePending }: {
  staff: StaffMember[];
  onRevoke: (staff: StaffMember) => void;
  onSuspend: (staff: StaffMember) => void;
  onReactivate: (staff: StaffMember) => void;
  reactivatePending: boolean;
}) {
  return <div className="space-y-3">
    <div className="hidden overflow-hidden rounded-2xl border bg-card xl:block">
      <Table><TableHeader><TableRow className="h-11 bg-muted/40 text-[11px] uppercase tracking-wide hover:bg-muted/40"><TableHead className="px-4">Staff member</TableHead><TableHead>Permission group</TableHead><TableHead>Status</TableHead><TableHead>Last login</TableHead><TableHead className="pr-4 text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>{staff.map((member) => <TableRow key={member.id} className="hover:bg-muted/30">
          <TableCell className="px-4 py-3.5"><Link href={`/users/${member.id}`} className="font-semibold hover:underline">{member.fullName}</Link><p className="mt-0.5 text-xs text-muted-foreground">{member.email}</p></TableCell>
          <TableCell>{member.groupName ? <Badge variant="outline">{member.groupName}</Badge> : <span className="text-xs text-muted-foreground">No group</span>}</TableCell>
          <TableCell><div className="flex flex-wrap items-center gap-1.5"><StatusBadge status={member.status} />{member.groupIsActive === false && <GroupDeactivatedBadge />}</div></TableCell>
          <TableCell className="text-xs text-muted-foreground">{member.lastLoginAt ? formatDateTime(member.lastLoginAt) : "Never"}</TableCell>
          <TableCell className="pr-4 text-right"><StaffActions member={member} onRevoke={onRevoke} onSuspend={onSuspend} onReactivate={onReactivate} reactivatePending={reactivatePending} /></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
    <div className="grid gap-3 xl:hidden">{staff.map((member) => <article key={member.id} className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><Link href={`/users/${member.id}`} className="line-clamp-2 text-sm font-semibold hover:underline">{member.fullName}</Link><p className="mt-1 truncate text-xs text-muted-foreground">{member.email}</p></div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5"><StatusBadge status={member.status} />{member.groupIsActive === false && <GroupDeactivatedBadge />}</div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 border-y py-3"><div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Permission group</dt><dd className="mt-1 text-xs font-medium">{member.groupName ?? "No group"}</dd></div><div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Last login</dt><dd className="mt-1 text-xs font-medium">{member.lastLoginAt ? formatDateTime(member.lastLoginAt) : "Never"}</dd></div></dl>
      <div className="mt-4"><StaffActions member={member} onRevoke={onRevoke} onSuspend={onSuspend} onReactivate={onReactivate} reactivatePending={reactivatePending} mobile /></div>
    </article>)}</div>
  </div>;
}

function StaffActions({ member, onRevoke, onSuspend, onReactivate, reactivatePending, mobile = false }: {
  member: StaffMember;
  onRevoke: (staff: StaffMember) => void;
  onSuspend: (staff: StaffMember) => void;
  onReactivate: (staff: StaffMember) => void;
  reactivatePending: boolean;
  mobile?: boolean;
}) {
  return (
    <div className={cn("flex gap-2", mobile ? "flex-col sm:flex-row" : "justify-end")}>
      {member.status === "suspended" ? (
        <Button variant="outline" size="sm" className={mobile ? "h-11 sm:h-9" : undefined} onClick={() => onReactivate(member)} disabled={reactivatePending}>
          <UserCheck className="size-3.5" aria-hidden="true" /> Reactivate
        </Button>
      ) : (
        <Button variant="outline" size="sm" className={mobile ? "h-11 sm:h-9" : undefined} onClick={() => onSuspend(member)}>
          <Ban className="size-3.5" aria-hidden="true" /> Suspend
        </Button>
      )}
      <Button variant="outline" size="sm" className={mobile ? "h-11 sm:h-9" : undefined} onClick={() => onRevoke(member)}>Revoke access</Button>
    </div>
  );
}

function InviteDirectory({ invites, onResend, onRevoke, resendPending }: { invites: StaffInvite[]; onResend: (invite: StaffInvite) => void; onRevoke: (invite: StaffInvite) => void; resendPending: boolean }) {
  return <div className="space-y-3">
    <div className="hidden overflow-hidden rounded-2xl border bg-card xl:block"><Table><TableHeader><TableRow className="h-11 bg-muted/40 text-[11px] uppercase tracking-wide hover:bg-muted/40"><TableHead className="px-4">Recipient</TableHead><TableHead>Permission group</TableHead><TableHead>Invited by</TableHead><TableHead>Status</TableHead><TableHead>Expires</TableHead><TableHead className="pr-4 text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{invites.map((invite) => <TableRow key={invite.id} className="hover:bg-muted/30"><TableCell className="px-4 py-3.5 font-medium">{invite.invitedEmail}</TableCell><TableCell><Badge variant="outline">{invite.targetGroupName}</Badge></TableCell><TableCell className="text-xs text-muted-foreground">{invite.invitedByName}</TableCell><TableCell><StatusBadge status={invite.status} /></TableCell><TableCell className="text-xs text-muted-foreground">{formatDate(invite.expiresAt)}</TableCell><TableCell className="pr-4 text-right"><InviteActions invite={invite} onResend={onResend} onRevoke={onRevoke} disabled={resendPending} /></TableCell></TableRow>)}</TableBody></Table></div>
    <div className="grid gap-3 xl:hidden">{invites.map((invite) => <article key={invite.id} className="rounded-xl border bg-card p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{invite.invitedEmail}</p><p className="mt-1 text-xs text-muted-foreground">Invited by {invite.invitedByName}</p></div><StatusBadge status={invite.status} /></div><dl className="mt-4 grid grid-cols-2 gap-4 border-y py-3"><div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Permission group</dt><dd className="mt-1 text-xs font-medium">{invite.targetGroupName}</dd></div><div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Expires</dt><dd className="mt-1 text-xs font-medium">{formatDate(invite.expiresAt)}</dd></div></dl><div className="mt-4"><InviteActions invite={invite} onResend={onResend} onRevoke={onRevoke} disabled={resendPending} mobile /></div></article>)}</div>
  </div>;
}

function InviteActions({ invite, onResend, onRevoke, disabled, mobile = false }: { invite: StaffInvite; onResend: (invite: StaffInvite) => void; onRevoke: (invite: StaffInvite) => void; disabled: boolean; mobile?: boolean }) {
  if (invite.status !== "pending") return <span className="text-xs text-muted-foreground">No actions</span>;
  return <div className={`flex gap-2 ${mobile ? "flex-col sm:flex-row" : "justify-end"}`}><Button variant="outline" size="sm" className={mobile ? "h-11 sm:h-9" : undefined} onClick={() => onResend(invite)} disabled={disabled}><RotateCw className="size-3.5" /> Resend</Button><Button variant="outline" size="sm" className={mobile ? "h-11 sm:h-9" : undefined} onClick={() => onRevoke(invite)}>Revoke</Button></div>;
}

function DatasetDirectory({ datasets, busy, onPublish, onArchiveToggle }: { datasets: AgencyDataset[]; busy: boolean; onPublish: (slug: string) => void; onArchiveToggle: (dataset: AgencyDataset) => void }) {
  return <div className="space-y-3">
    <div className="hidden overflow-hidden rounded-2xl border bg-card xl:block">
      <Table><TableHeader><TableRow className="h-11 bg-muted/40 text-[11px] uppercase tracking-wide hover:bg-muted/40"><TableHead className="px-4">Dataset</TableHead><TableHead>Format</TableHead><TableHead>Visibility</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead><TableHead className="pr-4 text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>{datasets.map((dataset) => <TableRow key={dataset.id} className="hover:bg-muted/30">
          <TableCell className="max-w-sm px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Database className="size-4 text-primary" aria-hidden="true" /></div>
              <div className="min-w-0"><Link href={`/datasets/${dataset.slug}`} className="line-clamp-1 font-semibold hover:underline">{dataset.title}</Link><p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{dataset.description || "No description provided"}</p></div>
            </div>
          </TableCell>
          <TableCell><Badge variant="outline" className="rounded-full text-[11px] font-semibold">{dataset.format?.toUpperCase() || "?"}</Badge></TableCell>
          <TableCell><VisibilityBadge visibility={dataset.visibility} /></TableCell>
          <TableCell><DatasetStatusBadge status={dataset.status} publishedAt={dataset.published_at} /></TableCell>
          <TableCell className="text-xs text-muted-foreground">
            {dataset.status === "pending" || dataset.status === "under_review" ? <AgeBadge submittedAt={dataset.submitted_at || dataset.created_at} /> : formatDate(dataset.submitted_at || dataset.created_at)}
          </TableCell>
          <TableCell className="pr-4 text-right"><DatasetActions dataset={dataset} busy={busy} onPublish={onPublish} onArchiveToggle={onArchiveToggle} /></TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
    <div className="grid gap-3 xl:hidden">{datasets.map((dataset) => <article key={dataset.id} className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"><Database className="size-5 text-primary" aria-hidden="true" /></div>
        <div className="min-w-0 flex-1"><Link href={`/datasets/${dataset.slug}`} className="line-clamp-2 text-sm font-semibold leading-5 hover:underline">{dataset.title}</Link></div>
        <DatasetStatusBadge status={dataset.status} publishedAt={dataset.published_at} className="shrink-0" />
      </div>
      {dataset.description && <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{dataset.description}</p>}
      <dl className="mt-4 grid grid-cols-3 gap-2 border-y py-3">
        <div><dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Format</dt><dd className="mt-1 text-xs font-medium">{dataset.format?.toUpperCase() || "?"}</dd></div>
        <div><dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Visibility</dt><dd className="mt-1"><VisibilityBadge visibility={dataset.visibility} /></dd></div>
        <div><dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Submitted</dt><dd className="mt-1 text-xs font-medium">{dataset.status === "pending" || dataset.status === "under_review" ? <AgeBadge submittedAt={dataset.submitted_at || dataset.created_at} /> : formatDate(dataset.submitted_at || dataset.created_at)}</dd></div>
      </dl>
      <div className="mt-4"><DatasetActions dataset={dataset} busy={busy} onPublish={onPublish} onArchiveToggle={onArchiveToggle} mobile /></div>
    </article>)}</div>
  </div>;
}

function DatasetActions({ dataset, busy, onPublish, onArchiveToggle, mobile = false }: { dataset: AgencyDataset; busy: boolean; onPublish: (slug: string) => void; onArchiveToggle: (dataset: AgencyDataset) => void; mobile?: boolean }) {
  const isReviewable = dataset.status === "pending" || dataset.status === "under_review";
  return (
    <div className={cn("flex items-center gap-1.5", mobile ? "w-full" : "justify-end")}>
      <Link href={isReviewable ? `/datasets/${dataset.slug}/review` : `/datasets/${dataset.slug}`} className={cn(buttonVariants({ variant: isReviewable ? "default" : "outline", size: "sm" }), "gap-1.5", mobile && "h-11 flex-1")}>
        <Eye className="size-3.5" aria-hidden="true" />
        {isReviewable ? "Review" : "View"}
      </Link>
      {dataset.status === "approved" && !dataset.published_at && (
        <Button size="sm" variant="outline" className={cn("gap-1.5", mobile && "h-11 flex-1")} onClick={() => onPublish(dataset.slug)} disabled={busy} aria-label={`Publish ${dataset.title}`}>
          <Globe className="size-3.5" aria-hidden="true" />
          Publish
        </Button>
      )}
      {dataset.status === "archived" ? (
        <Button size={mobile ? "default" : "icon-sm"} variant="ghost" className={mobile ? "size-11 shrink-0" : undefined} onClick={() => onArchiveToggle(dataset)} aria-label={`Restore ${dataset.title}`} title="Restore dataset">
          <ArchiveRestore className="size-4" aria-hidden="true" />
        </Button>
      ) : (
        <Button size={mobile ? "default" : "icon-sm"} variant="ghost" className={mobile ? "size-11 shrink-0" : undefined} onClick={() => onArchiveToggle(dataset)} aria-label={`Archive ${dataset.title}`} title="Archive dataset">
          <Archive className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_BADGE[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={config.variant} className="capitalize">{config.label}</Badge>;
}

function LoadError({ title, onRetry }: { title: string; onRetry: () => void }) {
  return <div className="rounded-2xl border bg-card px-4 py-12 text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertCircle className="size-7" /></div><h3 className="mt-4 text-base font-semibold">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Check your connection and try again.</p><Button variant="outline" className="mt-5 h-11 sm:h-8" onClick={onRetry}><RotateCcw className="size-4" /> Try again</Button></div>;
}

function DirectorySkeleton({ columns }: { columns: number }) {
  return <><div className="hidden overflow-hidden rounded-2xl border bg-card xl:block"><Table><TableBody>{Array.from({ length: 4 }).map((_, index) => <TableRowSkeleton key={index} cols={columns} />)}</TableBody></Table></div><div className="grid gap-3 xl:hidden">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-48 rounded-xl" />)}</div></>;
}

function apiMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}
