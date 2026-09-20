import { ExtractedEntities, Signal, UrlRiskIndicator } from "./schema";

export const OCR_PROMPT =
  "Extract all readable message text from this screenshot verbatim. " +
  "Preserve casing, numbers, links, and line breaks exactly as shown. " +
  "Do not add commentary, disclaimers, or markdown fences. Output only the extracted text.";

export const SYSTEM_PROMPT = `You are ScamAutopsy, an expert cyber-forensics engine analyzing suspicious communications targeted at users in India (UPI, KYC, banking, telecommunications, fake job scams).

CRITICAL DIRECTIVES:
1. Output MUST be strictly valid JSON conforming to the requested schema. No markdown backticks, no prose outside JSON.
2. Every "evidence_quote" in both "signals" and "attack_chain" MUST be a LITERAL, VERBATIM SUBSTRING of the input message. NEVER paraphrase, modify punctuation, or invent text inside "evidence_quote". If a concept cannot be quoted verbatim, do not include it as an evidence quote.
3. CONTEXT OVER KEYWORDS: If the input is a legitimate bank security advisory (e.g., "Never share your OTP with anyone") or a routine transaction confirmation with no coercive action request, output "risk_level": "low", "attack_chain": [] (empty array), and "signals": []. DO NOT manufacture an attack chain simply because keywords like "OTP", "KYC", or "UPI" appear.
4. When a coercive scam is present, construct an "attack_chain" with 3 to 6 logical sequential stages mapping the perpetrator's manipulation funnel. Allowed stages ONLY:
   - "trigger" (urgency, fear, greed, curiosity)
   - "impersonation" (bank, authority, recruiter, customer care)
   - "deception" (account block claim, fake bonus, fake penalty)
   - "action_request" (click link, accept collect request, install app, send code)
   - "target" (credentials, OTP, money transfer, remote screen access)
   - "consequence" (loss of funds, unauthorized access)
5. For "recommended_actions", deliver concrete, defensive, India-specific countermeasures (mention National Cyber Crime Helpline 1930, cybercrime.gov.in, locking UPI PIN, reporting to bank).
6. Safe reply templates should either advise total silence or offer a neutral, non-engaging verification boundary.
7. Tone must remain objective, analytical, and forensic. Frame findings as risk indicators, not definitive legal guilt.`;

export function buildAnalyzerPrompt(
  messageText: string,
  entities: ExtractedEntities,
  ruleSignals: Signal[],
  urlRisks: UrlRiskIndicator[]
): string {
  return `NORMALIZED INPUT MESSAGE:
"""
${messageText}
"""

DETERMINISTIC ENTITY DISCOVERY:
${JSON.stringify(entities, null, 2)}

OBSERVED HEURISTIC SIGNALS:
${JSON.stringify(ruleSignals, null, 2)}

OBSERVED URL RISK INDICATORS:
${JSON.stringify(urlRisks, null, 2)}

TASKS:
1. Reconstruct the manipulation funnel into "attack_chain" (3-6 steps) using ONLY valid stages: trigger, impersonation, deception, action_request, target, consequence. Ensure each node has an exact verbatim "evidence_quote" found in the input text.
2. Refine and complete "signals" with high/med/low severity, clear analytical explanation, and verbatim evidence quotes.
3. Synthesize a concise 1-2 sentence executive summary of how this scam attempt operates.
4. Assess "risk_level" ("low" | "medium" | "high").
5. Provide 2-4 "recommended_actions" (title + steps).
6. Provide 1-3 safe reply templates or note why engagement should be avoided.
7. Include the standard disclaimer note.

Remember: Every single "evidence_quote" will be programmatically tested for exact substring presence in the input. Return valid JSON only.`;
}

export function buildRepairPrompt(
  originalRaw: string,
  validationErrors: unknown
): string {
  return `The following JSON output failed strict schema validation:

VALIDATION ERRORS:
${JSON.stringify(validationErrors, null, 2)}

ORIGINAL OUTPUT:
${originalRaw}

Repair the JSON so it strictly matches the schema. Preserve all valid fields, rectify offending data types or missing fields, and ensure every "evidence_quote" remains an exact substring of the original input. Output valid JSON only, without markdown code fences or commentary.`;
}
