// Mirrors nsgdp-backend src/modules/organisations/constants/organisation-capabilities.ts

export type OrganisationCapabilityKey = "create:programs" | "upload:programs";

export const ORGANISATION_CAPABILITY_LABELS: Record<
  OrganisationCapabilityKey,
  string
> = {
  "create:programs": "Manage Programmes",
  "upload:programs": "Upload Programme Reports",
};

export const ORGANISATION_CAPABILITY_DESCRIPTIONS: Record<
  OrganisationCapabilityKey,
  string
> = {
  "create:programs":
    "Access My Programmes — create, edit, and upload reports for the organisation's programmes",
  "upload:programs":
    "Access My Programmes — upload reports to existing programmes only (no create or edit)",
};

export const ORGANISATION_CAPABILITIES: OrganisationCapabilityKey[] = [
  "create:programs",
  "upload:programs",
];
