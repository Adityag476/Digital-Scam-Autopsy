import { z } from "zod";

export const StageEnum = z.enum([
  "trigger",
  "impersonation",
  "deception",
  "action_request",
  "target",
  "consequence",
]);

export type Stage = z.infer<typeof StageEnum>;

export const AttackChainNodeSchema = z.object({
  stage: StageEnum,
  label: z.string().min(2).max(60),
  evidence_quote: z.string().min(1),
  explanation: z.string().max(300),
  start_offset: z.number().optional(),
  end_offset: z.number().optional(),
});

export type AttackChainNode = z.infer<typeof AttackChainNodeSchema>;

export const SignalSchema = z.object({
  id: z.string(),
  severity: z.enum(["low", "med", "high"]),
  evidence_quote: z.string().min(1),
  explanation: z.string().max(260),
  start_offset: z.number().optional(),
  end_offset: z.number().optional(),
});

export type Signal = z.infer<typeof SignalSchema>;

export const UrlRiskIndicatorSchema = z.object({
  url: z.string(),
  risk_flag: z.string(),
  description: z.string(),
});

export type UrlRiskIndicator = z.infer<typeof UrlRiskIndicatorSchema>;

export const ExtractedEntitiesSchema = z.object({
  urls: z.array(z.string()).default([]),
  phones: z.array(z.string()).default([]),
  upi_ids: z.array(z.string()).default([]),
  amounts: z.array(z.string()).default([]),
  brands_claimed: z.array(z.string()).default([]),
});

export type ExtractedEntities = z.infer<typeof ExtractedEntitiesSchema>;

export const ScamAutopsySchema = z.object({
  risk_level: z.enum(["low", "medium", "high"]),
  analysis_confidence: z.enum(["low", "medium", "high"]),
  summary: z.string().max(320),
  extracted_entities: ExtractedEntitiesSchema,
  url_risks: z.array(UrlRiskIndicatorSchema).default([]),
  signals: z.array(SignalSchema).default([]),
  attack_chain: z.array(AttackChainNodeSchema).max(7).default([]),
  recommended_actions: z
    .array(
      z.object({
        title: z.string().max(80),
        steps: z.array(z.string().max(160)).min(1).max(5),
      })
    )
    .min(1)
    .max(5),
  safe_reply_templates: z.array(z.string().max(200)).max(3).default([]),
  disclaimer: z.string(),
});

export type ScamAutopsy = z.infer<typeof ScamAutopsySchema>;

export function normalizeText(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function anchorEvidence(
  normalizedText: string,
  quote: string
): { quote: string; start: number; end: number } | null {
  const normText = normalizedText.toLowerCase();
  const cleanQuote = quote.trim().toLowerCase();
  if (!cleanQuote) return null;

  const start = normText.indexOf(cleanQuote);
  if (start === -1) {
    return null;
  }
  return {
    quote: normalizedText.slice(start, start + cleanQuote.length),
    start,
    end: start + cleanQuote.length,
  };
}

export function verifyAndAnchorQuotes(
  result: ScamAutopsy,
  normalizedText: string
): {
  anchoredResult: ScamAutopsy;
  ok: boolean;
  unanchoredQuotes: string[];
} {
  const unanchoredQuotes: string[] = [];

  const anchoredSignals = result.signals.map((s) => {
    const anchor = anchorEvidence(normalizedText, s.evidence_quote);
    if (!anchor) {
      unanchoredQuotes.push(s.evidence_quote);
      return s;
    }
    return {
      ...s,
      evidence_quote: anchor.quote,
      start_offset: anchor.start,
      end_offset: anchor.end,
    };
  });

  const anchoredChain = result.attack_chain.map((step) => {
    const anchor = anchorEvidence(normalizedText, step.evidence_quote);
    if (!anchor) {
      unanchoredQuotes.push(step.evidence_quote);
      return step;
    }
    return {
      ...step,
      evidence_quote: anchor.quote,
      start_offset: anchor.start,
      end_offset: anchor.end,
    };
  });

  return {
    anchoredResult: {
      ...result,
      signals: anchoredSignals,
      attack_chain: anchoredChain,
    },
    ok: unanchoredQuotes.length === 0,
    unanchoredQuotes,
  };
}
