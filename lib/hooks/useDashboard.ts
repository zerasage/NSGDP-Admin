"use client";

import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getDashboardActivity } from '@/lib/api/admin';

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => getDashboardStats(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to fetch the platform activity graph (daily views/downloads, 7d + 30d)
 */
export function useDashboardActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: () => getDashboardActivity(),
    staleTime: 5 * 60 * 1000, // 5 minutes — this changes slowly
  });
}
