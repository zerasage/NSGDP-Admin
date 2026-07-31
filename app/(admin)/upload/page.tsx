"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Upload, MapPin, Scale, Settings, X, Lock, Search } from "lucide-react";
import { Stepper } from "@/components/forms/stepper";
import { FileUploadArea, type UploadedFile } from "@/components/forms/file-upload-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { OrganisationCombobox } from "@/components/admin/organisation-combobox";
import { CategoryCombobox } from "@/components/admin/category-combobox";
import { Autocomplete } from "@/components/ui/autocomplete";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/lib/hooks/usePermissions";
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
import { useToast } from "@/lib/hooks/use-toast";
import type { DatasetFormat, DatasetVisibility } from "@/lib/api/datasets";

const steps = [
  { id: 1, name: "Basic Info", icon: FileText },
  { id: 2, name: "Coverage & Indicators", icon: MapPin },
  { id: 3, name: "Upload Files", icon: Upload },
  { id: 4, name: "Governance", icon: Scale },
  { id: 5, name: "Contact & Settings", icon: Settings },
];

const AGENCY_ORG_SLUG = "nsphcda";

const FORMAT_BY_EXTENSION: Record<string, DatasetFormat> = {
  csv: "csv",
  xlsx: "excel",
  xls: "excel",
  json: "json",
  geojson: "geojson",
  zip: "shapefile",
  kml: "kml",
  kmz: "kml",
  gpkg: "geopackage",
  pdf: "pdf",
};

const LICENSE_OPTIONS = [
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "CC0-1.0",
  "Government Open Data License",
  "Restricted — Internal Use Only",
];

