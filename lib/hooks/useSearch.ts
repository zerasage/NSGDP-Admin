import { useQuery } from "@tanstack/react-query";
import { searchAll } from "@/lib/mock";

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchAll(query),
    enabled: query.trim().length > 0,
  });
}
