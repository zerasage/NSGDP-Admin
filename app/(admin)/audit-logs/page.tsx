"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Download, Loader2, RotateCcw, Search, UserRound, X, XCircle } from "lucide-react";
import { useAuditLogs, downloadAuditLogsCsv } from "@/lib/hooks/useAuditLogs";
import type { AuditLog } from "@/lib/api/admin";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/data/pagination";
import { EmptyState } from "@/components/feedback/empty-state";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { statusPill } from "@/lib/constants/status-surfaces";
import {
  AUDIT_LOGS_ACTION_TIP,
  AUDIT_LOGS_EXPAND_TIP,
  AUDIT_LOGS_EXPORT_TIP,
  AUDIT_LOGS_FILTERS_TIP,
  AUDIT_LOGS_OUTCOME_TIP,
  AUDIT_LOGS_PAGE_TIP,
  AUDIT_LOGS_PERIOD_TIP,
} from "@/lib/constants/audit-logs-tooltips";
import { HelpTip } from "@/components/admin/help-tip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/date";
import { toast } from "sonner";

const ACTIONS = ["upload", "download", "export", "approve", "reject", "create", "update", "delete", "login", "logout"];
const ENTITIES = ["dataset", "user", "organisation", "access_request", "organisation_invite", "staff_invite", "permission_group", "auth"];
const PERIODS = [
  { key: "all", label: "All time", days: 0 },
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "custom", label: "Custom range", days: 0 },
];
const RISK = ["delete", "reject"];
const POSITIVE = ["approve", "create"];
const label = (value: string) => value.replace(/_/g, " ");
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

function ActionBadge({ entry }: { entry: AuditLog }) {
  const tone = !entry.success || RISK.includes(entry.action)
    ? "bg-destructive/10 text-destructive"
    : POSITIVE.includes(entry.action)
      ? statusPill.emerald
      : "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize", tone)}>
      {!entry.success ? <XCircle className="size-3" /> : RISK.includes(entry.action) ? <AlertTriangle className="size-3" /> : POSITIVE.includes(entry.action) ? <CheckCircle2 className="size-3" /> : null}
      {label(entry.action)}
    </span>
  );
}

function ValueDiff({ label: title, values }: { label: string; values: Record<string, unknown> | null }) {
  if (!values || !Object.keys(values).length) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-muted-foreground">{title}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-muted/50 p-2 text-xs">{JSON.stringify(values, null, 2)}</pre>
    </div>
  );
}

