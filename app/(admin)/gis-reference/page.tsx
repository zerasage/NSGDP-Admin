"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Layers,
  Loader2,
  Map,
  MapPin,
  Pencil,
  RotateCcw,
  ShieldAlert,
  Upload,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  useGisReferenceLayers,
  useRebuildCanonicalWards,
  useGisResolutionReport,
} from "@/lib/hooks/useGisReference";
import {
  GIS_REFERENCE_SLOTS,
  GIS_SLOT_LABELS,
  type GisReferenceLayer,
  type GisReferenceSlot,
} from "@/lib/api/gis-reference";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  DataTableShell,
  MetricCard,
  Panel,
  PanelIcon,
  METRIC_TONE,
  type MetricTone,
} from "@/components/admin/admin-analytics-ui";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SetGisLayerDialog } from "@/components/admin/set-gis-layer-dialog";
import { GisVariantDialog } from "@/components/admin/gis-variant-dialog";

const RECONCILABLE_SLOTS: GisReferenceSlot[] = [
  "ward_boundaries",
  "facility_registry",
  "settlements",
];

const SLOT_META: Record<
  GisReferenceSlot,
  { icon: LucideIcon; tone: MetricTone; description: string; formats: string }
> = {
  lga_boundaries: {
    icon: Map,
    tone: "primary",
    description: "State-wide LGA polygons for map outlines and lookups.",
    formats: "GeoJSON, Shapefile, GeoPackage",
  },
  ward_boundaries: {
    icon: MapPin,
    tone: "info",
    description: "Ward polygons — source for the canonical ward gazetteer.",
    formats: "GeoJSON, Shapefile, GeoPackage",
  },
  facility_registry: {
    icon: Building2,
    tone: "success",
    description: "Health facility points used for map overlays and analytics.",
    formats: "CSV, Excel, GeoJSON",
  },
  population: {
    icon: Users,
    tone: "warning",
    description: "LGA-level population estimates for incidence denominators.",
    formats: "CSV, Excel",
  },
  settlements: {
    icon: Layers,
    tone: "muted",
    description: "Settlement / MLoS layer for fine-grained place names.",
    formats: "GeoJSON, CSV",
  },
};

