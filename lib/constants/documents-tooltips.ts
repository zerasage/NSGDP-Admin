export const DOCUMENTS_PAGE_TIP =
  "Documents are standalone files in the repository — SOPs, policies, guidelines, and reports. Create with a file attached, then submit for review and publish to the public catalogue.";

export const DOCUMENTS_METRIC_TIPS = {
  total: "Every document record on the platform, across all workflow statuses.",
  published: "Live on the public catalogue and available for download.",
  draft: "Created but not yet submitted for review.",
  archived: "Removed from the public catalogue but retained for admin reference.",
} as const;

export const DOCUMENTS_PANEL_TIP =
  "Filter by status or document type, or search by title and description.";

export const DOCUMENTS_TAB_TIPS = {
  all: "Every document regardless of workflow status.",
  draft: "Editable records not yet in the review queue.",
  pending: "Submitted and waiting for a reviewer.",
  under_review: "A reviewer has opened the document but not decided yet.",
  approved: "Accepted for publishing — may not yet be on the public catalogue.",
  published: "Visible on the public document catalogue.",
  rejected: "Returned to the submitter with review feedback.",
  archived: "Withdrawn from the catalogue.",
} as const;

export const DOCUMENTS_CREATE_TIP =
  "A file is required. Select PDF, Office, images, or other supported formats — metadata and upload happen together.";

export const DOCUMENT_DETAIL_PAGE_TIP =
  "View file details, workflow status, and publishing metadata. Submit for review or publish when the document is ready for the catalogue.";

export const DOCUMENT_DETAIL_METRIC_TIPS = {
  fileSize: "Size of the attached file on disk.",
  downloads: "How many times this document has been downloaded from the catalogue.",
  version: "Optional version label, e.g. v1.0 or 2026 revision.",
  published: "Date this document went live on the public catalogue.",
} as const;

export const DOCUMENT_FILE_ACCESS_TIP =
  "Download the attached file. The same file is served to catalogue users once published.";

export const DOCUMENT_PREVIEW_TIP =
  "Inline preview for PDFs, images, and text-based files (JSON, GeoJSON, TXT, Markdown, RTF, XML, KML). Word, PowerPoint, GeoPackage, KMZ, and ZIP must be downloaded.";

export const DOCUMENT_INFO_PANEL_TIP =
  "Core metadata used in search and on the public document page.";

export const DOCUMENT_PUBLISHING_PANEL_TIP =
  "Catalogue visibility, attribution, and download statistics.";

export const DOCUMENT_SUBMIT_TIP =
  "Moves the document into the review queue. A file must be attached before submission.";

export const DOCUMENT_PUBLISH_TIP =
  "Makes an approved document visible on the public catalogue. Drafts with a file can skip review if you have permission.";

export const DOCUMENT_UNPUBLISH_TIP =
  "Removes the document from the public catalogue while keeping the record for admins.";
