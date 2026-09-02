"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDatasetPipelineStats,
  getGovernanceAnalytics,
  compareDatasets,
} from "@/lib/api/admin";

export function useDatasetPipelineStats() {
  return useQuery({
    queryKey: ["admin", "datasets", "stats"],
    queryFn: () => getDatasetPipelineStats(),
    staleTime: 60_000,
  });
}

export function useGovernanceAnalytics(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["admin", "analytics", "governance"],
    queryFn: () => getGovernanceAnalytics(),
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}

export function useDatasetCompare(
  datasetA?: string,
  datasetB?: string,
  mode: import("@/lib/api/admin").DatasetCompareMode = "live",
) {
  return useQuery({
    queryKey: ["analytics", "compare", datasetA, datasetB, mode],
    queryFn: () => compareDatasets(datasetA!, datasetB!, mode),
    enabled: Boolean(datasetA && datasetB && datasetA !== datasetB),
    staleTime: 30_000,
  });
}