function ActiveLayersList({
  layers,
  isLoading,
  onEdit,
}: {
  layers: GisReferenceLayer[] | undefined;
  isLoading: boolean;
  onEdit: (slot: GisReferenceSlot) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {GIS_REFERENCE_SLOTS.map((slot) => (
          <Skeleton key={slot} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Layer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active dataset</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {GIS_REFERENCE_SLOTS.map((slot) => {
              const layer = layers?.find((l) => l.slot === slot);
              const meta = SLOT_META[slot];
              const configured = Boolean(layer?.datasetId);

              return (
                <TableRow
                  key={slot}
                  className={cn(!configured && "bg-warning/[0.04]")}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <PanelIcon icon={meta.icon} tone={meta.tone} />
                      <div className="min-w-0">
                        <p className="font-medium">{GIS_SLOT_LABELS[slot]}</p>
                        <p className="text-xs text-muted-foreground">{meta.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {configured ? (
                      <Badge className="border-success/30 bg-success/10 text-success">Active</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 border-warning/30 text-amber-700 dark:text-warning"
                      >
                        <AlertTriangle className="size-3" />
                        Unset
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    {configured && layer?.datasetName ? (
                      <div>
                        {layer.datasetSlug ? (
                          <Link
                            href={`/datasets/${layer.datasetSlug}`}
                            className="font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {layer.datasetName}
                          </Link>
                        ) : (
                          <span className="font-medium">{layer.datasetName}</span>
                        )}
                        {layer.datasetSlug ? (
                          <p className="text-xs text-muted-foreground">{layer.datasetSlug}</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Expects {meta.formats}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {layer?.updatedAt ? formatDate(layer.updatedAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant={configured ? "outline" : "default"}
                        onClick={() => onEdit(slot)}
                      >
                        <Pencil className="size-3.5" />
                        {configured ? "Change" : "Assign"}
                      </Button>
                      {!configured ? (
                        <Link
                          href="/upload"
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                        >
                          <Upload className="size-3.5 shrink-0" aria-hidden />
                          Upload
                        </Link>
                      ) : layer?.datasetSlug ? (
                        <Link
                          href={`/datasets/${layer.datasetSlug}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
                        >
                          <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                          View
                        </Link>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </DataTableShell>
      </div>

      <div className="divide-y rounded-xl border md:hidden">
        {GIS_REFERENCE_SLOTS.map((slot) => {
          const layer = layers?.find((l) => l.slot === slot);
          const meta = SLOT_META[slot];
          const configured = Boolean(layer?.datasetId);
          const tone = METRIC_TONE[meta.tone];

          return (
            <div
              key={slot}
              className={cn("space-y-3 p-4", !configured && tone.card)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <PanelIcon icon={meta.icon} tone={meta.tone} />
                  <div className="min-w-0">
                    <p className="font-medium">{GIS_SLOT_LABELS[slot]}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>
                  </div>
                </div>
                {configured ? (
                  <Badge className="shrink-0 border-success/30 bg-success/10 text-success">
                    Active
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="shrink-0 gap-1 border-warning/30 text-amber-700 dark:text-warning"
                  >
                    <AlertTriangle className="size-3" />
                    Unset
                  </Badge>
                )}
              </div>

              <div className="text-sm">
                {configured && layer?.datasetName ? (
                  layer.datasetSlug ? (
                    <Link
                      href={`/datasets/${layer.datasetSlug}`}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {layer.datasetName}
                    </Link>
                  ) : (
                    <span className="font-medium">{layer.datasetName}</span>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No dataset — upload {meta.formats} first
                  </span>
                )}
                {layer?.updatedAt ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Updated {formatDate(layer.updatedAt)}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={configured ? "outline" : "default"}
                  onClick={() => onEdit(slot)}
                >
                  <Pencil className="size-3.5" />
                  {configured ? "Change" : "Assign"}
                </Button>
                {!configured && (
                  <Link
                    href="/upload"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                  >
                    <Upload className="size-3.5 shrink-0" aria-hidden />
                    Upload
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function GisReferenceLayersPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canManage = user?.role === "super_admin" || hasPermission("manage:gis-reference-data");

  const { data: layers, isLoading } = useGisReferenceLayers();
  const rebuildMutation = useRebuildCanonicalWards();

  const [editingSlot, setEditingSlot] = useState<GisReferenceSlot | null>(null);
  const [reportSlot, setReportSlot] = useState<GisReferenceSlot>("ward_boundaries");
  const [variantTarget, setVariantTarget] = useState<{ lga: string; ward: string } | null>(null);

  const { data: report, isLoading: reportLoading } = useGisResolutionReport(reportSlot);

  if (!canManage) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="No access"
        description="You don't have permission to manage GIS reference layers."
      />
    );
  }

  const configuredCount = layers
    ? GIS_REFERENCE_SLOTS.filter((slot) =>
        layers.find((l) => l.slot === slot)?.datasetId
      ).length
    : 0;
  const unsetCount = GIS_REFERENCE_SLOTS.length - configuredCount;

  const handleRebuild = async () => {
    try {
      const result = await rebuildMutation.mutateAsync();
      toast.success(
        `Canonical wards rebuilt: ${result.created} created, ${result.updated} updated (${result.total} total)`
      );
    } catch {
      toast.error("Failed to rebuild canonical wards");
    }
  };

  const matchRate =
    report && report.totalPairs > 0
      ? `${Math.round((report.matched / report.totalPairs) * 100)}%`
      : report
        ? "100%"
        : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">GIS Reference Layers</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Assign published datasets to the five platform map slots, then reconcile raw
            LGA/ward spellings against the canonical gazetteer. Upload new files from{" "}
            <Link href="/upload" className="font-medium text-primary underline-offset-4 hover:underline">
              Upload dataset
            </Link>
            — this page only picks which dataset backs each layer.
          </p>
        </div>
        <Button
          variant="outline"
          className="shrink-0 gap-1.5"
          onClick={handleRebuild}
          disabled={rebuildMutation.isPending}
        >
          {rebuildMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
          Rebuild canonical wards
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Configured layers"
          value={`${configuredCount}/${GIS_REFERENCE_SLOTS.length}`}
          icon={CheckCircle2}
          tone="success"
        />
        <MetricCard
          label="Needs assignment"
          value={unsetCount}
          icon={AlertTriangle}
          tone={unsetCount > 0 ? "warning" : "muted"}
        />
        <MetricCard
          label="Unmatched spellings"
          value={reportLoading ? "…" : (report?.unmatched.length ?? "—")}
          hint={report ? GIS_SLOT_LABELS[reportSlot] : undefined}
          icon={MapPin}
          tone={
            report && report.unmatched.length > 0
              ? "destructive"
              : report
                ? "success"
                : "muted"
          }
        />
        <MetricCard
          label="Match rate"
          value={reportLoading ? "…" : matchRate}
          hint={report ? `${report.matched} of ${report.totalPairs} pairs` : undefined}
          icon={Layers}
          tone="info"
        />
      </div>

      <Panel
        title="Active map layers"
        description="Each slot reads from one dataset. Changing a source updates the public map after the gazetteer rebuild runs."
        icon={Map}
        tone="primary"
      >
        <ActiveLayersList
          layers={layers}
          isLoading={isLoading}
          onEdit={setEditingSlot}
        />
      </Panel>

      <Panel
        title="Name resolution report"
        description="Raw LGA/ward strings from the active layer that do not yet map to a canonical ward."
        icon={MapPin}
        tone="warning"
        action={
          <Select
            value={reportSlot}
            onValueChange={(v) => v && setReportSlot(v as GisReferenceSlot)}
          >
            <SelectTrigger className="h-9 w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECONCILABLE_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {GIS_SLOT_LABELS[slot]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        {reportLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : report ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Total pairs" value={report.totalPairs} tone="muted" />
              <MetricCard label="Matched" value={report.matched} icon={CheckCircle2} tone="success" />
              <MetricCard
                label="Unmatched"
                value={report.unmatched.length}
                icon={AlertTriangle}
                tone={report.unmatched.length > 0 ? "destructive" : "success"}
              />
            </div>

            {report.unmatched.length === 0 ? (
              <div className="rounded-xl border border-success/25 bg-success/[0.06] px-4 py-6 text-center text-sm text-muted-foreground">
                Every raw LGA/ward spelling in{" "}
                <span className="font-medium text-foreground">{GIS_SLOT_LABELS[reportSlot]}</span>{" "}
                resolves to a canonical ward.
              </div>
            ) : (
              <DataTableShell>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>LGA (raw)</TableHead>
                      <TableHead>Ward (raw)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.unmatched.map((pair) => (
                      <TableRow key={`${pair.lga}|${pair.ward}`}>
                        <TableCell>{pair.lga}</TableCell>
                        <TableCell>{pair.ward}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setVariantTarget(pair)}
                          >
                            Attach to ward
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DataTableShell>
            )}
          </div>
        ) : null}
      </Panel>

      {editingSlot && (
        <SetGisLayerDialog
          slot={editingSlot}
          currentLayer={layers?.find((l) => l.slot === editingSlot)}
          open={!!editingSlot}
          onClose={() => setEditingSlot(null)}
        />
      )}

      {variantTarget && (
        <GisVariantDialog
          lga={variantTarget.lga}
          ward={variantTarget.ward}
          open={!!variantTarget}
          onClose={() => setVariantTarget(null)}
        />
      )}
    </div>
  );
}
