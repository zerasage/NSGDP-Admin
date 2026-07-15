/** Shared filter option lists for the Data Portal advanced filter bar */

export const DISEASE_FILTER_OPTIONS = [
  "Malaria",
  "Meningitis",
  "Cholera",
  "Diphtheria",
  "HIV/AIDS",
  "TB",
  "Measles",
  "Polio",
  "Maternal Health",
  "NTD",
].map((v) => ({ value: v, label: v }));

export const WARD_FILTER_OPTIONS = [
  "Tunga",
  "Minna Central",
  "Kpakungu",
  "Shango",
  "Limawa",
  "Bida Central",
  "Lapai Central",
  "Suleja Central",
].map((v) => ({ value: v, label: v }));

export const FACILITY_FILTER_OPTIONS = [
  { value: "PHC", label: "Primary Health Centre" },
  { value: "Secondary", label: "Secondary Facility" },
  { value: "General Hospital", label: "General Hospital" },
  { value: "All Facilities", label: "All Facility Types" },
];

export const YEAR_FILTER_OPTIONS = Array.from({ length: 8 }, (_, i) => {
  const y = 2019 + i;
  return { value: String(y), label: String(y) };
});

export const PROGRAM_FILTER_OPTIONS = [
  { value: "measles-rubella-integrated-2026", label: "Measles-Rubella Campaign 2026" },
  { value: "ipv-catchup-2025", label: "IPV Catch-up Campaign 2025" },
  { value: "malaria-sia-2025", label: "Malaria SIA 2025" },
  { value: "ntd-mda-2024", label: "NTD Mass Drug Administration 2024" },
  { value: "none", label: "Not linked to a programme" },
];

export const DEFAULT_PORTAL_FILTERS: Record<string, string[]> = {
  categories: [],
  organisations: [],
  lgas: [],
  formats: [],
  diseases: [],
  wards: [],
  facilities: [],
  years: [],
  programs: [],
  updateFrequency: [],
  status: [],
  dataLicense: [],
};
