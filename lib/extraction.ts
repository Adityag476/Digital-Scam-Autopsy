import { ExtractedEntities, Signal, UrlRiskIndicator, anchorEvidence } from "./schema";

export const KNOWN_UPI_HANDLES = [
  "okaxis",
  "okhdfcbank",
  "okicici",
  "oksbi",
  "okpaytm",
  "ybl",
  "ibl",
  "axl",
  "paytm",
  "upi",
  "barodampay",
  "postbank",
  "aubank",
  "fbl",
];

export const BRAND_KEYWORDS = [
  "SBI",
  "State Bank of India",
  "HDFC",
  "HDFC Bank",
  "ICICI",
  "ICICI Bank",
  "Axis Bank",
  "Axis",
  "Punjab National Bank",
  "PNB",
  "Bank of Baroda",
  "Paytm",
  "PhonePe",
  "Google Pay",
  "GPay",
  "RBI",
  "Reserve Bank of India",
  "Income Tax",
  "IT Department",
  "IRCTC",
  "Amazon",
  "Flipkart",
  "Electricity Board",
  "Bescom",
  "MSEDCL",
  "UPPCL",
  "BSES",
  "Telegram",
];

const URGENCY_PHRASES = [
  "today",
  "immediately",
  "within 2 hours",
  "within 24 hours",
  "tonight",
  "blocked",
  "suspended",
  "deactivated",
  "last warning",
  "final notice",
  "account will be closed",
  "expire",
  "urgent",
  "strictly required",
  "limited time",
];

const KYC_BAIT_PHRASES = [
  "kyc",
  "verify your account",
  "update your details",
  "link your aadhaar",
  "pan verification",
  "account freeze",
  "account will be deactivated",
  "sim will be blocked",
  "kyc expired",
  "re-kyc",
];

const CREDENTIAL_BAIT_PHRASES = [
  "otp",
  "pin",
  "mpin",
  "cvv",
  "net banking",
  "netbanking",
  "password",
  "anydesk",
  "teamviewer",
  "rustdesk",
  "screen share",
  "remote access",
  "install apk",
  ".apk",
];

const URL_SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "cutt.ly",
  "is.gd",
  "rb.gy",
  "shorturl.at",
  "ow.ly",
];

function findExactQuote(text: string, phrase: string): string | null {
  const idx = text.toLowerCase().indexOf(phrase.toLowerCase());
  if (idx === -1) return null;
  return text.slice(idx, idx + phrase.length);
}

