"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive, ArrowLeft, Building2, CheckCircle2, Edit, ExternalLink, FileText,
  Globe, KeyRound, Mail, MapPin, MoreVertical, Phone, Power, RefreshCw, RotateCcw,
  Search, ShieldCheck, Trash2, Upload, UserCog, UserPlus, Users, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useDevelopmentPartnerBySlug, useDeleteDevelopmentPartner, useToggleDevelopmentPartnerStatus } from "@/lib/hooks/useDevelopmentPartners";
import {
  archiveDataset, deleteDataset, demoteFromOrgAdmin,
  getUsers, promoteToOrgAdmin, removeOrgMember, updateUserStatus,
} from "@/lib/api/admin";
import {
  deleteInvite, getDevelopmentPartnerInvites, resendInvite, revokeInvite,
} from "@/lib/api/invites";
import { useAuth } from "@/lib/auth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import { InviteMemberModal } from "@/components/admin/invite-member-modal";
import { HelpTip } from "@/components/admin/help-tip";
import { DevelopmentPartnerAgreementCard } from "@/components/admin/development-partner-agreement-card";
import { EditDevelopmentPartnerModal } from "@/components/admin/edit-development-partner-modal";
import { DevelopmentPartnerApiKeysPanel } from "@/components/admin/development-partner-api-keys-panel";
import { EmptyState } from "@/components/feedback/empty-state";
import { StatusBadge } from "@/components/data/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import {
  DEVELOPMENT_PARTNER_CONTACT_PANEL_TIP,
  DEVELOPMENT_PARTNER_DATASETS_PANEL_TIP,
  DEVELOPMENT_PARTNER_DETAIL_PAGE_TIP,
  DEVELOPMENT_PARTNER_INVITES_PANEL_TIP,
  DEVELOPMENT_PARTNER_MEMBERS_PANEL_TIP,
  DEVELOPMENT_PARTNER_SUMMARY_TIPS,
  DEVELOPMENT_PARTNER_WORKSPACE_TIP,
} from "@/lib/constants/development-partner-tooltips";
import { TooltipProvider } from "@/components/ui/tooltip";

type Member = Awaited<ReturnType<typeof getUsers>>["data"][number];
type Invite = Awaited<ReturnType<typeof getDevelopmentPartnerInvites>>[number];
type Dataset = {
  id: string; slug: string; title: string; format?: string | null; status?: string | null;
  downloadCount?: number | null; created_at: string;
};
type Target = { slug: string; title: string } | null;
const DATASET_STATUSES = ["draft", "pending", "under_review", "approved", "rejected", "archived"] as const;

