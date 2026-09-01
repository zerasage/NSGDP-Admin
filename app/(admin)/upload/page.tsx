"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Upload, MapPin, Scale, Settings, X, Lock, Search } from "lucide-react";
import { Stepper } from "@/components/forms/stepper";
import { FileUploadArea, type UploadedFile } from "@/components/forms/file-upload-area";
import { FieldLabelTooltip } from "@/components/forms/field-label-tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { METRIC_TONE, Panel } from "@/components/admin/admin-analytics-ui";
import { OrganisationCombobox } from "@/components/admin/organisation-combobox";
import { CategoryCombobox } from "@/components/admin/category-combobox";
import { Autocomplete } from "@/components/ui/autocomplete";
import { useAuth } from "@/lib/auth";
import { useAdminAccess } from "@/lib/hooks/useAdminAccess";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateDataset } from "@/lib/hooks/useDatasets";
import { useOrganisations } from "@/lib/hooks/useOrganisations";
import { useCategories } from "@/lib/hooks/useCategories";
import { uploadFile } from "@/lib/api/uploads";
import { NIGER_STATE_LGAS } from "@/lib/constants/core";
import { UPLOAD_FIELD_TOOLTIPS } from "@/lib/constants/upload-tooltips";
import { useToast } from "@/lib/hooks/use-toast";
import type { DatasetFormat, DatasetVisibility } from "@/lib/api/datasets";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, name: "Basic Info", icon: FileText },
  { id: 2, name: "Coverage & Indicators", icon: MapPin },
  { id: 3, name: "Upload Files", icon: Upload },
  { id: 4, name: "Governance", icon: Scale },
  { id: 5, name: "Contact & Settings", icon: Settings },
];

const FORMAT_BY_EXTENSION: Record<string, DatasetFormat> = {
  csv: "csv",
  xlsx: "excel",
  xls: "excel",
  json: "json",
  gpkg: "geopackage",
};

const LICENSE_OPTIONS = [
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "CC0-1.0",
  "Government Open Data License",
  "Restricted — Internal Use Only",
];

