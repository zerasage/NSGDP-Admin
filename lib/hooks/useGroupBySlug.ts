import { useQuery } from "@tanstack/react-query";
import { getGroupBySlug } from "@/lib/mock";

export function useGroupBySlug(slug: string) {
  return useQuery({
    queryKey: ["group", slug],
    queryFn: () => getGroupBySlug(slug),
    enabled: !!slug,
  });
}
