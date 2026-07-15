import type { SOP } from "@/types";

export const mockSOPs: SOP[] = [
  {
    id: "sop-1",
    title: "Dataset Submission Procedure",
    category: "submission",
    version: "2.1",
    effectiveDate: "2026-01-01",
    summary: "Defines the complete end-to-end process for contributors to submit datasets, including metadata requirements, file format standards, and submission review expectations.",
    lastReviewed: "2025-12-15",
  },
  {
    id: "sop-2",
    title: "Metadata Quality Validation Checklist",
    category: "validation",
    version: "1.3",
    effectiveDate: "2025-09-01",
    summary: "8-dimension quality checklist applied by validators during metadata review. Covers completeness, accuracy, consistency, timeliness, validity, uniqueness, geo-references, and documentation.",
    lastReviewed: "2025-08-20",
  },
  {
    id: "sop-3",
    title: "Dataset Publication Authorisation Procedure",
    category: "publication",
    version: "1.0",
    effectiveDate: "2025-06-01",
    summary: "Outlines the Director Approval step, including sign-off criteria, publication rules, licensing requirements, and the conditions under which embargo periods apply.",
    lastReviewed: "2025-05-28",
  },
  {
    id: "sop-4",
    title: "Dataset Archival & Obsolescence Management",
    category: "archival",
    version: "1.1",
    effectiveDate: "2025-10-01",
    summary: "Procedure for identifying obsolete datasets, recording archival reasons, notifying stakeholders, and maintaining historical read-only access for archived records.",
    lastReviewed: "2025-09-10",
  },
  {
    id: "sop-5",
    title: "Data Correction & Version Control Process",
    category: "correction",
    version: "1.0",
    effectiveDate: "2026-01-01",
    summary: "Defines how errors in published datasets are reported, reviewed, corrected, and re-published. Covers semantic versioning, changelog requirements, and stakeholder notification.",
    lastReviewed: "2025-12-20",
  },
];
