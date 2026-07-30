"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  FileText,
  UserPlus,
  Edit,
  Power,
  ExternalLink,
  MailCheck,
  Clock,
  CheckCircle2,
  XCircle,
  MoreVertical,
  RefreshCw,
  UserCog,
  Ban,
  Upload,
  Trash2,
  Archive,
  ShieldCheck,
} from "lucide-react";
import { useOrganisationBySlug } from "@/lib/hooks/useOrganisationBySlug";
import { useToggleOrganisationStatus, useDeleteOrganisation } from "@/lib/hooks/useOrganisations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, getOrganisationInvites, revokeInvite, resendInvite, deleteInvite, updateUserStatus, deleteDataset, archiveDataset, removeOrgMember, promoteToOrgAdmin, demoteFromOrgAdmin } from "@/lib/api/admin";
import { InviteMemberModal } from "@/components/admin/invite-member-modal";
import { OrganisationAgreementCard } from "@/components/admin/organisation-agreement-card";
import { EditOrganisationModal } from "@/components/admin/edit-organisation-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { statusPill } from "@/lib/constants/status-surfaces";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";

const TYPE_STYLES = {
  government: statusPill.emerald,
  healthcare: statusPill.teal,
  ngo: statusPill.amber,
  private: statusPill.blue,
  international: statusPill.purple,
  academic: statusPill.blue,
  community: statusPill.emerald,
  other: statusPill.gray,
};

