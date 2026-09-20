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

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const MODEL_NAME = "gemini-3.6-flash";

function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

async function ocrScreenshot(base64Image: string, mimeType: string): Promise<string> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured for OCR screenshot extraction.");
  }
  const cleanBase64 = base64Image.replace(/^data:[^;]+;base64,/, "");

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const result = await model.generateContent([
    OCR_PROMPT,
    { inlineData: { data: cleanBase64, mimeType: mimeType || "image/png" } },
  ]);
  return result.response.text().trim();
}

async function callAnalyzer(prompt: string): Promise<string> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY not configured.");
  }
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
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

      let parsed = parsedJson
        ? ScamAutopsySchema.safeParse(parsedJson)
        : null;

      // Attempt one schema repair if schema validation failed
      if (parsed && !parsed.success && parsedJson) {
        try {
          const repairPrompt = buildRepairPrompt(rawJson, parsed.error.issues);
          rawJson = await callAnalyzer(repairPrompt);
          parsedJson = JSON.parse(stripJsonFences(rawJson));
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
