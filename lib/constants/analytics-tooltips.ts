export const ANALYTICS_PAGE_TIP =
  "Platform-wide reporting — user growth, catalogue usage, partner contributions, and ingestion health. Most charts respect the date range selector; headline totals and leaderboards use all-time or live counts where noted.";

export const ANALYTICS_RANGE_TIP =
  "Filters time-series charts and range-scoped metrics (uploads, new users). Headline totals, activity graph windows, and download leaderboards are not all tied to this selector.";

export const ANALYTICS_EXPORT_TIP =
  "Download a CSV snapshot of the analytics summary for the selected range — useful for offline reporting and stakeholder updates.";

export const ANALYTICS_REFRESH_TIP =
  "Force an immediate recompute of the platform analytics cache (KPIs, trends, LGA coverage). Nightly worker runs automatically — use after major publishes if charts look stale.";

export const ANALYTICS_METRIC_TIPS = {
  totalUsers: "Every registered account on the platform, including inactive and pending users.",
  totalDatasets: "All dataset records regardless of workflow status — draft through published.",
  totalDownloads: "Cumulative catalogue downloads since launch, across all published datasets.",
  downloadsThisMonth: "Downloads recorded in the current calendar month — resets on the 1st.",
  pendingReview: "Datasets waiting in the review queue (pending or under review).",
  uploadsInRange: "New dataset records created during the selected date range.",
  newUsersInRange: "User accounts registered during the selected date range.",
  openConflicts:
    "Uploads that disagree with values already stored in analytics on the same indicator, location, and period. Resolve in Ingestion Ops → Conflicts — your choice updates analytics and unblocks warehouse load.",
} as const;

export const ANALYTICS_PANEL_TIPS = {
  dailyActivity:
    "Day-by-day dataset views and downloads. Toggle between the last 7 and 30 days — independent of the main date range selector.",
  uploadsOverTime:
    "Monthly count of new datasets created. Reflects partner and agency upload activity over the selected range.",
  newUsersOverTime:
    "Monthly account registrations — staff, contributors, and public users combined.",
  topDownloads:
    "Bar chart of the most downloaded catalogue datasets by all-time download count.",
  downloadLeaderboard:
    "Ranked table of the same popular datasets with exact download totals.",
  byOrganisation:
    "How many datasets each partner organisation has contributed to the catalogue.",
  byCategory:
    "Distribution of datasets across health-domain categories for catalogue coverage analysis.",
  pipelineByStatus:
    "Snapshot of where datasets sit in the workflow — draft, review, approved, published, and archived.",
  publishedFreshness:
    "Update-schedule health for live catalogue entries — overdue counts, due-soon windows, and entries without a schedule.",
} as const;
