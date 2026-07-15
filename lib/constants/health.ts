import type { AnalyticsMetric, HealthCategory } from "@/types";

export const HEALTH_CATEGORIES: {
  id: HealthCategory;
  label: string;
  emoji: string;
}[] = [
  { id: "disease", label: "Disease Data", emoji: "🦠" },
  { id: "facilities", label: "Health Facilities", emoji: "🏥" },
  { id: "population", label: "Population", emoji: "👥" },
  { id: "surveillance", label: "Surveillance", emoji: "🔍" },
];

export const HEALTH_CATEGORY_LABELS: Record<HealthCategory, string> = {
  disease: "Disease Data",
  facilities: "Health Facilities",
  population: "Population",
  surveillance: "Surveillance",
};

export const ANALYTICS_METRICS: {
  id: AnalyticsMetric;
  label: string;
}[] = [
  { id: "severe_malaria", label: "Severe Malaria Cases" },
  { id: "meningitis", label: "Meningitis Cases" },
  { id: "cholera", label: "Cholera Cases" },
  { id: "diphtheria", label: "Diphtheria Cases" },
  { id: "anc_attendance", label: "ANC Attendance" },
  { id: "delivery_sba", label: "Delivery with SBA" },
  { id: "routine_immunisation", label: "Routine Immunisation" },
  { id: "u5_mortality", label: "U5 Mortality" },
  { id: "death_cases", label: "Death Cases" },
];

export const NIGER_STATE_POPULATION = 5_900_000;
