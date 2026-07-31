"use client";

import { Fragment, useState, useMemo } from "react";
import {
  Download,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAuditLogs, downloadAuditLogsCsv } from "@/lib/hooks/useAuditLogs";
import type { AuditLog } from "@/lib/api/admin";
import { Pagination } from "@/components/data/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableRowSkeleton } from "@/components/feedback/skeletons";
import { statusPill } from "@/lib/constants/status-surfaces";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/date";
import { toast } from "sonner";

const ACTION_GROUPS: Array<{ label: string; actions: Array<{ value: string; label: string }> }> = [
  {
    label: "Data Actions",
    actions: [
      { value: "upload", label: "Upload" },
      { value: "download", label: "Download" },
      { value: "export", label: "Export" },
    ],
  },
  {
    label: "Approval Actions",
    actions: [
      { value: "approve", label: "Approve" },
      { value: "reject", label: "Reject" },
    ],
  },
  {
    label: "Record Actions",
    actions: [
      { value: "create", label: "Create" },
      { value: "update", label: "Update" },
      { value: "delete", label: "Delete" },
    ],
  },
  {
    label: "Access",
    actions: [
      { value: "login", label: "Login" },
      { value: "logout", label: "Logout" },
    ],
  },
];

const ENTITY_TYPES = [
  "dataset",
  "user",
  "organisation",
  "access_request",
  "organisation_invite",
  "staff_invite",
  "permission_group",
  "auth",
];

const PERIOD_PRESETS: Array<{ key: string; label: string; days: number | null }> = [
  { key: "all", label: "All time", days: null },
  { key: "today", label: "Today", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "custom", label: "Custom range", days: null },
];

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const RISK_ACTIONS: string[] = ["delete", "reject"];
const SUCCESS_ACTIONS: string[] = ["approve", "create"];

function ActionBadge({ action, success }: { action: string; success: boolean }) {
  const isRisk = RISK_ACTIONS.includes(action);
  const isSuccess = SUCCESS_ACTIONS.includes(action);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        !success   && "bg-destructive/10 text-destructive",
        success && isRisk    && "bg-destructive/10 text-destructive",
        success && isSuccess && statusPill.emerald,
        success && !isRisk && !isSuccess && "bg-muted text-muted-foreground"
      )}
    >
      {!success && <XCircle className="size-2.5" />}
      {success && isRisk    && <AlertTriangle className="size-2.5" />}
      {success && isSuccess && <CheckCircle2 className="size-2.5" />}
      {action.replace(/_/g, " ")}
    </span>
  );
}

function ValueDiff({ label, values }: { label: string; values: Record<string, unknown> | null }) {
  if (!values || Object.keys(values).length === 0) return null;
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground mb-1">{label}</div>
      <pre className="rounded-md bg-muted/50 p-2 text-xs overflow-x-auto whitespace-pre-wrap break-all">
        {JSON.stringify(values, null, 2)}
      </pre>
    </div>
  );
}

