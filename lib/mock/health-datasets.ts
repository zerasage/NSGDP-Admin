import type { Dataset, HealthCategory, FileFormat } from "@/types";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";

type OrgRef = { id: string; slug: string; name: string };

const ORGS: Record<string, OrgRef> = {
  nsphcda: { id: "org-1", slug: "nsphcda", name: "NSPHCDA" },
  moh: { id: "org-2", slug: "niger-state-ministry-of-health", name: "Niger State Ministry of Health" },
  nphcda: { id: "org-3", slug: "nphcda", name: "NPHCDA" },
  grid3: { id: "org-4", slug: "grid3-nigeria", name: "GRID3 Nigeria" },
  fmh: { id: "org-5", slug: "federal-ministry-of-health", name: "Federal Ministry of Health" },
  surv: { id: "org-6", slug: "nsphcda-surveillance", name: "NSPHCDA Surveillance Unit" },
  rh: { id: "org-7", slug: "nsphcda-reproductive-health", name: "NSPHCDA Reproductive Health" },
  npc: { id: "org-8", slug: "national-population-commission", name: "National Population Commission" },
};

const CAT_GROUPS: Record<HealthCategory, { id: string; slug: string; name: string }> = {
  disease: { id: "grp-1", slug: "disease-data", name: "Disease Data" },
  facilities: { id: "grp-2", slug: "health-facilities", name: "Health Facilities" },
  population: { id: "grp-3", slug: "population", name: "Population" },
  surveillance: { id: "grp-4", slug: "surveillance", name: "Surveillance" },
};

let idCounter = 1;

function ds(
  slug: string,
  title: string,
  category: HealthCategory,
  orgKey: keyof typeof ORGS,
  opts: Partial<Dataset> & { formats: FileFormat[] }
): Dataset {
  const id = String(idCounter++);
  return {
    id,
    slug,
    title,
    description: opts.description ?? `${title} — NSPHCDA Data Portal dataset.`,
    organisation: ORGS[orgKey],
    groups: [CAT_GROUPS[category]],
    healthCategory: category,
    visibility: opts.visibility ?? "public",
    status: opts.status ?? "published",
    formats: opts.formats,
    lgaCoverage: opts.lgaCoverage ?? [...NIGER_STATE_LGAS],
    downloadCount: opts.downloadCount ?? Math.floor(Math.random() * 400) + 50,
    updatedAt: opts.updatedAt ?? "2026-05-15T10:00:00Z",
    resources: opts.resources,
    custodian: opts.custodian ?? ORGS[orgKey].name,
    dateCollected: opts.dateCollected ?? "2024-12-31",
    updateFrequency: opts.updateFrequency ?? "Quarterly",
    methodology: opts.methodology ?? "DHIS2 aggregate extraction and LGA-level validation.",
    citation: opts.citation ?? `${title}. NSPHCDA Data Portal. NSPHCDA, ${new Date().getFullYear()}.`,
    dataType: opts.dataType ?? (opts.formats.includes("GeoJSON") ? "spatial" : "attribute"),
    source: opts.source ?? "DHIS2 / NHMIS",
    portalSource: "NSPHCDA Data Portal",
    keyAttributes: opts.keyAttributes ?? [
      { fieldName: "lga", exampleValue: "Minna", description: "Local Government Area" },
      { fieldName: "reporting_period", exampleValue: "2024-Q4", description: "Reporting period" },
      { fieldName: "case_count", exampleValue: "142", description: "Aggregated case count" },
    ],
    responsibleDept: opts.responsibleDept ?? "Directorate of Planning, Research & Statistics",
    contactPerson: opts.contactPerson ?? "Data Focal Person, NSPHCDA",
    geographicCoverage: opts.geographicCoverage ?? "All 25 LGAs, Niger State",
    reportingPeriod: opts.reportingPeriod ?? "Jan 2024 – Dec 2024",
    datePublished: opts.datePublished ?? opts.updatedAt?.split("T")[0] ?? "2025-01-01",
    dataLicense: opts.dataLicense ?? "CC BY 4.0",
    tags: opts.tags,
    disease: opts.disease,
    reportingYear: opts.reportingYear ?? 2024,
    wardCoverage: opts.wardCoverage,
    facilityScope: opts.facilityScope,
    linkedProgram: opts.linkedProgram,
    programId: opts.programId,
    lifecycleStage: opts.lifecycleStage ?? (opts.status === "published" ? "published" : "submitted"),
  };
}

