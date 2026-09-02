export const DATASETS_QUEUE_PAGE_TIP =
  "New uploads enter as pending and move through review before approval. Approved datasets must still be published to appear on the public catalogue — approval and publishing are separate steps.";

export const DATASETS_QUEUE_METRIC_TIPS = {
  pending: "Submitted and waiting for a reviewer to open the dataset.",
  under_review: "A reviewer has started but not yet approved or rejected.",
  approved:
    "Accepted for the catalogue but not yet visible on the public portal — use Publish.",
  published: "Live on the public catalogue (approved and published).",
  rejected: "Returned to the submitter with review feedback.",
} as const;

export const DATASETS_QUEUE_PANEL_TIP =
  "Browse all datasets or filter by workflow status. Search matches title, format, and organisation. Select rows to archive many at once — analytics-loaded datasets are retracted when you confirm.";

export const DATASETS_PUBLISH_TIP =
  "Make an approved dataset visible on the public portal. Tabular datasets may still need analytics load for charts.";
