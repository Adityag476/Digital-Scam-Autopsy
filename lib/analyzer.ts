import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ScamAutopsy,
  ScamAutopsySchema,
  normalizeText,
  verifyAndAnchorQuotes,
} from "@/lib/schema";
import {
  extractEntities,
  detectRuleSignals,
  analyzeUrlRisks,
} from "@/lib/extraction";
import {
  SYSTEM_PROMPT,
  buildAnalyzerPrompt,
  buildRepairPrompt,
  OCR_PROMPT,
} from "@/lib/prompts";
import { generateDeterministicAutopsy } from "@/lib/fallback";
import { calculateEvidenceConfidence } from "@/lib/confidence";

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.6-flash",
];

function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function getGenAI(): GoogleGenerativeAI | null {
  const key = process.env.GEMINI_API_KEY || "";
  return key ? new GoogleGenerativeAI(key) : null;
}

async function ocrScreenshot(base64Image: string, mimeType: string): Promise<string> {
  const genAI = getGenAI();
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured for OCR screenshot extraction.");
  }
  const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, "");

  let lastError: any = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        OCR_PROMPT,
        { inlineData: { data: cleanBase64, mimeType: mimeType || "image/png" } },
      ]);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (err: any) {
      console.warn(`OCR model ${modelName} failed (${err?.status || err?.message}), trying next...`);
      lastError = err;
    }
  }
  throw lastError || new Error("All candidate OCR models failed.");
}

async function callAnalyzer(prompt: string): Promise<string> {
  const genAI = getGenAI();
  if (!genAI) {
    throw new Error("GEMINI_API_KEY not configured.");
  }

  let lastError: any = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text && text.trim().length > 0) {
        return text;
      }
    } catch (err: any) {
      console.warn(`Analyzer model ${modelName} failed (${err?.status || err?.message}), trying next...`);
      lastError = err;
    }
  }
  throw lastError || new Error("All candidate analyzer models failed.");
}

export interface AnalyzeInput {
  text?: string;
  image?: string;
  mimeType?: string;
}

export interface AnalysisResponse {
  result: ScamAutopsy;
  grounded: boolean;
  ungroundedQuotes: string[];
  message_text: string;
  is_fallback: boolean;
  note?: string;
}

