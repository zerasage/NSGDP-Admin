"use client";

import {
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  Database,
  HardDrive,
  Loader2,
  Server,
  Cog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  DataTableShell,
  MetricCard,
  Panel,
} from "@/components/admin/admin-analytics-ui";
import { HelpTip } from "@/components/admin/help-tip";
import {
  SYSTEM_HEALTH_DEPENDENCIES_TIP,
  SYSTEM_HEALTH_QUEUE_TIPS,
} from "@/lib/constants/system-health-tooltips";
import type { QueuesHealth } from "@/lib/api/ingestion-ops";
import type { DependencyHealth, SystemHealthSnapshot } from "@/lib/api/system-health";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

const DEPENDENCY_ICONS = {
  api: Server,
  postgres: Database,
  redis: Activity,
  object_storage: HardDrive,
  workers: Cog,
} as const;

function toneForStatus(status: DependencyHealth["status"] | QueuesHealth["status"]) {
  if (status === "healthy") return "success" as const;
  if (status === "degraded") return "warning" as const;
  return "destructive" as const;
}

function statusLabel(status: DependencyHealth["status"] | QueuesHealth["status"]) {
  if (status === "healthy") return "Healthy";
  if (status === "degraded") return "Degraded";
  return "Unavailable";
}

export function SystemDependenciesPanel({
  snapshot,
  isLoading,
}: {
  snapshot?: SystemHealthSnapshot;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!snapshot) {
    return <EmptyState title="Could not load dependency health" />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricCard
          label="Overall status"
          value={statusLabel(snapshot.status)}
          hint={`${snapshot.environment} · ${formatDate(snapshot.checkedAt)}`}
          tip={SYSTEM_HEALTH_DEPENDENCIES_TIP}
          icon={CheckCircle2}
          tone={toneForStatus(snapshot.status)}
        />
        {snapshot.dependencies.map((dep) => {
          const Icon = DEPENDENCY_ICONS[dep.id];
          return (
            <MetricCard
              key={dep.id}
              label={dep.label}
              value={statusLabel(dep.status)}
              hint={
                dep.latencyMs != null
                  ? `${dep.latencyMs}ms`
                  : dep.detail ?? "No latency sample"
              }
              tip={dep.detail ?? undefined}
              icon={Icon}
              tone={toneForStatus(dep.status)}
            />
          );
        })}
      </div>

      {snapshot.warnings.length > 0 && (
        <div className="rounded-2xl border border-warning/30 bg-warning/[0.08] p-4 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-warning" />
            <ul className="space-y-1">
              {snapshot.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function QueueHealthPanel({
  data,
  isLoading,
}: {
  data?: QueuesHealth;
  isLoading: boolean;
}) {
  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!data) return <EmptyState title="No queue health data available" />;

  const totalWaiting = data.queues.reduce((s, q) => s + q.waiting, 0);
  const totalActive = data.queues.reduce((s, q) => s + q.active, 0);
  const totalFailed = data.queues.reduce((s, q) => s + q.failed, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Queue status"
          value={data.status === "healthy" ? "Healthy" : "Degraded"}
          hint={`Checked ${formatDate(data.checkedAt)}`}
          tip={SYSTEM_HEALTH_QUEUE_TIPS.overview}
          icon={CheckCircle2}
          tone={data.status === "healthy" ? "success" : "warning"}
        />
        <MetricCard
          label="Waiting jobs"
          value={totalWaiting}
          tip={SYSTEM_HEALTH_QUEUE_TIPS.waiting}
          icon={Clock}
          tone="warning"
        />
        <MetricCard
          label="Failed jobs"
          value={totalFailed}
          tip={SYSTEM_HEALTH_QUEUE_TIPS.failed}
          icon={AlertTriangle}
          tone="destructive"
        />
      </div>

      <Panel
        title="Queue breakdown"
        titleTip={SYSTEM_HEALTH_QUEUE_TIPS.overview}
        description={`${totalActive} job(s) active across ${data.queues.length} queue(s). Dead letter: ${data.deadLetterCount}.`}
        icon={Activity}
        tone="success"
      >
        <DataTableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue</TableHead>
                <TableHead className="text-right">Waiting</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">Oldest waiting</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.queues.map((q) => (
                <TableRow key={q.queue}>
                  <TableCell className="font-medium">{q.queue}</TableCell>
                  <TableCell className="text-right tabular-nums">{q.waiting}</TableCell>
                  <TableCell className="text-right tabular-nums">{q.active}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      q.failed > 0 && "font-semibold text-destructive",
                    )}
                  >
                    {q.failed}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {q.oldestWaitingAgeMs != null
                      ? `${Math.round(q.oldestWaitingAgeMs / 1000)}s`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {q.paused ? (
                      <Badge
                        variant="outline"
                        className="border-warning/30 bg-warning/10 text-amber-700 dark:text-warning"
                      >
                        Paused
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-success/30 bg-success/10 text-success"
                      >
                        Running
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableShell>
      </Panel>
    </div>
  );
}

export function SystemHealthRefreshing({ refreshing }: { refreshing: boolean }) {
  if (!refreshing) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      Refreshing
    </span>
  );
}