export const mockDatasets: Dataset[] = [
  // P1 Disease Data
  ds("malaria-case-surveillance", "Malaria Case Surveillance", "disease", "surv", {
    formats: ["CSV", "XLSX"],
    description: "Confirmed and suspected malaria cases by LGA, age group, and month. 2013–present.",
    downloadCount: 512,
    updateFrequency: "Monthly",
    source: "DHIS2 Malaria Unit",
    disease: "Malaria",
    reportingYear: 2024,
    wardCoverage: ["Tunga", "Minna Central", "Shango"],
    linkedProgram: "malaria-sia-2025",
    updatedAt: "2024-08-01T10:00:00Z",
  }),
  ds("meningitis-cases", "Meningitis Cases", "disease", "surv", {
    formats: ["CSV", "PDF"],
    visibility: "restricted",
    description: "Meningitis case reports during dry-season surveillance windows.",
    downloadCount: 198,
    disease: "Meningitis",
    reportingYear: 2025,
    wardCoverage: ["Lapai Central", "Bida Central"],
  }),
  ds("cholera-diphtheria-outbreak", "Cholera & Diphtheria Outbreak Data", "disease", "surv", {
    formats: ["CSV", "GeoJSON"],
    description: "Outbreak line lists and LGA aggregates for cholera and diphtheria response.",
    downloadCount: 287,
    dataType: "spatial",
  }),
  ds("routine-immunisation", "Routine Immunisation Coverage", "disease", "nphcda", {
    formats: ["CSV", "XLSX"],
    description: "Pentavalent, measles, and OPV coverage by LGA and facility.",
    downloadCount: 341,
  }),
  ds("hiv-unit-data", "HIV Unit Data", "disease", "moh", {
    formats: ["CSV"],
    visibility: "restricted",
    description: "HIV testing, treatment, and PMTCT indicators by LGA.",
    downloadCount: 156,
  }),
  ds("tb-unit-data", "TB Unit Data", "disease", "moh", {
    formats: ["CSV", "XLSX"],
    visibility: "restricted",
    description: "TB notification, treatment outcomes, and DOTS coverage.",
    downloadCount: 134,
  }),
  ds("maternal-health-indicators", "Maternal Health Indicators", "disease", "rh", {
    formats: ["CSV", "PDF"],
    description: "ANC attendance, skilled delivery, and postnatal care by LGA.",
    downloadCount: 276,
  }),
  ds("child-health-nutrition", "Child Health & Nutrition", "disease", "rh", {
    formats: ["CSV", "XLSX"],
    description: "Under-5 nutrition screening, SAM/MAM cases, and growth monitoring.",
    downloadCount: 223,
  }),
  ds("ntd-data", "Neglected Tropical Diseases (NTD) Data", "disease", "nphcda", {
    formats: ["CSV"],
    description: "Onchocerciasis, lymphatic filariasis, and schistosomiasis programme data.",
    downloadCount: 89,
  }),

  // P1 Facilities
  ds("health-facility-registry-hfr", "Health Facility Registry (HFR)", "facilities", "nphcda", {
    formats: ["GeoJSON", "CSV", "XLSX"],
    description: "National HFR extract for Niger State — all registered PHC and hospital facilities.",
    downloadCount: 678,
    dataType: "spatial",
    updateFrequency: "Monthly",
    facilityScope: "All Facilities",
    reportingYear: 2026,
    resources: [
      { id: "r-hfr-1", name: "niger_hfr.geojson", format: "GeoJSON", sizeBytes: 312000, updatedAt: "2026-06-01T00:00:00Z" },
      { id: "r-hfr-2", name: "niger_hfr.csv", format: "CSV", sizeBytes: 98000, updatedAt: "2026-06-01T00:00:00Z" },
    ],
    keyAttributes: [
      { fieldName: "facility_name", exampleValue: "Minna PHC", description: "Facility name" },
      { fieldName: "facility_type", exampleValue: "PHC", description: "Facility classification" },
      { fieldName: "lga", exampleValue: "Chanchaga", description: "LGA" },
    ],
  }),
  ds("phc-operational-status", "PHC Operational Status", "facilities", "nsphcda", {
    formats: ["CSV", "XLSX"],
    description: "Operational status, staffing levels, and service availability at PHC level.",
    downloadCount: 312,
  }),

  // P1 Population
  ds("population-estimates-boundaries", "Population Estimates & Boundaries", "population", "grid3", {
    formats: ["GeoJSON", "CSV"],
    description: "GRID3 population estimates and administrative boundaries for all 25 LGAs.",
    downloadCount: 445,
    dataType: "spatial",
    source: "GRID3 Nigeria",
  }),
  ds("population-projections", "Population Projections 2020–2030", "population", "npc", {
    formats: ["CSV", "XLSX"],
    description: "LGA-level population projections by age and sex.",
    downloadCount: 167,
    source: "National Population Commission",
  }),
  ds("nhmis-aggregate", "NHMIS Aggregate Indicators", "population", "nsphcda", {
    formats: ["CSV", "XLSX", "PDF"],
    description: "National Health Management Information System aggregate indicators for Niger State.",
    downloadCount: 389,
    source: "NHMIS",
  }),

  // P1 Surveillance
  ds("idsr-weekly-reports", "IDSR Weekly Reports", "surveillance", "surv", {
    formats: ["CSV", "PDF"],
    description: "Integrated Disease Surveillance and Response weekly bulletin data.",
    downloadCount: 234,
    updateFrequency: "Weekly",
  }),
  ds("outbreak-line-lists", "Outbreak Line Lists", "surveillance", "surv", {
    formats: ["CSV"],
    visibility: "restricted",
    description: "De-identified outbreak line lists for epidemic response teams.",
    downloadCount: 112,
  }),
  ds("mortality-registry", "Mortality Registry", "surveillance", "moh", {
    formats: ["CSV", "XLSX"],
    visibility: "restricted",
    description: "Facility-reported mortality by cause category and LGA.",
    downloadCount: 98,
  }),

  // P2 datasets
  ds("hr-registry", "Health Worker Registry", "facilities", "nsphcda", {
    formats: ["CSV", "XLSX"],
    visibility: "restricted",
    description: "Health workforce registry — cadre, facility assignment, and LGA.",
    downloadCount: 76,
  }),
  ds("drug-stock-availability", "Drug Stock Availability", "surveillance", "nsphcda", {
    formats: ["CSV"],
    description: "Essential medicine stock levels at facility and LGA warehouse level.",
    downloadCount: 145,
    updateFrequency: "Monthly",
  }),
  ds("immunisation-campaigns", "Immunisation Campaign Records", "disease", "nphcda", {
    formats: ["CSV", "XLSX"],
    description: "Campaign coverage data for MR, OPV, IPV, and outbreak response SIAs.",
    downloadCount: 201,
  }),
  ds("lab-results-surveillance", "Laboratory Results — Surveillance", "surveillance", "surv", {
    formats: ["CSV"],
    visibility: "restricted",
    description: "Laboratory-confirmed disease results linked to surveillance cases.",
    downloadCount: 67,
  }),
  ds("ward-boundaries", "Ward Administrative Boundaries", "population", "grid3", {
    formats: ["GeoJSON", "Shapefile"],
    description: "274 ward boundaries for Niger State with population attributes.",
    downloadCount: 298,
    dataType: "spatial",
  }),
  ds("dhis2-export-template", "DHIS2 Export Template", "surveillance", "nsphcda", {
    formats: ["CSV", "JSON"],
    description: "Standardised DHIS2 data export template for LGA data officers.",
    downloadCount: 54,
    source: "DHIS2",
  }),
  ds("facility-catchment-population", "Facility Catchment Population", "facilities", "grid3", {
    formats: ["GeoJSON", "CSV"],
    description: "Estimated catchment population per health facility for planning.",
    downloadCount: 187,
    dataType: "spatial",
  }),
  ds("anc-delivery-indicators", "ANC & Delivery Indicators by Ward", "disease", "rh", {
    formats: ["CSV"],
    description: "Ward-level maternal health service delivery indicators.",
    downloadCount: 143,
    disease: "Maternal Health",
    wardCoverage: ["Tunga", "Kpakungu", "Limawa"],
    reportingYear: 2024,
  }),

  // ── Expanded catalogue (debrief f1) ────────────────────────────────────────
  ds("hrh-workforce-profiles", "HRH Workforce Profiles by LGA", "facilities", "nphcda", {
    formats: ["CSV", "XLSX"],
    description: "Health workforce profiles by cadre, facility assignment, and LGA — doctors, nurses, midwives, CHEWs.",
    downloadCount: 92,
    tags: ["HRH", "workforce", "human resources"],
    facilityScope: "PHC",
    reportingYear: 2025,
    updateFrequency: "Quarterly",
  }),
  ds("budget-aop-2025", "State Health Budget & Annual Operational Plan 2025", "surveillance", "nsphcda", {
    formats: ["XLSX", "PDF"],
    description: "Approved health sector budget allocations and AOP line items by programme and LGA.",
    downloadCount: 64,
    tags: ["budget", "AOP", "finance"],
    reportingYear: 2025,
    dataLicense: "Restricted Use",
    visibility: "restricted",
  }),
  ds("nhmis-non-dhis2-indicators", "NHMIS Indicators Not in DHIS2", "population", "nsphcda", {
    formats: ["CSV", "XLSX"],
    description: "NHMIS aggregate indicators collected outside DHIS2 routine reporting — community outreach, campaigns, and surveys.",
    downloadCount: 118,
    tags: ["NHMIS", "non-DHIS2"],
    reportingYear: 2024,
    source: "NHMIS Offline Forms",
  }),
  ds("open-lms-training-records", "Open LMS Training Completion Records", "facilities", "nsphcda", {
    formats: ["CSV", "JSON"],
    description: "Health worker training completion records from the Open Learning Management System.",
    downloadCount: 47,
    tags: ["Open LMS", "training", "capacity building"],
    reportingYear: 2025,
    updateFrequency: "Monthly",
  }),
  ds("programme-implementation-tracker", "Programme Implementation Datasets", "surveillance", "nsphcda", {
    formats: ["CSV", "XLSX"],
    description: "Implementation monitoring data for state health programmes — coverage, reach, and milestone indicators.",
    downloadCount: 83,
    tags: ["programme", "M&E", "implementation"],
    linkedProgram: "measles-rubella-integrated-2026",
    programId: "prog-1",
    reportingYear: 2026,
  }),
  ds("phc-inventory-2020", "Outdated PHC Inventory 2020", "facilities", "nsphcda", {
    formats: ["CSV"],
    description: "Legacy PHC inventory superseded by HFR 2024 extract.",
    downloadCount: 12,
    status: "archived",
    lifecycleStage: "archived",
    updatedAt: "2020-12-31T00:00:00Z",
    archiveInfo: {
      archivedAt: "2025-06-01T00:00:00Z",
      archivedBy: "Musa Abdullahi",
      reason: "Superseded by Health Facility Registry (HFR) 2024 extract",
    },
  }),
];
