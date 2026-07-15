import { useQuery } from "@tanstack/react-query";
import { getDatasetBySlug } from "@/lib/mock";

export function useDatasetBySlug(slug: string) {
  return useQuery({
    queryKey: ["dataset", slug],
    queryFn: () => getDatasetBySlug(slug),
    enabled: !!slug,
  });
}
