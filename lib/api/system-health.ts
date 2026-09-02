import { apiClient } from './client';
import type { QueuesHealth } from './ingestion-ops';

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  timestamp: string;
  path: string;
  data: T;
}

export type DependencyStatus = 'healthy' | 'degraded' | 'unavailable';

export interface DependencyHealth {
  id: 'api' | 'postgres' | 'redis' | 'object_storage' | 'workers';
  label: string;
  status: DependencyStatus;
  latencyMs: number | null;
  detail: string | null;
}

export interface SystemHealthSnapshot {
  status: 'healthy' | 'degraded' | 'unavailable';
  warnings: string[];
  environment: string;
  checkedAt: string;
  dependencies: DependencyHealth[];
  queues: QueuesHealth;
}

export async function getSystemHealth(): Promise<SystemHealthSnapshot> {
  const response = await apiClient.get<ApiResponse<SystemHealthSnapshot>>(
    '/admin/system-health',
  );
  return response.data.data;
}
