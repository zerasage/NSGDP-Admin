// Mirrors nsgdp-backend src/modules/development-partners/constants/development-partner-capabilities.ts

export type DevelopmentPartnerCapabilityKey = "manage:programs";

export const DEVELOPMENT_PARTNER_CAPABILITY_LABELS: Record<
  DevelopmentPartnerCapabilityKey,
  string
> = {
  "manage:programs": "Manage Programmes",
};

export const DEVELOPMENT_PARTNER_CAPABILITY_DESCRIPTIONS: Record<
  DevelopmentPartnerCapabilityKey,
  string
> = {
  "manage:programs":
    "Full programme management: create, edit, archive programmes and upload or delete reports for programmes belonging to the development partner.",
};

export const DEVELOPMENT_PARTNER_CAPABILITIES: DevelopmentPartnerCapabilityKey[] = [
  "manage:programs",
];
