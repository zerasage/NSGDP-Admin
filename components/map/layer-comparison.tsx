"use client";

import { useState } from "react";
import { Layers, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AnalyticsMetric } from "@/types";
import { ANALYTICS_METRICS } from "@/lib/constants/health";

export interface LayerConfig {
  id: string;
  metric: AnalyticsMetric;
  label: string;
  color: string;
  visible: boolean;
}

const LAYER_COLORS = ["#dc2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed"];

interface LayerComparisonProps {
  layers: LayerConfig[];
  onLayersChange: (layers: LayerConfig[]) => void;
  maxLayers?: number;
}

export function LayerComparison({ layers, onLayersChange, maxLayers = 4 }: LayerComparisonProps) {
  const [open, setOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<AnalyticsMetric>("severe_malaria");

  const addLayer = () => {
    if (layers.length >= maxLayers) return;
    const metric = ANALYTICS_METRICS.find((m) => m.id === selectedMetric);
    if (!metric) return;
    const already = layers.find((l) => l.metric === selectedMetric);
    if (already) return;
    const newLayer: LayerConfig = {
      id: `layer-${Date.now()}`,
      metric: selectedMetric,
      label: metric.label,
      color: LAYER_COLORS[layers.length % LAYER_COLORS.length],
      visible: true,
    };
    onLayersChange([...layers, newLayer]);
  };

  const toggleVisibility = (id: string) => {
    onLayersChange(layers.map((l) => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const removeLayer = (id: string) => {
    onLayersChange(layers.filter((l) => l.id !== id));
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2"
      >
        <Layers className="size-4" />
        Layers
        {layers.length > 0 && (
          <Badge className="ml-1 px-1.5 text-xs">{layers.length}</Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-lg border bg-background shadow-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Map Layers</p>
            <p className="text-xs text-muted-foreground">{layers.length}/{maxLayers} layers</p>
          </div>

          {/* Active layers */}
          <div className="space-y-2">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2",
                  !layer.visible && "opacity-50"
                )}
              >
                <span
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: layer.color }}
                  aria-hidden
                />
                <span className="flex-1 text-sm truncate">{layer.label}</span>
                <button
                  type="button"
                  onClick={() => toggleVisibility(layer.id)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={layer.visible ? "Hide layer" : "Show layer"}
                >
                  {layer.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => removeLayer(layer.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove layer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add layer */}
          {layers.length < maxLayers && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground">Add layer</p>
              <select
                className="w-full rounded-md border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as AnalyticsMetric)}
              >
                {ANALYTICS_METRICS
                  .filter((m) => !layers.some((l) => l.metric === m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
              </select>
              <Button size="sm" className="w-full" onClick={addLayer}>
                <Plus className="size-3.5 mr-1.5" />
                Add Layer
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
