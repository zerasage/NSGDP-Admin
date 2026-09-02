import { useQuery } from '@tanstack/react-query';
import { getSystemHealth } from '../api/system-health';

const SYSTEM_HEALTH_KEY = 'system-health';

export function useSystemHealth(options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: [SYSTEM_HEALTH_KEY],
    queryFn: getSystemHealth,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
  });
}
