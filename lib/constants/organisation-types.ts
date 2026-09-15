// Mirrors backend DevelopmentPartnerType (src/modules/development-partners/entities/development-partner.entity.ts)
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
