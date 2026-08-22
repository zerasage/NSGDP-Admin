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

export function useGovernanceAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics", "governance"],
    queryFn: () => getGovernanceAnalytics(),
    staleTime: 60_000,
  });
}

export function useDatasetCompare(datasetA?: string, datasetB?: string) {
  return useQuery({
    queryKey: ["analytics", "compare", datasetA, datasetB],
    queryFn: () => compareDatasets(datasetA!, datasetB!),
    enabled: Boolean(datasetA && datasetB && datasetA !== datasetB),
    staleTime: 30_000,
  });
}
