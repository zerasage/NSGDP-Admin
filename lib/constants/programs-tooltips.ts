export const PROGRAMS_PAGE_TIP =
  "Programmes track health initiatives — campaigns, surveillance rounds, screening drives, and training. Set target LGAs and outcome metrics, then update progress from each programme's detail page.";

export const PROGRAMS_METRIC_TIPS = {
  total: "Every programme record on the platform, across all statuses.",
  active: "Initiatives currently running or scheduled within their timeline.",
  completed: "Programmes that have finished — progress and coverage are retained for reporting.",
  suspended: "Paused or on hold — not counted as active but still visible to admins.",
} as const;

export const PROGRAMS_PANEL_TIP =
  "Browse programmes, filter by status or type, and search by name or code.";

export const PROGRAMS_TAB_TIPS = {
  all: "Every programme regardless of status.",
  active: "Currently running or within their active window.",
  completed: "Finished initiatives kept for historical reporting.",
  suspended: "Paused programmes not currently delivering.",
  archived: "Withdrawn from the public catalogue but retained for admins.",
} as const;

export const PROGRAMS_CREATE_TIP =
  "Register a new initiative with type, timeline, target LGAs, and how progress will be measured (LGA coverage, outcome count, or both).";

export const PROGRAM_DETAIL_PAGE_TIP =
  "View rollout progress, geographic coverage, and outcome metrics. Edit programme details or update progress from the actions above.";

export const PROGRAM_DETAIL_METRIC_TIPS = {
  outcomeTarget:
    "The numeric goal for the primary outcome metric — e.g. children vaccinated or people trained.",
  outcomeReached:
    "Latest reported count toward the outcome target. Update via Update progress.",
  lgaCoverage:
    "How many target LGAs have been marked covered versus the programme's geographic scope.",
  timeline:
    "Days active, days until start, or time remaining based on the programme schedule.",
} as const;

export const PROGRAM_PROGRESS_PANEL_TIP =
  "Headline progress follows the programme's tracking mode — LGA coverage, an outcome count, or both. Use Update progress to record coverage and reach.";

export const PROGRAM_UPDATE_PROGRESS_TIP =
  "Record which LGAs are covered and/or update the outcome count. Progress feeds the public programme page and admin metrics.";

export const PROGRAM_INFO_PANEL_TIP =
  "Core metadata — type, status, programme code, and audit timestamps.";

export const PROGRAM_TIMELINE_PANEL_TIP =
  "Planned start and end dates used to calculate active days and time remaining.";

export const PROGRAM_COVERAGE_PANEL_TIP =
  "Target LGAs define geographic scope. Badges marked covered reflect the latest progress update.";

export const PROGRAM_OBJECTIVES_PANEL_TIP =
  "Stated goals and deliverables for this initiative — shown on the public programme page when published.";
