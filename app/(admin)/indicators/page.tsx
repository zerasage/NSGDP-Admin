"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleSlash, Plus, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  useIndicators,
  useCreateIndicator,
  useUpdateIndicator,
} from "@/lib/hooks/useIndicators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";

export default function IndicatorsPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canManage = user?.role === "super_admin" || hasPermission("manage:indicators");

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

  if (!canManage) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No access"
        description="You don't have permission to manage indicators."
      />
    );
  }

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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Indicators</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The canonical registry every uploaded dataset resolves against. New indicators
            proposed during ingestion start inactive until confirmed here.
          </p>
        </div>
        <Button className="h-11 w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Create Indicator
        </Button>
      </div>

      {createOpen && (
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
      )}

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Registry</CardTitle>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, category, or slug..."
              className="h-9 max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={search ? "No indicators match your search" : "No indicators yet"}
              description={search ? undefined : "Create the first indicator, or wait for one to be proposed during ingestion."}
            />
          ) : (
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
                    <TableCell className="text-muted-foreground">{indicator.category ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{indicator.unit ?? "—"}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{indicator.revisionCount}</TableCell>
                    <TableCell>
                      {indicator.is_active ? (
                        <Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
