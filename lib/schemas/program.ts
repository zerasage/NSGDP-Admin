import { z } from "zod";
import {
  defaultProgressModeForType,
  tracksOutcomeMetric,
} from "@/lib/constants/program-progress";

const programmeTypeEnum = z.enum([
  "campaign",
  "surveillance",
  "screening",
  "training",
  "infrastructure",
  "research",
  "other",
]);

const programmeStatusEnum = z.enum(["active", "completed", "suspended"]);

const progressModeEnum = z.enum([
  "lga_coverage",
  "outcome_metric",
  "combined",
]);

function localDateInputValue(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const todayMin = localDateInputValue();

export const programFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(5, "Programme name must be at least 5 characters")
      .max(200, "Programme name must be at most 200 characters"),
    description: z
      .string()
      .trim()
      .min(10, "Description must be at least 10 characters"),
    type: programmeTypeEnum,
    status: programmeStatusEnum.optional(),
    code: z.string(),
    organisationId: z.string(),
    targetLgas: z
      .array(z.string())
      .min(1, "Select at least one target LGA"),
    startDate: z.string(),
    endDate: z.string(),
    objectives: z.string(),
    progressMode: progressModeEnum,
    primaryMetric: z.string(),
    targetCount: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.startDate < todayMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date cannot be in the past",
        path: ["startDate"],
      });
    }
    if (data.endDate && data.endDate < todayMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date cannot be in the past",
        path: ["endDate"],
      });
    }
    if (
      data.startDate &&
      data.endDate &&
      data.endDate < data.startDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after the start date",
        path: ["endDate"],
      });
    }

    if (tracksOutcomeMetric(data.progressMode)) {
      if (!data.primaryMetric.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a label for the outcome you are tracking",
          path: ["primaryMetric"],
        });
      }
      const target = Number.parseInt(data.targetCount.trim(), 10);
      if (!Number.isFinite(target) || target < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter a target count of at least 1",
          path: ["targetCount"],
        });
      }
    }
  });

export type ProgramFormData = z.infer<typeof programFormSchema>;

export { defaultProgressModeForType };
