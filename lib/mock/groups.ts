import type { Group } from "@/types";

export const mockGroups: Group[] = [
  {
    id: "grp-1",
    slug: "disease-data",
    name: "Disease Data",
    description: "Malaria, meningitis, cholera, immunisation, HIV, TB, maternal and child health datasets.",
    datasetCount: 12,
    healthCategory: "disease",
  },
  {
    id: "grp-2",
    slug: "health-facilities",
    name: "Health Facilities",
    description: "HFR registry, PHC status, health worker registry, and facility catchment data.",
    datasetCount: 4,
    healthCategory: "facilities",
  },
  {
    id: "grp-3",
    slug: "population",
    name: "Population",
    description: "GRID3 estimates, ward boundaries, population projections, and NHMIS aggregates.",
    datasetCount: 4,
    healthCategory: "population",
  },
  {
    id: "grp-4",
    slug: "surveillance",
    name: "Surveillance",
    description: "IDSR reports, outbreak line lists, mortality registry, and lab results.",
    datasetCount: 6,
    healthCategory: "surveillance",
  },
];