export default function OrganisationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = use(params); // This is the slug from URL
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isSuperAdmin = user?.role === "super_admin";
  const canPromote = isSuperAdmin || hasPermission("promote:org-admin");
  const canDemote = isSuperAdmin || hasPermission("demote:org-admin");
  const canRemoveMember = isSuperAdmin || hasPermission("remove:org-members");
  const canEditOrg = isSuperAdmin || hasPermission("edit:organisations");
  const canDeactivateOrg = isSuperAdmin || hasPermission("deactivate:organisations");
  const canDeleteOrg = isSuperAdmin || hasPermission("delete:organisations");
  const canManageAgreement = isSuperAdmin || hasPermission("manage:organisation-agreements");
  const canInvite = isSuperAdmin || hasPermission("invite:users");
  const canUploadDataset = isSuperAdmin || hasPermission("create:datasets");
  // Both archiveDataset (POST /datasets/:slug/archive) and deleteDataset
  // (DELETE /admin/datasets/:slug) accept a staff archive:datasets grant.
  const canArchiveDataset = isSuperAdmin || hasPermission("archive:datasets");
  const canDeleteDataset = isSuperAdmin || hasPermission("archive:datasets");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberDetailOpen, setMemberDetailOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [removeMemberConfirmOpen, setRemoveMemberConfirmOpen] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [deleteOrgConfirmOpen, setDeleteOrgConfirmOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<{ slug: string; title: string } | null>(null);
  const [datasetToArchive, setDatasetToArchive] = useState<{ slug: string; title: string } | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);

  // Fetch organization data by slug
  const { data: orgData, isLoading: orgLoading } = useOrganisationBySlug(slug);
  const toggleStatusMutation = useToggleOrganisationStatus(slug);
  const deleteOrgMutation = useDeleteOrganisation();
  
  // Get the actual org ID (UUID) from the fetched data
  // The API returns { organisation: {...}, datasets: [] }
  const orgId = orgData?.organisation?.id;
  
  // Fetch organization members (using UUID)
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => getUsers({ organisationId: orgId!, limit: 100 }),
    enabled: !!orgId,
  });

  // Fetch organization invites (using UUID)
  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    queryKey: ['org-invites', orgId],
    queryFn: () => getOrganisationInvites(orgId!),
    enabled: !!orgId,
  });

  // Revoke invite mutation
  const revokeMutation = useMutation({
    mutationFn: (inviteId: string) => revokeInvite(orgId!, inviteId),
    onSuccess: () => {
      toast.success("Invite revoked successfully");
      queryClient.invalidateQueries({ queryKey: ['org-invites', orgId] });
    },
    onError: (error: any) => {
      toast.error("Failed to revoke invite", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });

  // Resend invite mutation
  const resendMutation = useMutation({
    mutationFn: (inviteId: string) => resendInvite(orgId!, inviteId),
    onSuccess: () => {
      toast.success("Invite resent successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to resend invite", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });

  // Delete invite mutation (permanent)
  const deleteInviteMutation = useMutation({
    mutationFn: (inviteId: string) => deleteInvite(inviteId),
    onSuccess: () => {
      toast.success("Invite deleted permanently");
      queryClient.invalidateQueries({ queryKey: ['org-invites', orgId] });
    },
    onError: (error: any) => {
      toast.error("Failed to delete invite", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });

  // Deactivate user mutation
  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => updateUserStatus(userId, { status: 'suspended' }),
    onSuccess: () => {
      toast.success("User deactivated successfully");
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
    onError: (error: any) => {
      toast.error("Failed to deactivate user", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });

  // Reactivate user mutation
  const reactivateMutation = useMutation({
    mutationFn: (userId: string) => updateUserStatus(userId, { status: 'active' }),
    onSuccess: () => {
      toast.success("User reactivated successfully");
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
    onError: (error: any) => {
      toast.error("Failed to reactivate user", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });

  // Promote member to org admin — the only role change exposed anywhere
  // in the admin UI, and only ever within this org.
  const promoteMutation = useMutation({
    mutationFn: (userId: string) => promoteToOrgAdmin(userId),
    onSuccess: () => {
      toast.success("Member promoted to org admin");
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
    onError: (error: any) => {
      toast.error("Failed to promote member", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });

  // Demote org admin back to contributor — counterpart to promoteMutation.
  const demoteMutation = useMutation({
    mutationFn: (userId: string) => demoteFromOrgAdmin(userId),
    onSuccess: () => {
      toast.success("Member demoted to contributor");
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
    onError: (error: any) => {
      toast.error("Failed to demote member", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });

  // Remove member from organisation (detaches them, does not delete the account)
  const removeUserMutation = useMutation({
    mutationFn: (userId: string) => removeOrgMember(orgId!, userId),
    onSuccess: () => {
      toast.success("Member removed from organisation");
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      setRemoveMemberConfirmOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to remove member", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });

  // Delete dataset mutation
  const deleteDatasetMutation = useMutation({
    mutationFn: (datasetSlug: string) => deleteDataset(datasetSlug),
    onSuccess: () => {
      toast.success("Dataset deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['organisation', slug] });
      setDeleteConfirmOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to delete dataset", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });

  // Archive dataset mutation
  const archiveDatasetMutation = useMutation({
    mutationFn: (datasetSlug: string) => archiveDataset(datasetSlug),
    onSuccess: () => {
      toast.success("Dataset archived successfully");
      queryClient.invalidateQueries({ queryKey: ['organisation', slug] });
      setArchiveConfirmOpen(false);
    },
    onError: (error: any) => {
      toast.error("Failed to archive dataset", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });

  const invites = invitesData || [];

  const org = orgData?.organisation;
  const datasets = orgData?.datasets || [];
  const members = membersData?.data || [];

  const typeStyle = org?.type ? TYPE_STYLES[org.type as keyof typeof TYPE_STYLES] : statusPill.blue;

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertDescription>Organization not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const adminCount = members.filter(m => m.role === 'admin').length;
  const contributorCount = members.filter(m => m.role === 'contributor').length;
  const pendingInvites = invites.filter((i: any) => i.status === 'pending').length;

  const handleViewMember = (member: any) => {
    setSelectedMember(member);
    setMemberDetailOpen(true);
  };

  const handleDeactivateMember = (memberId: string) => {
    deactivateMutation.mutate(memberId);
  };

  const handleReactivateMember = (memberId: string) => {
    reactivateMutation.mutate(memberId);
  };

  const handlePromoteMember = (memberId: string) => {
    promoteMutation.mutate(memberId);
  };

  const handleDemoteMember = (memberId: string) => {
    demoteMutation.mutate(memberId);
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName });
    setRemoveMemberConfirmOpen(true);
  };

  const confirmRemoveMember = () => {
    if (memberToRemove) {
      removeUserMutation.mutate(memberToRemove.id);
      setMemberToRemove(null);
    }
  };

  const handleDeleteDataset = (datasetSlug: string, datasetTitle: string) => {
    setDatasetToDelete({ slug: datasetSlug, title: datasetTitle });
    setDeleteConfirmOpen(true);
  };

  const handleArchiveDataset = (datasetSlug: string, datasetTitle: string) => {
    setDatasetToArchive({ slug: datasetSlug, title: datasetTitle });
    setArchiveConfirmOpen(true);
  };

  const confirmDeleteDataset = () => {
    if (datasetToDelete) {
      deleteDatasetMutation.mutate(datasetToDelete.slug);
      setDatasetToDelete(null);
    }
  };

  const confirmArchiveDataset = () => {
    if (datasetToArchive) {
      archiveDatasetMutation.mutate(datasetToArchive.slug);
      setDatasetToArchive(null);
    }
  };

  return (
    <>
      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        organisationId={orgId || ""}
        organisationName={org?.name || ""}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Dataset"
        description={`Are you sure you want to delete "${datasetToDelete?.title}"? The dataset will be soft deleted and can be restored later if needed.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteDataset}
        loading={deleteDatasetMutation.isPending}
      />

      <ConfirmDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title="Archive Dataset"
        description={`Are you sure you want to archive "${datasetToArchive?.title}"? This will change the dataset status to archived. You can restore it later if needed.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={confirmArchiveDataset}
        loading={archiveDatasetMutation.isPending}
      />

      <ConfirmDialog
        open={removeMemberConfirmOpen}
        onOpenChange={setRemoveMemberConfirmOpen}
        title="Remove Member"
        description={`Are you sure you want to remove "${memberToRemove?.name}" from this organisation? Their account stays intact, but they lose access to this organisation's data.`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={confirmRemoveMember}
        loading={removeUserMutation.isPending}
      />

      <ConfirmDialog
        open={statusConfirmOpen}
        onOpenChange={setStatusConfirmOpen}
        title={org.is_active ? "Deactivate Organisation" : "Activate Organisation"}
        description={
          org.is_active
            ? `Deactivating "${org.name}" will hide it from public listings. Organisations with active (approved) datasets cannot be deactivated until those datasets are archived or transferred.`
            : `Reactivate "${org.name}"? It will become visible in public listings again.`
        }
        confirmLabel={org.is_active ? "Deactivate" : "Activate"}
        cancelLabel="Cancel"
        variant={org.is_active ? "destructive" : "default"}
        onConfirm={() =>
          toggleStatusMutation.mutate(
            { id: orgId!, isActive: !org.is_active },
            {
              onSuccess: () => toast.success(org.is_active ? "Organisation deactivated" : "Organisation activated"),
              onError: (error: unknown) => {
                const err = error as { message?: string };
                toast.error(err?.message || "Failed to update organisation status");
              },
            }
          )
        }
        loading={toggleStatusMutation.isPending}
      />

      <ConfirmDialog
        open={deleteOrgConfirmOpen}
        onOpenChange={setDeleteOrgConfirmOpen}
        title="Delete Organisation"
        description={`Delete "${org.name}"? This will also remove its members, datasets, and any pending invites (soft-deleted, not permanently erased). This cannot be undone from the UI.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={() =>
          deleteOrgMutation.mutate(orgId!, {
            onSuccess: (result) => {
              toast.success(
                `Organisation deleted — ${result.membersRemoved} member(s), ${result.datasetsRemoved} dataset(s) removed, ${result.invitesRevoked} invite(s) revoked`
              );
              router.push("/organisations");
            },
            onError: (error: unknown) => {
              const err = error as { message?: string };
              toast.error(err?.message || "Failed to delete organisation");
            },
          })
        }
        loading={deleteOrgMutation.isPending}
      />

      <EditOrganisationModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        org={org}
        slug={slug}
      />

      {/* Member Detail Dialog */}
      <Dialog open={memberDetailOpen} onOpenChange={setMemberDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
            <DialogDescription>
              View and manage member information
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {selectedMember.first_name?.[0]}{selectedMember.last_name?.[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {selectedMember.first_name} {selectedMember.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Role</p>
                  <Badge variant="secondary" className="capitalize">
                    {selectedMember.role === 'admin' ? 'Org Admin' : selectedMember.role.replace('_', ' ')}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <Badge variant={selectedMember.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                    {selectedMember.status}
                  </Badge>
                </div>

                {selectedMember.phone_number && (
                  <div>
                    <p className="text-sm font-medium mb-1">Phone</p>
                    <p className="text-sm text-muted-foreground">{selectedMember.phone_number}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-1">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedMember.created_at)}
                  </p>
                </div>

                {selectedMember.last_login_at && (
                  <div>
                    <p className="text-sm font-medium mb-1">Last Login</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedMember.last_login_at)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setMemberDetailOpen(false)}
                >
                  Close
                </Button>
                <div className="flex gap-2 flex-1">
                  {selectedMember.status === 'active' ? (
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        handleDeactivateMember(selectedMember.id);
                        setMemberDetailOpen(false);
                      }}
                      disabled={deactivateMutation.isPending}
                    >
                      <Ban className="size-4 mr-2" />
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        handleReactivateMember(selectedMember.id);
                        setMemberDetailOpen(false);
                      }}
                      disabled={reactivateMutation.isPending}
                    >
                      <CheckCircle2 className="size-4 mr-2" />
                      Reactivate
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleRemoveMember(selectedMember.id, `${selectedMember.first_name} ${selectedMember.last_name}`);
                      setMemberDetailOpen(false);
                    }}
                    disabled={removeUserMutation.isPending}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="mb-3 -ml-3"
            onClick={() => router.push('/organisations')}
          >
            <ArrowLeft className="size-4" />
            Back to Organizations
          </Button>
          
          <div className="flex items-start gap-4">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="size-16 rounded-lg object-cover border"
              />
            ) : (
              <div className="size-16 rounded-lg bg-muted flex items-center justify-center border">
                <Building2 className="size-8 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{org.name}</h1>
                {org.acronym && (
                  <span className="text-muted-foreground text-sm font-medium">({org.acronym})</span>
                )}
                <Badge
                  variant="secondary"
                  className={cn("border-0 capitalize", typeStyle)}
                >
                  {org.type}
                </Badge>
                <Badge variant={org.is_active ? "default" : "secondary"}>
                  {org.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {org.description && (
                <p className="text-muted-foreground mt-2">{org.description}</p>
              )}
            </div>
          </div>
        </div>

        {(canEditOrg || canDeactivateOrg || canDeleteOrg) && (
          <div className="flex gap-2">
            {canEditOrg && (
              <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
                <Edit className="size-4" />
                Edit
              </Button>
            )}
            {canDeactivateOrg && (
              <Button
                variant={org.is_active ? "destructive" : "default"}
                size="sm"
                onClick={() => setStatusConfirmOpen(true)}
                disabled={toggleStatusMutation.isPending}
              >
                <Power className="size-4" />
                {org.is_active ? "Deactivate" : "Activate"}
              </Button>
            )}
            {canDeleteOrg && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOrgConfirmOpen(true)}
                disabled={deleteOrgMutation.isPending}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{datasets.length}</p>
                <p className="text-xs text-muted-foreground">Datasets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingInvites}</p>
                <p className="text-xs text-muted-foreground">Pending Invites</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adminCount}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {org.email && (
              <div className="flex items-start gap-3">
                <Mail className="size-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a 
                    href={`mailto:${org.email}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {org.email}
                  </a>
                </div>
              </div>
            )}

            {org.phone && (
              <div className="flex items-start gap-3">
                <Phone className="size-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <a 
                    href={`tel:${org.phone}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {org.phone}
                  </a>
                </div>
              </div>
            )}

            {org.website && (
              <div className="flex items-start gap-3">
                <Globe className="size-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Website</p>
                  <a 
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:underline flex items-center gap-1"
                  >
                    {new URL(org.website).hostname}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            )}

            {org.address && (
              <div className="flex items-start gap-3">
                <MapPin className="size-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{org.address}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <OrganisationAgreementCard org={org} orgId={orgId!} slug={slug} canManage={canManageAgreement} />

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50">
          <TabsTrigger 
            value="members"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 text-sm font-medium"
          >
            <Users className="size-4 mr-2" />
            Members ({members.length})
          </TabsTrigger>
          <TabsTrigger 
            value="invites"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 text-sm font-medium"
          >
            <MailCheck className="size-4 mr-2" />
            Invites ({invites.length})
          </TabsTrigger>
          <TabsTrigger 
            value="datasets"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3 text-sm font-medium"
          >
            <FileText className="size-4 mr-2" />
            Datasets ({datasets.length})
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Manage organization members and their roles
            </p>
            {canInvite && (
              <Button size="sm" onClick={() => setInviteModalOpen(true)}>
                <UserPlus className="size-4" />
                Invite Member
              </Button>
            )}
          </div>

          <Card>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {membersLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Loading members...
                      </td>
                    </tr>
                  ) : members.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No members yet. Invite someone to get started.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">
                          {member.first_name} {member.last_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {member.email}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {member.role === 'admin' ? 'Org Admin' : member.role.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge 
                            variant={member.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs capitalize"
                          >
                            {member.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDate(member.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                              <MoreVertical className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewMember(member)}>
                                <UserCog className="size-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {canPromote && member.role === 'contributor' && (
                                <DropdownMenuItem
                                  onClick={() => handlePromoteMember(member.id)}
                                  disabled={promoteMutation.isPending}
                                >
                                  <ShieldCheck className="size-4 mr-2" />
                                  {promoteMutation.isPending ? 'Promoting...' : 'Promote to Org Admin'}
                                </DropdownMenuItem>
                              )}
                              {canDemote && member.role === 'admin' && (
                                <DropdownMenuItem
                                  onClick={() => handleDemoteMember(member.id)}
                                  disabled={demoteMutation.isPending}
                                >
                                  <UserCog className="size-4 mr-2" />
                                  {demoteMutation.isPending ? 'Demoting...' : 'Demote to Contributor'}
                                </DropdownMenuItem>
                              )}
                              {member.status === 'active' ? (
                                <DropdownMenuItem
                                  onClick={() => handleDeactivateMember(member.id)}
                                  className="text-destructive"
                                  disabled={deactivateMutation.isPending}
                                >
                                  <Ban className="size-4 mr-2" />
                                  {deactivateMutation.isPending ? 'Deactivating...' : 'Deactivate'}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleReactivateMember(member.id)}
                                  className="text-emerald-600"
                                  disabled={reactivateMutation.isPending}
                                >
                                  <CheckCircle2 className="size-4 mr-2" />
                                  {reactivateMutation.isPending ? 'Reactivating...' : 'Reactivate'}
                                </DropdownMenuItem>
                              )}
                              {canRemoveMember && (
                                <DropdownMenuItem
                                  onClick={() => handleRemoveMember(member.id, `${member.first_name} ${member.last_name}`)}
                                  className="text-destructive"
                                  disabled={removeUserMutation.isPending}
                                >
                                  <Trash2 className="size-4 mr-2" />
                                  {removeUserMutation.isPending ? 'Removing...' : 'Remove'}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Invites Tab */}
        <TabsContent value="invites" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Track and manage pending invitations
            </p>
            {canInvite && (
              <Button size="sm" onClick={() => setInviteModalOpen(true)}>
                <UserPlus className="size-4" />
                Send New Invite
              </Button>
            )}
          </div>

          <Card>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Invited By</th>
                    <th className="px-4 py-3 font-medium">Sent</th>
                    <th className="px-4 py-3 font-medium">Expires</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitesLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        Loading invites...
                      </td>
                    </tr>
                  ) : invites.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No invites yet. Click "Send New Invite" to get started.
                      </td>
                    </tr>
                  ) : (
                    invites.map((invite) => {
                      const isExpired = new Date(invite.expiresAt) < new Date();
                      const isPending = invite.status === 'pending';
                      
                      return (
                        <tr key={invite.id} className="border-b hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">
                            <div className="flex items-center gap-2">
                              <Mail className="size-4 text-muted-foreground" />
                              {invite.invitedEmail}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {invite.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                invite.status === 'pending'
                                  ? 'default'
                                  : invite.status === 'accepted'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                              className="text-xs capitalize"
                            >
                              {invite.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {invite.invitedByName}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {formatDate(invite.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {isExpired && isPending ? (
                              <span className="text-destructive font-medium">Expired</span>
                            ) : (
                              formatDate(invite.expiresAt)
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isPending && !isExpired ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                                  <MoreVertical className="size-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {canInvite && (
                                    <DropdownMenuItem
                                      onClick={() => resendMutation.mutate(invite.id)}
                                      disabled={resendMutation.isPending}
                                    >
                                      <RefreshCw className="size-4 mr-2" />
                                      Resend Invite
                                    </DropdownMenuItem>
                                  )}
                                  {canInvite && (
                                    <DropdownMenuItem
                                      onClick={() => revokeMutation.mutate(invite.id)}
                                      disabled={revokeMutation.isPending}
                                      className="text-destructive"
                                    >
                                      <XCircle className="size-4 mr-2" />
                                      Revoke
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => deleteInviteMutation.mutate(invite.id)}
                                    disabled={deleteInviteMutation.isPending}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="size-4 mr-2" />
                                    Delete Permanently
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteInviteMutation.mutate(invite.id)}
                                disabled={deleteInviteMutation.isPending}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-4 mr-1" />
                                Delete
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Datasets Tab */}
        <TabsContent value="datasets" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Datasets published by this organization
            </p>
            {canUploadDataset && (
              <Link href={`/upload?orgId=${orgId}`}>
                <Button size="sm">
                  <Upload className="size-4" />
                  Upload Dataset
                </Button>
              </Link>
            )}
          </div>

          <Card>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Format</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Downloads</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No datasets yet. Click "Upload Dataset" to add one.
                      </td>
                    </tr>
                  ) : (
                    datasets.map((dataset: any) => (
                      <tr key={dataset.id} className="border-b hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{dataset.title}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs uppercase">
                            {dataset.format}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs capitalize">
                            {dataset.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {dataset.downloadCount || 0}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDate(dataset.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                              <MoreVertical className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/datasets/${dataset.slug}`)}>
                                <ExternalLink className="size-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {canArchiveDataset && (
                                <DropdownMenuItem
                                  onClick={() => handleArchiveDataset(dataset.slug, dataset.title)}
                                  disabled={archiveDatasetMutation.isPending || dataset.status === 'archived'}
                                >
                                  <Archive className="size-4 mr-2" />
                                  {archiveDatasetMutation.isPending ? 'Archiving...' : 'Archive'}
                                </DropdownMenuItem>
                              )}
                              {canDeleteDataset && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteDataset(dataset.slug, dataset.title)}
                                  disabled={deleteDatasetMutation.isPending}
                                  className="text-destructive"
                                >
                                  <Trash2 className="size-4 mr-2" />
                                  {deleteDatasetMutation.isPending ? 'Deleting...' : 'Delete'}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