export function extractEntities(text: string): ExtractedEntities {
  const urlMatches = text.match(/https?:\/\/[^\s"'<>]+|www\.[^\s"'<>]+|[a-zA-Z0-9-]+\.(?:com|in|info|co|org|net|xyz|top|site|app|live)\/[^\s"'<>]*/gi) || [];
  const urls = Array.from(
    new Set<string>(
      urlMatches.map((s) => s.replace(/[.,:;)]$/, ""))
    )
  );

  const phoneMatches = text.match(/(?:\+91[-\s]?)?[6-9]\d{9}\b/g) || [];
  const phones = Array.from(
    new Set<string>(
      phoneMatches.map((p) => p.trim())
    )
  );

  const rawHandles = text.match(/[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}/g) || [];
  const upi_ids = Array.from(
    new Set<string>(
      rawHandles.filter((h) =>
        KNOWN_UPI_HANDLES.some((k) => h.toLowerCase().includes(k))
      )
    )
  );

  const rupeeMatches = text.match(/₹\s?\d[\d,]*(?:\.\d+)?/g) || [];
  const inrMatches = text.match(/\b(?:INR|Rs\.?)\s?\d[\d,]*(?:\.\d+)?/gi) || [];
  const amounts = Array.from(new Set<string>([...rupeeMatches, ...inrMatches]));

  const brands_claimed = Array.from(
    new Set<string>(
      BRAND_KEYWORDS.filter((b) =>
        new RegExp(`\\b${b.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i").test(text)
      )
    )
  );

  return { urls, phones, upi_ids, amounts, brands_claimed };
}

export function analyzeUrlRisks(urls: string[], brandsClaimed: string[]): UrlRiskIndicator[] {
  const indicators: UrlRiskIndicator[] = [];

  for (const rawUrl of urls) {
    const urlLower = rawUrl.toLowerCase();

    // 1. Raw IP address check
    if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(rawUrl)) {
      indicators.push({
        url: rawUrl,
        risk_flag: "Raw Numerical IP Address",
        description: "Direct numerical IP address observed instead of a verified institutional domain name.",
      });
    }

    // 2. Shortener check
    if (URL_SHORTENERS.some((sh) => urlLower.includes(sh))) {
      indicators.push({
        url: rawUrl,
        risk_flag: "Obfuscated Shortened Link",
        description: "Employs an external link redirection service that obscures the ultimate destination host.",
      });
    }

    // 3. Punycode check
    if (urlLower.includes("xn--")) {
      indicators.push({
        url: rawUrl,
        risk_flag: "Punycode Domain Representation",
        description: "Internationalized domain encoding (punycode) detected, commonly observed in visual lookalike domains.",
      });
    }

    // 4. Insecure protocol check
    if (urlLower.startsWith("http://")) {
      indicators.push({
        url: rawUrl,
        risk_flag: "Unencrypted HTTP Protocol",
        description: "Communicates over plain HTTP without TLS encryption, inconsistent with legitimate financial institutions.",
      });
    }

    // 5. Brand impersonation in domain
    for (const brand of brandsClaimed) {
      const bClean = brand.toLowerCase().replace(/\s+/g, "");
      if (
        urlLower.includes(bClean) &&
        !urlLower.includes(`.${bClean}.co.in`) &&
        !urlLower.includes(`.${bClean}.com`) &&
        !urlLower.includes(`${bClean}.bank.in`)
      ) {
        indicators.push({
          url: rawUrl,
          risk_flag: "Mismatched Brand Reference in Hostname",
          description: `URL references '${brand}' but resolves on a third-party non-authoritative domain structure.`,
        });
        break;
      }
    }
  }

  return indicators;
}

export function detectBenignAdvisory(text: string): { isBenign: boolean; reason?: string } {
  const lower = text.toLowerCase();

  // Safety advisories
  if (
    lower.includes("never share your otp") ||
    lower.includes("never share otp") ||
    lower.includes("do not share your pin") ||
    lower.includes("do not share otp") ||
    lower.includes("beware of fraud") ||
    lower.includes("at your bank branch") ||
    lower.includes("visit your home branch")
  ) {
    return {
      isBenign: true,
      reason: "Official security advisory warning users against sharing credentials.",
    };
  }

  // Legitimate transaction confirmations
  if (
    (lower.includes("was successful") || lower.includes("successfully paid") || lower.includes("debited from a/c")) &&
    !lower.includes("blocked") &&
    !lower.includes("suspended") &&
    !lower.includes("refund pending") &&
    !lower.includes("http") &&
    !lower.includes("bit.ly")
  ) {
    return {
      isBenign: true,
      reason: "Standard transactional receipt/confirmation message with no action request or suspicious link.",
    };
  }

  // Peer warning / Scam awareness / Police alert
  if (
    (lower.includes("beware of") || lower.includes("fraudsters use") || lower.includes("fake electricity") || lower.includes("known fraud") || lower.includes("don't click") || lower.includes("do not click") || lower.includes("phishing trap")) &&
    (lower.includes("police") || lower.includes("warning") || lower.includes("stay safe") || lower.includes("just informing") || lower.includes("alert") || lower.includes("advisory"))
  ) {
    return {
      isBenign: true,
      reason: "Scam awareness advisory or peer warning educating recipients about a known fraudulent pattern.",
    };
  }

  return { isBenign: false };
}

export function detectRuleSignals(text: string): Signal[] {
  const signals: Signal[] = [];

  // Urgency
  for (const phrase of URGENCY_PHRASES) {
    const quote = findExactQuote(text, phrase);
    if (quote) {
      const anchor = anchorEvidence(text, quote);
      signals.push({
        id: "urgency_deadline",
        severity: "med",
        evidence_quote: quote,
        explanation:
          "Manufactures synthetic time pressure to impair deliberation and panic the recipient into acting before verifying.",
        start_offset: anchor?.start,
        end_offset: anchor?.end,
      });
      break;
    }
  }

  // KYC
  for (const phrase of KYC_BAIT_PHRASES) {
    const quote = findExactQuote(text, phrase);
    if (quote) {
      const anchor = anchorEvidence(text, quote);
      signals.push({
        id: "kyc_verification_bait",
        severity: "high",
        evidence_quote: quote,
        explanation:
          "Uses statutory KYC terminology as pretense to demand urgent compliance and channel users to illicit forms.",
        start_offset: anchor?.start,
        end_offset: anchor?.end,
      });
      break;
    }
  }

  // Credential bait
  for (const phrase of CREDENTIAL_BAIT_PHRASES) {
    const quote = findExactQuote(text, phrase);
    if (quote) {
      const anchor = anchorEvidence(text, quote);
      signals.push({
        id: "credential_harvesting_bait",
        severity: "high",
        evidence_quote: quote,
        explanation:
          "Demands sensitive credentials, OTP, or remote screen-sharing tools. Legitimate banks never solicit these via chat or SMS.",
        start_offset: anchor?.start,
        end_offset: anchor?.end,
      });
      break;
    }
  }

  const entities = extractEntities(text);

  // Brand + UPI payment mismatch
  if (entities.brands_claimed.length > 0 && entities.upi_ids.length > 0) {
    const anchor = anchorEvidence(text, entities.brands_claimed[0]);
    signals.push({
      id: "brand_payment_mismatch",
      severity: "high",
      evidence_quote: entities.brands_claimed[0],
      explanation:
        `Claims affiliation with '${entities.brands_claimed[0]}' while routing payments to an arbitrary individual VPA (${entities.upi_ids[0]}).`,
      start_offset: anchor?.start,
      end_offset: anchor?.end,
    });
  }

  // Suspicious shortened / non-standard link
  if (entities.urls.length > 0) {
    const anchor = anchorEvidence(text, entities.urls[0]);
    signals.push({
      id: "external_unverified_url",
      severity: "high",
      evidence_quote: entities.urls[0],
      explanation:
        "Routes interaction outside verified banking apps into an unauthenticated external portal.",
      start_offset: anchor?.start,
      end_offset: anchor?.end,
    });
  }

  return signals;
}
