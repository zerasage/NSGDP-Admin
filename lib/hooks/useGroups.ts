import { useQuery } from "@tanstack/react-query";
import { getGroups } from "@/lib/mock";

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  });
}
