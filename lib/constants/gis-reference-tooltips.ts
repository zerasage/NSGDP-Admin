export const GIS_REFERENCE_PAGE_TIP =
  "Platform-wide map layers used by public maps and analytics — LGA/ward boundaries, health facilities, population, and settlements. Upload one source file per slot; spelling mismatches are reconciled against the canonical ward gazetteer.";

export const GIS_REFERENCE_REBUILD_TIP =
  "Re-runs the canonical ward gazetteer from all configured layers. Usually automatic after a ward-boundary upload — use this if assignments look stale or after bulk alias fixes.";

export const GIS_REFERENCE_METRIC_TIPS = {
  configured:
    "Reference slots that have an active uploaded file (or legacy catalogue dataset) assigned.",
  unset:
    "Slots still without a source file — maps and analytics may omit or fall back for that layer.",
  unmatched:
    "Raw LGA/ward spellings in reconcilable layers that do not yet map to a canonical ward.",
  matchRate:
    "Resolved spellings for the layer selected in the resolution report — aim for 95%+ before relying on analytics.",
} as const;

export const GIS_REFERENCE_LAYERS_PANEL_TIP =
  "Five fixed slots, each holding one staff-uploaded file. Replacing ward boundaries, facilities, or settlements may queue a background gazetteer rebuild.";

export const GIS_REFERENCE_RESOLUTION_PANEL_TIP =
  "Spellings from uploaded layers compared to the canonical gazetteer. Fix unmatched rows here or send tricky cases to the Ingestion Ops alias queue.";

export const GIS_REFERENCE_RESOLUTION_TAB_TIPS = {
  ward_boundaries:
    "Ward polygon attributes — primary source for the canonical ward list and map outlines.",
  facility_registry:
    "Health facility point names and locations — unmatched spellings block correct ward assignment.",
  settlements:
    "Settlement / MLoS place names — reconcile so fine-grained labels match canonical wards.",
} as const;

export const GIS_REFERENCE_RESOLUTION_METRIC_TIPS = {
  totalPairs: "Distinct raw LGA + ward combinations found in this layer's attributes.",
  matched: "Spellings already linked to a canonical ward in the gazetteer.",
  unmatched: "Spellings still needing confirmation or an alias in the review queue.",
} as const;

export const GIS_REFERENCE_COVERAGE_TIP =
  "Analytics expects at least 95% of spellings resolved. Review remaining unmatched rows before publishing datasets that depend on this layer.";

export const GIS_REFERENCE_CONFIRM_WARD_TIP =
  "Links this raw spelling to the canonical ward you pick. Future uploads using the same spelling will resolve automatically.";

export const GIS_REFERENCE_REVIEW_QUEUE_TIP =
  "Opens Ingestion Ops filtered to this ward name — use when the spelling needs alias review rather than a one-off confirm.";

export const GIS_REFERENCE_REPLACE_LAYER_TIP =
  "Upload a new GeoPackage or spreadsheet for this slot. The dialog closes immediately; send progress and any gazetteer rebuild show on this row.";

export const GIS_REFERENCE_UPLOAD_LAYER_TIP =
  "Assign the first source file for this slot. Accepted formats are shown in the row — GeoPackage for boundaries and points, CSV/Excel for population.";

export const GIS_REFERENCE_REBUILD_STATUS_TIP =
  "Background job rebuilding the canonical ward gazetteer from configured layers. Wait for completion before trusting match rates.";
