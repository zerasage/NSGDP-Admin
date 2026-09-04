// Mirrors nsgdp-backend src/modules/organisations/constants/organisation-capabilities.ts

export type OrganisationCapabilityKey = "manage:programs";

export const ORGANISATION_CAPABILITY_LABELS: Record<
  OrganisationCapabilityKey,
  string
> = {
  "manage:programs": "Manage Programmes",
};

export const ORGANISATION_CAPABILITY_DESCRIPTIONS: Record<
  OrganisationCapabilityKey,
  string
> = {
  "manage:programs":
    "Full programme management: create, edit, archive programmes and upload or delete reports for programmes belonging to the organisation.",
};

export const ORGANISATION_CAPABILITIES: OrganisationCapabilityKey[] = [
  "manage:programs",
];