export default function DevelopmentPartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { can, canAny, isSuperAdmin, isLoading: permissionsLoading } = useAdminAccess();
  const canPromote = can("promote:org-admin");
  const canDemote = can("demote:org-admin");
  const canRemove = can("remove:org-members");
  const canViewMembers = canAny(
    "invite:users",
    "promote:org-admin",
    "demote:org-admin",
    "remove:org-members",
  );
  const canEdit = can("edit:development-partners");
  const canDeactivate = can("deactivate:development-partners");
  const canDeleteOrg = can("delete:development-partners");
  const canAgreement = can("manage:development-partner-agreements");
  const canInvite = can("invite:users");
  const canViewInvites = canInvite;
  const canUpload = can("create:datasets");
  const canArchive = can("archive:datasets");
  const canDeleteDataset = can("archive:datasets");
  const canManageApiKeys = can("manage:partner-api-keys");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteOrgOpen, setDeleteOrgOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Target>(null);
  const [deleteTarget, setDeleteTarget] = useState<Target>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberStatus, setMemberStatus] = useState("all");
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteStatus, setInviteStatus] = useState("all");
  const [datasetSearch, setDatasetSearch] = useState("");
  const [datasetStatus, setDatasetStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("members");
  const directoryRef = useRef<HTMLDivElement>(null);

  const developmentPartnerQuery = useDevelopmentPartnerBySlug(slug);
  const org = developmentPartnerQuery.data?.developmentPartner;
  const orgId = org?.id;
  const datasets = useMemo(() => (developmentPartnerQuery.data?.datasets ?? []) as Dataset[], [developmentPartnerQuery.data?.datasets]);
  const membersQuery = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: () => getUsers({ developmentPartnerId: orgId!, limit: 100 }),
    enabled: !!orgId && canViewMembers,
  });
  const invitesQuery = useQuery({
    queryKey: ["org-invites", orgId],
    queryFn: () => getDevelopmentPartnerInvites(orgId!),
    enabled: !!orgId && canViewInvites,
  });
  const members = useMemo(() => membersQuery.data?.data ?? [], [membersQuery.data?.data]);
  const invites = useMemo(() => invitesQuery.data ?? [], [invitesQuery.data]);

  const errorText = (error: unknown) => {
    const candidate = error as { response?: { data?: { message?: string } }; message?: string };
    return candidate.response?.data?.message || candidate.message || "Please try again";
  };
  const useActionMutation = <T,>(fn: (value: T) => Promise<unknown>, success: string, key: "members" | "invites" | "developmentPartner") =>
    useMutation({ mutationFn: fn, onSuccess: () => { toast.success(success); queryClient.invalidateQueries({ queryKey: key === "developmentPartner" ? ["development-partner", slug] : [`org-${key}`, orgId] }); }, onError: (e) => toast.error(errorText(e)) });
  // Hooks are intentionally declared unconditionally; every action retains its original endpoint.
  const revoke = useActionMutation((id: string) => revokeInvite(orgId!, id), "Invite revoked", "invites");
  const resend = useActionMutation((id: string) => resendInvite(orgId!, id), "Invite resent", "invites");
  const removeInvite = useActionMutation(deleteInvite, "Invite permanently deleted", "invites");
  const suspend = useActionMutation((id: string) => updateUserStatus(id, { status: "suspended" }), "Member suspended", "members");
  const reactivate = useActionMutation((id: string) => updateUserStatus(id, { status: "active" }), "Member reactivated", "members");
  const promote = useActionMutation(promoteToOrgAdmin, "Member promoted to Dev Partner Admin", "members");
  const demote = useActionMutation(demoteFromOrgAdmin, "Member demoted to contributor", "members");
  const removeMember = useActionMutation((id: string) => removeOrgMember(orgId!, id), "Member removed", "members");
  const archive = useActionMutation(archiveDataset, "Dataset archived", "developmentPartner");
  const removeDataset = useActionMutation(deleteDataset, "Dataset deleted", "developmentPartner");
  const toggleStatus = useToggleDevelopmentPartnerStatus(slug);
  const deleteDevelopmentPartner = useDeleteDevelopmentPartner();

  const filteredMembers = useMemo(() => members.filter((member) => {
    const text = `${member.first_name} ${member.last_name} ${member.email}`.toLowerCase();
    return text.includes(memberSearch.toLowerCase()) && (memberStatus === "all" || member.status === memberStatus);
  }), [members, memberSearch, memberStatus]);
  const filteredInvites = useMemo(() => invites.filter((invite) =>
    invite.invitedEmail.toLowerCase().includes(inviteSearch.toLowerCase()) && (inviteStatus === "all" || invite.status === inviteStatus)
  ), [invites, inviteSearch, inviteStatus]);
  const filteredDatasets = useMemo(() => datasets.filter((dataset) =>
    dataset.title.toLowerCase().includes(datasetSearch.toLowerCase()) && (datasetStatus === "all" || dataset.status === datasetStatus)
  ), [datasets, datasetSearch, datasetStatus]);

  useEffect(() => {
    if (permissionsLoading) return;
    if (activeTab === "members" && !canViewMembers) setActiveTab("datasets");
    if (activeTab === "invites" && !canViewInvites) setActiveTab("datasets");
  }, [permissionsLoading, activeTab, canViewMembers, canViewInvites]);

  if (developmentPartnerQuery.isLoading) return <PageSkeleton />;
  if (developmentPartnerQuery.isError) return <LoadFailure title="Could not load development partner" retry={() => developmentPartnerQuery.refetch()} />;
  if (!org) return <LoadFailure title="Development partner not found" description="The record may have been removed or the URL may be incorrect." retry={() => developmentPartnerQuery.refetch()} />;

  const pendingInvites = canViewInvites
    ? invites.filter((invite) => invite.status === "pending").length
    : 0;
  const adminCount = canViewMembers
    ? members.filter((member) => member.role === "admin").length
    : 0;
  const resetMembers = () => { setMemberSearch(""); setMemberStatus("all"); };
  const resetInvites = () => { setInviteSearch(""); setInviteStatus("all"); };
  const resetDatasets = () => { setDatasetSearch(""); setDatasetStatus("all"); };
  const openDirectory = (tab: "members" | "invites" | "datasets", status?: string) => {
    setActiveTab(tab);
    if (tab === "members") resetMembers();
    if (tab === "invites") {
      setInviteSearch("");
      setInviteStatus(status ?? "all");
    }
    if (tab === "datasets") resetDatasets();
    requestAnimationFrame(() => directoryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <TooltipProvider delay={200}>
  <div className="space-y-5">
    <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} developmentPartnerId={orgId ?? ""} developmentPartnerName={org.name} />
    <EditDevelopmentPartnerModal open={editOpen} onClose={() => setEditOpen(false)} org={org} slug={slug} />
    <ConfirmDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)} title="Remove member?" description={`Remove “${removeTarget?.name}” from this development partner? Their account will remain intact.`} confirmLabel="Remove" variant="destructive" loading={removeMember.isPending} onConfirm={() => removeTarget && removeMember.mutate(removeTarget.id, { onSuccess: () => setRemoveTarget(null) })} />
    <ConfirmDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)} title="Archive dataset?" description={`Archive “${archiveTarget?.title}”?`} confirmLabel="Archive" loading={archive.isPending} onConfirm={() => archiveTarget && archive.mutate(archiveTarget.slug, { onSuccess: () => setArchiveTarget(null) })} />
    <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)} title="Delete dataset?" description={`Delete “${deleteTarget?.title}”? It will be soft deleted.`} confirmLabel="Delete" variant="destructive" loading={removeDataset.isPending} onConfirm={() => deleteTarget && removeDataset.mutate(deleteTarget.slug, { onSuccess: () => setDeleteTarget(null) })} />
    <ConfirmDialog open={statusOpen} onOpenChange={setStatusOpen} title={`${org.is_active ? "Deactivate" : "Activate"} development partner?`} description={org.is_active ? "The development partner will be hidden from public listings. Approved datasets must be archived or transferred first." : "The development partner will become visible in public listings."} confirmLabel={org.is_active ? "Deactivate" : "Activate"} variant={org.is_active ? "destructive" : "default"} loading={toggleStatus.isPending} onConfirm={() => toggleStatus.mutate({ id: orgId!, isActive: !org.is_active }, { onSuccess: () => { toast.success(`Development Partner ${org.is_active ? "deactivated" : "activated"}`); setStatusOpen(false); }, onError: (e) => toast.error(errorText(e)) })} />
    <ConfirmDialog open={deleteOrgOpen} onOpenChange={setDeleteOrgOpen} title="Delete development partner?" description={`Delete “${org.name}” and soft-delete its related records? This cannot be undone in the UI.`} confirmLabel="Delete" variant="destructive" loading={deleteDevelopmentPartner.isPending} onConfirm={() => deleteDevelopmentPartner.mutate(orgId!, { onSuccess: () => { toast.success("Development Partner deleted"); router.push("/development-partners"); }, onError: (e) => toast.error(errorText(e)) })} />

    <header className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b px-4 py-3 sm:px-5"><Link href="/development-partners" className={cn(buttonVariants({ variant: "ghost" }), "-ml-3 h-11 sm:h-8")}><ArrowLeft className="size-4" />Development Partners</Link></div>
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-3"><div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-muted"><Building2 className="size-6" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="flex items-center gap-2 text-2xl font-bold leading-8">{org.name}<HelpTip content={DEVELOPMENT_PARTNER_DETAIL_PAGE_TIP} label="About this development partner" /></h1>{org.acronym && <Badge variant="secondary">{org.acronym}</Badge>}<Badge variant="outline" className="capitalize">{org.type}</Badge><Badge variant={org.is_active ? "default" : "secondary"}>{org.is_active ? "Active" : "Inactive"}</Badge></div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{org.description || "No development partner description has been added."}</p></div></div>
        {(canEdit || canDeactivate || canDeleteOrg) && <div className="flex gap-2">{canEdit && <Button variant="outline" className="h-11 flex-1 sm:h-9 sm:flex-none" onClick={() => setEditOpen(true)}><Edit className="size-4" />Edit</Button>}<DropdownMenu><DropdownMenuTrigger className="inline-flex h-11 items-center justify-center rounded-md border px-4 sm:h-9" aria-label="Development partner actions"><MoreVertical className="size-4" /></DropdownMenuTrigger><DropdownMenuContent align="end">{canDeactivate && <DropdownMenuItem onClick={() => setStatusOpen(true)}><Power className="size-4" />{org.is_active ? "Deactivate" : "Activate"}</DropdownMenuItem>}{canDeleteOrg && <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOrgOpen(true)}><Trash2 className="size-4" />Delete development partner</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></div>}
      </div>
    </header>

    <section
      className={cn(
        "grid gap-3",
        canViewMembers && canViewInvites
          ? "grid-cols-2 xl:grid-cols-4"
          : canViewMembers || canViewInvites
            ? "grid-cols-2 xl:grid-cols-3"
            : "grid-cols-1",
      )}
      aria-label="Development partner summary"
    >
      {canViewMembers ? (
        <>
          <Metric label="Members" value={members.length} icon={Users} tip={DEVELOPMENT_PARTNER_SUMMARY_TIPS.members} onClick={() => openDirectory("members")} />
          <Metric label="Dev Partner Admins" value={adminCount} icon={ShieldCheck} tip={DEVELOPMENT_PARTNER_SUMMARY_TIPS.orgAdmins} onClick={() => openDirectory("members")} />
        </>
      ) : null}
      <Metric label="Datasets" value={datasets.length} icon={FileText} tip={DEVELOPMENT_PARTNER_SUMMARY_TIPS.datasets} onClick={() => openDirectory("datasets")} />
      {canViewInvites ? (
        <Metric label="Pending invites" value={pendingInvites} icon={Mail} tip={DEVELOPMENT_PARTNER_SUMMARY_TIPS.pendingInvites} onClick={() => openDirectory("invites", "pending")} />
      ) : null}
    </section>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <Card size="sm"><CardHeader className="border-b"><CardTitle className="flex items-center gap-2 text-base">Contact and record information<HelpTip content={DEVELOPMENT_PARTNER_CONTACT_PANEL_TIP} label="About contact information" /></CardTitle></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2"><Info icon={Mail} label="Email" value={org.email} href={org.email ? `mailto:${org.email}` : undefined} /><Info icon={Phone} label="Phone" value={org.phone} href={org.phone ? `tel:${org.phone}` : undefined} /><Info icon={Globe} label="Website" value={org.website} href={org.website ?? undefined} /><Info icon={MapPin} label="Address" value={org.address} /><Info icon={Building2} label="Development Partner ID" value={org.id} mono /></CardContent></Card>
      <DevelopmentPartnerAgreementCard org={org} orgId={orgId!} slug={slug} canManage={canAgreement} />
    </div>

    <Tabs ref={directoryRef} value={activeTab} onValueChange={setActiveTab} className="scroll-mt-6 space-y-4">
      <div className="rounded-2xl border bg-card p-3 sm:p-4">
        <div className="mb-3 px-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            Development partner workspace
            <HelpTip content={DEVELOPMENT_PARTNER_WORKSPACE_TIP} label="About development partner workspace" />
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Choose a section to manage its records and actions.</p>
        </div>
        <div className="scrollbar-hide overflow-x-auto rounded-xl bg-muted/70 p-1">
          <TabsList className="h-auto min-w-max justify-start gap-1 bg-transparent p-0">
            {canViewMembers ? (
              <TabsTrigger value="members" className="min-h-11 flex-none gap-2 px-4 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none dark:data-active:bg-primary dark:data-active:text-primary-foreground"><Users className="size-4" aria-hidden="true" />Members <span className="rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] tabular-nums text-foreground">{members.length}</span></TabsTrigger>
            ) : null}
            {canViewInvites ? (
              <TabsTrigger value="invites" className="min-h-11 flex-none gap-2 px-4 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none dark:data-active:bg-primary dark:data-active:text-primary-foreground"><Mail className="size-4" aria-hidden="true" />Invitations <span className="rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] tabular-nums text-foreground">{invites.length}</span></TabsTrigger>
            ) : null}
            <TabsTrigger value="datasets" className="min-h-11 flex-none gap-2 px-4 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none dark:data-active:bg-primary dark:data-active:text-primary-foreground"><FileText className="size-4" aria-hidden="true" />Datasets <span className="rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] tabular-nums text-foreground">{datasets.length}</span></TabsTrigger>
            {canManageApiKeys && <TabsTrigger value="api-keys" className="min-h-11 flex-none gap-2 px-4 data-active:bg-primary data-active:text-primary-foreground data-active:shadow-none dark:data-active:bg-primary dark:data-active:text-primary-foreground"><KeyRound className="size-4" aria-hidden="true" />API Keys</TabsTrigger>}
          </TabsList>
        </div>
      </div>
      {canViewMembers ? (
        <TabsContent value="members"><Directory title="Members" titleTip={DEVELOPMENT_PARTNER_MEMBERS_PANEL_TIP} description="Manage development partner access and roles." action={canInvite ? <Button className="h-11 sm:h-9" onClick={() => setInviteOpen(true)}><UserPlus className="size-4" />Invite member</Button> : null} search={memberSearch} setSearch={setMemberSearch} status={memberStatus} setStatus={setMemberStatus} statuses={["active", "pending", "suspended", "archived"]} reset={resetMembers}><MemberList records={filteredMembers} loading={membersQuery.isLoading} failed={membersQuery.isError} filtered={!!memberSearch || memberStatus !== "all"} retry={() => membersQuery.refetch()} actions={{ canPromote, canDemote, canRemove, canManageStatus: isSuperAdmin, promote, demote, suspend, reactivate, remove: setRemoveTarget }} /></Directory></TabsContent>
      ) : null}
      {canViewInvites ? (
        <TabsContent value="invites"><Directory title="Invitations" titleTip={DEVELOPMENT_PARTNER_INVITES_PANEL_TIP} description="Track invitations and their delivery status." action={canInvite ? <Button className="h-11 sm:h-9" onClick={() => setInviteOpen(true)}><UserPlus className="size-4" />Send invite</Button> : null} search={inviteSearch} setSearch={setInviteSearch} status={inviteStatus} setStatus={setInviteStatus} statuses={["pending", "accepted", "revoked", "expired"]} reset={resetInvites}><InviteList records={filteredInvites} loading={invitesQuery.isLoading} failed={invitesQuery.isError} filtered={!!inviteSearch || inviteStatus !== "all"} retry={() => invitesQuery.refetch()} canInvite={canInvite} revoke={revoke} resend={resend} remove={removeInvite} /></Directory></TabsContent>
      ) : null}
      <TabsContent value="datasets"><Directory title="Datasets" titleTip={DEVELOPMENT_PARTNER_DATASETS_PANEL_TIP} description="Review datasets owned by this development partner." action={canUpload ? <Link href={`/upload?orgId=${orgId}`} className={cn(buttonVariants(), "h-11 sm:h-9")}><Upload className="size-4" />Upload dataset</Link> : null} search={datasetSearch} setSearch={setDatasetSearch} status={datasetStatus} setStatus={setDatasetStatus} statuses={[...DATASET_STATUSES]} reset={resetDatasets}><DatasetList records={filteredDatasets} filtered={!!datasetSearch || datasetStatus !== "all"} canArchive={canArchive} canDelete={canDeleteDataset} archive={setArchiveTarget} remove={setDeleteTarget} /></Directory></TabsContent>
      {canManageApiKeys && <TabsContent value="api-keys"><DevelopmentPartnerApiKeysPanel developmentPartnerId={orgId ?? ""} canManage={canManageApiKeys} /></TabsContent>}
    </Tabs>
  </div>
  </TooltipProvider>
  );
}

