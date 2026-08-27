// Mirrors nsgdp-backend src/modules/organisations/constants/organisation-capabilities.ts

export type OrganisationCapabilityKey = 'create:programs';

export const ORGANISATION_CAPABILITY_LABELS: Record<OrganisationCapabilityKey, string> = {
  'create:programs': 'Manage Programmes',
};

export const ORGANISATION_CAPABILITY_DESCRIPTIONS: Record<OrganisationCapabilityKey, string> = {
  'create:programs':
    'Allows member organisations to access My Programmes and create, edit, or upload reports for their programmes',
};

export const ORGANISATION_CAPABILITIES: OrganisationCapabilityKey[] = [
  'create:programs',
];
