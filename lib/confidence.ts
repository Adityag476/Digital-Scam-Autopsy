export interface ConfidenceInput {
  ruleMatchCount: number;
  anchoredSignalCount: number;
  extractedEntityCount: number;
  unsupportedClaimCount: number;
}

/**
 * Derives evidence confidence deterministically from verifiable grounded properties,
 * rather than asking the LLM to hallucinate an arbitrary pseudo-probability.
 */
export function calculateEvidenceConfidence(input: ConfidenceInput): "low" | "medium" | "high" {
  let score = 0;

  score += Math.min(input.ruleMatchCount * 8, 32);
  score += Math.min(input.anchoredSignalCount * 10, 40);
  score += Math.min(input.extractedEntityCount * 5, 20);
  score -= input.unsupportedClaimCount * 20;

  if (score >= 55) return "high";
  if (score >= 28) return "medium";
  return "low";
}
