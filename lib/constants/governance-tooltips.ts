export const GOVERNANCE_PAGE_TIP =
  "Platform-wide data health — pipeline status, publish freshness, alias resolution quality, open ingestion conflicts, and missing values in the analytics warehouse.";

export const GOVERNANCE_METRIC_TIPS = {
  total: "Every dataset record on the platform regardless of workflow status.",
  pending: "Datasets awaiting approval, review, or publish — not yet fully live in the catalogue.",
  overdue: "Published datasets past their scheduled update date — partners may be late submitting refreshes.",
  conflicts: "Open Stored vs Upload disagreements — unique rows still load; charts keep stored values until you pick in Ingestion Ops.",
} as const;

export const GOVERNANCE_PANEL_TIPS = {
  byStatus: "How many datasets sit in each workflow state — draft through published and archived.",
  freshness: "Update schedule compliance for published catalogue entries only.",
  byCategory: "Distribution of datasets across catalogue categories — spot concentration or gaps.",
  ingestionQuality:
    "Alias auto-match rate and staging backlog — low auto-resolution means more manual work in Ingestion Ops.",
  burdenQuality:
    "Indicators where source files left gaps (missing burden rows) — high percentages may distort charts and maps.",
} as const;

export const GOVERNANCE_MISSING_PCT_TIP =
  "Share of warehouse rows marked missing for that indicator — investigate source files or ingestion mapping when consistently high.";
