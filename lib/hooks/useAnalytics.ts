"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminAnalytics, exportAnalytics } from "@/lib/api/admin";

export function useAdminAnalytics(months = 6) {
  return useQuery({
    queryKey: ["admin-analytics", months],
    queryFn: () => getAdminAnalytics(months),
    staleTime: 60_000,
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
