"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Target, Loader2, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/forms/form-error";
import { useCreateProgram, useUpdateProgram } from "@/lib/hooks/usePrograms";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import type { AdminProgramme, ProgrammeType, ProgrammeStatus } from "@/lib/api/programs";
import { toast } from "sonner";

const PROGRAMME_TYPES: Array<{ value: ProgrammeType; label: string }> = [
  { value: "campaign", label: "Campaign" },
  { value: "surveillance", label: "Surveillance" },
  { value: "screening", label: "Screening" },
  { value: "training", label: "Training" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "research", label: "Research" },
  { value: "other", label: "Other" },
];

const PROGRAMME_STATUSES: Array<{ value: ProgrammeStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "suspended", label: "Suspended" },
];

interface ProgramFormData {
  name: string;
  description: string;
  type: ProgrammeType;
  status?: ProgrammeStatus;
  code: string;
  organisationId: string;
  targetLgas: string;
  startDate: string;
  endDate: string;
  objectives: string;
  primaryMetric: string;
  targetCount: string;
  reachCount: string;
  lgasCoveredCount: string;
}

interface ProgramFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Present = editing; absent = creating */
  programme?: AdminProgramme;
}

export function ProgramFormModal({ open, onClose, programme }: ProgramFormModalProps) {
  const isEditing = !!programme;
  const [submitting, setSubmitting] = useState(false);
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram();

  // Fetch organisations for the dropdown
  const { data: orgsData } = useOrganisations(1, 100);
  const organisations = orgsData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProgramFormData>({
    defaultValues: {
      name: "",
      description: "",
      type: "campaign",
      status: "active",
      code: "",
      organisationId: "",
      targetLgas: "",
      startDate: "",
      endDate: "",
      objectives: "",
      primaryMetric: "",
      targetCount: "",
      reachCount: "",
      lgasCoveredCount: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: programme?.name ?? "",
        description: programme?.description ?? "",
        type: programme?.type ?? "campaign",
        status: programme?.status ?? "active",
        code: programme?.code ?? "",
        organisationId: programme?.organisation_id ?? "",
        targetLgas: programme?.target_lgas?.join(", ") ?? "",
        startDate: programme?.start_date ? programme.start_date.split("T")[0] : "",
        endDate: programme?.end_date ? programme.end_date.split("T")[0] : "",
        objectives: programme?.objectives?.join("\n") ?? "",
        primaryMetric: programme?.primary_metric ?? "",
        targetCount: programme?.target_count?.toString() ?? "",
        reachCount: programme?.reach_count?.toString() ?? "",
        lgasCoveredCount: programme?.lgas_covered_count?.toString() ?? "",
      });
    }
  }, [open, programme, reset]);

  const onSubmit = async (data: ProgramFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        description: data.description,
        type: data.type,
        code: data.code || undefined,
        organisationId: data.organisationId || undefined,
        targetLgas: data.targetLgas
          ? data.targetLgas.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        objectives: data.objectives
          ? data.objectives.split("\n").map((s) => s.trim()).filter(Boolean)
          : undefined,
        primaryMetric: data.primaryMetric || undefined,
        targetCount: data.targetCount ? parseInt(data.targetCount, 10) : undefined,
        reachCount: data.reachCount ? parseInt(data.reachCount, 10) : undefined,
        lgasCoveredCount: data.lgasCoveredCount ? parseInt(data.lgasCoveredCount, 10) : undefined,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({
          slug: programme.slug,
          data: {
            ...payload,
            status: data.status,
          },
        });
        toast.success("Programme updated");
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success(`Programme "${created.name}" created`);
      }
      onClose();
    } catch (error) {
      const err = error as { message?: string };
      toast.error(err?.message || `Failed to ${isEditing ? "update" : "create"} programme`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="size-5" />
            {isEditing ? "Edit Programme" : "Create Programme"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update programme details and progress metrics."
              : "Create a new health programme, campaign, or initiative. You can track progress and attach reports."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Basic Information
            </h3>

            <div>
              <Label htmlFor="name">
                Programme Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                className="mt-1.5"
                placeholder="e.g. 2026 Measles Vaccination Campaign"
                {...register("name", { required: "Name is required", minLength: 5 })}
              />
              <FormError message={errors.name?.message} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="type">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue>
                          {(v: string) => PROGRAMME_TYPES.find((t) => t.value === v)?.label ?? "Select type"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRAMME_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {isEditing && (
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue>
                            {(v: string) => PROGRAMME_STATUSES.find((s) => s.value === v)?.label ?? v}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {PROGRAMME_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                className="mt-1.5"
                rows={3}
                placeholder="Brief description of the programme's goals and activities..."
                {...register("description", { required: "Description is required", minLength: 10 })}
              />
              <FormError message={errors.description?.message} />
            </div>
          </div>

          {/* Organisation & Metadata */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Organisation & Metadata
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="code">Programme Code</Label>
                <Input
                  id="code"
                  className="mt-1.5"
                  placeholder="e.g. MVC-2026-Q1"
                  {...register("code")}
                />
                <p className="text-xs text-muted-foreground mt-1">Optional internal reference</p>
              </div>

              <div>
                <Label htmlFor="organisationId">Organisation</Label>
                <Controller
                  name="organisationId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select organisation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {organisations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="targetLgas">Target LGAs</Label>
              <Input
                id="targetLgas"
                className="mt-1.5"
                placeholder="e.g. Minna, Suleja, Bosso"
                {...register("targetLgas")}
              />
              <p className="text-xs text-muted-foreground mt-1">Comma-separated list</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Timeline
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  className="mt-1.5"
                  {...register("startDate")}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  className="mt-1.5"
                  {...register("endDate")}
                />
              </div>
            </div>
          </div>

          {/* Progress Metrics */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Progress Tracking
            </h3>

            <div>
              <Label htmlFor="objectives">Objectives</Label>
              <Textarea
                id="objectives"
                className="mt-1.5"
                rows={3}
                placeholder="One objective per line"
                {...register("objectives")}
              />
              <p className="text-xs text-muted-foreground mt-1">Enter each objective on a new line</p>
            </div>

            <div>
              <Label htmlFor="primaryMetric">Primary Metric Label</Label>
              <Input
                id="primaryMetric"
                className="mt-1.5"
                placeholder="e.g. children_vaccinated, cases_detected"
                {...register("primaryMetric")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="targetCount">Target Count</Label>
                <Input
                  id="targetCount"
                  type="number"
                  className="mt-1.5"
                  placeholder="50000"
                  {...register("targetCount")}
                />
              </div>

              <div>
                <Label htmlFor="reachCount">Reach Count</Label>
                <Input
                  id="reachCount"
                  type="number"
                  className="mt-1.5"
                  placeholder="35000"
                  {...register("reachCount")}
                />
              </div>

              <div>
                <Label htmlFor="lgasCoveredCount">LGAs Covered</Label>
                <Input
                  id="lgasCoveredCount"
                  type="number"
                  className="mt-1.5"
                  placeholder="12"
                  {...register("lgasCoveredCount")}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              <X className="size-4 mr-1.5" />
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="size-4 mr-1.5" />
                  {isEditing ? "Save Changes" : "Create Programme"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
