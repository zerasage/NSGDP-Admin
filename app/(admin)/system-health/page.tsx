"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  HeartPulse,
  Lock,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/feedback/empty-state";
import { HelpTip } from "@/components/admin/help-tip";
import {
  DeadLetterPanel,
} from "@/components/admin/dead-letter-panel";
import {
  QueueHealthPanel,
  SystemDependenciesPanel,
  SystemHealthRefreshing,
} from "@/components/admin/system-health-panels";
import { useSystemHealth } from "@/lib/hooks/useSystemHealth";
import {
  SYSTEM_HEALTH_PAGE_TIP,
  SYSTEM_HEALTH_WORKER_TIP,
} from "@/lib/constants/system-health-tooltips";

type HealthTab = "overview" | "queues" | "dead-letter";

function parseTab(value: string | null): HealthTab {
  if (value === "queues" || value === "dead-letter") return value;
  return "overview";
}

export default function SystemHealthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const tab = parseTab(searchParams.get("tab"));

  const { data, isLoading, isFetching, isError, refetch } = useSystemHealth({
    enabled: isSuperAdmin,
    refetchInterval: 30_000,
  });

  const setTab = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "overview") params.delete("tab");
    else params.set("tab", value);
    const qs = params.toString();
    router.replace(qs ? `/system-health?${qs}` : "/system-health");
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Super admin only"
          description="System health monitoring is restricted to super_admin accounts."
        />
      </div>
    );
  }

  return (
    <TooltipProvider delay={200}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              System Health
              <HelpTip content={SYSTEM_HEALTH_PAGE_TIP} label="About system health" />
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Dependency probes, worker queue depths, and dead-letter recovery.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SystemHealthRefreshing refreshing={isFetching && !isLoading} />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Refresh
            </Button>
            <HelpTip content={SYSTEM_HEALTH_WORKER_TIP} label="About workers" />
          </div>
        </div>

        {isError ? (
          <div className="rounded-2xl border bg-card px-4 py-12 text-center">
            <EmptyState
              icon={AlertTriangle}
              title="Could not load system health"
              description="Check your connection and try again."
              action={{ label: "Retry", onClick: () => refetch() }}
            />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/40 p-1">
              <TabsTrigger value="overview" className="gap-1.5">
                <HeartPulse className="size-3.5" aria-hidden="true" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="queues" className="gap-1.5">
                <Activity className="size-3.5" aria-hidden="true" />
                Queues
                {data?.queues.deadLetterCount ? (
                  <span className="rounded-full bg-destructive/15 px-1.5 text-[10px] font-semibold tabular-nums text-destructive">
                    {data.queues.deadLetterCount}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="dead-letter" className="gap-1.5">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                Dead letter
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-0 space-y-6">
              <SystemDependenciesPanel snapshot={data} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="queues" className="mt-0">
              <QueueHealthPanel data={data?.queues} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="dead-letter" className="mt-0">
              <DeadLetterPanel />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </TooltipProvider>
  );
}
