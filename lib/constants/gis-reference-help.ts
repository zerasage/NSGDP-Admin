/** Structured in-app manual for GIS Reference Layers — plain language for operators. */

export type GisReferenceHelpSectionId =
  | "overview"
  | "layers"
  | "resolution"
  | "rebuild";

export type GisReferenceScenario = {
  if: string;
  then: string;
};

export type GisReferenceStep = {
  title: string;
  detail: string;
};

export type GisReferenceHelpSection = {
  sectionLabel: string;
  tagline: string;
  whatIsThis: string;
  whatYouCanDo: string[];
  steps: GisReferenceStep[];
  whatHappensNext: string[];
  scenarios: GisReferenceScenario[];
  tips?: string[];
};

export const GIS_REFERENCE_JOURNEY_STEPS = [
  {
    title: "Assign reference files",
    detail:
      "Upload one GeoPackage or spreadsheet per slot — LGA boundaries, ward polygons, facilities, population, and settlements.",
  },
  {
    title: "Rebuild gazetteer",
    detail:
      "Ward-related uploads queue a background job that rebuilds the canonical ward list maps and analytics use.",
  },
  {
    title: "Check match rate",
    detail:
      "The resolution report shows spellings that did not auto-match. Aim for 95%+ before trusting location analytics.",
  },
  {
    title: "Fix unmatched spellings",
    detail:
      "Confirm a ward mapping on this page, or send tricky names to Ingestion Ops → Aliases for ongoing alias review.",
  },
] as const;

export const GIS_REFERENCE_HELP_SECTION_ORDER: GisReferenceHelpSectionId[] = [
  "overview",
  "layers",
  "resolution",
  "rebuild",
];

export const GIS_REFERENCE_HELP: Record<
  GisReferenceHelpSectionId,
  GisReferenceHelpSection
