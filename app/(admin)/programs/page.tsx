"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  PauseCircle,
  Plus,
  RotateCcw,
  Search,
  Target,
  Trash2,
  X,
  Edit,
} from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { usePrograms, useArchiveProgram } from "@/lib/hooks/usePrograms";
import { getProgrammes } from "@/lib/api/programs";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/data/pagination";
import { EmptyState } from "@/components/feedback/empty-state";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataTableShell,
  METRIC_TONE,
  MetricCard,
  Panel,
  tabToneClass,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { ProgramFormModal } from "@/components/admin/program-form-modal";
import Link from "next/link";
import type { AdminProgramme, ProgrammeType, ProgrammeStatus } from "@/lib/api/programs";
import { toast } from "sonner";

const typeLabels: Record<ProgrammeType, string> = {
  campaign: "Campaign",
  surveillance: "Surveillance",
  screening: "Screening",
  training: "Training",
  infrastructure: "Infrastructure",
  research: "Research",
  other: "Other",
};

const STATUS_CONFIG: Record<ProgrammeStatus, { label: string; tone: MetricTone }> = {
  active: { label: "Active", tone: "success" },
  completed: { label: "Completed", tone: "info" },
  suspended: { label: "Suspended", tone: "warning" },
  archived: { label: "Archived", tone: "muted" },
};

const TABS: Array<{ key: ProgrammeStatus | "all"; label: string; tone: MetricTone }> = [
  { key: "all", label: "All programmes", tone: "muted" },
  { key: "active", label: "Active", tone: "success" },
  { key: "completed", label: "Completed", tone: "info" },
  { key: "suspended", label: "Suspended", tone: "warning" },
  { key: "archived", label: "Archived", tone: "muted" },
];

function progressPercent(reach: number | null, target: number | null): number | null {
  if (!reach || !target || target === 0) return null;
  return Math.min(100, Math.round((reach / target) * 100));
}

