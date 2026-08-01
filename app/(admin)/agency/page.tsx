"use client";

import { useState } from "react";
import { AlertCircle, Building2, Edit, Globe, Mail, MapPin, Phone, RotateCcw } from "lucide-react";
import { StaffWorkflow } from "@/components/admin/staff-workflow";
import { EditOrganisationModal } from "@/components/admin/edit-organisation-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useOrganisations } from "@/lib/hooks/useOrganisations";

export default function AgencyPage() {
  const [editOpen, setEditOpen] = useState(false);
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useOrganisations(1, 10, "platform-owner");
  const organisations = data?.data ?? [];
  const agency = organisations[0];

  if (user?.role !== "super_admin") {
    return <AgencyMessage title="Agency access is restricted" description="Only the super administrator can manage the agency profile, staff, and invitations." />;
  }

  if (isLoading) {
    return <div className="space-y-6"><div><Skeleton className="h-8 w-32" /><Skeleton className="mt-2 h-4 w-80 max-w-full" /></div><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>;
  }
  if (isError) {
    return <AgencyMessage title="Could not load the agency" description="Check your connection and try loading the agency workspace again." action={<Button variant="outline" className="mt-5 h-11 sm:h-8" onClick={() => refetch()}><RotateCcw className="size-4" /> Try again</Button>} />;
  }
  if (organisations.length !== 1 || !agency) {
    return <AgencyMessage title="Agency configuration needs attention" description={organisations.length === 0 ? "No platform-owner agency is configured." : "Multiple platform-owner agencies were returned. Correct the platform configuration before managing staff."} />;
  }

  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold">Agency</h1><p className="mt-1 text-sm text-muted-foreground">Manage the platform-owning agency profile and staff access.</p></div>
    <section className="overflow-hidden rounded-2xl border bg-card" aria-labelledby="agency-profile-heading">
      <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted"><Building2 className="size-5" aria-hidden="true" /></div>
          <div className="min-w-0"><h2 id="agency-profile-heading" className="text-lg font-semibold">{agency.name}</h2><div className="mt-2 flex flex-wrap items-center gap-2">{agency.acronym && <Badge variant="secondary">{agency.acronym}</Badge>}<Badge variant="outline" className="capitalize">{agency.type}</Badge><Badge variant={agency.is_active ? "default" : "secondary"}>{agency.is_active ? "Active" : "Inactive"}</Badge></div></div>
        </div>
        <Button variant="outline" className="h-11 w-full sm:h-9 sm:w-auto" onClick={() => setEditOpen(true)}><Edit className="size-4" aria-hidden="true" /> Edit profile</Button>
      </div>
      <div className="space-y-4 p-4">
        <p className="max-w-4xl text-sm leading-6 text-muted-foreground">{agency.description || "No agency description has been added."}</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ProfileItem icon={Mail} label="Email" value={agency.email} href={agency.email ? `mailto:${agency.email}` : undefined} /><ProfileItem icon={Phone} label="Phone" value={agency.phone} href={agency.phone ? `tel:${agency.phone}` : undefined} /><ProfileItem icon={Globe} label="Website" value={agency.website} href={agency.website ?? undefined} external /><ProfileItem icon={MapPin} label="Address" value={agency.address} /></div>
      </div>
    </section>
    <StaffWorkflow organisationId={agency.id} />
    <EditOrganisationModal open={editOpen} onClose={() => setEditOpen(false)} org={agency} slug={agency.slug} />
  </div>;
}

function ProfileItem({ icon: Icon, label, value, href, external = false }: { icon: typeof Mail; label: string; value: string | null; href?: string; external?: boolean }) {
  return <div className="rounded-xl border bg-background p-3"><div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><Icon className="size-3.5" aria-hidden="true" />{label}</div>{value ? href ? <a className="mt-1.5 block truncate text-sm font-medium hover:underline" href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>{value}</a> : <p className="mt-1.5 line-clamp-2 text-sm font-medium">{value}</p> : <p className="mt-1.5 text-sm text-muted-foreground">Not provided</p>}</div>;
}

function AgencyMessage({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="rounded-2xl border bg-card px-4 py-12 text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertCircle className="size-7" aria-hidden="true" /></div><h1 className="mt-4 text-xl font-semibold">{title}</h1><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{description}</p>{action}</div>;
}
