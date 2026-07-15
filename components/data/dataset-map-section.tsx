"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Table, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FileFormat } from "@/types";
import { cn } from "@/lib/utils";

// Leaflet requires window — must not load during SSR
const DatasetMap = dynamic(
  () => import("@/components/map/dataset-map").then((mod) => mod.DatasetMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[400px] items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  }
);

const SPATIAL_FORMATS: FileFormat[] = ["GeoJSON", "Shapefile", "KML"];

interface DatasetMapSectionProps {
  formats: FileFormat[];
  lgaCoverage: string[];
}

export function DatasetMapSection({
  formats,
  lgaCoverage,
}: DatasetMapSectionProps) {
  const isSpatial = formats.some((f) => SPATIAL_FORMATS.includes(f));
  const [view, setView] = useState<"map" | "table">("map");

  if (!isSpatial) return null;

  const mockMarkers = lgaCoverage.slice(0, 5).map((lga, i) => ({
    id: `marker-${i}`,
    position: [9.5 + i * 0.15, 6.2 + i * 0.1] as [number, number],
    title: lga,
    description: `Coverage area: ${lga}`,
  }));

  const attributeRows = [
    { field: "lga_name", example: lgaCoverage[0] ?? "Chanchaga", description: "Local Government Area name" },
    { field: "facility_count", example: "187", description: "Number of health facilities" },
    { field: "population", example: "688,000", description: "Estimated population" },
    { field: "geometry", example: "POLYGON", description: "Spatial boundary geometry" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Spatial Preview</CardTitle>
        <div className="flex rounded-lg border">
          <Button
            type="button"
            size="sm"
            variant={view === "map" ? "default" : "ghost"}
            className={cn("rounded-r-none", view === "map" && "rounded-l-lg")}
            onClick={() => setView("map")}
          >
            <Map className="size-4 mr-1" />
            Map
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "table" ? "default" : "ghost"}
            className="rounded-l-none border-l"
            onClick={() => setView("table")}
          >
            <Table className="size-4 mr-1" />
            Attribute Table
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {view === "map" ? (
          <DatasetMap
            markers={mockMarkers}
            lgaCoverage={lgaCoverage}
            height="400px"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 pr-4 font-medium">Field Name</th>
                  <th className="pb-2 pr-4 font-medium">Example Value</th>
                  <th className="pb-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {attributeRows.map((row) => (
                  <tr key={row.field} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs">{row.field}</td>
                    <td className="py-2 pr-4">{row.example}</td>
                    <td className="py-2 text-muted-foreground">{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