export default function AdminUploadDatasetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetOrgId = searchParams.get("orgId") ?? undefined;
  const presetAgency = searchParams.get("agency") === "1";
  const { user } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const isSuperAdmin = user?.role === "super_admin";
  const canUpload = isSuperAdmin || hasPermission("create:datasets");
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

  const organisations = orgsData?.data ?? [];
  const categories = categoriesData?.data ?? [];

  useEffect(() => {
    if (!presetAgency || organisationId) return;
    const agencyOrg = organisations.find((o) => o.slug === AGENCY_ORG_SLUG);
    if (agencyOrg) setOrganisationId(agencyOrg.id);
  }, [presetAgency, organisations, organisationId]);

  // Category IDs are seeded per-environment, so default to the first
  // available category once loaded rather than hardcoding an ID — only
  // when the prefill checkbox is on, matching every other field.
  useEffect(() => {
    if (prefillTestData && !categoryId && categories.length) {
      setCategoryId(categories[0].id);
    }
  }, [prefillTestData, categoryId, categories]);

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
    if (!organisationId) errors.organisationId = "Select an organisation";
    if (title.trim().length < 5) errors.title = "Title must be at least 5 characters";
    if (description.trim().length < 20) errors.description = "Description must be at least 20 characters";
    if (!categoryId) errors.categoryId = "Select a category";
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
        categoryId,
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
        organisationId,
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
      // The org detail route is keyed by slug, not id, despite the folder being named [id]
      const orgSlug = organisations.find((o) => o.id === organisationId)?.slug;
      router.push(orgSlug ? `/organisations/${orgSlug}` : "/organisations");
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
      <EmptyState
        icon={Lock}
        title="Access restricted"
        description="Uploading a dataset requires create:datasets. Ask a super_admin to grant your group this permission."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Upload Dataset</h1>
          <p className="text-muted-foreground mt-1">
            Create a new dataset on behalf of an organisation
          </p>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 cursor-pointer">
          <Checkbox
            checked={prefillTestData}
            onCheckedChange={(checked) => togglePrefill(!!checked)}
          />
          Prefill test data
        </label>
      </div>

      <Stepper
        steps={steps}
        currentStep={currentStep}
        onStepClick={(step) => step < currentStep && setCurrentStep(step)}
      />

      <Card className="max-w-3xl mx-auto p-4 sm:p-8">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Basic Information</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organisation">
                Organisation <span className="text-destructive">*</span>
              </Label>
              <OrganisationCombobox
                id="organisation"
                organisations={organisations}
                value={organisationId}
                onValueChange={setOrganisationId}
              />
              {stepErrors.organisationId && (
                <p className="text-sm text-destructive">{stepErrors.organisationId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Dataset Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Niger State Health Facilities 2024"
              />
              {stepErrors.title && <p className="text-sm text-destructive">{stepErrors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what this dataset contains..."
              />
              {stepErrors.description && (
                <p className="text-sm text-destructive">{stepErrors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Programme Area / Category <span className="text-destructive">*</span>
              </Label>
              <CategoryCombobox
                id="category"
                categories={categories}
                value={categoryId}
                onValueChange={setCategoryId}
              />
              {stepErrors.categoryId && (
                <p className="text-sm text-destructive">{stepErrors.categoryId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
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
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => validateStep1() && setCurrentStep(2)}>
                Next: Coverage & Indicators
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Coverage & Indicators</h2>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  LGA Coverage <span className="text-destructive">*</span>
                </Label>
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
                  className="text-xs h-8 font-medium"
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
                  className="pl-9 h-9"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-4 rounded-lg border">
                {filteredLGAs.length === 0 ? (
                  <p className="col-span-full text-sm text-muted-foreground text-center py-4">
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
              {stepErrors.lgas && <p className="text-sm text-destructive">{stepErrors.lgas}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Reporting Period <span className="text-destructive">*</span>
              </Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
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
                <div className="space-y-1">
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
                <p className="text-sm text-destructive">
                  {stepErrors.temporalCoverageStart || stepErrors.temporalCoverageEnd}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="diseaseIndicators">Disease / Health Indicators</Label>
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
                <div className="flex flex-wrap gap-2">
                  {diseaseIndicators.map((indicator) => (
                    <span
                      key={indicator}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                    >
                      {indicator}
                      <button type="button" onClick={() => removeIndicator(indicator)} aria-label={`Remove ${indicator}`}>
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button onClick={() => validateStep2() && setCurrentStep(3)}>Next: Upload Files</Button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Upload Files</h2>
              <p className="text-muted-foreground text-sm">
                Optional — a dataset can have more than one file, and you can add or replace
                files later from its detail page.
              </p>
            </div>

            <FileUploadArea files={uploadedFiles} onFilesChange={setUploadedFiles} />

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep(4)}>Next: Governance</Button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Governance</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license">
                Data License <span className="text-destructive">*</span>
              </Label>
              <Autocomplete
                id="license"
                items={LICENSE_OPTIONS}
                value={license}
                onValueChange={setLicense}
                placeholder="Select a license or type your own…"
              />
              {stepErrors.license && <p className="text-sm text-destructive">{stepErrors.license}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="methodology">Methodology</Label>
              <Textarea
                id="methodology"
                value={methodology}
                onChange={(e) => setMethodology(e.target.value)}
                rows={2}
                placeholder="e.g., Facility-based routine reporting via DHIS2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limitations">Known Limitations</Label>
              <Textarea
                id="limitations"
                value={limitations}
                onChange={(e) => setLimitations(e.target.value)}
                rows={2}
                placeholder="e.g., Reporting delays from rural facilities"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                Back
              </Button>
              <Button onClick={() => validateStep4() && setCurrentStep(5)}>Next: Contact & Settings</Button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-4">Contact & Settings</h2>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Additional Information <span className="font-normal">(optional)</span>
              </p>

              <div className="space-y-2">
                <Label htmlFor="responsibleDept">Responsible Department</Label>
                <Input
                  id="responsibleDept"
                  value={responsibleDept}
                  onChange={(e) => setResponsibleDept(e.target.value)}
                  placeholder="e.g., Disease Surveillance Unit"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g., Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
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
                <Label htmlFor="updateFrequency">Update Frequency</Label>
                <Select value={updateFrequency} onValueChange={(v) => setUpdateFrequency(v || "")}>
                  <SelectTrigger id="updateFrequency">
                    <SelectValue placeholder="Select frequency (optional)" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={(v) => v && setVisibility(v as DatasetVisibility)}>
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public — anyone can view and download</SelectItem>
                  <SelectItem value="restricted">Restricted — users must request access</SelectItem>
                  <SelectItem value="private">Private — only this organisation can access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(4)}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSubmit(true)} disabled={saving}>
                  Save as Draft
                </Button>
                <Button onClick={() => handleSubmit(false)} disabled={saving}>
                  {saving ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
