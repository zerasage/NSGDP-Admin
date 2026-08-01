"use client";

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getAuditLogs, exportAuditLogs, type AuditLogParams } from '@/lib/api/admin';

/**
 * Hook to fetch audit logs with filters
 */
export function useAuditLogs(params?: AuditLogParams) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => getAuditLogs(params),
    staleTime: 10000, // 10 seconds
    placeholderData: keepPreviousData,
  });
}

/**
 * Hook to export audit logs as CSV
 * Note: This is a simple wrapper, actual implementation would need mutation
 */
export async function downloadAuditLogsCsv(params?: Omit<AuditLogParams, 'page' | 'limit'>) {
  try {
    const blob = await exportAuditLogs(params);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Failed to export audit logs:', error);
    throw error;
  }
}
