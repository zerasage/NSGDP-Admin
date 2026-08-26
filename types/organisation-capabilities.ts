// Mirrors nsgdp-backend src/modules/organisations/constants/organisation-capabilities.ts

export type OrganisationCapabilityKey = 'create:programs';

export const ORGANISATION_CAPABILITY_LABELS: Record<OrganisationCapabilityKey, string> = {
  'create:programs': 'Create Programmes',
};

export const ORGANISATION_CAPABILITY_DESCRIPTIONS: Record<OrganisationCapabilityKey, string> = {
  'create:programs': 'Allows member organisations to create new programmes and campaigns',
};

export const ORGANISATION_CAPABILITIES: OrganisationCapabilityKey[] = [
  'create:programs',
];
