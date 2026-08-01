"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  ChevronRight,
  FileText,
  FileWarning,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/data/pagination";
import { EmptyState } from "@/components/feedback/empty-state";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { ORG_TYPES } from "@/lib/constants/organisation-types";
import type { OrganisationType } from "@/lib/api/organisations";
import { CreateOrganisationModal } from "@/components/admin/create-organisation-modal";

const typeLabels = new Map(ORG_TYPES.map((type) => [type.value, type.label]));
const statusTabs = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

type OrganisationStatusFilter = (typeof statusTabs)[number]["value"];

export default function AdminOrganisationsPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isSuperAdmin = user?.role === "super_admin";
  const canCreate = isSuperAdmin || hasPermission("create:organisations");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<OrganisationStatusFilter>("all");
  const [type, setType] = useState<OrganisationType | "all">("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isFetching, isError, refetch } = useOrganisations(
    page,
    pageSize,
    "partners",
    {
      search: debouncedQuery || undefined,
      status: status === "all" ? undefined : status,
      type: type === "all" ? undefined : type,
    }
  );

  const orgs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const isSearchPending = query.trim() !== debouncedQuery;
  const hasFilters = !!query || !!debouncedQuery || status !== "all" || type !== "all";

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setStatus("all");
    setType("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organisations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage partner organisations, agreements, and dataset ownership
          </p>
        </div>
        {canCreate && (
          <Button className="h-11 w-full sm:h-8 sm:w-auto" onClick={() => setCreateModalOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Add organisation
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="scrollbar-slim overflow-x-auto border-b px-4">
          <div className="flex min-w-max gap-1" role="tablist" aria-label="Organisation status">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={status === tab.value}
                onClick={() => {
                  setStatus(tab.value);
                  setPage(1);
                }}
                className={cn(
                  "relative min-h-11 px-3 text-sm font-medium transition-colors",
                  status === tab.value
                    ? "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, acronym, or email"
                className="h-11 pl-9 pr-10 sm:h-10"
                aria-label="Search organisations"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-10"
                  aria-label="Clear organisation search"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as OrganisationType | "all");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 w-full sm:h-10 sm:w-64" aria-label="Filter by organisation type">
                <SelectValue placeholder="All organisation types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All organisation types</SelectItem>
                {ORG_TYPES.map((organisationType) => (
                  <SelectItem key={organisationType.value} value={organisationType.value}>
                    {organisationType.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="ghost" className="h-11 sm:h-10" onClick={clearFilters}>
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
              {total === 1 ? "organisation" : "organisations"}
            </span>
          </div>
        </div>
      </div>

      <div aria-busy={isLoading || isFetching || isSearchPending} className="space-y-4">
        {isError ? (
          <div className="rounded-2xl border bg-card px-4 py-12 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-semibold">Could not load organisations</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Check your connection and try loading the organisation list again.
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
            <div className="grid gap-3 xl:hidden">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-64 rounded-xl" />
              ))}
            </div>
          </>
        ) : orgs.length === 0 ? (
          <div className="rounded-2xl border bg-card">
            <EmptyState
              icon={Building2}
              title={hasFilters ? "No matching organisations" : "No organisations yet"}
              description={
                hasFilters
                  ? "Try a different search term, status, or organisation type."
                  : "Partner organisations will appear here after they are added to the platform."
              }
              action={
                hasFilters
                  ? { label: "Clear filters", onClick: clearFilters }
                  : canCreate
                    ? { label: "Add organisation", onClick: () => setCreateModalOpen(true) }
                    : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border bg-card xl:block">
              <Table>
                <TableHeader>
                  <TableRow className="h-11 bg-muted/40 text-[11px] uppercase tracking-wide hover:bg-muted/40">
                    <TableHead className="h-11 px-4">Organisation</TableHead>
                    <TableHead className="h-11 px-4">Type</TableHead>
                    <TableHead className="h-11 px-4">Contact</TableHead>
                    <TableHead className="h-11 px-4 text-right">Datasets</TableHead>
                    <TableHead className="h-11 px-4">Agreement</TableHead>
                    <TableHead className="h-11 px-4">Status</TableHead>
                    <TableHead className="h-11 px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.map((organisation) => (
                    <TableRow key={organisation.id} className="hover:bg-muted/30">
                      <TableCell className="max-w-sm px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Building2 className="size-4" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <Link href={`/organisations/${organisation.slug}`} className="line-clamp-1 font-semibold hover:underline">
                              {organisation.name}
                            </Link>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {organisation.acronym || `Added ${formatDate(organisation.created_at)}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-48 px-4 py-3.5">
                        <Badge variant="secondary" className="max-w-full text-[11px]">
                          <span className="truncate">{typeLabels.get(organisation.type) ?? "Other"}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-56 px-4 py-3.5 text-xs text-muted-foreground">
                        <span className="line-clamp-2 break-all">{organisation.email || "No email provided"}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right font-medium tabular-nums">
                        {organisation.dataset_count ?? 0}
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <AgreementBadge hasAgreement={!!organisation.agreement_file_path} />
                      </TableCell>
                      <TableCell className="px-4 py-3.5">
                        <OrganisationStatusBadge active={organisation.is_active} />
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-right">
                        <Link
                          href={`/organisations/${organisation.slug}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                          aria-label={`View ${organisation.name}`}
                          title="View organisation"
                        >
                          <ChevronRight className="size-4" aria-hidden="true" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 xl:hidden">
              {orgs.map((organisation) => (
                <article key={organisation.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/organisations/${organisation.slug}`} className="line-clamp-2 text-sm font-semibold leading-5 hover:underline">
                        {organisation.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {typeLabels.get(organisation.type) ?? "Other"}
                      </p>
                    </div>
                    <OrganisationStatusBadge active={organisation.is_active} />
                  </div>

                  {organisation.email && (
                    <p className="mt-3 truncate text-xs text-muted-foreground">{organisation.email}</p>
                  )}

                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y py-3">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Datasets</dt>
                      <dd className="mt-1 text-sm font-semibold tabular-nums">{organisation.dataset_count ?? 0}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Agreement</dt>
                      <dd className="mt-1"><AgreementBadge hasAgreement={!!organisation.agreement_file_path} /></dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Added</dt>
                      <dd className="mt-1 text-xs font-medium">{formatDate(organisation.created_at)}</dd>
                    </div>
                  </dl>

                  <Link
                    href={`/organisations/${organisation.slug}`}
                    className={cn(buttonVariants({ variant: "outline" }), "mt-4 h-11 w-full justify-between")}
                  >
                    View organisation
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Link>
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

      <CreateOrganisationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}

function AgreementBadge({ hasAgreement }: { hasAgreement: boolean }) {
  return (
    <Badge variant="outline" className="gap-1 text-[11px]">
      {hasAgreement ? (
        <FileText className="size-3" aria-hidden="true" />
      ) : (
        <FileWarning className="size-3" aria-hidden="true" />
      )}
      {hasAgreement ? "Signed" : "Missing"}
    </Badge>
  );
}

function OrganisationStatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "default" : "secondary"} className="text-[11px]">
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}
