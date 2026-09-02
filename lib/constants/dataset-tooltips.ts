/** Plain-language help for dataset detail and per-dataset ingestion pages. */

export const DATASET_PAGE_TIPS = {
  catalogue:
    "The public portal listing — visitors can find and download the file. Separate from analytics charts.",
  analytics:
    "When resolved rows were loaded into the analytics warehouse so portal charts and maps can use them.",
  publish_catalogue:
    "Make this dataset visible on the public portal. Tabular uploads still need analytics load for charts.",
  unpublish_catalogue:
    "Hide the dataset from the public portal. Warehouse rows stay until you retract analytics.",
  load_analytics:
    "Copy resolved staging rows into the analytics warehouse. Required before charts show this data.",
  retract_analytics:
    "Remove this dataset's rows from portal charts. The catalogue file stays unless you unpublish.",
} as const;

export const ANALYTICS_PIPELINE_STEP_TIPS = {
  ingested:
    "Workbook parsed and staging rows written. Canonicalization finished or in progress.",
  aliasesClear:
    "Every column name and LGA string is resolved — no pending alias decisions blocking load.",
  catalogueLive:
    "Dataset is published on the public portal (downloadable file).",
  analyticsLoaded:
    "Burden rows are in the analytics warehouse — portal charts and maps can read them.",
} as const;

export const DATASET_INGESTION_PAGE_TIP =
  "Canonicalization for this workbook — parse sheets, match indicators and LGAs, then clear the alias queue before analytics can load.";

export const DATASET_INGESTION_ACTION_TIPS = {
  run:
    "Queue canonicalization — parses the workbook and rebuilds the report and alias queue.",
  retry:
    "Re-run after a failure or workbook change. Replaces the previous report and alias suggestions.",
  stop:
    "Cancel the running job. Safe to retry once the workbook or blockers are fixed.",
} as const;

export const DATASET_INGESTION_TAB_TIPS = {
  report:
    "Resolution stats after the pipeline ran — matched rows, holds, and per-sheet coverage.",
  related:
    "Possible duplicate studies found by overlapping indicators, areas, and time periods. Confirm or reject each link.",
} as const;

export const DATASET_ALIASES_TIP =
  "Column and LGA names from this workbook that did not auto-match. Approve to link them to the registry.";

export const INGESTION_SUMMARY_METRIC_TIPS = {
  staging_rows:
    "Parsed rows from the workbook sitting in staging before or after indicator matching.",
  resolved:
    "Rows successfully linked to a canonical indicator and org unit.",
  auto_resolution:
    "Share of rows matched automatically without a human alias decision.",
  pending_aliases:
    "Column or LGA names still waiting for approve / reject in the Aliases tab.",
} as const;

export const INGESTION_REPORT_TIPS = {
  staging_rows:
    "Total parsed data points emitted from handled sheets.",
  resolved: "Rows with a matched indicator and org unit.",
  flagged: "Rows held back — usually waiting on alias review or validation.",
  auto_resolution: "Percentage resolved without human alias review.",
  held_for_review:
    "Why rows are blocked. Most often an unknown indicator name or unmapped LGA.",
  per_sheet_coverage:
    "How each sheet was classified and how completely indicators were matched.",
  species:
    "Detected workbook layout (wide pivot, long format, survey export, etc.). Determines which parser runs.",
  ai_summary:
    "Plain-language overview generated from the coverage register — useful for handoff notes.",
} as const;

export const INGESTION_FITNESS_TIPS = {
  panel:
    "Whether this workbook produced rows suitable for analytics charts — not a judgement on catalogue value.",
  observations: "Total parsed data points across all handled sheets.",
  usable:
    "Rows with a matched indicator and in-scope LGA — eligible for the analytics warehouse.",
  out_of_scope:
    "Rows whose geography could not be mapped to an official LGA in Niger State.",
  sheets:
    "How many sheets were parsed vs skipped as unknown layout or archived.",
  usable_rate: "Share of observations ready for analytics load.",
  out_of_scope_geo: "Share of rows with geography outside the mapped LGA set.",
  indicator_pending: "Share of rows blocked until an indicator alias is decided.",
  org_pending: "Share of rows blocked until an org-unit (LGA) alias is decided.",
} as const;

export const INGESTION_PROGRESS_TIP =
  "Live canonicalization stages — parse workbook, match indicators, write staging rows. Each stage updates as the worker progresses.";

export const RELATED_DATASETS_TIPS = {
  panel:
    "Another upload may describe the same study under a different name or organisation. Confirm to link them; reject if unrelated.",
  candidates: "Suggested links from automatic overlap detection.",
  pending: "Awaiting your confirm or reject decision.",
  confirmed: "Links you accepted — shown on both datasets.",
} as const;
