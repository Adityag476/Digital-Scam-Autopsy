import { NextRequest, NextResponse } from "next/server";
import { analyzeScam } from "@/lib/analyzer";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  inlineButtons?: Array<Array<{ text: string; url?: string }>>
) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN is not configured in environment variables.");
    return false;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body: Record<string, any> = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    disable_web_page_preview: true,
  };

  if (inlineButtons && inlineButtons.length > 0) {
    body.reply_markup = {
      inline_keyboard: inlineButtons,
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return res.ok;
}

export async function GET() {
  return NextResponse.json({
    status: "online",
    bot_configured: Boolean(TELEGRAM_BOT_TOKEN),
    instructions: "Configure TELEGRAM_BOT_TOKEN in .env.local and set webhook to /api/telegram",
  });
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update?.message;

    if (!message || !message.chat || !message.text) {
      return NextResponse.json({ ok: true, note: "No text message in update." });
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    // 1. Handle commands
    if (text === "/start" || text === "/help") {
      const welcome =
        `🔍 *Digital Scam Autopsy Bot*\n\n` +
        `Forward or paste any suspicious SMS, WhatsApp message, or payment request here to understand how the manipulation works.\n\n` +
        `*Features:*\n` +
        `• Reconstructs the manipulation attack chain\n` +
        `• Anchors verbatim evidence quotes\n` +
        `• Extracts UPI VPAs & suspicious URLs\n` +
        `• Provides official Indian defense steps\n\n` +
        `_Try pasting a message like:_\n` +
        `_"URGENT: Your SBI KYC has expired. Your account will be blocked today..."_`;

      await sendTelegramMessage(chatId, welcome);
      return NextResponse.json({ ok: true });
    }

    // 2. Perform Scam Autopsy
    try {
      const { result } = await analyzeScam({ text });

      const riskEmoji =
        result.risk_level === "high"
          ? "🔴"
          : result.risk_level === "medium"
          ? "🟡"
          : "🟢";

      const riskLabel =
        result.risk_level === "high"
          ? "HIGH RISK"
          : result.risk_level === "medium"
          ? "ELEVATED RISK"
          : "LOW RISK (SAFE CONTROL)";

      let reply = `${riskEmoji} *${riskLabel}*\n`;
      reply += `*Evidence Confidence:* ${result.analysis_confidence.toUpperCase()}\n\n`;
      reply += `*Summary:*\n${result.summary}\n\n`;

      if (result.attack_chain && result.attack_chain.length > 0) {
        reply += `⚡ *Manipulation Attack Chain:*\n`;
        result.attack_chain.forEach((stage, i) => {
          reply += `${i + 1}. *${stage.label}*\n   Evidence: _"${stage.evidence_quote}"_\n   ${stage.explanation}\n\n`;
        });
      } else {
        reply += `✅ *No Manipulation Chain Identified*\nThis message matches legitimate advisory or transaction patterns without coercive funnel stages.\n\n`;
      }

      if (result.recommended_actions && result.recommended_actions.length > 0) {
        reply += `🛡️ *Immediate Defense Steps:*\n`;
        result.recommended_actions.forEach((act) => {
          reply += `• *${act.title}:*\n`;
          act.steps.forEach((step) => {
            reply += `  - ${step}\n`;
          });
        });
        reply += `\n`;
      }

      reply += `📞 *Helpline 1930* · 🌐 cybercrime.gov.in`;

      const inlineButtons = [
        [
          { text: "🚨 National Helpline: 1930", url: "https://cybercrime.gov.in" },
          { text: "🌐 cybercrime.gov.in", url: "https://cybercrime.gov.in" },
        ],
      ];

      await sendTelegramMessage(chatId, reply, inlineButtons);
    } catch (analysisErr: any) {
      const errorMsg = `⚠️ Could not analyze message: ${analysisErr?.message || "Please provide clearer message text."}`;
      await sendTelegramMessage(chatId, errorMsg);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true, error: err?.message });
  }
}
