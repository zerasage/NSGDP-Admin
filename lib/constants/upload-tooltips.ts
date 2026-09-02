export const UPLOAD_FIELD_TOOLTIPS = {
  /** @deprecated use datasetName */
  title:
    "A clear, descriptive title that helps users find your dataset in search results.",
  datasetName:
    "A clear, descriptive title that helps users find your dataset in search results. E.g. 'Niger State Malaria Burden by LGA, 2024'.",
  organisation:
    "The agency or organisation that owns or produced this dataset. Use your official organisation name.",
  responsibleDept:
    "The specific directorate, department, or unit responsible for managing this dataset. E.g. 'DPRS', 'Surveillance Unit'.",
  contactPerson:
    "The name (and optionally phone/email) of the person who can answer questions about this dataset.",

  // Coverage
  geographicCoverage:
    "Describe the area this dataset covers. E.g. 'All 25 LGAs, Niger State' or 'Minna, Bosso, and Paikoro LGAs'.",
  reportingPeriod:
    "The calendar period this data represents. E.g. 'January – December 2024' or 'Q4 2024'.",
  diseaseIndicators:
    "The specific diseases, conditions, or health indicators this dataset tracks. Add one at a time — e.g. 'Confirmed cases', 'Malaria', 'ANC attendance'.",

  // Technical
  category:
    "Select the health domain that best describes this dataset.",
  dataFormat:
    "The file format you are uploading. CSV and Excel are most common; GeoJSON/Shapefile for spatial data.",
  updateFrequency:
    "How often you plan to update this dataset. Choose 'One-time' if it is a static historical snapshot.",

  // Governance
  dataLicense:
    "The license under which this data can be used. 'CC BY 4.0' allows open reuse with attribution. 'Restricted Use' means internal/partner access only.",
  methodology:
    "How this data was collected. E.g. 'Facility-based routine reporting via DHIS2' or 'Household survey, cluster sampling'.",
  limitations:
    "Known gaps, biases, or caveats a user of this data should be aware of. E.g. 'Reporting delays from rural facilities' or 'Excludes private-sector facilities'.",

  // Description
  description:
    "Explain what the dataset contains, its methodology, time period, data source, and intended use cases. Minimum 20 characters.",
  tags:
    "Comma-separated keywords that improve discoverability. E.g. 'malaria, LGA, quarterly, DHIS2, 2024'.",

  // Legacy
  lgas: "Select all Local Government Areas covered by this dataset. Choose multiple if applicable.",
  visibility:
    "Public datasets are open to all. Restricted requires approval. Private is visible only to your organisation.",
  files: "Supported formats include CSV, XLSX, JSON, and GeoPackage. Files upload when you submit — you can skip this step and attach files later from the dataset page.",
} as const;

export const UPLOAD_PAGE_TIP =
  "Walk through five steps to register a dataset on behalf of a partner organisation. Submitting sends it to the review queue; save as draft to finish later.";

export const UPLOAD_PAGE_AGENCY_TIP =
  "Register a dataset owned by the platform agency. Submitting sends it to the review queue; save as draft to finish later.";

export const UPLOAD_STEPS_PANEL_TIP =
  "Complete each step in order. You can click a completed step to go back and edit earlier answers.";

export const UPLOAD_STEP_TIPS = {
  basic: "Identify the owning organisation and describe the dataset so reviewers and catalogue users can find it.",
  coverage: "Specify which LGAs and time period the data covers, plus the health indicators it tracks.",
  files: "Attach the data files now or skip and upload later from the dataset detail page.",
  governance: "Licensing and methodology help users understand how they may reuse the data and how it was collected.",
  contact: "Stewardship contacts and visibility control who can access the dataset once it is approved.",
} as const;

export const UPLOAD_CONTACT_EMAIL_TIP =
  "Email address for questions about this dataset. Shown to reviewers and catalogue users when access is granted.";

export const UPLOAD_DRAFT_TIP =
  "Save progress without submitting. The dataset stays editable in draft status until you are ready for review.";

export const UPLOAD_SUBMIT_TIP =
  "Creates the dataset and moves it to pending review. Required fields from all steps must be complete.";

export const UPLOAD_PREFILL_TIP =
  "Fills the form with sample values for local testing. Turn off before a real submission.";
