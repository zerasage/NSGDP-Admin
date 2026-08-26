"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, History, Lock, Pencil, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  useIndicators,
  useUpdateIndicator,
  useIndicatorRevisions,
} from "@/lib/hooks/useIndicators";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { IndicatorForm } from "@/components/admin/indicator-form";
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";

export default function IndicatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canManage = user?.role === "super_admin" || hasPermission("manage:indicators");

  const { data: indicators, isLoading } = useIndicators();
  const { data: revisions } = useIndicatorRevisions(id);
  const updateMutation = useUpdateIndicator();
  const [editing, setEditing] = useState(false);

  if (!canManage) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No access"
        description="You don't have permission to manage indicators."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  const indicator = indicators?.find((i) => i.id === id);

  if (!indicator) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/ingestion-ops?tab=indicators")}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <EmptyState
          icon={Lock}
          title="Indicator not found"
          description="It may have been removed, or the link is incorrect."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-3 gap-1.5" onClick={() => router.push("/ingestion-ops?tab=indicators")}>
          <ArrowLeft className="size-4" />
          Indicators
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{indicator.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{indicator.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            {indicator.is_active ? (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
            )}
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {editing ? (
        <IndicatorForm
          initial={indicator}
          isSaving={updateMutation.isPending}
          onCancel={() => setEditing(false)}
          onSave={(payload) => {
            updateMutation.mutate(
              { id, payload },
              {
                onSuccess: () => {
                  toast.success("Indicator updated");
                  setEditing(false);
                },
                onError: (error: unknown) =>
                  toast.error(error instanceof Error ? error.message : "Failed to update indicator"),
              }
            );
          }}
        />
      ) : (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              {[
                ["Category", indicator.category ?? "Not set"],
                ["Unit", indicator.unit ?? "Not set"],
                ["Description", indicator.description ?? "Not set"],
                ["Canonical source", indicator.canonical_source ?? "Not set"],
                ["Created", formatDate(indicator.created_at)],
                ["Last updated", formatDate(indicator.updated_at)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                  <dd className="max-w-md text-right text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            Revision History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!revisions || revisions.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No revisions recorded yet.</p>
          ) : (
            <ul className="divide-y">
              {revisions.map((rev) => (
                <li key={rev.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {rev.field_changed === "created" ? "Created" : `Changed ${rev.field_changed}`}
                    </p>
                    {rev.field_changed !== "created" && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {rev.old_value ?? "(empty)"} → {rev.new_value ?? "(empty)"}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(rev.changed_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