function Details({ entry }: { entry: AuditLog }) {
  return (
    <div className="space-y-3 text-xs">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="font-semibold text-muted-foreground">User agent</dt><dd className="mt-1 break-all">{entry.user_agent || "—"}</dd></div>
        <div><dt className="font-semibold text-muted-foreground">Permission group</dt><dd className="mt-1 break-all">{entry.permission_group_id || "—"}</dd></div>
        <div><dt className="font-semibold text-muted-foreground">Entity</dt><dd className="mt-1 break-all">{entry.entity_type}{entry.entity_id ? `/${entry.entity_id}` : ""}</dd></div>
        {!entry.success && <div><dt className="font-semibold text-muted-foreground">Failure reason</dt><dd className="mt-1 break-all text-destructive">{entry.failure_reason || "—"}</dd></div>}
      </dl>
      <div className="grid gap-3 sm:grid-cols-2">
        <ValueDiff label="Before" values={entry.old_values} />
        <ValueDiff label="After" values={entry.new_values} />
      </div>
      <ValueDiff label="Metadata" values={entry.metadata} />
    </div>
  );
}

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [action, setAction] = useState("all");
  const [entityType, setEntityType] = useState("all");
  const [outcome, setOutcome] = useState("all");
  const [period, setPeriod] = useState("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const dates = useMemo(() => {
    if (period === "custom") return { startDate: customStart || undefined, endDate: customEnd || undefined };
    const days = PERIODS.find((item) => item.key === period)?.days || 0;
    if (!days) return {};
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    return { startDate: isoDate(start), endDate: isoDate(end) };
  }, [period, customStart, customEnd]);

  const filters = {
    action: action === "all" ? undefined : action,
    entityType: entityType === "all" ? undefined : entityType,
    success: outcome === "all" ? undefined : outcome === "success",
    search: search || undefined,
    ...dates,
  };

  const { data, isLoading, isFetching, isError, refetch } = useAuditLogs({ page, limit: pageSize, ...filters });
  const entries = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;
  const searchPending = query.trim() !== search;
  const activeCount = [query.trim(), action !== "all", entityType !== "all", outcome !== "all", period !== "all", period === "custom" && customStart, period === "custom" && customEnd].filter(Boolean).length;

  const clearFilters = () => {
    setQuery(""); setSearch(""); setAction("all"); setEntityType("all");
    setOutcome("all"); setPeriod("all"); setCustomStart(""); setCustomEnd(""); setPage(1);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadAuditLogsCsv(filters);
      toast.success("Audit logs exported successfully");
    } catch {
      toast.error("Failed to export audit logs");
    } finally {
      setExporting(false);
    }
  };

  const toggle = (id: string) => setExpandedId((current) => (current === id ? null : id));

  return (
    <TooltipProvider delay={200}>
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            Audit logs
            <HelpTip content={AUDIT_LOGS_PAGE_TIP} label="About audit logs" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Immutable record of platform actions</p>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && (
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium tabular-nums">
              {total} {total === 1 ? "record" : "records"}
            </Badge>
          )}
          <Button variant="outline" className="h-11 gap-1.5 sm:h-9" onClick={exportCsv} disabled={exporting || total === 0}>
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
          <HelpTip content={AUDIT_LOGS_EXPORT_TIP} label="About CSV export" />
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-4" aria-label="Audit log filters">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold">Filters</h2>
          <HelpTip content={AUDIT_LOGS_FILTERS_TIP} label="About audit log filters" />
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input className="h-10 pl-9 pr-10" placeholder="Search actor or resource" aria-label="Search audit logs" value={query} onChange={(e) => setQuery(e.target.value)} />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <Filter value={action} setValue={(value) => { setAction(value); setPage(1); }} name="action" options={ACTIONS} tip={AUDIT_LOGS_ACTION_TIP} />
          <Filter value={entityType} setValue={(value) => { setEntityType(value); setPage(1); }} name="entity" options={ENTITIES} />
          <Filter value={outcome} setValue={(value) => { setOutcome(value); setPage(1); }} name="outcome" options={["success", "failure"]} tip={AUDIT_LOGS_OUTCOME_TIP} />
          <div className="flex items-center gap-1">
            <Select value={period} onValueChange={(v) => { if (v) { setPeriod(v); setPage(1); } }}>
              <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Filter by period">
                <SelectValue>{(v: string) => PERIODS.find((p) => p.key === v)?.label ?? "All time"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <HelpTip content={AUDIT_LOGS_PERIOD_TIP} label="About date filters" />
          </div>
          {period === "custom" && (
            <>
              <Input type="date" aria-label="From date" className="h-10 sm:w-40" value={customStart} onChange={(e) => { setCustomStart(e.target.value); setPage(1); }} />
              <Input type="date" aria-label="To date" className="h-10 sm:w-40" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); setPage(1); }} />
            </>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
          <div>{activeCount > 0 && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="size-4" />Clear all ({activeCount})</Button>}</div>
          <div className="flex items-center gap-2" aria-live="polite">
            {(searchPending || (isFetching && !isLoading)) && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            <span>
              {searchPending ? "Searching" : isFetching && !isLoading ? "Updating" : "Found"}{" "}
              <strong className="text-foreground tabular-nums">{total}</strong> {total === 1 ? "record" : "records"}
            </span>
          </div>
        </div>
      </section>

      <div aria-busy={isLoading || isFetching || searchPending} className="space-y-4">
        {isLoading ? (
          <>
            <div className="hidden overflow-hidden rounded-2xl border bg-card xl:block">
              <table className="w-full text-sm">
                <tbody>{Array.from({ length: 6 }, (_, index) => <TableRowSkeleton key={index} cols={6} />)}</tbody>
              </table>
            </div>
            <div className="grid gap-3 xl:hidden">
              {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-52 rounded-xl" />)}
            </div>
          </>
        ) : isError ? (
          <div className="rounded-2xl border bg-card p-8 text-center">
            <AlertCircle className="mx-auto size-8 text-destructive" />
            <h2 className="mt-3 font-semibold">Could not load audit logs</h2>
            <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}><RotateCcw className="size-4" />Try again</Button>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border bg-card">
            <EmptyState
              icon={Search}
              title={activeCount ? "No matching audit records" : "No audit records yet"}
              description={activeCount ? "Try changing or clearing the active filters." : "Platform activity will appear here when it is recorded."}
              action={activeCount ? { label: "Clear filters", onClick: clearFilters } : undefined}
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-2xl border bg-card xl:block">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="h-11 border-b bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="w-14 px-4 font-semibold">
                      <HelpTip content={AUDIT_LOGS_EXPAND_TIP} label="About expanded record details" />
                    </th>
                    <th className="px-4 font-semibold">Timestamp</th>
                    <th className="px-4 font-semibold">Actor</th>
                    <th className="px-4 font-semibold">Action</th>
                    <th className="px-4 font-semibold">Entity / description</th>
                    <th className="px-4 font-semibold">IP address</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <Fragment key={entry.id}>
                      <tr className={cn("border-b transition-colors last:border-0 hover:bg-muted/30", (!entry.success || RISK.includes(entry.action)) && "bg-destructive/5")}>
                        <td className="px-2 py-3.5">
                          <Button variant="ghost" size="icon" aria-expanded={expandedId === entry.id} aria-label={`${expandedId === entry.id ? "Collapse" : "Expand"} audit record`} onClick={() => toggle(entry.id)}>
                            {expandedId === entry.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                          </Button>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 font-mono">{formatDateTime(entry.created_at)}</td>
                        <td className="max-w-56 px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <UserRound className="size-3.5 text-primary" aria-hidden="true" />
                            </div>
                            <span className="line-clamp-1 break-all">{entry.user_email || entry.user_id || "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><ActionBadge entry={entry} /></td>
                        <td className="max-w-xs px-4 py-3.5">
                          <p className="line-clamp-2">{entry.description || `${entry.entity_type}${entry.entity_id ? `/${entry.entity_id}` : ""}`}</p>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-muted-foreground">{entry.ip_address || "—"}</td>
                      </tr>
                      {expandedId === entry.id && (
                        <tr className="border-b bg-muted/20">
                          <td colSpan={6} className="px-4 py-4"><Details entry={entry} /></td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 xl:hidden">
              {entries.map((entry) => (
                <article key={entry.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <UserRound className="size-5 text-primary" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm font-semibold leading-5">{entry.user_email || entry.user_id || "Unknown actor"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>
                    </div>
                    <ActionBadge entry={entry} />
                  </div>
                  <div className="mt-3 border-y py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label(entry.entity_type)}</p>
                    <p className="mt-1 text-sm">{entry.description || entry.entity_id || "No description"}</p>
                    <p className="mt-2 text-xs text-muted-foreground">IP {entry.ip_address || "—"}</p>
                  </div>
                  <Button variant="ghost" className="mt-2 h-11 w-full justify-between" aria-expanded={expandedId === entry.id} onClick={() => toggle(entry.id)}>
                    <span className="inline-flex items-center gap-1.5">
                      Record details
                      <HelpTip content={AUDIT_LOGS_EXPAND_TIP} label="About expanded record details" />
                    </span>
                    {expandedId === entry.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </Button>
                  {expandedId === entry.id && <div className="border-t pt-3"><Details entry={entry} /></div>}
                </article>
              ))}
            </div>
          </>
        )}

        {!isLoading && entries.length > 0 && (
          <Pagination
            page={page}
            totalPages={Math.max(1, totalPages)}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            className="rounded-xl border bg-card px-4 py-3"
          />
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}

function Filter({ value, setValue, name, options, tip }: { value: string; setValue: (value: string) => void; name: string; options: string[]; tip?: string }) {
  const allLabel = `All ${name === "entity" ? "entities" : `${name}s`}`;
  return (
    <div className="flex items-center gap-1">
      <Select value={value} onValueChange={(next) => { if (next) setValue(next); }}>
        <SelectTrigger className="h-10 w-full sm:w-44" aria-label={`Filter by ${name}`}>
          <SelectValue>{(v: string) => (v === "all" ? allLabel : label(v))}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((option) => <SelectItem key={option} value={option} className="capitalize">{label(option)}</SelectItem>)}
        </SelectContent>
      </Select>
      {tip ? <HelpTip content={tip} label={`About ${name} filter`} /> : null}
    </div>
  );
}
