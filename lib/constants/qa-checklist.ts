export interface QADimension {
  id: string;
  label: string;
  description: string;
  guidanceItems: string[];
}

export const QA_DIMENSIONS: QADimension[] = [
  {
    id: "completeness",
    label: "Completeness",
    description: "All required metadata fields are present and no critical data gaps exist.",
    guidanceItems: [
      "All 14 mandatory metadata fields are filled",
      "No blank LGA rows for mandatory reporting periods",
      "Contact person and responsible dept are identified",
    ],
  },
  {
    id: "accuracy",
    label: "Accuracy",
    description: "Values are within expected statistical ranges and aligned with known baselines.",
    guidanceItems: [
      "Case counts are within 3 standard deviations of prior-year LGA values",
      "Facility counts match NHMIS registry ± 5%",
      "Population denominators align with NPC projections",
    ],
  },
  {
    id: "consistency",
    label: "Consistency",
    description: "Data agrees with previously published datasets and cross-referenced sources.",
    guidanceItems: [
      "Aggregates match sum of disaggregated records",
      "Temporal trends are plausible (no unexplained step-changes)",
      "Totals cross-check with DHIS2 aggregate",
    ],
  },
  {
    id: "timeliness",
    label: "Timeliness",
    description: "Data was submitted within the agreed reporting window for the period it covers.",
    guidanceItems: [
      "Submission date is within 90 days of reporting period end",
      "Update frequency matches the schedule declared at submission",
      "No data from future dates",
    ],
  },
  {
    id: "validity",
    label: "Validity",
    description: "Values conform to defined formats, value lists, and acceptable ranges.",
    guidanceItems: [
      "Dates follow ISO 8601 format (YYYY-MM-DD)",
      "LGA names match the official Niger State LGA list (25 LGAs)",
      "Coded fields use approved code lists",
    ],
  },
  {
    id: "uniqueness",
    label: "Uniqueness",
    description: "No duplicate records, rows or resources are present in the dataset.",
    guidanceItems: [
      "No duplicate LGA-period combinations",
      "No identical resource files (hash check)",
      "No repeated facility codes",
    ],
  },
  {
    id: "geo_refs",
    label: "Geo-References",
    description: "Spatial data is correctly projected and geographic identifiers are accurate.",
    guidanceItems: [
      "Coordinate system is WGS 84 (EPSG:4326)",
      "All points fall within Niger State bounding box",
      "LGA polygons close without gaps or overlaps",
    ],
  },
  {
    id: "documentation",
    label: "Documentation",
    description: "Data dictionary, methodology notes, and citation are present and understandable.",
    guidanceItems: [
      "Methodology note explains collection method",
      "Citation is correctly formatted",
      "Key attributes table describes all columns",
    ],
  },
];

export type QAResult = "pass" | "fail" | "na" | "pending";

/** True when every dimension is Pass or N/A (no pending, no fail). */
export function isQAChecklistPassed(
  qa: Record<string, { result: QAResult }>
): boolean {
  return QA_DIMENSIONS.every((d) => {
    const result = qa[d.id]?.result ?? "pending";
    return result === "pass" || result === "na";
  });
}
