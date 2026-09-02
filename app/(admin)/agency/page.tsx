"use client";

import { useState, type ReactNode } from "react";
import {
  AlertCircle,
  Building2,
  Database,
  Edit,
  Globe,
  Lock,
  Mail,
  MailPlus,
  MapPin,
  Phone,
  RotateCcw,
  Users,
} from "lucide-react";
import { StaffWorkflow } from "@/components/admin/staff-workflow";
import { EditOrganisationModal } from "@/components/admin/edit-organisation-modal";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MetricCard,
  METRIC_TONE,
  Panel,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import { HelpTip } from "@/components/admin/help-tip";
import {
  AGENCY_EDIT_PROFILE_TIP,
  AGENCY_METRIC_TIPS,
  AGENCY_PAGE_TIP,
  AGENCY_PROFILE_PANEL_TIP,
} from "@/lib/constants/agency-tooltips";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import { useStaffInvites, useStaffMembers } from "@/lib/hooks/useStaff";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { cn } from "@/lib/utils";

export default function AgencyPage() {
  const [editOpen, setEditOpen] = useState(false);
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useOrganisations(1, 10, "platform-owner");
  const organisations = data?.data ?? [];
  const agency = organisations[0];

  const staffSummary = useStaffMembers({ page: 1, limit: 1 });
  const inviteSummary = useStaffInvites({ page: 1, limit: 1, status: "pending" });
  const datasetsSummary = useQuery({
    queryKey: ["agency", "datasets", agency?.id, "summary"],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        limit: "1",
        organisationId: agency!.id,
      });
      const response = await adminApi.get<{ data: { meta: { total: number } } }>(
        `/admin/datasets?${params}`,
      );
      return response.data.data.meta.total;
    },
    enabled: !!agency?.id,
  });

  if (user?.role !== "super_admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Agency access is restricted"
          description="Only the super administrator can manage the agency profile, staff, and invitations."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <AgencyMessage
        title="Could not load the agency"
        description="Check your connection and try loading the agency workspace again."
        action={
          <Button variant="outline" className="mt-5 h-11 sm:h-8" onClick={() => refetch()}>
            <RotateCcw className="size-4" />
            Try again
          </Button>
        }
      />
    );
  }

  if (organisations.length !== 1 || !agency) {
    return (
      <AgencyMessage
        title="Agency configuration needs attention"
        description={
          organisations.length === 0
            ? "No platform-owner agency is configured."
            : "Multiple platform-owner agencies were returned. Correct the platform configuration before managing staff."
        }
      />
    );
  }

  return (
    <TooltipProvider delay={200}>
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          Agency
          <HelpTip content={AGENCY_PAGE_TIP} label="About agency" />
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Manage the platform-owning agency profile, staff access, invitations, and agency datasets.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Staff members"
          value={staffSummary.data?.total ?? 0}
          hint="Agency staff accounts"
          tip={AGENCY_METRIC_TIPS.staff}
          icon={Users}
          tone="primary"
        />
        <MetricCard
          label="Pending invites"
          value={inviteSummary.data?.total ?? 0}
          hint="Awaiting acceptance"
          tip={AGENCY_METRIC_TIPS.invites}
          icon={MailPlus}
          tone="warning"
        />
        <MetricCard
          label="Agency datasets"
          value={datasetsSummary.data ?? 0}
          hint="Owned by the platform agency"
          tip={AGENCY_METRIC_TIPS.datasets}
          icon={Database}
          tone="info"
        />
        <MetricCard
          label="Agency status"
          value={agency.is_active ? "Active" : "Inactive"}
          hint={agency.acronym ?? agency.slug}
          tip={AGENCY_METRIC_TIPS.status}
          icon={Building2}
          tone={agency.is_active ? "success" : "muted"}
        />
      </div>

      <Panel
        title={agency.name}
        titleTip={AGENCY_PROFILE_PANEL_TIP}
        description={agency.description || "Platform-owning agency profile."}
        icon={Building2}
        tone="primary"
        action={
          <div className="flex items-center gap-1">
            <Button variant="outline" className="h-9" onClick={() => setEditOpen(true)}>
              <Edit className="size-4" />
              Edit profile
            </Button>
            <HelpTip content={AGENCY_EDIT_PROFILE_TIP} label="About edit profile" />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {agency.acronym && <Badge variant="outline">{agency.acronym}</Badge>}
            <Badge variant="outline" className="capitalize">
              {agency.type}
            </Badge>
            <AgencyStatusBadge active={agency.is_active} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ProfileItem
              icon={Mail}
              label="Email"
              value={agency.email}
              href={agency.email ? `mailto:${agency.email}` : undefined}
            />
            <ProfileItem
              icon={Phone}
              label="Phone"
              value={agency.phone}
              href={agency.phone ? `tel:${agency.phone}` : undefined}
            />
            <ProfileItem
              icon={Globe}
              label="Website"
              value={agency.website}
              href={agency.website ?? undefined}
              external
            />
            <ProfileItem icon={MapPin} label="Address" value={agency.address} />
          </div>
        </div>
      </Panel>

      <StaffWorkflow organisationId={agency.id} />

      <EditOrganisationModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        org={agency}
        slug={agency.slug}
      />
    </div>
    </TooltipProvider>
  );
}

function AgencyStatusBadge({ active }: { active: boolean }) {
  const tone: MetricTone = active ? "success" : "muted";
  const t = METRIC_TONE[tone];
  return (
    <Badge variant="outline" className={cn("border text-xs", t.well, t.icon)}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

function ProfileItem({
  icon: Icon,
  label,
  value,
  href,
  external = false,
}: {
  icon: typeof Mail;
  label: string;
  value: string | null;
  href?: string;
  external?: boolean;
}) {
  const t = METRIC_TONE.info;
  return (
    <div className={cn("rounded-xl border p-3", t.card)}>
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className={cn("size-3.5", t.icon)} aria-hidden />
        {label}
      </div>
      {value ? (
        href ? (
          <a
            className="mt-1.5 block truncate text-sm font-medium hover:underline"
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
          >
            {value}
          </a>
        ) : (
          <p className="mt-1.5 line-clamp-2 text-sm font-medium">{value}</p>
        )
      ) : (
        <p className="mt-1.5 text-sm text-muted-foreground">Not provided</p>
      )}
    </div>
  );
}

function AgencyMessage({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-card px-4 py-12 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-7" aria-hidden />
      </div>
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
