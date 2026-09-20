# Digital Scam Autopsy 🔍

> **"Don't build another 'Is this a scam?' checker. Build a 'Show me how this scam works' analyzer."**

Digital Scam Autopsy is an evidence-grounded threat analysis system focusing on Indian UPI, KYC, and banking fraud vectors.

Instead of outputting an arbitrary probability or a single yes/no verdict, it reconstructs the perpetrator's sequential manipulation chain, anchors every single observation to literal verbatim quotes from the original message, and delivers actionable, India-specific defense steps.

---

## ⚡ Core Technical Differentiators

```text
               INPUT (Pasted Text, Screenshot, or Telegram Forward)
                                     │
                       ┌─────────────┴─────────────┐
                       ▼                           ▼
              Gemini Vision OCR            Text Normalization
             (Screenshots only)                  (NFKC)
                       │                           │
                       └─────────────┬─────────────┘
                                     ▼
                        DETERMINISTIC RULE ENGINE
                      • Regex Entity Discovery (UPI VPAs, Phones, Amounts, Brands)
                      • Lexical URL Property Analysis (Punycode, Raw IP, Shorteners)
                      • Indian Banking Heuristics (Urgency, KYC Bait, Credential Bait)
                                     │
                                     ▼
                            GEMINI AI ANALYZER
                      (Contextual Attack-Chain Funnel)
                                     │
                                     ▼
                           ZOD SCHEMA VALIDATOR
                            │                │
                        [Valid]          [Invalid]
                            │                │
                            │          Repair Retry
                            │                │
                            ├────────────────┘
                            ▼
                 LITERAL EVIDENCE GROUNDING CHECK
               • Enforces exact substring occurrence in message
               • Stores character start/end offsets
               • Computes deterministic evidence confidence
                                     │
                        ┌────────────┴────────────┐
                        ▼                         ▼
                 EDITORIAL WEB UI           TELEGRAM BOT
            • Apple/Linear aesthetic     • Forward & analyze
            • Interactive step timeline  • Inline 1930 action
            • Document highlight sync    • Zero app install
```

### 1. Verbatim Substring Evidence Anchoring
Every `evidence_quote` in the attack chain and signal list is programmatically validated against the source message. Offsets (`start_offset`, `end_offset`) are preserved and synchronized with the highlight inspector. The AI cannot hallucinate facts and attach them to the user's message.

### 2. Defensible Evidence Confidence (No Fake Percentages)
We avoid arbitrary calibrated probabilities like *"91% scam probability"*. Instead, confidence (`low`, `medium`, `high`) is calculated deterministically from observable properties:
```text
+ Rule matches
+ Extracted entities
+ Anchored verbatim quotes
- Unsupported claims
```

### 3. Context Over Keywords (Negative Control Tests)
The engine does **not** trigger an attack chain simply because sensitive keywords (`OTP`, `PIN`, `KYC`, `UPI`) appear. Official bank advisories and routine transaction receipts evaluate to `LOW RISK` with `0` attack stages.

### 4. Telegram Bot Integration (Two Products, One Core)
Supports both a web application and a Telegram Bot (`/api/telegram`) running on the exact same forensic engine. Users can forward suspicious SMS or WhatsApp messages directly to a bot without opening a browser.

---

## 🧪 Verified Test Scenarios

The system has been evaluated against both coercive threats and adversarial negative controls:

| Test Scenario | Category | Result | Stages | Grounded Evidence Quotes |
| :--- | :--- | :---: | :---: | :--- |
| **SBI KYC Expiry Threat** | Coercive Phishing | `HIGH RISK` | 6 | `"immediately"`, `"SBI"`, `"KYC has expired"`, `"Update immediately"`, `"http://sbi-kyc-update.info"`, `"BLOCKED within 24 hours"` |
| **Flipkart UPI Collect** | Reverse UPI Collect | `HIGH RISK` | 6 | `"within 2 hours"`, `"Flipkart"`, `"refund pending"`, `"Accept collect request"`, `"9876543210@ybl"`, `"money will be cancelled"` |
| **Bank AnyDesk Alert** | Remote Access Trap | `HIGH RISK` | 5 | Authority pretense (`"fraud department"`), Remote tool (`"AnyDesk"`), Credential harvesting |
| **Electricity Disconnection** | Utility Scam | `HIGH RISK` | 6 | Disconnect threat (`"tonight at 9:30 PM"`), Officer impersonation, Direct UPI demand (`"powerboard@okaxis"`) |
| **Official Bank Advisory** | **Negative Control** | `LOW RISK` | **0** | Recognizes advisory context (*"Never share your OTP"*). No attack chain manufactured. |
| **Legitimate UPI Receipt** | **Negative Control** | `LOW RISK` | **0** | Recognizes standard transaction confirmation (*"Payment of ₹500 was successful"*). |
| **Police Scam Alert** | **Adversarial Control** | `LOW RISK` | **0** | Mentions scam keywords in an awareness context (*"Beware of fake electricity bill SMS"*). No false alarm. |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Create `.env.local`:
```bash
# Optional: Gemini API Key for AI attack chain & vision OCR
# (Without this key, text analysis runs 100% deterministically via offline fallback)
GEMINI_API_KEY=your_gemini_api_key

# Optional: Telegram Bot Token from @BotFather
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 Telegram Bot Webhook Setup

1. Message **[@BotFather](https://t.me/BotFather)** on Telegram and create a new bot to receive your `TELEGRAM_BOT_TOKEN`.
2. Add the token to `.env.local` or your Vercel project environment variables.
3. Register your webhook via curl:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_DEPLOYED_URL>/api/telegram"
```
4. Forward any suspicious message to your bot for instant forensic analysis.

---

## 🏛 Official Indian Cyber Safety Resources

- **National Cybercrime Helpline:** Dial `1930`
- **National Cyber Crime Reporting Portal:** [cybercrime.gov.in](https://cybercrime.gov.in)
- **Telecom Fraud Reporting (Chakshu / Sanchar Saathi):** [sancharsaathi.gov.in](https://sancharsaathi.gov.in)