> = {
  overview: {
    sectionLabel: "Overview",
    tagline: "Platform map layers and the canonical ward gazetteer",
    whatIsThis:
      "GIS Reference Layers is where staff maintain the shared geography every map and location-aware chart depends on. Unlike dataset uploads (one partner file at a time), these five slots are platform-wide sources — upload once, and the whole portal reads them.",
    whatYouCanDo: [
      "See which of the five slots are configured vs still empty",
      "Upload or replace boundary, facility, population, and settlement files",
      "Monitor spelling match rates after uploads",
      "Reconcile raw LGA/ward names that did not auto-match",
      "Manually rebuild the canonical ward gazetteer when needed",
    ],
    steps: [
      {
        title: "Configure all five slots",
        detail:
          "Start with LGA and ward boundaries — they anchor the gazetteer. Add facilities, population, and settlements when you have authoritative sources.",
      },
      {
        title: "Wait for rebuild to finish",
        detail:
          "After ward-boundary or facility uploads, a progress row appears on that slot. Do not trust match rates until the job completes.",
      },
      {
        title: "Clear unmatched spellings",
        detail:
          "Open the resolution report, work through unmatched rows, and recheck the headline match rate.",
      },
    ],
    whatHappensNext: [
      "Configured layers feed public map outlines, facility overlays, and population denominators",
      "Resolved spellings help dataset ingestion auto-match LGA/ward columns",
      "Unresolved spellings may block analytics for affected locations",
    ],
    scenarios: [
      {
        if: "A slot shows Unset",
        then: "Upload the expected file type shown in that row — maps may omit that layer until configured.",
      },
      {
        if: "Match rate is below 95%",
        then: "Go to Name resolution, confirm wards or send names to the alias queue before publishing location-heavy datasets.",
      },
      {
        if: "Facilities appear on the wrong ward",
        then: "Check facility registry spellings in the resolution report, then rebuild gazetteer if ward boundaries changed.",
      },
    ],
    tips: [
      "Legacy catalogue datasets still appear as a source on some slots — prefer dedicated GIS uploads when available.",
    ],
  },

  layers: {
    sectionLabel: "Map layers",
    tagline: "The five fixed reference slots",
    whatIsThis:
      "Each slot accepts one active source file. Replacing a file updates the whole platform — there is no per-organisation copy. Ward boundaries, facilities, and settlements participate in spelling reconciliation; LGA boundaries and population do not.",
    whatYouCanDo: [
      "Upload a missing layer or replace an outdated GeoPackage",
      "See which filename is active and when it was last updated",
      "Follow file-send and gazetteer rebuild progress inline on the row you just changed",
    ],
    steps: [
      {
        title: "Pick the slot",
        detail:
          "LGA Boundaries — state-wide LGA polygons (.gpkg). Ward Boundaries — ward polygons, primary gazetteer source (.gpkg).",
      },
      {
        title: "Upload or Replace",
        detail:
          "Choose a file matching the accepted format in the row. Optionally add a friendly label. The previous source is replaced immediately on success.",
      },
      {
        title: "Watch progress on the row",
        detail:
          "The replace dialog closes as soon as you confirm. File send and gazetteer rebuild progress show on that layer row — not in the dialog. Population and LGA-only changes skip gazetteer rebuild.",
      },
    ],
    whatHappensNext: [
      "Active layers show a green Active badge with the filename",
      "Reconcilable layers refresh their resolution report after rebuild completes",
      "Public maps pick up new geometry on next load",
    ],
    scenarios: [
      {
        if: "Upload button is disabled with Rebuilding badge",
        then: "Wait for the background job — uploading again will fail or queue behind the current run.",
      },
      {
        if: "Row links to a legacy catalogue dataset",
        then: "That slot still reads from an old published dataset — consider migrating to a dedicated GIS file upload.",
      },
    ],
    tips: [
      "Health Facility Registry and Settlements expect GeoPackage point or polygon layers with LGA/ward attribute columns.",
      "Population accepts CSV or Excel with LGA-level estimates for incidence denominators.",
    ],
  },

  resolution: {
    sectionLabel: "Name resolution",
    tagline: "Fix spellings that did not auto-match the gazetteer",
    whatIsThis:
      "GIS files often spell ward names differently from the canonical list (extra spaces, old spellings, abbreviations). The resolution report lists every raw LGA/ward pair that still lacks a gazetteer link after rebuild.",
    whatYouCanDo: [
      "Switch tabs between ward boundaries, facilities, and settlements",
      "Confirm a one-off mapping to the correct canonical ward",
      "Jump to Ingestion Ops alias review for recurring spelling variants",
      "Track total, matched, and unmatched counts per layer",
    ],
    steps: [
      {
        title: "Open the layer tab with unmatched count",
        detail:
          "Tabs with a red count badge need attention. The page auto-selects the worst layer when you arrive.",
      },
      {
        title: "Confirm ward for a row",
        detail:
          "Search the canonical ward in the LGA, confirm, and the spelling is saved as an alias for future uploads.",
      },
      {
        title: "Use Review queue for messy names",
        detail:
          "When the same variant appears across many datasets, approve it in Ingestion Ops → Aliases instead of confirming row by row.",
      },
    ],
    whatHappensNext: [
      "Confirmed mappings drop off the unmatched list on refresh",
      "Match rate rises toward 95%+ — the threshold analytics expects",
      "Dataset ingestion can auto-resolve the same spelling next time",
    ],
    scenarios: [
      {
        if: "Yellow coverage warning appears",
        then: "Match rate is under 95% — finish unmatched rows before relying on ward-level analytics from this layer.",
      },
      {
        if: "Unmatched list is empty but datasets still fail location match",
        then: "Check Ingestion Ops aliases — column names may differ from GIS attribute names.",
      },
    ],
    tips: [
      "Confirm ward is best for typos in this GIS file. Alias review is best for spelling variants in partner uploads.",
    ],
  },

  rebuild: {
    sectionLabel: "Gazetteer rebuild",
    tagline: "How the canonical ward list is built and refreshed",
    whatIsThis:
      "The gazetteer is the master list of LGAs and wards the platform uses everywhere — maps, facility assignment, and ingestion location matching. Rebuild compiles it from your configured reference layers in the background.",
    whatYouCanDo: [
      "Trigger a manual rebuild with Rebuild canonical wards (top right)",
      "See inline progress after uploading reconcilable layers",
      "Wait for completion before trusting resolution report numbers",
    ],
    steps: [
      {
        title: "Automatic rebuild",
        detail:
          "Uploading ward boundaries, facilities, or settlements queues rebuild automatically — no extra click needed.",
      },
      {
        title: "Manual rebuild",
        detail:
          "Use Rebuild canonical wards after bulk alias fixes, boundary corrections, or if ward assignments look stale across the platform.",
      },
      {
        title: "Confirm completion",
        detail:
          "Progress stages run from loading files through ward assignment and alias harvest. A toast confirms success; the row badge clears.",
      },
    ],
    whatHappensNext: [
      "Resolution reports refresh with updated match counts",
      "Maps and analytics use the new canonical ward geometry and names",
      "Failed rebuilds show an error toast — re-upload the source file or retry manual rebuild",
    ],
    scenarios: [
      {
        if: "Rebuild failed mid-run",
        then: "Check the source GeoPackage opens cleanly, then retry. A partial gazetteer may leave match rates unreliable.",
      },
      {
        if: "Match rate unchanged after rebuild",
        then: "Unmatched rows need manual Confirm ward or alias approval — rebuild alone does not guess new spellings.",
      },
    ],
    tips: [
      "Rebuild can take several minutes on large facility registries — leave the tab open or return later; progress persists in session.",
    ],
  },
};

export function getGisReferenceHelpSection(
  id: GisReferenceHelpSectionId,
): GisReferenceHelpSection {
  return GIS_REFERENCE_HELP[id];
}