function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b pb-4">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function TagChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const t = METRIC_TONE.primary;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
        t.well,
        t.icon,
      )}
    >
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`}>
        <X className="size-3" />
      </button>
    </span>
  );
}

export default function AdminUploadDatasetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetOrgId = searchParams.get("orgId") ?? undefined;
  const presetAgency = searchParams.get("agency") === "1";
  const { user } = useAuth();
  const { isLoading: permissionsLoading, can } = useAdminAccess();
  const canUpload = can("create:datasets");
  const { toast } = useToast();
  const createMutation = useCreateDataset();
  const { data: orgsData } = useOrganisations(1, 200);
  const { data: categoriesData } = useCategories();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const [organisationId, setOrganisationId] = useState(presetOrgId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedLGAs, setSelectedLGAs] = useState<string[]>([]);
  const [lgaFilter, setLgaFilter] = useState("");
  const filteredLGAs = NIGER_STATE_LGAS.filter((lga) =>
    lga.toLowerCase().includes(lgaFilter.trim().toLowerCase())
  );
  const [temporalCoverageStart, setTemporalCoverageStart] = useState("");
  const [temporalCoverageEnd, setTemporalCoverageEnd] = useState("");
  const [diseaseIndicators, setDiseaseIndicators] = useState<string[]>([]);
  const [indicatorInput, setIndicatorInput] = useState("");
  const [license, setLicense] = useState("");
  const [methodology, setMethodology] = useState("");
  const [limitations, setLimitations] = useState("");
  const [visibility, setVisibility] = useState<DatasetVisibility>("public");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [responsibleDept, setResponsibleDept] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [updateFrequency, setUpdateFrequency] = useState("");

  // Off by default — only fills the form when explicitly opted into via the
  // small checkbox in the header, and clears back out if unchecked.
  const [prefillTestData, setPrefillTestData] = useState(false);
  const togglePrefill = (checked: boolean) => {
    setPrefillTestData(checked);
    if (checked) {
      setTitle(`Test Health Dataset ${new Date().getFullYear()} - ${Date.now().toString().slice(-6)}`);
      setDescription(
        "Sample dataset used for testing the admin upload flow and data validation. Contains placeholder health data for Niger State."
      );
      setTags(["health", "test", "niger-state"]);
      setSelectedLGAs(["Minna", "Suleja", "Bida"]);
      setTemporalCoverageStart("2025-01-01");
      setTemporalCoverageEnd("2025-12-31");
      setDiseaseIndicators(["Confirmed cases", "Deaths"]);
      setLicense("CC-BY-4.0");
      setMethodology("Facility-based routine reporting via DHIS2");
      setLimitations("Data may have reporting delays from rural facilities");
      setResponsibleDept("Disease Surveillance Unit");
      setContactPerson("Jane Doe");
      setContactEmail("jane.doe@example.org");
      setUpdateFrequency("Monthly");
    } else {
      setTitle("");
      setDescription("");
      setTags([]);
      setSelectedLGAs([]);
      setTemporalCoverageStart("");
      setTemporalCoverageEnd("");
      setDiseaseIndicators([]);
      setLicense("");
      setMethodology("");
      setLimitations("");
      setResponsibleDept("");
      setContactPerson("");
      setContactEmail("");
      setUpdateFrequency("");
    }
  };

  const organisations = useMemo(() => orgsData?.data ?? [], [orgsData?.data]);
  const categories = useMemo(() => categoriesData?.data ?? [], [categoriesData?.data]);
  const effectiveOrganisationId =
    organisationId || (presetAgency ? organisations.find((o) => o.is_platform_owner)?.id ?? "" : "");
  const effectiveCategoryId = categoryId || (prefillTestData ? categories[0]?.id ?? "" : "");
  const agencyOrg = organisations.find((o) => o.is_platform_owner);
  const currentStepMeta = steps.find((step) => step.id === currentStep);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const addIndicator = () => {
    if (indicatorInput.trim() && !diseaseIndicators.includes(indicatorInput.trim())) {
      setDiseaseIndicators([...diseaseIndicators, indicatorInput.trim()]);
      setIndicatorInput("");
    }
  };

  const removeIndicator = (indicator: string) => {
    setDiseaseIndicators(diseaseIndicators.filter((i) => i !== indicator));
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    if (!effectiveOrganisationId) errors.organisationId = "Select an organisation";
    if (title.trim().length < 5) errors.title = "Title must be at least 5 characters";
    if (description.trim().length < 20) errors.description = "Description must be at least 20 characters";
    if (!effectiveCategoryId) errors.categoryId = "Select a category";
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    if (selectedLGAs.length === 0) errors.lgas = "Select at least one LGA";
    if (!temporalCoverageStart) errors.temporalCoverageStart = "Start date is required";
    if (!temporalCoverageEnd) errors.temporalCoverageEnd = "End date is required";
    if (
      temporalCoverageStart &&
      temporalCoverageEnd &&
      new Date(temporalCoverageStart) > new Date(temporalCoverageEnd)
    ) {
      errors.temporalCoverageEnd = "Start date must be before end date";
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep4 = () => {
    const errors: Record<string, string> = {};
    if (!license) errors.license = "Select a license";
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }
    if (!validateStep4()) {
      setCurrentStep(4);
      return;
    }

    setSaving(true);

    try {
      const firstExt = uploadedFiles[0]?.name.split(".").pop()?.toLowerCase();
      const format: DatasetFormat = (firstExt && FORMAT_BY_EXTENSION[firstExt]) || "csv";

      const dataset = await createMutation.mutateAsync({
        title,
        description,
        categoryId: effectiveCategoryId,
        format,
        visibility,
        tags,
        geographicCoverage: selectedLGAs.join(", "),
        temporalCoverageStart: temporalCoverageStart || undefined,
        temporalCoverageEnd: temporalCoverageEnd || undefined,
        diseaseIndicators: diseaseIndicators.length > 0 ? diseaseIndicators : undefined,
        license: license || undefined,
        methodology: methodology || undefined,
        limitations: limitations || undefined,
        organisationId: effectiveOrganisationId,
        responsibleDept: responsibleDept || undefined,
        contactPerson: contactPerson || undefined,
        contactEmail: contactEmail || undefined,
        updateFrequency: updateFrequency || undefined,
        status: isDraft ? "draft" : "pending",
      });

      for (const uploadedFile of uploadedFiles) {
        await uploadFile(uploadedFile.file, dataset.id);
      }

      toast({
        title: "Success",
        description: isDraft
          ? "Dataset saved as draft"
          : `Dataset created${uploadedFiles.length ? ` with ${uploadedFiles.length} file(s)` : ""} and submitted for review`,
      });
      router.push(`/datasets/${dataset.slug}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create dataset",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!permissionsLoading && !canUpload) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          icon={Lock}
          title="Access restricted"
          description="Uploading a dataset requires create:datasets. Ask a super_admin to grant your group this permission."
        />
      </div>
    );
  }

  if (permissionsLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="mx-auto h-[32rem] w-full max-w-4xl rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {presetAgency ? "Upload to agency" : "Upload dataset"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {presetAgency
              ? `Create a dataset owned by ${agencyOrg?.name ?? "the platform agency"}`
              : "Create a new dataset on behalf of a partner organisation"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium tabular-nums",
              METRIC_TONE.info.well,
              METRIC_TONE.info.icon,
            )}
          >
            Step {currentStep} of {steps.length}
          </Badge>
          <label className="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 text-xs text-muted-foreground">
            <Checkbox
              checked={prefillTestData}
              onCheckedChange={(checked) => togglePrefill(!!checked)}
            />
            Prefill test data
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-info/25 bg-info/[0.06] px-4 py-3 text-sm text-muted-foreground">
        Complete all five steps — basic info, coverage, files, governance, and contacts. Submitting
        sends the dataset to the review queue; saving as draft keeps it editable until you are ready.
        {presetAgency
          ? " Agency uploads are owned by the platform organisation and appear in the agency workspace."
          : " Partner uploads are attributed to the selected organisation."}
      </div>

      {/* Mobile stepper: horizontal at top */}
      <Panel
        title="Upload progress"
        description={currentStepMeta ? `Current step: ${currentStepMeta.name}` : undefined}
        icon={Upload}
        tone="info"
        className="lg:hidden"
      >
        <Stepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step) => step < currentStep && setCurrentStep(step)}
        />
      </Panel>

      {/* Desktop: vertical stepper + form side by side */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Vertical stepper sidebar (desktop only) */}
        <aside className="hidden lg:block">
          <Panel title="Upload steps" icon={Upload} tone="primary" className="sticky top-6">
            <Stepper
              steps={steps}
              currentStep={currentStep}
              onStepClick={(step) => step < currentStep && setCurrentStep(step)}
              orientation="vertical"
            />
          </Panel>
        </aside>

        {/* Form content */}
        <section className="overflow-hidden rounded-2xl border bg-card p-5 sm:p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <StepHeading
              title="Basic information"
              description="Identify the owning organisation and describe the dataset clearly."
            />

            <div className="space-y-4">
              <div className="space-y-2">
                <FieldLabelTooltip
                  htmlFor="organisation"
                  label="Organisation"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.organisation}
                />
                <OrganisationCombobox
                  id="organisation"
                  organisations={organisations}
                  value={effectiveOrganisationId}
                  onValueChange={setOrganisationId}
                />
                {stepErrors.organisationId && (
                  <p className="text-xs text-destructive">{stepErrors.organisationId}</p>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabelTooltip
                  htmlFor="title"
                  label="Dataset title"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.title}
                />
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Niger State Health Facilities 2024"
                  aria-required="true"
                />
                {stepErrors.title && <p className="text-xs text-destructive">{stepErrors.title}</p>}
              </div>

              <div className="space-y-2">
                <FieldLabelTooltip
                  htmlFor="description"
                  label="Description"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.description}
                />
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe what this dataset contains..."
                  aria-required="true"
                />
                {stepErrors.description && (
                  <p className="text-xs text-destructive">{stepErrors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabelTooltip
                  htmlFor="category"
                  label="Programme area or category"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.category}
                />
                <CategoryCombobox
                  id="category"
                  categories={categories}
                  value={effectiveCategoryId}
                  onValueChange={setCategoryId}
                />
                {stepErrors.categoryId && (
                  <p className="text-xs text-destructive">{stepErrors.categoryId}</p>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabelTooltip
                  htmlFor="tags"
                  label="Tags"
                  tooltip={UPLOAD_FIELD_TOOLTIPS.tags}
                />
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Add tags (press Enter)"
                  />
                  <Button type="button" onClick={addTag} variant="outline" className="shrink-0">
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map((tag) => (
                      <TagChip key={tag} label={tag} onRemove={() => removeTag(tag)} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t pt-4">
              <Button onClick={() => validateStep1() && setCurrentStep(2)}>
                Next: Coverage and indicators
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <StepHeading
              title="Coverage and indicators"
              description="Define where and when the data applies, plus the indicators it contains."
            />

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FieldLabelTooltip
                    label="LGA coverage"
                    required
                    tooltip={UPLOAD_FIELD_TOOLTIPS.lgas}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedLGAs.length === NIGER_STATE_LGAS.length) {
                        setSelectedLGAs([]);
                      } else {
                        setSelectedLGAs([...NIGER_STATE_LGAS]);
                      }
                    }}
                    className="h-8 text-xs font-medium"
                  >
                    {selectedLGAs.length === NIGER_STATE_LGAS.length ? "Clear All" : "Select All (25)"}
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={lgaFilter}
                    onChange={(e) => setLgaFilter(e.target.value)}
                    placeholder="Filter LGAs…"
                    className="pl-9"
                  />
                </div>
                <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-lg border p-4 sm:grid-cols-3">
                  {filteredLGAs.length === 0 ? (
                    <p className="col-span-full py-4 text-center text-sm text-muted-foreground">
                      No LGAs match &ldquo;{lgaFilter}&rdquo;
                    </p>
                  ) : (
                    filteredLGAs.map((lga) => (
                      <label key={lga} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedLGAs.includes(lga)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedLGAs([...selectedLGAs, lga]);
                            else setSelectedLGAs(selectedLGAs.filter((l) => l !== lga));
                          }}
                          className="rounded"
                        />
                        {lga}
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedLGAs.length} of {NIGER_STATE_LGAS.length} LGAs selected
                </p>
                {stepErrors.lgas && <p className="text-xs text-destructive">{stepErrors.lgas}</p>}
              </div>

              <div className="space-y-2">
                <FieldLabelTooltip
                  label="Reporting period"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.reportingPeriod}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="temporalCoverageStart" className="text-xs font-normal text-muted-foreground">
                      Start date
                    </Label>
                    <Input
                      id="temporalCoverageStart"
                      type="date"
                      value={temporalCoverageStart}
                      onChange={(e) => setTemporalCoverageStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temporalCoverageEnd" className="text-xs font-normal text-muted-foreground">
                      End date
                    </Label>
                    <Input
                      id="temporalCoverageEnd"
                      type="date"
                      value={temporalCoverageEnd}
                      onChange={(e) => setTemporalCoverageEnd(e.target.value)}
                    />
                  </div>
                </div>
                {(stepErrors.temporalCoverageStart || stepErrors.temporalCoverageEnd) && (
                  <p className="text-xs text-destructive">
                    {stepErrors.temporalCoverageStart || stepErrors.temporalCoverageEnd}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabelTooltip
                  htmlFor="diseaseIndicators"
                  label="Disease or health indicators"
                  tooltip={UPLOAD_FIELD_TOOLTIPS.diseaseIndicators}
                />
                <div className="flex gap-2">
                  <Input
                    id="diseaseIndicators"
                    value={indicatorInput}
                    onChange={(e) => setIndicatorInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIndicator())}
                    placeholder="e.g., Confirmed cases (press Enter)"
                  />
                  <Button type="button" onClick={addIndicator} variant="outline" className="shrink-0">
                    Add
                  </Button>
                </div>
                {diseaseIndicators.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {diseaseIndicators.map((indicator) => (
                      <TagChip
                        key={indicator}
                        label={indicator}
                        onRemove={() => removeIndicator(indicator)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button onClick={() => validateStep2() && setCurrentStep(3)}>Next: Upload files</Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <StepHeading
              title="Upload files"
              description="CSV, Excel, JSON, or GeoPackage only. For PDF and other document files, use Documents."
            />

            <FileUploadArea files={uploadedFiles} onFilesChange={setUploadedFiles} />

            <div className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep(4)}>Next: Governance</Button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <StepHeading
              title="Governance"
              description="Document licensing, collection methodology, and known data limitations."
            />

            <div className="space-y-4">
              <div className="space-y-2">
                <FieldLabelTooltip
                  htmlFor="license"
                  label="Data license"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.dataLicense}
                />
                <Autocomplete
                  id="license"
                  items={LICENSE_OPTIONS}
                  value={license}
                  onValueChange={setLicense}
                  placeholder="Select a license or type your own…"
                />
                {stepErrors.license && <p className="text-xs text-destructive">{stepErrors.license}</p>}
              </div>

              <div className="space-y-2">
                <FieldLabelTooltip
                  htmlFor="methodology"
                  label="Methodology"
                  tooltip={UPLOAD_FIELD_TOOLTIPS.methodology}
                />
                <Textarea
                  id="methodology"
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  rows={3}
                  placeholder="e.g., Facility-based routine reporting via DHIS2"
                />
              </div>

              <div className="space-y-2">
                <FieldLabelTooltip
                  htmlFor="limitations"
                  label="Known limitations"
                  tooltip={UPLOAD_FIELD_TOOLTIPS.limitations}
                />
                <Textarea
                  id="limitations"
                  value={limitations}
                  onChange={(e) => setLimitations(e.target.value)}
                  rows={3}
                  placeholder="e.g., Reporting delays from rural facilities"
                />
              </div>
            </div>

            <div className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                Back
              </Button>
              <Button onClick={() => validateStep4() && setCurrentStep(5)}>Next: Contact and settings</Button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <StepHeading
              title="Contact and settings"
              description="Add stewardship contacts, update frequency, and access visibility."
            />

            <div className="space-y-4">
              <div className="space-y-2">
                <FieldLabelTooltip
                  htmlFor="responsibleDept"
                  label="Responsible department"
                  tooltip={UPLOAD_FIELD_TOOLTIPS.responsibleDept}
                />
                <Input
                  id="responsibleDept"
                  value={responsibleDept}
                  onChange={(e) => setResponsibleDept(e.target.value)}
                  placeholder="e.g., Disease Surveillance Unit"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabelTooltip
                    htmlFor="contactPerson"
                    label="Contact person"
                    tooltip={UPLOAD_FIELD_TOOLTIPS.contactPerson}
                  />
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g., Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">
                    Contact email
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g., jane.doe@example.org"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabelTooltip
                  htmlFor="updateFrequency"
                  label="Update frequency"
                  tooltip={UPLOAD_FIELD_TOOLTIPS.updateFrequency}
                />
                <Select value={updateFrequency} onValueChange={(v) => setUpdateFrequency(v || "")}>
                  <SelectTrigger id="updateFrequency" className="w-full">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annually">Annually</SelectItem>
                    <SelectItem value="One-time">One-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <FieldLabelTooltip
                  htmlFor="visibility"
                  label="Visibility"
                  required
                  tooltip={UPLOAD_FIELD_TOOLTIPS.visibility}
                />
                <Select value={visibility} onValueChange={(v) => v && setVisibility(v as DatasetVisibility)}>
                  <SelectTrigger id="visibility" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public — anyone can view and download</SelectItem>
                    <SelectItem value="restricted">Restricted — users must request access</SelectItem>
                    <SelectItem value="private">Private — only this organisation can access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(4)}>
                Back
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => handleSubmit(true)} disabled={saving}>
                  Save as draft
                </Button>
                <Button onClick={() => handleSubmit(false)} disabled={saving}>
                  {saving ? "Submitting..." : "Submit for review"}
                </Button>
              </div>
            </div>
          </div>
        )}
        </section>
      </div>
    </div>
  );
}