function AuditLogDetailRow({ entry }: { entry: AuditLog }) {
  const hasDiff = entry.old_values || entry.new_values;
  return (
    <tr className="border-b bg-muted/20 font-sans text-xs">
      <td colSpan={6} className="px-4 py-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">User agent</div>
            <div className="break-all">{entry.user_agent || "—"}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">Permission group</div>
            <div className="break-all">{entry.permission_group_id || "—"}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1">Entity</div>
            <div className="break-all">
              {entry.entity_type}
              {entry.entity_id ? `/${entry.entity_id}` : ""}
            </div>
          </div>
          {!entry.success && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">Failure reason</div>
              <div className="break-all text-destructive">{entry.failure_reason || "—"}</div>
            </div>
          )}
        </div>
        {hasDiff && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ValueDiff label="Before" values={entry.old_values} />
            <ValueDiff label="After" values={entry.new_values} />
          </div>
        )}
        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
          <div className="mt-3">
            <ValueDiff label="Metadata" values={entry.metadata} />
          </div>
        )}
      </td>
    </tr>
  );
}

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [action, setAction] = useState<string>("all");
  const [entityType, setEntityType] = useState<string>("all");
  const [outcome, setOutcome] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<string>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Resolve the selected time period into concrete dates — shared by both
  // the list view and CSV export so they never see different date ranges.
  const { startDate, endDate } = useMemo(() => {
    if (period === "custom") {
      return { startDate: customStart || undefined, endDate: customEnd || undefined };
    }
    const preset = PERIOD_PRESETS.find((p) => p.key === period);
    if (!preset?.days) return { startDate: undefined, endDate: undefined };

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (preset.days - 1));
    return { startDate: toIsoDate(start), endDate: toIsoDate(end) };
  }, [period, customStart, customEnd]);

  // Fetch audit logs with filters
  const params = useMemo(() => ({
    page,
    limit: pageSize,
    action: action !== "all" ? action : undefined,
    entityType: entityType !== "all" ? entityType : undefined,
    search: query || undefined,
    startDate,
    endDate,
    success: outcome === "all" ? undefined : outcome === "success",
  }), [page, pageSize, action, entityType, query, startDate, endDate, outcome]);

  const { data, isLoading } = useAuditLogs(params);

  const entries = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = data?.meta?.totalPages || 1;

  const handleExport = async () => {
    try {
      await downloadAuditLogsCsv({
        action: action !== "all" ? action : undefined,
        entityType: entityType !== "all" ? entityType : undefined,
        search: query || undefined,
        startDate,
        endDate,
        success: outcome === "all" ? undefined : outcome === "success",
      });
      toast.success("Audit logs exported successfully");
    } catch (error) {
      toast.error("Failed to export audit logs");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground mt-1">Immutable record of all platform actions</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search user or resource…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={action} onValueChange={(v) => { if (v) { setAction(v); setPage(1); } }}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Action type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            {ACTION_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group.label}</div>
                {group.actions.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        <Select value={entityType} onValueChange={(v) => { if (v) { setEntityType(v); setPage(1); } }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Entity type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {ENTITY_TYPES.map((type) => (
              <SelectItem key={type} value={type} className="capitalize">
                {type.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={outcome} onValueChange={(v) => { if (v) { setOutcome(v); setPage(1); } }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Outcome" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failure">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={(v) => { if (v) { setPeriod(v); setPage(1); } }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Time period" /></SelectTrigger>
          <SelectContent>
            {PERIOD_PRESETS.map((p) => (
              <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {period === "custom" && (
          <>
            <Input
              type="date"
              aria-label="From date"
              value={customStart}
              onChange={(e) => { setCustomStart(e.target.value); setPage(1); }}
              className="w-40"
            />
            <Input
              type="date"
              aria-label="To date"
              value={customEnd}
              onChange={(e) => { setCustomEnd(e.target.value); setPage(1); }}
              className="w-40"
            />
          </>
        )}
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium w-8" />
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Resource / Detail</th>
              <th className="px-4 py-3 font-medium">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              : entries.map((e: AuditLog) => {
                  const isExpanded = expandedId === e.id;
                  return (
                    <Fragment key={e.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : e.id)}
                        className={cn(
                          "border-b font-mono text-xs cursor-pointer hover:bg-muted/30",
                          e.success === false && "bg-destructive/5",
                          e.success !== false && RISK_ACTIONS.includes(e.action) && "bg-destructive/5"
                        )}
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(e.created_at)}</td>
                        <td className="px-4 py-3">{e.user_email || e.user_id || "—"}</td>
                        <td className="px-4 py-3"><ActionBadge action={e.action} success={e.success !== false} /></td>
                        <td className="px-4 py-3 max-w-xs truncate font-sans" title={e.description ?? undefined}>
                          {e.description || `${e.entity_type}${e.entity_id ? `/${e.entity_id}` : ""}`}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{e.ip_address || "—"}</td>
                      </tr>
                      {isExpanded && <AuditLogDetailRow entry={e} />}
                    </Fragment>
                  );
                })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={Math.max(1, totalPages)}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
      />
    </div>
  );
}
