import type { ProgrammeType } from "@/lib/api/programs";

export type ProgrammeProgressMode =
  | "lga_coverage"
  | "outcome_metric"
  | "combined";

export const PROGRESS_MODE_OPTIONS: Array<{
  value: ProgrammeProgressMode;
  label: string;
  description: string;
}> = [
  {
    value: "lga_coverage",
    label: "LGA coverage",
    description:
      "Progress = target LGAs vs LGAs marked covered. Best for rollouts, surveillance zones, and infrastructure spread.",
  },
  {
    value: "outcome_metric",
    label: "Outcome count",
    description:
      "Progress = a numeric target you define (people trained, doses given, cases investigated). Geographic scope still uses target LGAs.",
  },
  {
    value: "combined",
    label: "Both LGA and outcome",
    description:
      "Track geographic rollout and a separate outcome metric — e.g. campaign in 15 LGAs aiming to vaccinate 50,000 children.",
  },
];

const DEFAULT_BY_TYPE: Record<ProgrammeType, ProgrammeProgressMode> = {
  campaign: "combined",
  surveillance: "lga_coverage",
  screening: "combined",
  training: "outcome_metric",
  infrastructure: "lga_coverage",
  research: "outcome_metric",
  other: "combined",
};

export function defaultProgressModeForType(
  type: ProgrammeType | null | undefined,
): ProgrammeProgressMode {
  if (!type) return "combined";
  return DEFAULT_BY_TYPE[type];
}

export function tracksLgaCoverage(mode: ProgrammeProgressMode | null | undefined): boolean {
  return mode === "lga_coverage" || mode === "combined";
}

export function tracksOutcomeMetric(
  mode: ProgrammeProgressMode | null | undefined,
): boolean {
  return mode === "outcome_metric" || mode === "combined";
}

export function lgaCoverageCounts(program: {
  target_lgas: string[] | null;
  covered_lgas?: string[] | null;
  lgas_covered_count?: number | null;
}): { target: number; reach: number } {
  const target = program.target_lgas?.length ?? 0;
  const reach =
    program.covered_lgas?.length ?? program.lgas_covered_count ?? 0;
  return { target, reach };
}

export function lgaCoveragePercent(program: {
  target_lgas: string[] | null;
  covered_lgas?: string[] | null;
  lgas_covered_count?: number | null;
}): number | null {
  const { target, reach } = lgaCoverageCounts(program);
  if (target <= 0) return null;
  return Math.min(100, Math.round((reach / target) * 100));
}

export function outcomeMetricPercent(program: {
  target_count: number | null;
  reach_count: number | null;
}): number | null {
  if (
    program.target_count == null ||
    program.target_count <= 0 ||
    program.reach_count == null
  ) {
    return null;
  }
  return Math.min(
    100,
    Math.round((program.reach_count / program.target_count) * 100),
  );
}

/** Headline progress for list cards — prefers outcome when tracked, else LGA. */
export function headlineProgressPercent(program: {
  progress_mode?: ProgrammeProgressMode | null;
  target_lgas: string[] | null;
  covered_lgas?: string[] | null;
  lgas_covered_count?: number | null;
  target_count: number | null;
  reach_count: number | null;
}): number | null {
  return headlineProgressSummary(program).percent;
}

/** Label + basis for list/table progress display. */
export function headlineProgressSummary(program: {
  progress_mode?: ProgrammeProgressMode | null;
  primary_metric?: string | null;
  target_lgas: string[] | null;
  covered_lgas?: string[] | null;
  lgas_covered_count?: number | null;
  target_count: number | null;
  reach_count: number | null;
}): { percent: number | null; basis: string | null } {
  const mode = program.progress_mode ?? "lga_coverage";
  const lgaPct = lgaCoveragePercent(program);
  const outcomePct = outcomeMetricPercent(program);
  const { target, reach } = lgaCoverageCounts(program);

  if (mode === "combined") {
    if (outcomePct != null) {
      return {
        percent: outcomePct,
        basis: program.primary_metric?.trim() || "Outcome metric",
      };
    }
    if (lgaPct != null) {
      return {
        percent: lgaPct,
        basis: `${reach}/${target} LGAs covered`,
      };
    }
    return { percent: null, basis: null };
  }

  if (mode === "outcome_metric") {
    return {
      percent: outcomePct,
      basis: program.primary_metric?.trim() || "Outcome metric",
    };
  }

  return {
    percent: lgaPct,
    basis: target > 0 ? `${reach}/${target} LGAs covered` : null,
  };
}
