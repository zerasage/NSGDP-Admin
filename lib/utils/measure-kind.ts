/**
 * Client-side measure-kind detector (mirrors nsgdp-backend measure-kind.ts).
 * Used for alias queue badges and create-indicator defaults — not an NHMIS dictionary.
 */

export type MeasureKind =
  | "cases"
  | "completeness"
  | "coverage"
  | "positivity"
  | "stock"
  | "population";

export type MeasureKindMeta = {
  kind: MeasureKind;
  category: string | null;
  unit: string;
  label: string;
};

const COMPLETENESS_PATTERNS: RegExp[] = [
  /\breporting\s+rate\b/i,
  /\breporting\s+completeness\b/i,
  /\bfacility\s+reporting\s+rate\b/i,
  /\bforms?\s+received\s+rate\b/i,
  /\breporting\s+timeliness\b/i,
  /\breports?\s+on\s+time\b/i,
  /\btimeliness\s+rate\b/i,
  /\bmonthly\s+reporting\s+rate\b/i,
  /\bnhmis\s+monthly\s+summary\s+form\s+reporting\s+rate\b/i,
  /\bactual\s+reports(\s+on\s+time)?\b/i,
  /\bexpected\s+reports\b/i,
];

const POSITIVITY_PATTERNS: RegExp[] = [
  /\bpositivity\s+rate\b/i,
  /\bpositive\s+rate\b/i,
  /\bpositivity\b/i,
  /\bseroprevalence\b/i,
  /\bprevalence\s+rate\b/i,
];

const COVERAGE_PATTERNS: RegExp[] = [
  /\btesting\s+coverage\b/i,
  /\bimmuni[sz]ation\s+coverage\b/i,
  /\bvaccination\s+coverage\b/i,
  /\btreatment\s+coverage\b/i,
  /\bservice\s+coverage\b/i,
  /\bcoverage\s+rate\b/i,
  /\bcoverage\b/i,
  /^%\s*of\b/i,
  /\bpercentage\s+of\b/i,
  /\bpercent\s+of\b/i,
  /\/\s*ANC\s*1\b/i,
  /\b(antenatal|anc|pnc|visits?|attendance|delivery|immuni[sz]ation|ipt|testing|treatment|screening)\b[\w\s/%.-]{0,40}\brate\b/i,
  /\brate\b[\w\s/%.-]{0,40}\b(visits?|attendance|coverage)\b/i,
];

const STOCK_PATTERNS: RegExp[] = [
  /\bstock\s+on\s+hand\b/i,
  /\bstock\s*-?\s*out\b/i,
  /\bout\s+of\s+stock\b/i,
  /\bdoses?\s+(used|issued|received|utili[sz]ed)\b/i,
  /\bcommodity\s+consumption\b/i,
  /\baverage\s+monthly\s+consumption\b/i,
  /\bAMC\b(?!\s*attendance)/,
  /\bvaccines?\s+utilization\b(?![\w\s/%.-]{0,40}\b(actual|expected)\s+reports)/i,
  /\butilization\s+summary\b(?![\w\s/%.-]{0,40}\b(actual|expected)\s+reports)/i,
];

const POPULATION_PATTERNS: RegExp[] = [
  /\bcatchment\s+area\s+population\b/i,
  /\bfacility\s+catchment\b/i,
  /\btarget\s+population\b/i,
  /\bestimated\s+population\b/i,
];

const META: Record<MeasureKind, MeasureKindMeta> = {
  cases: { kind: "cases", category: null, unit: "cases", label: "Cases" },
  completeness: {
    kind: "completeness",
    category: "completeness",
    unit: "%",
    label: "Reporting rate",
  },
  coverage: {
    kind: "coverage",
    category: "coverage",
    unit: "%",
    label: "Coverage",
  },
  positivity: {
    kind: "positivity",
    category: "positivity",
    unit: "%",
    label: "Positivity",
  },
  stock: { kind: "stock", category: "stock", unit: "units", label: "Stock" },
  population: {
    kind: "population",
    category: "population",
    unit: "persons",
    label: "Population",
  },
};

export function detectMeasureKind(
  raw: string | null | undefined,
): MeasureKindMeta {
  if (!raw?.trim()) return META.cases;
  if (COMPLETENESS_PATTERNS.some((re) => re.test(raw))) return META.completeness;
  if (POSITIVITY_PATTERNS.some((re) => re.test(raw))) return META.positivity;
  if (POPULATION_PATTERNS.some((re) => re.test(raw))) return META.population;
  if (STOCK_PATTERNS.some((re) => re.test(raw))) return META.stock;
  if (COVERAGE_PATTERNS.some((re) => re.test(raw))) return META.coverage;
  return META.cases;
}

export const MEASURE_KIND_FILTERS: Array<{
  value: MeasureKind | "all";
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "cases", label: "Cases" },
  { value: "completeness", label: "Reporting rate" },
  { value: "coverage", label: "Coverage" },
  { value: "positivity", label: "Positivity" },
  { value: "stock", label: "Stock" },
  { value: "population", label: "Population" },
];
