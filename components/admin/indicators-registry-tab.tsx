"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleSlash, Network, Plus, Tags } from "lucide-react";
import {
  useIndicators,
  useCreateIndicator,
  useUpdateIndicator,
} from "@/lib/hooks/useIndicators";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { IndicatorForm } from "@/components/admin/indicator-form";
import { DataTableShell, MetricCard, Panel } from "@/components/admin/admin-analytics-ui";
import { toast } from "sonner";

export function IndicatorsRegistryTab() {
  const { data: indicators, isLoading } = useIndicators();
  const createMutation = useCreateIndicator();
  const updateMutation = useUpdateIndicator();

  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!indicators) return [];
    const q = search.trim().toLowerCase();
    if (!q) return indicators;
    return indicators.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category?.toLowerCase().includes(q) ||
        i.slug.toLowerCase().includes(q)
    );
  }, [indicators, search]);

  const activeCount = indicators?.filter((i) => i.is_active).length ?? 0;
  const inactiveCount = (indicators?.length ?? 0) - activeCount;

  const handleActivate = (id: string, isActive: boolean) => {
    updateMutation.mutate(
      { id, payload: { isActive: !isActive } },
      {
        onSuccess: () =>
          toast.success(isActive ? "Indicator deactivated" : "Indicator activated"),
        onError: (error: unknown) =>
          toast.error(error instanceof Error ? error.message : "Failed to update indicator"),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Total indicators"
          value={indicators?.length ?? "—"}
          icon={Network}
          tone="success"
        />
        <MetricCard label="Active" value={activeCount} icon={CheckCircle2} tone="primary" />
        <MetricCard label="Inactive" value={inactiveCount} icon={CircleSlash} tone="muted" />
      </div>

      <Panel
        title="Indicator registry"
        description="Canonical registry every uploaded workbook resolves against. New indicators proposed during ingestion start inactive until activated here."
        icon={Tags}
        tone="success"
        action={
          <Button className="h-9" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create Indicator
          </Button>
        }
      >
        <div className="mb-4 max-w-xs">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category, or slug..."
            className="h-9"
          />
        </div>

        {createOpen && (
          <div className="mb-4">
            <IndicatorForm
              onCancel={() => setCreateOpen(false)}
              isSaving={createMutation.isPending}
              onSave={(payload) => {
                createMutation.mutate(payload, {
                  onSuccess: () => {
                    toast.success(`Indicator "${payload.name}" created`);
                    setCreateOpen(false);
                  },
                  onError: (error: unknown) =>
                    toast.error(error instanceof Error ? error.message : "Failed to create indicator"),
                });
              }}
            />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? "No indicators match your search" : "No indicators yet"}
            description={
              search
                ? undefined
                : "Create the first indicator, or wait for one to be proposed during ingestion."
            }
          />
        ) : (
          <DataTableShell>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Revisions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((indicator) => (
                  <TableRow key={indicator.id}>
                    <TableCell className="font-medium">
                      <Link href={`/indicators/${indicator.id}`} className="hover:underline">
                        {indicator.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {indicator.category ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {indicator.unit ?? "—"}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {indicator.revisionCount}
                    </TableCell>
                    <TableCell>
                      {indicator.is_active ? (
                        <Badge className="gap-1 border-success/30 bg-success/10 text-success">
                          <CheckCircle2 className="size-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <CircleSlash className="size-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivate(indicator.id, indicator.is_active)}
                        disabled={updateMutation.isPending}
                      >
                        {indicator.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableShell>
        )}
      </Panel>
    </div>
  );
}
