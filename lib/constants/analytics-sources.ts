import type { AnalyticsMetric } from "@/types";
import { mockOrganisations } from "@/lib/mock/organisations";

/** Organisations that generate or upload analytics data to the portal */
const SOURCE_ORG_IDS = [
  "org-1", // NSPHCDA
  "org-2", // NSMOH
  "org-3", // NPHCDA
  "org-6", // NSPHCDA Surveillance
  "org-7", // NSPHCDA RH
  "org-8", // NPC
] as const;

export type AnalyticsDataSourceId = (typeof SOURCE_ORG_IDS)[number] | "all";

export interface AnalyticsDataSource {
  id: AnalyticsDataSourceId;
  slug?: string;
  name: string;
  acronym: string;
  description?: string;
}

export const ANALYTICS_DATA_SOURCES: AnalyticsDataSource[] = [
  {
    id: "all",
    name: "All Sources (Aggregated)",
    acronym: "ALL",
    description: "Combined indicators from all contributing organisations",
  },
  ...mockOrganisations
    .filter((o) => (SOURCE_ORG_IDS as readonly string[]).includes(o.id))
    .map((o) => ({
      id: o.id as AnalyticsDataSourceId,
      slug: o.slug,
      name: o.name,
      acronym: o.acronym ?? o.name.split(" ").map((w) => w[0]).join(""),
      description: o.description,
    })),
];

/**
 * Approximate share of state-level indicator volume attributable to each source.
 * Used to simulate org-scoped analytics in the mock layer.
 */
const ORG_METRIC_SHARE: Partial<
  Record<AnalyticsDataSourceId, Partial<Record<AnalyticsMetric, number>> & { _default?: number }>
> = {
  "org-1": {
    _default: 0.28,
    routine_immunisation: 0.22,
    anc_attendance: 0.2,
    delivery_sba: 0.19,
  },
  "org-2": {
    _default: 0.18,
    anc_attendance: 0.24,
    delivery_sba: 0.22,
    u5_mortality: 0.2,
    death_cases: 0.21,
  },
  "org-3": {
    _default: 0.2,
    routine_immunisation: 0.48,
    anc_attendance: 0.15,
  },
  "org-6": {
    _default: 0.12,
    severe_malaria: 0.52,
    meningitis: 0.58,
    cholera: 0.49,
    diphtheria: 0.44,
    death_cases: 0.18,
  },
  "org-7": {
    _default: 0.14,
    anc_attendance: 0.38,
    delivery_sba: 0.41,
    u5_mortality: 0.35,
  },
  "org-8": {
    _default: 0.08,
  },
};

const ORG_FACILITY_SHARE: Partial<Record<AnalyticsDataSourceId, number>> = {
  "org-1": 0.45,
  "org-2": 0.35,
  "org-3": 0.12,
  "org-6": 0.05,
  "org-7": 0.03,
  "org-8": 0,
};

/** Programme → contributing data source (uploading organisation) */
export const PROGRAM_DATA_SOURCE: Record<string, AnalyticsDataSourceId> = {
  "prog-1": "org-3",
  "prog-2": "org-3",
  "prog-3": "org-6",
  "prog-4": "org-6",
  "prog-5": "org-7",
  "prog-6": "org-1",
  "prog-7": "org-1",
  "prog-8": "org-2",
};

export function getAnalyticsSourceLabel(sourceId: AnalyticsDataSourceId): string {
  return ANALYTICS_DATA_SOURCES.find((s) => s.id === sourceId)?.name ?? sourceId;
}

export function getAnalyticsSourceShare(
  sourceId: AnalyticsDataSourceId,
  metric: AnalyticsMetric
): number {
  if (sourceId === "all") return 1;
  const profile = ORG_METRIC_SHARE[sourceId];
  if (!profile) return 0.15;
  return profile[metric] ?? profile._default ?? 0.15;
}

export function getAnalyticsFacilityShare(sourceId: AnalyticsDataSourceId): number {
  if (sourceId === "all") return 1;
  return ORG_FACILITY_SHARE[sourceId] ?? 0.1;
}
