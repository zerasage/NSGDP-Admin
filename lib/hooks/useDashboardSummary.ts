import { useQuery } from '@tanstack/react-query';
import { getDashboardSummary } from '../api/users';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: getDashboardSummary,
  });
}
