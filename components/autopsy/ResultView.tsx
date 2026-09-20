"use client";

import React, { useState } from "react";
import AttackChain from "./AttackChain";
import MessageEvidence from "./MessageEvidence";
import EntityPills from "./EntityPills";
import { ScamAutopsy, STAGE_META } from "./types";
import {
  Check,
  Copy,
  ExternalLink,
  PhoneCall,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

interface ResultViewProps {
  result: ScamAutopsy;
  message: string;
  isFallback?: boolean;
  grounded?: boolean;
  onReset: () => void;
}

const RISK_CONFIG = {
  high: {
    label: "HIGH RISK",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    dotClass: "bg-red-600",
  },
  medium: {
    label: "ELEVATED RISK",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-600",
  },
  low: {
    label: "LOW RISK",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dotClass: "bg-emerald-600",
  },
};

export default function ResultView({
  result,
  message,
  grounded = true,
  onReset,
}: ResultViewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  const activeNode =
    selectedIndex !== null && result.attack_chain[selectedIndex]
      ? result.attack_chain[selectedIndex]
      : null;

  const activeStageMeta = activeNode ? STAGE_META[activeNode.stage] : null;
  const riskMeta = RISK_CONFIG[result.risk_level] || RISK_CONFIG.high;

  const copyTemplate = async (template: string) => {
    try {
      await navigator.clipboard.writeText(template);
      setCopiedTemplate(template);
      setTimeout(() => setCopiedTemplate(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header / Forensic Overview */}
      <div className="border-b border-slate-200 pb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-semibold tracking-wider ${riskMeta.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${riskMeta.dotClass}`} />
              {riskMeta.label}
            </span>

            <span className="inline-flex items-center px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-xs text-slate-700">
              Evidence confidence: <strong className="ml-1 capitalize">{result.analysis_confidence}</strong>
            </span>

            {grounded && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-600 border border-slate-200 bg-white">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Verbatim Anchored</span>
              </span>
            )}
          </div>

          <button
            onClick={onReset}
            type="button"
            className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Analyze another message</span>
          </button>
        </div>

        {/* Executive Summary */}
        <p className="text-base sm:text-lg text-slate-900 leading-relaxed font-normal">
          {result.summary}
        </p>
      </div>

      {/* Main Core Grid: Attack Chain Anatomy (Left) + Source Evidence (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Attack Chain Pipeline */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Manipulation Attack Chain
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              {result.attack_chain.length} {result.attack_chain.length === 1 ? "Stage" : "Stages"}
            </span>
          </div>

          {result.attack_chain.length > 0 ? (
            <AttackChain
              chain={result.attack_chain}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
            />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-6 text-center space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">
                No Manipulation Chain Identified
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                This communication does not exhibit coercive manipulation stages (such as fake urgency, unauthorized collect requests, or phishing links). It matches legitimate informational patterns.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Original Message Evidence Panel & Stage Deep Dive */}
        <div className="lg:col-span-5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Evidence Document
            </h2>
            {activeNode && (
              <span className="text-xs text-slate-500 font-mono">
                Stage {selectedIndex! + 1} of {result.attack_chain.length}
              </span>
            )}
          </div>

          <div className="flex-1 min-h-[300px]">
            <MessageEvidence
              message={message}
              quote={activeNode ? activeNode.evidence_quote : null}
              startOffset={activeNode?.start_offset}
              endOffset={activeNode?.end_offset}
              stageTitle={activeStageMeta?.title}
              stageIcon={activeStageMeta?.icon}
            />
          </div>

          {activeNode && (
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Stage rationale
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {activeNode.explanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Extracted Entities */}
      <div className="border-t border-slate-200 pt-6">
        <EntityPills
          entities={result.extracted_entities}
          urlRisks={result.url_risks}
        />
      </div>

      {/* Observed Signals */}
      {result.signals.length > 0 && (
        <section className="space-y-3 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Observed Behavioral Signals
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {result.signals.length} Signals Identified
            </span>
          </div>

          <div className="border border-slate-200 rounded divide-y divide-slate-100 bg-white">
            {result.signals.map((sig, i) => (
              <div
                key={sig.id || `signal-${i}`}
                className="p-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 text-xs"
              >
                <div className="space-y-1 sm:max-w-md">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        sig.severity === "high"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : sig.severity === "med"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {sig.severity}
                    </span>
                    <span className="font-mono text-slate-800 font-medium">
                      &ldquo;{sig.evidence_quote}&rdquo;
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {sig.explanation}
                  </p>
                </div>

                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {sig.id}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action Plan */}
      <section className="space-y-4 border-t border-slate-200 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Immediate Defense Protocol
            </h2>
            <p className="text-xs text-slate-500">
              Recommended countermeasures for Indian banking and payment fraud
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="tel:1930"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-red-200 bg-red-50 text-red-800 text-xs font-medium hover:bg-red-100 transition-colors"
            >
              <PhoneCall className="w-3 h-3 text-red-700" />
              <span>Helpline 1930</span>
            </a>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              <span>cybercrime.gov.in</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.recommended_actions.map((act, i) => (
            <div
              key={`act-${i}`}
              className="border border-slate-200 rounded p-4 space-y-2 bg-white"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                <span>{act.title}</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600 pl-3">
                {act.steps.map((step, j) => (
                  <li key={`step-${j}`} className="list-disc list-outside leading-relaxed">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Safe Disengagement */}
      {result.safe_reply_templates && result.safe_reply_templates.length > 0 && (
        <section className="space-y-3 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Safe Non-Escalating Replies
            </h2>
            <span className="text-xs text-slate-400">
              Click to copy · Non-engagement is usually preferred
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {result.safe_reply_templates.map((tpl, i) => {
              const isCopied = copiedTemplate === tpl;
              return (
                <button
                  key={`tpl-${i}`}
                  type="button"
                  onClick={() => copyTemplate(tpl)}
                  className="rounded border border-slate-200 bg-white hover:border-slate-300 p-3 text-left transition-colors flex items-start justify-between gap-3 group"
                >
                  <p className="text-xs font-mono text-slate-700 leading-relaxed">
                    &ldquo;{tpl}&rdquo;
                  </p>
                  <span className="shrink-0 p-1 text-slate-400 group-hover:text-slate-700">
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer Disclaimer */}
      <footer className="pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {result.disclaimer}
        </p>
      </footer>
    </div>
  );
}
