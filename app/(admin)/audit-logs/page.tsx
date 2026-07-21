"use client";

import { useState, useMemo } from "react";
import { Download, Search, AlertTriangle, CheckCircle2 } from "lucide-react";
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

const ENTITY_TYPES = ["dataset", "user", "organisation"];

const RISK_ACTIONS: string[] = ["delete", "reject"];
const SUCCESS_ACTIONS: string[] = ["approve", "create"];

function ActionBadge({ action }: { action: string }) {
  const isRisk = RISK_ACTIONS.includes(action);
  const isSuccess = SUCCESS_ACTIONS.includes(action);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isRisk    && "bg-destructive/10 text-destructive",
        isSuccess && statusPill.emerald,
        !isRisk && !isSuccess && "bg-muted text-muted-foreground"
      )}
    >
      {isRisk    && <AlertTriangle className="size-2.5" />}
      {isSuccess && <CheckCircle2 className="size-2.5" />}
      {action.replace(/_/g, " ")}
    </span>
  );
}

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [action, setAction] = useState<string>("all");
  const [entityType, setEntityType] = useState<string>("all");
  const [query, setQuery] = useState("");

  // Fetch audit logs with filters
  const params = useMemo(() => ({
    page,
    limit: pageSize,
    action: action !== "all" ? action : undefined,
    entityType: entityType !== "all" ? entityType : undefined,
    search: query || undefined,
  }), [page, pageSize, action, entityType, query]);

  const { data, isLoading } = useAuditLogs(params);

  const entries = data?.data || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleExport = async () => {
    try {
      await downloadAuditLogsCsv({
        action: action !== "all" ? action : undefined,
        entityType: entityType !== "all" ? entityType : undefined,
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
              <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Resource / Detail</th>
              <th className="px-4 py-3 font-medium">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? [...Array(5)].map((_, i) => <TableRowSkeleton key={i} cols={5} />)
              : entries.map((e: AuditLog) => (
                  <tr
                    key={e.id}
                    className={cn(
                      "border-b font-mono text-xs",
                      RISK_ACTIONS.includes(e.action) && "bg-destructive/5"
                    )}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{e.user_email || e.user_id || "—"}</td>
                    <td className="px-4 py-3"><ActionBadge action={e.action} /></td>
                    <td className="px-4 py-3 max-w-xs truncate font-sans" title={e.description ?? undefined}>
                      {e.description || `${e.entity_type}${e.entity_id ? `/${e.entity_id}` : ""}`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{e.ip_address || "—"}</td>
                  </tr>
                ))}
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
