"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminAnalytics, exportAnalytics, refreshAnalyticsCache } from "@/lib/api/admin";

export function useAdminAnalytics(months = 6) {
  return useQuery({
    queryKey: ["admin-analytics", months],
    queryFn: () => getAdminAnalytics(months),
    staleTime: 60_000,
  });
}

export function useRefreshAnalyticsCache() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => refreshAnalyticsCache(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "datasets", "stats"] });
    },
  });
}

export async function downloadAnalyticsCsv(months = 6) {
  const blob = await exportAnalytics(months);

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `platform-analytics-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
