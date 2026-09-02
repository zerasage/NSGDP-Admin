"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Layers,
  Loader2,
  Map as MapIcon,
  MapPin,
  Pencil,
  RotateCcw,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import {
  useGisReferenceLayers,
  useRebuildCanonicalWards,
  useGisResolutionReports,
} from "@/lib/hooks/useGisReference";
import {
  GIS_REFERENCE_SLOTS,
  GIS_RECONCILABLE_SLOTS,
  GIS_SLOT_LABELS,
  isGisReconcilableSlot,
  type GisReferenceLayer,
  type GisReferenceSlot,
  type GisReconcilableSlot,
  type GisResolutionReport,
} from "@/lib/api/gis-reference";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
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
  tabToneClass,
} from "@/components/admin/admin-analytics-ui";
import { HelpTip } from "@/components/admin/help-tip";
import {
  GIS_REFERENCE_CONFIRM_WARD_TIP,
  GIS_REFERENCE_COVERAGE_TIP,
  GIS_REFERENCE_LAYERS_PANEL_TIP,
  GIS_REFERENCE_PAGE_TIP,
  GIS_REFERENCE_REBUILD_TIP,
  GIS_REFERENCE_REPLACE_LAYER_TIP,
  GIS_REFERENCE_RESOLUTION_METRIC_TIPS,
  GIS_REFERENCE_RESOLUTION_PANEL_TIP,
  GIS_REFERENCE_RESOLUTION_TAB_TIPS,
  GIS_REFERENCE_REVIEW_QUEUE_TIP,
  GIS_REFERENCE_METRIC_TIPS,
  GIS_REFERENCE_UPLOAD_LAYER_TIP,
} from "@/lib/constants/gis-reference-tooltips";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  GisReferenceHelpDialog,
  GisReferenceHelpFab,
} from "@/components/admin/gis-reference-help-dialog";
import {
  AdminSectionTabsNav,
  AdminTabCount,
  ADMIN_TAB_TRIGGER_BASE,
} from "@/components/admin/admin-section-tabs-nav";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ReplaceGisLayerDialog } from "@/components/admin/replace-gis-layer-dialog";
import { GisWardConfirmDialog } from "@/components/admin/gis-ward-confirm-dialog";
import {
  GisGazetteerRebuildStatus,
  GIS_PENDING_REBUILD_KEY,
  type GisPendingRebuild,
} from "@/components/admin/gis-gazetteer-rebuild-banner";
import type { GisUploadResult } from "@/lib/api/gis-reference";

const RECONCILABLE_SLOT_META: Record<GisReconcilableSlot, { tone: MetricTone }> = {
  ward_boundaries: { tone: "info" },
  facility_registry: { tone: "success" },
  settlements: { tone: "muted" },
};

function pickReportSlot(
  configured: GisReconcilableSlot[],
  reports: Map<GisReferenceSlot, GisResolutionReport>,
  preferred?: GisReconcilableSlot | null,
): GisReconcilableSlot | null {
  if (configured.length === 0) return null;
  if (preferred && configured.includes(preferred)) return preferred;

  const withUnmatched = configured
    .filter((slot) => (reports.get(slot)?.unmatched.length ?? 0) > 0)
    .sort(
      (a, b) =>
        (reports.get(b)?.unmatched.length ?? 0) -
        (reports.get(a)?.unmatched.length ?? 0),
    );
  if (withUnmatched.length > 0) return withUnmatched[0];

  return configured[0];
}

