import { ExtractedEntities, ScamAutopsy, Signal, UrlRiskIndicator, anchorEvidence } from "./schema";
import { calculateEvidenceConfidence } from "./confidence";
import { detectBenignAdvisory } from "./extraction";

export function generateDeterministicAutopsy(
  messageText: string,
  entities: ExtractedEntities,
  signals: Signal[],
  urlRisks: UrlRiskIndicator[]
): ScamAutopsy {
  const normLower = messageText.toLowerCase();

  // Check if this is an official security advisory or safe transaction confirmation
  const benignCheck = detectBenignAdvisory(messageText);
  if (benignCheck.isBenign && urlRisks.length === 0 && entities.upi_ids.length === 0) {
    return {
      risk_level: "low",
      analysis_confidence: "high",
      summary:
        benignCheck.reason ||
        "This message represents a standard informational notification or official security advisory. No coercive manipulation funnel was detected.",
      extracted_entities: entities,
      url_risks: urlRisks,
      signals: [],
      attack_chain: [],
      recommended_actions: [
        {
          title: "Standard Precaution",
          steps: [
            "No immediate adversarial threat detected.",
            "Continue observing standard security practices by never sharing confidential OTPs or credentials.",
          ],
        },
      ],
      safe_reply_templates: [],
      disclaimer:
        "Scam Autopsy provides heuristic threat pattern analysis based on observed social engineering markers. It is an analytical decision-support aid and does not constitute a legal determination.",
    };
  }

  // Determine primary vector
  let isKyc = normLower.includes("kyc") || normLower.includes("verify") || normLower.includes("deactivated");
  let isRefund = normLower.includes("refund") || normLower.includes("collect request");
  let isJob = normLower.includes("job") || normLower.includes("salary") || normLower.includes("telegram");
  let isUtility = normLower.includes("electricity") || normLower.includes("power") || normLower.includes("disconnected");
  let isLoan = normLower.includes("loan") || normLower.includes("pre-approved");
  let isTech = normLower.includes("anydesk") || normLower.includes("teamviewer") || normLower.includes("fraud department");

  // Attack chain stages
  const chain: ScamAutopsy["attack_chain"] = [];

  // Stage 1: Trigger
  const urgencySignal = signals.find((s) => s.id === "urgency_deadline");
  if (urgencySignal) {
    chain.push({
      stage: "trigger",
      label: "Urgency & Loss Pressure",
      evidence_quote: urgencySignal.evidence_quote,
      explanation: "Fabricates synthetic urgency or immediate negative consequences to induce impulsive compliance.",
      start_offset: urgencySignal.start_offset,
      end_offset: urgencySignal.end_offset,
    });
  } else {
    // fallback trigger search
    const words = ["congratulations", "urgent", "dear customer", "dear consumer", "your parcel"];
    let foundWord = "";
    for (const w of words) {
      const idx = normLower.indexOf(w);
      if (idx !== -1) {
        foundWord = messageText.slice(idx, idx + w.length);
        const anchor = anchorEvidence(messageText, foundWord);
        chain.push({
          stage: "trigger",
          label: "Engagement Hook",
          evidence_quote: foundWord,
          explanation: "Hooks victim attention using authority, sudden crisis, or reward notification.",
          start_offset: anchor?.start,
          end_offset: anchor?.end,
        });
        break;
      }
    }
  }

  // Stage 2: Impersonation
  if (entities.brands_claimed.length > 0) {
    const brand = entities.brands_claimed[0];
    const anchor = anchorEvidence(messageText, brand);
    chain.push({
      stage: "impersonation",
      label: `${brand} Brand Impersonation`,
      evidence_quote: brand,
      explanation: `Borrows institutional credibility of ${brand} to reduce victim scrutiny and bypass natural skepticism.`,
      start_offset: anchor?.start,
      end_offset: anchor?.end,
    });
  } else if (isUtility) {
    const quote = "electricity service";
    const anchor = anchorEvidence(messageText, quote) || anchorEvidence(messageText, "officer");
    if (anchor) {
      chain.push({
        stage: "impersonation",
        label: "Utility Provider Authority",
        evidence_quote: anchor.quote,
        explanation: "Presents as a municipal or power utility authority to assert administrative compliance.",
        start_offset: anchor.start,
        end_offset: anchor.end,
      });
    }
  } else if (isTech) {
    const quote = "fraud department";
    const anchor = anchorEvidence(messageText, quote);
    if (anchor) {
      chain.push({
        stage: "impersonation",
        label: "Bank Security Impersonation",
        evidence_quote: anchor.quote,
        explanation: "Poses as bank fraud defense personnel to gain trust while orchestrating credential surrender.",
        start_offset: anchor.start,
        end_offset: anchor.end,
      });
    }
  }

  // Stage 3: Deception / False Pretense
  const deceptionPhrases = [
    "kyc has expired",
    "refund pending",
    "selected for a work from home",
    "will be disconnected",
    "pre-approved personal loan",
    "on hold at customs",
    "detected suspicious activity",
    "account will be blocked",
  ];
  for (const phrase of deceptionPhrases) {
    const anchor = anchorEvidence(messageText, phrase);
    if (anchor) {
      chain.push({
        stage: "deception",
        label: "Fabricated Pretext",
        evidence_quote: anchor.quote,
        explanation: "Introduces a counterfeit administrative, financial, or employment scenario requiring immediate intervention.",
        start_offset: anchor.start,
        end_offset: anchor.end,
      });
      break;
    }
  }

  // Stage 4: Action Request
  const actionPhrases = [
    "update immediately",
    "accept collect request",
    "pay a refundable registration fee",
    "contact our officer",
    "share your aadhaar",
    "pay immediately",
    "install anydesk",
    "verify now",
    "accept:",
  ];
  let actionAdded = false;
  for (const phrase of actionPhrases) {
    const anchor = anchorEvidence(messageText, phrase);
    if (anchor) {
      chain.push({
        stage: "action_request",
        label: "Call to Action",
        evidence_quote: anchor.quote,
        explanation: "Instructs victim to execute an untrusted financial transaction, install software, or navigate to a spoofed link.",
        start_offset: anchor.start,
        end_offset: anchor.end,
      });
      actionAdded = true;
      break;
    }
  }

  if (!actionAdded && entities.urls.length > 0) {
    const anchor = anchorEvidence(messageText, entities.urls[0]);
    if (anchor) {
      chain.push({
        stage: "action_request",
        label: "External Link Click",
        evidence_quote: anchor.quote,
        explanation: "Directs target to click an unverified web destination outside official application ecosystems.",
        start_offset: anchor.start,
        end_offset: anchor.end,
      });
    }
  }

  // Stage 5: Target
  if (entities.upi_ids.length > 0) {
    const anchor = anchorEvidence(messageText, entities.upi_ids[0]);
    if (anchor) {
      chain.push({
        stage: "target",
        label: "Unauthorized Direct UPI Transfer",
        evidence_quote: anchor.quote,
        explanation: `Routes funds straight into an adversary's private virtual payment address (${entities.upi_ids[0]}).`,
        start_offset: anchor.start,
        end_offset: anchor.end,
      });
    }
  } else if (normLower.includes("otp") || normLower.includes("pin") || normLower.includes("pan") || normLower.includes("aadhaar")) {
    const targetWords = ["otp", "pin", "pan", "aadhaar", "code"];
    for (const tw of targetWords) {
      const anchor = anchorEvidence(messageText, tw);
      if (anchor) {
        chain.push({
          stage: "target",
          label: "Credential & Identity Harvesting",
          evidence_quote: anchor.quote,
          explanation: "Harvests confidential authorization codes or identity proof to facilitate identity theft or account takeover.",
          start_offset: anchor.start,
          end_offset: anchor.end,
        });
        break;
      }
    }
  } else if (entities.urls.length > 0) {
    const anchor = anchorEvidence(messageText, entities.urls[0]);
    if (anchor) {
      chain.push({
        stage: "target",
        label: "Phishing Credential Harvest",
        evidence_quote: anchor.quote,
        explanation: "Lures victim onto a malicious cloned portal designed to capture banking login and debit card information.",
        start_offset: anchor.start,
        end_offset: anchor.end,
      });
    }
  }

  // Stage 6: Consequence
  const consequencePhrases = ["blocked within 24 hours", "money will be cancelled", "will be disconnected", "returned to sender", "account will be blocked"];
  for (const cp of consequencePhrases) {
    const anchor = anchorEvidence(messageText, cp);
    if (anchor) {
      chain.push({
        stage: "consequence",
        label: "Threatened Penalty",
        evidence_quote: anchor.quote,
        explanation: "Emphasizes the punitive consequence if instructions are not followed promptly.",
        start_offset: anchor.start,
        end_offset: anchor.end,
      });
      break;
    }
  }

  // Ensure chain length is at least 3
  if (chain.length < 3 && entities.phones.length > 0) {
    const anchor = anchorEvidence(messageText, entities.phones[0]);
    if (anchor) {
      chain.push({
        stage: "action_request",
        label: "Direct Social Engineering Line",
        evidence_quote: anchor.quote,
        explanation: "Establishes a direct phone line to apply high-pressure vocal social engineering.",
        start_offset: anchor.start,
        end_offset: anchor.end,
      });
    }
  }

  const confidence = calculateEvidenceConfidence({
    ruleMatchCount: signals.length,
    anchoredSignalCount: signals.filter((s) => s.start_offset !== undefined).length,
    extractedEntityCount:
      entities.urls.length + entities.phones.length + entities.upi_ids.length + entities.amounts.length,
    unsupportedClaimCount: 0,
  });

  const isHighRisk = signals.some((s) => s.severity === "high") || entities.upi_ids.length > 0 || urlRisks.length > 0;

  return {
    risk_level: isHighRisk ? "high" : signals.length > 0 ? "medium" : "low",
    analysis_confidence: confidence,
    summary:
      "This communication exhibits systemic markers of targeted social engineering designed to induce hasty compliance via institutional impersonation, synthetic urgency, and unauthorized payment or credential harvesting.",
    extracted_entities: entities,
    url_risks: urlRisks,
    signals,
    attack_chain: chain,
    recommended_actions: [
      {
        title: "Do Not Engage or Authorize Payment",
        steps: [
          "Do not click any provided web links or dial embedded phone numbers.",
          "Never approve a UPI collect request or enter your 4/6-digit UPI PIN to receive money (receiving money NEVER requires a PIN).",
          "Never install remote screen-sharing applications (AnyDesk, TeamViewer, RustDesk).",
        ],
      },
      {
        title: "Verify Through Independent Official Channels",
        steps: [
          "Cross-reference claims only through the bank's official banking application or website URL printed on your physical card/statement.",
          "Contact customer support directly using publicly listed numbers on official domains.",
        ],
      },
      {
        title: "Report to Indian Cyber Defense Authorities",
        steps: [
          "Call the National Cyber Fraud Helpline immediately at 1930.",
          "File an incident complaint at https://cybercrime.gov.in with screenshots and transaction details.",
          "Forward spam SMS to 1909 (Do Not Disturb registry) or your telecom provider's fraud portal.",
        ],
      },
    ],
    safe_reply_templates: [
      "I will verify this directly at my nearest official branch. Please do not contact this number again.",
      "Official inquiries must be routed through verified email channels. No action will be taken via SMS.",
    ],
    disclaimer:
      "Scam Autopsy provides heuristic threat pattern analysis based on observed social engineering markers. It is an analytical decision-support aid and does not constitute a legal determination.",
  };
}