export default function AdminProgramsPage() {
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission, isLoading: permissionsLoading } = usePermissions();
  const isSuperAdmin = user?.role === "super_admin";
  const canView =
    isSuperAdmin ||
    hasAnyPermission("create:programs", "edit:programs", "upload:programs", "delete:programs");
  const canManage = isSuperAdmin || hasAnyPermission("create:programs", "edit:programs");
  const canDelete = isSuperAdmin || hasPermission("delete:programs");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<ProgrammeStatus | "all">("all");
  const [type, setType] = useState<ProgrammeType | "all">("all");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<AdminProgramme | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, isFetching, isError, refetch } = usePrograms({
    page,
    limit: pageSize,
    q: debouncedQuery || undefined,
    status: status === "all" ? undefined : status,
    type: type === "all" ? undefined : type,
  });
  const archiveMutation = useArchiveProgram();

  const [totalSummary, activeSummary, completedSummary, suspendedSummary] = useQueries({
    queries: [
      {
        queryKey: ["programmes", "summary", "total"],
        queryFn: () => getProgrammes({ page: 1, limit: 1 }),
        select: (result: Awaited<ReturnType<typeof getProgrammes>>) => result.total,
        enabled: canView,
      },
      {
        queryKey: ["programmes", "summary", "active"],
        queryFn: () => getProgrammes({ page: 1, limit: 1, status: "active" }),
        select: (result: Awaited<ReturnType<typeof getProgrammes>>) => result.total,
        enabled: canView,
      },
      {
        queryKey: ["programmes", "summary", "completed"],
        queryFn: () => getProgrammes({ page: 1, limit: 1, status: "completed" }),
        select: (result: Awaited<ReturnType<typeof getProgrammes>>) => result.total,
        enabled: canView,
      },
      {
        queryKey: ["programmes", "summary", "suspended"],
        queryFn: () => getProgrammes({ page: 1, limit: 1, status: "suspended" }),
        select: (result: Awaited<ReturnType<typeof getProgrammes>>) => result.total,
        enabled: canView,
      },
    ],
  });

  const statsLoading =
    totalSummary.isLoading ||
    activeSummary.isLoading ||
    completedSummary.isLoading ||
    suspendedSummary.isLoading;

  const programmes = data?.data ?? [];
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

  const openCreate = () => {
    setFormModalOpen(true);
  };

  const confirmArchive = () => {
    if (!archiveTarget) return;
    archiveMutation.mutate(archiveTarget.slug, {
      onSuccess: () => {
        toast.success("Programme archived");
        setArchiveTarget(null);
      },
      onError: (error) => {
        const err = error as { message?: string };
        toast.error(err?.message || "Failed to archive programme");
      },
    });
  };

  if (!permissionsLoading && !canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="Managing programmes requires create:programs, edit:programs, upload:programs, or delete:programs. Ask a super admin to grant your group one of these permissions."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programmes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Health campaigns, surveillance, training, and other initiatives — track progress and manage reports
          </p>
        </div>
        {!isLoading && (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium tabular-nums">
            {total} {total === 1 ? "programme" : "programmes"}
          </Badge>
        )}
      </div>

      <div className="rounded-xl border border-info/25 bg-info/[0.06] px-4 py-3 text-sm text-muted-foreground">
        Programmes track health initiatives across LGAs — campaigns, surveillance rounds, screening drives,
        and training. Upload periodic reports from each programme&apos;s detail page to keep reach and coverage
        metrics current.
      </div>

      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total programmes"
            value={totalSummary.data ?? 0}
            hint="All statuses"
            icon={Target}
            tone="primary"
          />
          <MetricCard
            label="Active"
            value={activeSummary.data ?? 0}
            hint="Currently running"
            icon={Target}
            tone="success"
          />
          <MetricCard
            label="Completed"
            value={completedSummary.data ?? 0}
            hint="Finished initiatives"
            icon={CheckCircle2}
            tone="info"
          />
          <MetricCard
            label="Suspended"
            value={suspendedSummary.data ?? 0}
            hint="Paused or on hold"
            icon={PauseCircle}
            tone="warning"
          />
        </div>
      )}

      <Panel
        title="Programme directory"
        description="Filter by status or type, or search by programme name."
        icon={Target}
        tone="info"
        action={
          canManage ? (
            <Button className="h-9 w-full sm:w-auto" onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Create programme
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-1">
            <div className="flex flex-wrap gap-1" role="tablist" aria-label="Programme status">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={status === tab.key}
                  onClick={() => {
                    setStatus(tab.key);
                    setPage(1);
                  }}
                  className={cn(
                    "min-h-9 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                    status === tab.key
                      ? cn("shadow-sm", tabToneClass(tab.tone))
                      : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
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
                  placeholder="Search programme name"
                  className="h-10 pl-9 pr-10"
                  aria-label="Search programmes"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-0 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="Clear programme search"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              <Select
                value={type}
                onValueChange={(value) => {
                  setType(value as ProgrammeType | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-full sm:w-56" aria-label="Filter by programme type">
                  <SelectValue>
                    {(v: string) =>
                      v === "all" ? "All types" : (typeLabels[v as ProgrammeType] ?? v)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {(Object.keys(typeLabels) as ProgrammeType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {typeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                {total === 1 ? "programme" : "programmes"}
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
            <h2 className="mt-4 text-base font-semibold">Could not load programmes</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Check your connection and try loading the programme list again.
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
                <Skeleton key={index} className="h-48 rounded-xl" />
              ))}
            </div>
          </>
        ) : programmes.length === 0 ? (
          <div className="rounded-2xl border bg-card">
            <EmptyState
              icon={Target}
              title={hasFilters ? "No matching programmes" : "No programmes yet"}
              description={
                hasFilters
                  ? "Try a different search term, status, or programme type."
                  : "Health campaigns, surveillance, and training programmes will appear here once created."
              }
              action={
                hasFilters
                  ? { label: "Clear filters", onClick: clearFilters }
                  : canManage
                    ? { label: "Create programme", onClick: openCreate }
                    : undefined
              }
            />
          </div>
        ) : (
          <>
            <DataTableShell>
              <div className="hidden xl:block">
                <Table>
                  <TableHeader>
                    <TableRow className="h-11 bg-muted/40 text-[11px] uppercase tracking-wide hover:bg-muted/40">
                      <TableHead className="h-11 px-4">Programme</TableHead>
                      <TableHead className="h-11 px-4">Type</TableHead>
                      <TableHead className="h-11 px-4">Status</TableHead>
                      <TableHead className="h-11 px-4">Progress</TableHead>
                      <TableHead className="h-11 px-4">LGAs</TableHead>
                      <TableHead className="h-11 px-4">Created</TableHead>
                      <TableHead className="h-11 px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programmes.map((prog) => {
                      const progress = progressPercent(prog.reach_count, prog.target_count);
                      return (
                        <TableRow key={prog.id} className="hover:bg-muted/30">
                          <TableCell className="max-w-sm px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <Target className="size-4" aria-hidden="true" />
                              </div>
                              <div className="min-w-0">
                                <Link
                                  href={`/programs/${prog.slug}`}
                                  className="line-clamp-1 font-semibold hover:underline"
                                >
                                  {prog.name}
                                </Link>
                                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                  {prog.code ? `${prog.code} · ` : ""}
                                  {prog.target_lgas?.length ?? 0} target LGAs
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-40 px-4 py-3.5">
                            <TypeBadge type={prog.type} />
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            <ProgrammeStatusBadge status={prog.status} />
                          </TableCell>
                          <TableCell className="px-4 py-3.5">
                            {progress !== null ? (
                              <div className="flex items-center gap-2">
                                <div className="h-2 max-w-24 flex-1 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium tabular-nums">{progress}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-center font-medium tabular-nums">
                            {prog.lgas_covered_count ?? "—"}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-xs text-muted-foreground">
                            {formatDate(prog.created_at)}
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-right">
                            {canManage && (
                              <div className="flex justify-end gap-1">
                                <Link
                                  href={`/programs/${prog.slug}`}
                                  className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                                  aria-label={`View ${prog.name}`}
                                  title="View details"
                                >
                                  <Edit className="size-4" aria-hidden="true" />
                                </Link>
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Archive ${prog.name}`}
                                    title="Archive programme"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setArchiveTarget(prog)}
                                    disabled={prog.status === "archived"}
                                  >
                                    <Trash2 className="size-4" aria-hidden="true" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </DataTableShell>

            <div className="grid grid-cols-1 gap-3 xl:hidden">
              {programmes.map((prog) => {
                const progress = progressPercent(prog.reach_count, prog.target_count);
                return (
                  <article key={prog.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Target className="size-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/programs/${prog.slug}`}
                          className="line-clamp-2 text-sm font-semibold leading-5 hover:underline"
                        >
                          {prog.name}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {prog.type ? typeLabels[prog.type] : "—"}
                        </p>
                      </div>
                      <ProgrammeStatusBadge status={prog.status} />
                    </div>

                    <dl className="mt-4 grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 border-y py-3">
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Progress
                        </dt>
                        <dd className="mt-1 text-sm font-semibold">
                          {progress !== null ? `${progress}%` : "—"}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          LGAs covered
                        </dt>
                        <dd className="mt-1 text-sm font-semibold tabular-nums">
                          {prog.lgas_covered_count ?? "—"}
                        </dd>
                      </div>
                    </dl>

                    {canManage && (
                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/programs/${prog.slug}`}
                          className={cn(buttonVariants({ variant: "outline" }), "h-11 flex-1")}
                        >
                          <Edit className="mr-1.5 size-3.5" />
                          View details
                        </Link>
                        {canDelete && (
                          <Button
                            variant="outline"
                            className="h-11 flex-1 text-destructive"
                            onClick={() => setArchiveTarget(prog)}
                            disabled={prog.status === "archived"}
                          >
                            <Trash2 className="mr-1.5 size-3.5" />
                            Archive
                          </Button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
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

      <ProgramFormModal open={formModalOpen} onClose={() => setFormModalOpen(false)} />

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
        title="Archive programme?"
        description={`"${archiveTarget?.name}" will be removed from the public catalogue but remains accessible to admins.`}
        confirmLabel="Archive"
        variant="destructive"
        loading={archiveMutation.isPending}
        onConfirm={confirmArchive}
      />
    </div>
  );
}

function ProgrammeStatusBadge({ status }: { status: ProgrammeStatus }) {
  const { label, tone } = STATUS_CONFIG[status];
  const t = METRIC_TONE[tone];
  return (
    <Badge variant="outline" className={cn("border text-xs capitalize", t.well, t.icon)}>
      {label}
    </Badge>
  );
}

function TypeBadge({ type }: { type: ProgrammeType | null }) {
  const t = METRIC_TONE.info;
  return (
    <Badge variant="outline" className={cn("max-w-full border text-[11px]", t.well, t.icon)}>
      <span className="truncate">{type ? typeLabels[type] : "—"}</span>
    </Badge>
  );
}
