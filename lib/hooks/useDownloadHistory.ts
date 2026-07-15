import { useQuery } from '@tanstack/react-query';
import { getDownloadHistory } from '../api/users';

export function useDownloadHistory(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['downloadHistory', page, limit],
    queryFn: () => getDownloadHistory(page, limit),
  });
}
