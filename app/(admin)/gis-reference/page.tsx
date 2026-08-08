"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Pencil, RotateCcw, ShieldAlert } from "lucide-react";
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
  type GisReferenceSlot,
} from "@/lib/api/gis-reference";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate } from "@/lib/utils/date";
import { toast } from "sonner";
import { SetGisLayerDialog } from "@/components/admin/set-gis-layer-dialog";
import { GisVariantDialog } from "@/components/admin/gis-variant-dialog";

const RECONCILABLE_SLOTS: GisReferenceSlot[] = [
  "ward_boundaries",
  "facility_registry",
  "settlements",
];

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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">GIS Reference Layers</h1>
          <p className="text-muted-foreground mt-1">
            Choose which dataset backs each of the 5 map layers, and reconcile raw LGA/ward
            spellings against the canonical ward table.
          </p>
        </div>
        <Button onClick={handleRebuild} disabled={rebuildMutation.isPending}>
          {rebuildMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
          Rebuild Canonical Wards
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Layers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slot</TableHead>
                  <TableHead>Active Dataset</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {GIS_REFERENCE_SLOTS.map((slot) => {
                  const layer = layers?.find((l) => l.slot === slot);
                  return (
                    <TableRow key={slot}>
                      <TableCell className="font-medium">{GIS_SLOT_LABELS[slot]}</TableCell>
                      <TableCell>
                        {layer?.datasetName ? (
                          <div>
                            <div>{layer.datasetName}</div>
                            <div className="text-muted-foreground text-xs">
                              {layer.datasetSlug}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <AlertTriangle className="size-3" />
                            Not configured
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {layer?.updatedAt ? formatDate(layer.updatedAt) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setEditingSlot(slot)}>
                          <Pencil className="size-4" />
                          Change
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Name Resolution Report</CardTitle>
          <Select
            value={reportSlot}
            onValueChange={(v) => v && setReportSlot(v as GisReferenceSlot)}
          >
            <SelectTrigger className="w-56">
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
        </CardHeader>
        <CardContent>
          {reportLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : report ? (
            <div className="space-y-4">
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Total pairs: </span>
                  <span className="font-medium">{report.totalPairs}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Matched: </span>
                  <span className="font-medium text-green-600">{report.matched}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Unmatched: </span>
                  <span className="font-medium text-amber-600">
                    {report.unmatched.length}
                  </span>
                </div>
              </div>
              {report.unmatched.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Every raw LGA/ward spelling in this layer resolves to a canonical ward.
                </p>
              ) : (
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
                            variant="ghost"
                            size="sm"
                            onClick={() => setVariantTarget(pair)}
                          >
                            Attach to ward
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {editingSlot && (
        <SetGisLayerDialog
          slot={editingSlot}
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