function ResolutionReportBody({
  slot,
  report,
  onConfirm,
}: {
  slot: GisReferenceSlot;
  report: GisResolutionReport;
  onConfirm: (pair: { lga: string; ward: string }) => void;
}) {
  return (
    <div className="space-y-4">
      {report.belowCoverageThreshold ? (
        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/[0.06] px-4 py-3 text-sm text-amber-900 dark:text-warning">
          <p>
            Match rate {Math.round(report.matchRate * 100)}% is below the 95% threshold —{" "}
            {report.unmatched.length} spelling(s) still need review before this layer is fully fit
            for analytics.
            <HelpTip
              content={GIS_REFERENCE_COVERAGE_TIP}
              label="About coverage threshold"
              className="ml-1 inline-flex align-middle"
            />
          </p>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Total pairs"
          value={report.totalPairs}
          tone="muted"
          tip={GIS_REFERENCE_RESOLUTION_METRIC_TIPS.totalPairs}
        />
        <MetricCard
          label="Matched"
          value={report.matched}
          icon={CheckCircle2}
          tone="success"
          tip={GIS_REFERENCE_RESOLUTION_METRIC_TIPS.matched}
        />
        <MetricCard
          label="Unmatched"
          value={report.unmatched.length}
          icon={AlertTriangle}
          tone={report.unmatched.length > 0 ? "destructive" : "success"}
          tip={GIS_REFERENCE_RESOLUTION_METRIC_TIPS.unmatched}
        />
      </div>

      {report.unmatched.length === 0 ? (
        <div className="rounded-xl border border-success/25 bg-success/[0.06] px-4 py-6 text-center text-sm text-muted-foreground">
          Every raw LGA/ward spelling in{" "}
          <span className="font-medium text-foreground">{GIS_SLOT_LABELS[slot]}</span> resolves to
          a canonical ward.
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
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={() => onConfirm(pair)}>
                          Confirm ward
                        </Button>
                        <HelpTip content={GIS_REFERENCE_CONFIRM_WARD_TIP} label="About confirm ward" />
                      </div>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/ingestion-ops?orgunit=${encodeURIComponent(pair.ward)}`}
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                        >
                          Review queue
                        </Link>
                        <HelpTip content={GIS_REFERENCE_REVIEW_QUEUE_TIP} label="About review queue" />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableShell>
      )}
    </div>
  );
}

const SLOT_META: Record<
  GisReferenceSlot,
  { icon: LucideIcon; tone: MetricTone; description: string; formats: string }
> = {
  lga_boundaries: {
    icon: MapIcon,
    tone: "primary",
    description: "State-wide LGA polygons for map outlines and lookups.",
    formats: "GeoPackage (.gpkg)",
  },
  ward_boundaries: {
    icon: MapPin,
    tone: "info",
    description: "Ward polygons — source for the canonical ward gazetteer.",
    formats: "GeoPackage (.gpkg)",
  },
  facility_registry: {
    icon: Building2,
    tone: "success",
    description: "Health facility points used for map overlays and analytics.",
    formats: "GeoPackage (.gpkg)",
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
    formats: "GeoPackage (.gpkg)",
  },
};

function layerConfigured(layer?: GisReferenceLayer): boolean {
  return Boolean(layer?.fileId || layer?.datasetId);
}

function layerDisplayName(layer?: GisReferenceLayer): string | null {
  if (!layer) return null;
  return layer.label ?? layer.filename ?? layer.datasetName ?? null;
}

function ActiveLayersList({
  layers,
  isLoading,
  onEdit,
  pendingRebuild,
  onClearRebuild,
}: {
  layers: GisReferenceLayer[] | undefined;
  isLoading: boolean;
  onEdit: (slot: GisReferenceSlot) => void;
  pendingRebuild: GisPendingRebuild | null;
  onClearRebuild: () => void;
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
              <TableHead>Active source</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {GIS_REFERENCE_SLOTS.map((slot) => {
              const layer = layers?.find((l) => l.slot === slot);
              const meta = SLOT_META[slot];
              const configured = layerConfigured(layer);
              const displayName = layerDisplayName(layer);
              const rebuilding =
                pendingRebuild?.slot === slot ? pendingRebuild : null;

              return (
                <Fragment key={slot}>
                  <TableRow className={cn(!configured && "bg-warning/4")}>
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
                      {rebuilding ? (
                        <Badge className="gap-1 border-info/30 bg-info/10 text-info">
                          <Loader2 className="size-3 animate-spin" />
                          Rebuilding
                        </Badge>
                      ) : configured ? (
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
                      {configured && displayName ? (
                        <div>
                          <span className="font-medium">{displayName}</span>
                          {layer?.filename ? (
                            <p className="text-xs text-muted-foreground">{layer.filename}</p>
                          ) : null}
                          {layer?.source === "dataset" && layer.datasetSlug ? (
                            <Link
                              href={`/datasets/${layer.datasetSlug}`}
                              className="text-xs text-primary underline-offset-4 hover:underline"
                            >
                              Legacy catalogue dataset
                            </Link>
                          ) : layer?.source === "file" ? (
                            <p className="text-xs text-muted-foreground">Dedicated GIS file</p>
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
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant={configured ? "outline" : "default"}
                          onClick={() => onEdit(slot)}
                          disabled={!!rebuilding}
                        >
                          <Pencil className="size-3.5" />
                          {configured ? "Replace" : "Upload layer"}
                        </Button>
                        <HelpTip
                          content={
                            configured
                              ? GIS_REFERENCE_REPLACE_LAYER_TIP
                              : GIS_REFERENCE_UPLOAD_LAYER_TIP
                          }
                          label={configured ? "About replace layer" : "About upload layer"}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                  {rebuilding ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="bg-info/4 py-2">
                        <GisGazetteerRebuildStatus
                          pending={rebuilding}
                          onClear={onClearRebuild}
                        />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
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
          const configured = layerConfigured(layer);
          const displayName = layerDisplayName(layer);
          const tone = METRIC_TONE[meta.tone];
          const rebuilding =
            pendingRebuild?.slot === slot ? pendingRebuild : null;

          return (
            <div
              key={slot}
              className={cn("space-y-3 p-4", !configured && !rebuilding && tone.card)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <PanelIcon icon={meta.icon} tone={meta.tone} />
                  <div className="min-w-0">
                    <p className="font-medium">{GIS_SLOT_LABELS[slot]}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>
                  </div>
                </div>
                {rebuilding ? (
                  <Badge className="shrink-0 gap-1 border-info/30 bg-info/10 text-info">
                    <Loader2 className="size-3 animate-spin" />
                    Rebuilding
                  </Badge>
                ) : configured ? (
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
                {configured && displayName ? (
                  <span className="font-medium">{displayName}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No file — upload {meta.formats}
                  </span>
                )}
                {layer?.updatedAt ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Updated {formatDate(layer.updatedAt)}
                  </p>
                ) : null}
              </div>

              {rebuilding ? (
                <GisGazetteerRebuildStatus
                  pending={rebuilding}
                  onClear={onClearRebuild}
                />
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={configured ? "outline" : "default"}
                  onClick={() => onEdit(slot)}
                  disabled={!!rebuilding}
                >
                  <Pencil className="size-3.5" />
                  {configured ? "Replace" : "Upload layer"}
                </Button>
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
  const { can } = useAdminAccess();
  const canManage = can("manage:gis-reference-data");

  const { data: layers, isLoading } = useGisReferenceLayers();
  const rebuildMutation = useRebuildCanonicalWards();

  const [helpOpen, setHelpOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<GisReferenceSlot | null>(null);
  const [pendingRebuild, setPendingRebuild] = useState<GisPendingRebuild | null>(null);
  const [reportSlot, setReportSlot] = useState<GisReconcilableSlot | null>(null);
  const [visitedReportSlots, setVisitedReportSlots] = useState<
    Set<GisReconcilableSlot>
  >(new Set());
  const [variantTarget, setVariantTarget] = useState<{ lga: string; ward: string } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(GIS_PENDING_REBUILD_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as GisPendingRebuild;
      if (parsed?.jobId && parsed?.slot) {
        setPendingRebuild(parsed);
      }
    } catch {
      sessionStorage.removeItem(GIS_PENDING_REBUILD_KEY);
    }
  }, []);

  useEffect(() => {
    if (pendingRebuild) {
      sessionStorage.setItem(GIS_PENDING_REBUILD_KEY, JSON.stringify(pendingRebuild));
    } else {
      sessionStorage.removeItem(GIS_PENDING_REBUILD_KEY);
    }
  }, [pendingRebuild]);

  const clearPendingRebuild = () => setPendingRebuild(null);

  const configuredReconcilable = useMemo(
    (): GisReconcilableSlot[] =>
      GIS_RECONCILABLE_SLOTS.filter((slot) =>
        layerConfigured(layers?.find((l) => l.slot === slot)),
      ),
    [layers],
  );

  const preferredReportSlot =
    pendingRebuild?.slot && isGisReconcilableSlot(pendingRebuild.slot)
      ? pendingRebuild.slot
      : reportSlot;

  useEffect(() => {
    if (configuredReconcilable.length === 0) return;
    const seed =
      preferredReportSlot && configuredReconcilable.includes(preferredReportSlot)
        ? preferredReportSlot
        : configuredReconcilable[0];
    setVisitedReportSlots((prev) => {
      if (prev.has(seed)) return prev;
      const next = new Set(prev);
      next.add(seed);
      return next;
    });
  }, [configuredReconcilable, preferredReportSlot]);

  const reportQueries = useGisResolutionReports(
    configuredReconcilable,
    [...visitedReportSlots],
  );

  const reportsBySlot = useMemo(() => {
    const map = new Map<GisReferenceSlot, GisResolutionReport>();
    configuredReconcilable.forEach((slot, index) => {
      const data = reportQueries[index]?.data;
      if (data) map.set(slot, data);
    });
    return map;
  }, [configuredReconcilable, reportQueries]);

  const activeReportSlot = pickReportSlot(
    configuredReconcilable,
    reportsBySlot,
    preferredReportSlot,
  );

  const activeReport = activeReportSlot ? reportsBySlot.get(activeReportSlot) : undefined;
  const activeReportLoading =
    activeReportSlot != null &&
    reportQueries[configuredReconcilable.indexOf(activeReportSlot)]?.isLoading;

  const anyReportLoading = reportQueries.some((query) => query.isLoading);
  const totalUnmatched = [...reportsBySlot.values()].reduce(
    (sum, report) => sum + report.unmatched.length,
    0,
  );
  const layersWithUnmatched = [...reportsBySlot.values()].filter(
    (report) => report.unmatched.length > 0,
  ).length;

  const handleLayerUploaded = (result: GisUploadResult) => {
    if (isGisReconcilableSlot(result.slot)) {
      setReportSlot(result.slot);
    }
    if (result.jobId && result.rebuildStatus === "queued") {
      setPendingRebuild({ jobId: result.jobId, slot: result.slot });
    }
  };

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
        layerConfigured(layers.find((l) => l.slot === slot)),
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
    activeReport && activeReport.totalPairs > 0
      ? `${Math.round((activeReport.matched / activeReport.totalPairs) * 100)}%`
      : activeReport
        ? "100%"
        : "—";

  const unmatchedHint =
    layersWithUnmatched > 0
      ? `${layersWithUnmatched} layer${layersWithUnmatched === 1 ? "" : "s"} need review`
      : configuredReconcilable.length > 0
        ? "All reconciled"
        : undefined;

  return (
    <TooltipProvider delay={200}>
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            GIS Reference Layers
            <HelpTip content={GIS_REFERENCE_PAGE_TIP} label="About GIS reference layers" />
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Upload dedicated GIS reference files for the five platform map slots, then reconcile
            raw LGA/ward spellings via the shared org-unit ladder and Data Review queue.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            className="gap-1.5"
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
          <HelpTip content={GIS_REFERENCE_REBUILD_TIP} label="About rebuild canonical wards" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Configured layers"
          value={`${configuredCount}/${GIS_REFERENCE_SLOTS.length}`}
          icon={CheckCircle2}
          tone="success"
          tip={GIS_REFERENCE_METRIC_TIPS.configured}
        />
        <MetricCard
          label="Needs assignment"
          value={unsetCount}
          icon={AlertTriangle}
          tone={unsetCount > 0 ? "warning" : "muted"}
          tip={GIS_REFERENCE_METRIC_TIPS.unset}
        />
        <MetricCard
          label="Unmatched spellings"
          value={
            configuredReconcilable.length === 0
              ? "—"
              : anyReportLoading && reportsBySlot.size === 0
                ? "…"
                : totalUnmatched
          }
          hint={unmatchedHint}
          icon={MapPin}
          tone={
            totalUnmatched > 0
              ? "destructive"
              : configuredReconcilable.length > 0 && !anyReportLoading
                ? "success"
                : "muted"
          }
          tip={GIS_REFERENCE_METRIC_TIPS.unmatched}
        />
        <MetricCard
          label="Match rate"
          value={activeReportLoading ? "…" : matchRate}
          hint={
            activeReport
              ? `${activeReport.matched} of ${activeReport.totalPairs} pairs · ${activeReportSlot ? GIS_SLOT_LABELS[activeReportSlot] : ""}`
              : undefined
          }
          icon={Layers}
          tone="info"
          tip={GIS_REFERENCE_METRIC_TIPS.matchRate}
        />
      </div>

      <Panel
        title="Active map layers"
        titleTip={GIS_REFERENCE_LAYERS_PANEL_TIP}
        description="Each slot reads from one staff-uploaded file (or legacy catalogue dataset). Replacing a layer triggers gazetteer rebuild when applicable."
        icon={MapIcon}
        tone="primary"
      >
        <ActiveLayersList
          layers={layers}
          isLoading={isLoading}
          onEdit={setEditingSlot}
          pendingRebuild={pendingRebuild}
          onClearRebuild={clearPendingRebuild}
        />
      </Panel>

      <Panel
        title="Name resolution report"
        titleTip={GIS_REFERENCE_RESOLUTION_PANEL_TIP}
        description="Unmatched LGA/ward spellings across reconcilable layers. Tabs show counts per layer — the layer with issues is selected automatically."
        icon={MapPin}
        tone="warning"
      >
        {configuredReconcilable.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No reconcilable layers yet"
            description="Upload ward boundaries, health facilities, or settlements to see spelling mismatches here."
          />
        ) : activeReportSlot ? (
          <Tabs
            value={activeReportSlot}
            onValueChange={(value) => {
              if (!value) return;
              const slot = value as GisReconcilableSlot;
              setReportSlot(slot);
              setVisitedReportSlots((prev) => {
                if (prev.has(slot)) return prev;
                const next = new Set(prev);
                next.add(slot);
                return next;
              });
            }}
          >
            <AdminSectionTabsNav>
              {configuredReconcilable.map((slot) => {
                const slotReport = reportsBySlot.get(slot);
                const unmatchedCount = slotReport?.unmatched.length ?? 0;
                const isActive = slot === activeReportSlot;
                const meta = RECONCILABLE_SLOT_META[slot];

                return (
                  <div key={slot} className="inline-flex flex-none items-center gap-0.5">
                    <TabsTrigger
                      value={slot}
                      className={cn(ADMIN_TAB_TRIGGER_BASE, tabToneClass(meta.tone))}
                    >
                      {GIS_SLOT_LABELS[slot]}
                      <AdminTabCount count={unmatchedCount} active={isActive} />
                    </TabsTrigger>
                    {isActive ? (
                      <HelpTip
                        content={GIS_REFERENCE_RESOLUTION_TAB_TIPS[slot]}
                        label={`About ${GIS_SLOT_LABELS[slot]}`}
                      />
                    ) : null}
                  </div>
                );
              })}
            </AdminSectionTabsNav>

            {configuredReconcilable.map((slot) => {
              const slotIndex = configuredReconcilable.indexOf(slot);
              const slotQuery = reportQueries[slotIndex];
              const slotReport = reportsBySlot.get(slot);

              return (
                <TabsContent key={slot} value={slot} className="mt-4">
                  {slotQuery?.isLoading ? (
                    <Skeleton className="h-32 w-full rounded-xl" />
                  ) : slotReport ? (
                    <ResolutionReportBody
                      slot={slot}
                      report={slotReport}
                      onConfirm={setVariantTarget}
                    />
                  ) : slotQuery?.isError ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/[0.06] px-4 py-3 text-sm">
                      Could not load the resolution report for {GIS_SLOT_LABELS[slot]}.
            </div>
          ) : null}
                </TabsContent>
              );
            })}
          </Tabs>
        ) : (
          <Skeleton className="h-32 w-full rounded-xl" />
        )}
      </Panel>

      {editingSlot && (
        <ReplaceGisLayerDialog
          slot={editingSlot}
          currentLayer={layers?.find((l) => l.slot === editingSlot)}
          open={!!editingSlot}
          onClose={() => setEditingSlot(null)}
          onUploaded={handleLayerUploaded}
        />
      )}

      {variantTarget && (
        <GisWardConfirmDialog
          lga={variantTarget.lga}
          ward={variantTarget.ward}
          open={!!variantTarget}
          onClose={() => setVariantTarget(null)}
        />
      )}

      <GisReferenceHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
      <GisReferenceHelpFab onClick={() => setHelpOpen(true)} />
    </div>
    </TooltipProvider>
  );
}