export async function analyzeScam(input: AnalyzeInput): Promise<AnalysisResponse> {
  let rawText = input.text;

  // 1. Vision OCR extraction if image provided
  if (!rawText && input.image) {
    rawText = await ocrScreenshot(input.image, input.mimeType || "image/png");
  }

  if (!rawText || rawText.trim().length < 3) {
    throw new Error("No usable text found. Paste the message or upload a legible screenshot.");
  }

  // 2. Text Normalization
  const normalizedText = normalizeText(rawText);

  // 3. Deterministic Pre-Analysis Layer
  const entities = extractEntities(normalizedText);
  const ruleSignals = detectRuleSignals(normalizedText);
  const urlRisks = analyzeUrlRisks(entities.urls, entities.brands_claimed);

  const genAI = getGenAI();

  // 4. Try Gemini if configured, otherwise use deterministic engine
  if (genAI) {
    try {
      const prompt = buildAnalyzerPrompt(normalizedText, entities, ruleSignals, urlRisks);
      let rawJson = await callAnalyzer(prompt);
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(stripJsonFences(rawJson));
      } catch {
        // Attempt syntax repair if raw LLM response had malformed JSON
        try {
          const syntaxRepairPrompt = `The following output is corrupted or invalid JSON. Correct all syntax errors and return ONLY valid JSON matching the schema:\n${rawJson}`;
          rawJson = await callAnalyzer(syntaxRepairPrompt);
          parsedJson = JSON.parse(stripJsonFences(rawJson));
        } catch {
          parsedJson = null;
        }
      }

      if (parsedJson && typeof parsedJson === "object") {
        if (!parsedJson.extracted_entities) parsedJson.extracted_entities = entities;
        if (!parsedJson.url_risks) parsedJson.url_risks = urlRisks;
        if (!parsedJson.analysis_confidence) parsedJson.analysis_confidence = "medium";
        if (!parsedJson.summary) {
          parsedJson.summary =
            parsedJson.executive_summary ||
            parsedJson.overview ||
            parsedJson.description ||
            parsedJson.scam_summary ||
            "Social engineering attempt detected.";
        }
        if (Array.isArray(parsedJson.safe_reply_templates)) {
          parsedJson.safe_reply_templates = parsedJson.safe_reply_templates.map((t: any) =>
            typeof t === "string" ? t : t?.template || t?.reply || t?.text || JSON.stringify(t)
          );
        }
        if (Array.isArray(parsedJson.recommended_actions)) {
          parsedJson.recommended_actions = parsedJson.recommended_actions.map((a: any) => {
            if (typeof a === "string") return { title: a, steps: [a] };
            return {
              title: a?.title || a?.name || a?.action || "Protective Action",
              steps: Array.isArray(a?.steps) ? a.steps : [a?.step || a?.description || "Do not comply"],
            };
          });
        }
        if (Array.isArray(parsedJson.attack_chain)) {
          parsedJson.attack_chain = parsedJson.attack_chain.map((node: any) => ({
            ...node,
            label: node.label || node.title || node.name || "Observed Attack Stage",
            explanation: node.explanation || node.description || "Manipulative interaction observed in message.",
          }));
        }
      }

      let parsed = parsedJson
        ? ScamAutopsySchema.safeParse(parsedJson)
        : null;

      // Attempt one schema repair if schema validation failed
      if (parsed && !parsed.success && parsedJson) {
        console.warn("Gemini schema parse failed, attempting repair. Issues:", parsed.error.issues);
        try {
          const repairPrompt = buildRepairPrompt(rawJson, parsed.error.issues);
          rawJson = await callAnalyzer(repairPrompt);
          parsedJson = JSON.parse(stripJsonFences(rawJson));
          if (parsedJson && typeof parsedJson === "object") {
            if (!parsedJson.extracted_entities) parsedJson.extracted_entities = entities;
            if (!parsedJson.url_risks) parsedJson.url_risks = urlRisks;
            if (!parsedJson.analysis_confidence) parsedJson.analysis_confidence = "medium";
          }
          parsed = ScamAutopsySchema.safeParse(parsedJson);
        } catch {
          // Fallback will activate
        }
      }

      if (parsed && parsed.success) {
        // 5. Strict Literal Evidence Anchoring
        const { anchoredResult, ok, unanchoredQuotes } = verifyAndAnchorQuotes(
          parsed.data,
          normalizedText
        );

        // 6. Compute objective evidence confidence
        const confidence = calculateEvidenceConfidence({
          ruleMatchCount: ruleSignals.length,
          anchoredSignalCount: anchoredResult.signals.filter((s) => s.start_offset !== undefined).length,
          extractedEntityCount:
            entities.urls.length + entities.phones.length + entities.upi_ids.length + entities.amounts.length,
          unsupportedClaimCount: unanchoredQuotes.length,
        });

        const finalResult: ScamAutopsy = {
          ...anchoredResult,
          analysis_confidence: confidence,
          url_risks: urlRisks,
        };

        return {
          result: finalResult,
          grounded: ok,
          ungroundedQuotes: unanchoredQuotes,
          message_text: normalizedText,
          is_fallback: false,
        };
      }
    } catch (geminiErr) {
      console.warn("Gemini analysis error, falling back to deterministic autopsy:", geminiErr);
    }
  }

  // 7. Deterministic Autopsy Fallback (Always returns valid, grounded, structured output)
  const fallbackAutopsy = generateDeterministicAutopsy(
    normalizedText,
    entities,
    ruleSignals,
    urlRisks
  );

  const { anchoredResult, ok, unanchoredQuotes } = verifyAndAnchorQuotes(
    fallbackAutopsy,
    normalizedText
  );

  return {
    result: anchoredResult,
    grounded: ok,
    ungroundedQuotes: unanchoredQuotes,
    message_text: normalizedText,
    is_fallback: true,
    note: genAI ? "Fallback heuristic autopsy applied." : "Operating in deterministic offline autopsy mode.",
  };
}
