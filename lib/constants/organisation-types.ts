// Mirrors backend OrganisationType (src/modules/organisations/entities/organisation.entity.ts)
export const ORG_TYPES = [
  { value: "government", label: "Government Agency" },
  { value: "healthcare", label: "Healthcare Provider" },
  { value: "ngo", label: "Non-Governmental Organisation" },
  { value: "private", label: "Private Sector" },
  { value: "international", label: "International Organisation" },
  { value: "academic", label: "Academic Institution" },
  { value: "community", label: "Community Organisation" },
  { value: "other", label: "Other" },
] as const;