function Directory({ title, description, titleTip, action, search, setSearch, status, setStatus, statuses, reset, children }: { title: string; description: string; titleTip?: string; action: React.ReactNode; search: string; setSearch: (v: string) => void; status: string; setStatus: (v: string) => void; statuses: readonly string[]; reset: () => void; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border bg-card"><div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 font-semibold">{title}{titleTip ? <HelpTip content={titleTip} label={`About ${title}`} /> : null}</h2><p className="text-sm text-muted-foreground">{description}</p></div>{action}</div><div className="grid gap-2 border-b bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-11 pl-9 sm:h-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${title.toLowerCase()}`} aria-label={`Search ${title.toLowerCase()}`} /></div><Select value={status} onValueChange={(value) => setStatus(value ?? "all")}><SelectTrigger className="h-11 sm:h-9" aria-label="Filter by status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((item) => <SelectItem key={item} value={item} className="capitalize">{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select><Button variant="ghost" className="h-11 sm:h-9" onClick={reset} disabled={!search && status === "all"}><RotateCcw className="size-4" />Reset</Button></div>{children}</section>;
}

type StringMutation = { mutate: (value: string) => void };
type MemberActions = { canPromote: boolean; canDemote: boolean; canRemove: boolean; canManageStatus: boolean; promote: StringMutation; demote: StringMutation; suspend: StringMutation; reactivate: StringMutation; remove: (v: { id: string; name: string }) => void };
function MemberList({ records, loading, failed, filtered, retry, actions }: { records: Member[]; loading: boolean; failed: boolean; filtered: boolean; retry: () => void; actions: MemberActions }) {
  if (loading) return <ListSkeleton />;
  if (failed) return <InlineFailure retry={retry} />;
  if (!records.length) return <ListEmpty icon={Users} filtered={filtered} noun="members" />;
  return <><div className="hidden xl:block"><Table><TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{records.map((m) => <TableRow key={m.id}><TableCell><Link className="font-medium hover:underline" href={`/users/${m.id}`}>{m.first_name} {m.last_name}</Link><p className="text-xs text-muted-foreground">{m.email}</p></TableCell><TableCell><Role role={m.role} /></TableCell><TableCell><MemberStatus status={m.status} /></TableCell><TableCell className="text-xs text-muted-foreground">{formatDate(m.created_at)}</TableCell><TableCell className="text-right"><MemberMenu member={m} actions={actions} /></TableCell></TableRow>)}</TableBody></Table></div><div className="divide-y xl:hidden">{records.map((m) => <div key={m.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link className="font-semibold hover:underline" href={`/users/${m.id}`}>{m.first_name} {m.last_name}</Link><p className="truncate text-sm text-muted-foreground">{m.email}</p></div><MemberMenu member={m} actions={actions} /></div><div className="mt-3 flex flex-wrap gap-2"><Role role={m.role} /><MemberStatus status={m.status} /><span className="text-xs text-muted-foreground">Joined {formatDate(m.created_at)}</span></div></div>)}</div></>;
}
function MemberMenu({ member: m, actions }: { member: Member; actions: MemberActions }) { return <DropdownMenu><DropdownMenuTrigger className="inline-flex h-11 items-center justify-center rounded-md border px-4 sm:h-9" aria-label={`Actions for ${m.first_name} ${m.last_name}`}><MoreVertical className="size-4" /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => window.location.assign(`/users/${m.id}`)}><ExternalLink className="size-4" />View user</DropdownMenuItem>{actions.canPromote && m.role === "contributor" && <DropdownMenuItem onClick={() => actions.promote.mutate(m.id)}><ShieldCheck className="size-4" />Promote to Dev Partner Admin</DropdownMenuItem>}{actions.canDemote && m.role === "admin" && <DropdownMenuItem onClick={() => actions.demote.mutate(m.id)}><UserCog className="size-4" />Demote to contributor</DropdownMenuItem>}{actions.canManageStatus && (m.status === "active" ? <DropdownMenuItem onClick={() => actions.suspend.mutate(m.id)}><Power className="size-4" />Suspend</DropdownMenuItem> : <DropdownMenuItem onClick={() => actions.reactivate.mutate(m.id)}><CheckCircle2 className="size-4" />Reactivate</DropdownMenuItem>)}{actions.canRemove && <DropdownMenuItem className="text-destructive" onClick={() => actions.remove({ id: m.id, name: `${m.first_name} ${m.last_name}` })}><Trash2 className="size-4" />Remove</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>; }

function InviteList({ records, loading, failed, filtered, retry, canInvite, revoke, resend, remove }: { records: Invite[]; loading: boolean; failed: boolean; filtered: boolean; retry: () => void; canInvite: boolean; revoke: StringMutation; resend: StringMutation; remove: StringMutation }) {
  if (loading) return <ListSkeleton />; if (failed) return <InlineFailure retry={retry} />; if (!records.length) return <ListEmpty icon={Mail} filtered={filtered} noun="invitations" />;
  const row = (i: Invite, mobile = false) => { const expired = new Date(i.expiresAt) < new Date(); const menu = <InviteMenu invite={i} expired={expired} canInvite={canInvite} revoke={revoke} resend={resend} remove={remove} />; return mobile ? <div key={i.id} className="p-4"><div className="flex justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{i.invitedEmail}</p><p className="text-xs text-muted-foreground">Invited by {i.invitedByName}</p></div>{menu}</div><div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary" className="capitalize">{i.role}</Badge><Badge variant={i.status === "pending" ? "default" : "secondary"} className="capitalize">{expired && i.status === "pending" ? "Expired" : i.status}</Badge><span className="text-xs text-muted-foreground">Sent {formatDate(i.createdAt)}</span></div></div> : <TableRow key={i.id}><TableCell><p className="font-medium">{i.invitedEmail}</p><p className="text-xs text-muted-foreground">{i.invitedByName}</p></TableCell><TableCell><Badge variant="secondary" className="capitalize">{i.role}</Badge></TableCell><TableCell><Badge variant={i.status === "pending" ? "default" : "secondary"} className="capitalize">{expired && i.status === "pending" ? "Expired" : i.status}</Badge></TableCell><TableCell className="text-xs text-muted-foreground">{formatDate(i.createdAt)}</TableCell><TableCell className="text-xs text-muted-foreground">{formatDate(i.expiresAt)}</TableCell><TableCell className="text-right">{menu}</TableCell></TableRow>; };
  return <><div className="hidden xl:block"><Table><TableHeader><TableRow><TableHead>Invitation</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Sent</TableHead><TableHead>Expires</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{records.map((i) => row(i))}</TableBody></Table></div><div className="divide-y xl:hidden">{records.map((i) => row(i, true))}</div></>;
}
function InviteMenu({ invite, expired, canInvite, revoke, resend, remove }: { invite: Invite; expired: boolean; canInvite: boolean; revoke: StringMutation; resend: StringMutation; remove: StringMutation }) { return <DropdownMenu><DropdownMenuTrigger className="inline-flex h-11 items-center justify-center rounded-md border px-4 sm:h-9" aria-label={`Actions for invitation to ${invite.invitedEmail}`}><MoreVertical className="size-4" /></DropdownMenuTrigger><DropdownMenuContent align="end">{invite.status === "pending" && !expired && canInvite && <><DropdownMenuItem onClick={() => resend.mutate(invite.id)}><RefreshCw className="size-4" />Resend</DropdownMenuItem><DropdownMenuItem onClick={() => revoke.mutate(invite.id)}><XCircle className="size-4" />Revoke</DropdownMenuItem></>}{canInvite ? <DropdownMenuItem className="text-destructive" onClick={() => remove.mutate(invite.id)}><Trash2 className="size-4" />Delete permanently</DropdownMenuItem> : null}</DropdownMenuContent></DropdownMenu>; }

function DatasetList({ records, filtered, canArchive, canDelete, archive, remove }: { records: Dataset[]; filtered: boolean; canArchive: boolean; canDelete: boolean; archive: (v: Target) => void; remove: (v: Target) => void }) {
  if (!records.length) return <ListEmpty icon={FileText} filtered={filtered} noun="datasets" />;
  const menu = (d: Dataset) => <DropdownMenu><DropdownMenuTrigger className="inline-flex h-11 items-center justify-center rounded-md border px-4 sm:h-9" aria-label={`Actions for ${d.title}`}><MoreVertical className="size-4" /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => window.location.assign(`/datasets/${d.slug}`)}><ExternalLink className="size-4" />View details</DropdownMenuItem>{canArchive && <DropdownMenuItem disabled={d.status === "archived"} onClick={() => archive({ slug: d.slug, title: d.title })}><Archive className="size-4" />Archive</DropdownMenuItem>}{canDelete && <DropdownMenuItem className="text-destructive" onClick={() => remove({ slug: d.slug, title: d.title })}><Trash2 className="size-4" />Delete</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>;
  return <><div className="hidden xl:block"><Table><TableHeader><TableRow><TableHead>Dataset</TableHead><TableHead>Format</TableHead><TableHead>Status</TableHead><TableHead>Downloads</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{records.map((d) => <TableRow key={d.id}><TableCell><Link href={`/datasets/${d.slug}`} className="font-medium hover:underline">{d.title}</Link></TableCell><TableCell><Badge variant="secondary">{d.format?.toUpperCase() || "—"}</Badge></TableCell><TableCell><DatasetStatus value={d.status} /></TableCell><TableCell>{d.downloadCount ?? 0}</TableCell><TableCell className="text-xs text-muted-foreground">{formatDate(d.created_at)}</TableCell><TableCell className="text-right">{menu(d)}</TableCell></TableRow>)}</TableBody></Table></div><div className="divide-y xl:hidden">{records.map((d) => <div key={d.id} className="p-4"><div className="flex justify-between gap-3"><Link href={`/datasets/${d.slug}`} className="font-semibold hover:underline">{d.title}</Link>{menu(d)}</div><div className="mt-3 flex flex-wrap items-center gap-2"><Badge variant="secondary">{d.format?.toUpperCase() || "Unknown format"}</Badge><DatasetStatus value={d.status} /><span className="text-xs text-muted-foreground">{d.downloadCount ?? 0} downloads · {formatDate(d.created_at)}</span></div></div>)}</div></>;
}
function DatasetStatus({ value }: { value?: string | null }) { return DATASET_STATUSES.includes(value as typeof DATASET_STATUSES[number]) ? <StatusBadge status={value as typeof DATASET_STATUSES[number]} /> : <Badge variant="outline">Unknown</Badge>; }
function MemberStatus({ status }: { status: Member["status"] }) { return <Badge variant={status === "active" ? "default" : status === "suspended" ? "destructive" : "secondary"} className="capitalize">{status}</Badge>; }
function Role({ role }: { role: Member["role"] }) { return <Badge variant="secondary" className={role === "admin" ? undefined : "capitalize"}>{role === "admin" ? "Dev Partner Admin" : role.replaceAll("_", " ")}</Badge>; }
function Metric({ label, value, icon: Icon, onClick, tip }: { label: string; value: number; icon: typeof Users; onClick: () => void; tip?: string }) {
  return (
    <div className="relative rounded-xl border bg-card transition-colors hover:border-primary/40 hover:bg-muted/30">
      {tip ? (
        <div className="absolute right-2 top-2 z-10">
          <HelpTip content={tip} label={`About ${label}`} />
        </div>
      ) : null}
      <button
        type="button"
        className="group w-full rounded-xl p-3 pr-8 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={onClick}
        aria-label={`View ${label.toLowerCase()}`}
      >
        <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
        <p className="mt-2 text-xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </button>
    </div>
  );
}
function Info({ icon: Icon, label, value, href, mono }: { icon: typeof Mail; label: string; value?: string | null; href?: string; mono?: boolean }) { return <div className="rounded-xl border p-3"><p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Icon className="size-4" />{label}</p>{value ? href ? <a href={href} className="mt-1 block break-all text-sm font-medium hover:underline" target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{value}</a> : <p className={cn("mt-1 break-all text-sm font-medium", mono && "font-mono text-xs")}>{value}</p> : <p className="mt-1 text-sm text-muted-foreground">Not provided</p>}</div>; }
function ListEmpty({ icon, filtered, noun }: { icon: typeof Users; filtered: boolean; noun: string }) { return <EmptyState icon={icon} title={filtered ? `No matching ${noun}` : `No ${noun} yet`} description={filtered ? "Adjust the search or status filter, or reset filters." : `This development partner has no ${noun} to display.`} />; }
function InlineFailure({ retry }: { retry: () => void }) { return <div className="p-8 text-center"><p className="text-sm font-medium">Could not load these records</p><Button variant="outline" className="mt-3 h-11 sm:h-9" onClick={retry}><RotateCcw className="size-4" />Try again</Button></div>; }
function ListSkeleton() { return <div className="space-y-3 p-4">{[1, 2, 3].map((n) => <Skeleton key={n} className="h-16 rounded-xl" />)}</div>; }
function LoadFailure({ title, description = "Check your connection and try again.", retry }: { title: string; description?: string; retry: () => void }) { return <div className="space-y-4"><Link href="/development-partners" className={cn(buttonVariants({ variant: "ghost" }), "h-11 sm:h-8")}><ArrowLeft className="size-4" />Development Partners</Link><div className="rounded-2xl border bg-card px-4 py-12 text-center"><Building2 className="mx-auto size-10 text-muted-foreground" /><h1 className="mt-4 text-xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p><Button variant="outline" className="mt-5 h-11 sm:h-9" onClick={retry}><RotateCcw className="size-4" />Try again</Button></div></div>; }
function PageSkeleton() { return <div className="space-y-6"><Skeleton className="h-40 rounded-2xl" /><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[1, 2, 3, 4].map((n) => <Skeleton key={n} className="h-24 rounded-xl" />)}</div><Skeleton className="h-56 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>; }
