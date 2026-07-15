import { useQuery } from "@tanstack/react-query";
import { getOrganisationBySlug } from "@/lib/mock";

export function useOrganisationBySlug(slug: string) {
  return useQuery({
    queryKey: ["organisation", slug],
    queryFn: () => getOrganisationBySlug(slug),
    enabled: !!slug,
  });
}
