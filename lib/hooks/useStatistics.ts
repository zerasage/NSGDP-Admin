import { useQuery } from "@tanstack/react-query";
import { getStatistics } from "@/lib/mock";

export function useStatistics() {
  return useQuery({
    queryKey: ["statistics"],
    queryFn: getStatistics,
  });
}
