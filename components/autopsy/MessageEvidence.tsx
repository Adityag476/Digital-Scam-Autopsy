"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface MessageEvidenceProps {
  message: string;
  quote: string | null;
  startOffset?: number;
  endOffset?: number;
  stageTitle?: string;
  stageIcon?: string;
}

export default function MessageEvidence({
  message,
  quote,
  startOffset,
  endOffset,
  stageTitle,
}: MessageEvidenceProps) {
  const [copied, setCopied] = useState(false);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const renderContent = () => {
    if (!quote || quote.trim().length === 0) {
      return <span>{message}</span>;
    }

    // Offset-based slice if valid
    if (
      typeof startOffset === "number" &&
      typeof endOffset === "number" &&
      startOffset >= 0 &&
      endOffset <= message.length &&
      startOffset < endOffset
    ) {
      const before = message.slice(0, startOffset);
      const matched = message.slice(startOffset, endOffset);
      const after = message.slice(endOffset);

      return (
        <>
          <span>{before}</span>
          <mark className="bg-amber-200/90 text-slate-950 px-1 py-0.5 rounded-sm font-semibold selection:bg-amber-300">
            {matched}
          </mark>
          <span>{after}</span>
        </>
      );
    }

    // Substring fallback
    const idx = message.toLowerCase().indexOf(quote.toLowerCase().trim());
    if (idx !== -1) {
      const before = message.slice(0, idx);
      const matched = message.slice(idx, idx + quote.length);
      const after = message.slice(idx + quote.length);

      return (
        <>
          <span>{before}</span>
          <mark className="bg-amber-200/90 text-slate-950 px-1 py-0.5 rounded-sm font-semibold selection:bg-amber-300">
            {matched}
          </mark>
          <span>{after}</span>
        </>
      );
    }

    return <span>{message}</span>;
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Original Communication
          </span>
          {quote && (
            <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.2 rounded font-medium">
              Highlighted Evidence
            </span>
          )}
        </div>

        <button
          onClick={copyMessage}
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Copy message"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Document view panel */}
      <div className="flex-1 bg-slate-50/80 border border-slate-200/70 rounded p-3.5 font-mono text-xs sm:text-[13px] leading-relaxed text-slate-800 whitespace-pre-wrap select-text selection:bg-slate-200">
        {renderContent()}
      </div>

      {/* Bottom active quote summary */}
      {quote && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs flex items-baseline justify-between gap-2">
          <span className="font-semibold text-slate-600 shrink-0">
            {stageTitle ? `${stageTitle} evidence:` : "Inspected quote:"}
          </span>
          <span className="font-mono text-slate-800 truncate text-right">
            &ldquo;{quote}&rdquo;
          </span>
        </div>
      )}
    </div>
  );
}
