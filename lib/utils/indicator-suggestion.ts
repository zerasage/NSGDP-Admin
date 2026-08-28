/** Lightweight client-side guards for alias-review suggestions. */

const DISEASE_FAMILIES: string[][] = [
  ["hepatitis", "hcv", "hbv", "hep"],
  ["hiv", "aids", "hts", "plhiv"],
  ["malaria", "rdt"],
  ["tuberculosis", "tb", "tpt"],
  ["polio", "afp"],
];

function tokens(text: string | null | undefined): Set<string> {
  const normalized = (text ?? "").trim().toLowerCase();
  if (!normalized) return new Set();
  return new Set(
    normalized
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 1)
  );
}

function familyHits(toks: Set<string>): number[] {
  return DISEASE_FAMILIES.map((family, idx) =>
    family.some((term) => toks.has(term) || [...toks].some((t) => t.startsWith(term)))
      ? idx
      : -1
  ).filter((idx) => idx >= 0);
}

/** True when query and candidate clearly point at different disease families. */
export function hasDiseaseFamilyConflict(
  query: string | null | undefined,
  candidateName: string | null | undefined,
): boolean {
  const q = familyHits(tokens(query));
  const c = familyHits(tokens(candidateName));
  if (q.length === 0 || c.length === 0) return false;
  return !q.some((idx) => c.includes(idx));
}

/** Jaccard overlap on tokens — enough to demote stale stored fuzzy candidates. */
export function tokenOverlapScore(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return union === 0 ? 0 : inter / union;
}

export type LlmIndicatorProposal = {
  decision?: string;
  proposedName?: string;
  category?: string;
  unit?: string;
};

/** LLM classify stores proposals in alias.candidates[0] — not registry fuzzy hits. */
export function extractLlmProposal(
  candidates: unknown[] | null | undefined,
): LlmIndicatorProposal | null {
  if (!candidates?.length) return null;
  const first = candidates[0];
  if (!first || typeof first !== "object") return null;
  const row = first as Record<string, unknown>;
  if (typeof row.proposedName !== "string" || !row.proposedName.trim()) {
    return null;
  }
  return {
    decision: typeof row.decision === "string" ? row.decision : undefined,
    proposedName: row.proposedName.trim(),
    category: typeof row.category === "string" ? row.category : undefined,
    unit: typeof row.unit === "string" ? row.unit : undefined,
  };
}
