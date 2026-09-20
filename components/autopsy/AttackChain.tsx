"use client";

import React from "react";
import { AttackChainNode, STAGE_META } from "./types";
import { ChevronRight } from "lucide-react";

interface AttackChainProps {
  chain: AttackChainNode[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export default function AttackChain({
  chain,
  selectedIndex,
  onSelect,
}: AttackChainProps) {
  return (
    <div className="relative">
      {/* 1px vertical timeline connector */}
      <div
        className="absolute left-[19px] top-4 bottom-6 w-px bg-slate-200 -z-0"
        aria-hidden="true"
      />

      <ol className="space-y-3 relative z-10 list-none p-0 m-0">
        {chain.map((node, idx) => {
          const meta = STAGE_META[node.stage] || STAGE_META.trigger;
          const isActive = selectedIndex === idx;

          return (
            <li key={idx} className="relative">
              <div
                onClick={() => onSelect(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(idx);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                className={`w-full group text-left cursor-pointer flex items-start gap-3.5 p-3.5 rounded-lg border transition-colors outline-none focus-visible:ring-1 focus-visible:ring-slate-900 ${
                  isActive
                    ? "border-slate-900 bg-slate-50/60 shadow-sm"
                    : "border-slate-200/90 bg-white hover:border-slate-300"
                }`}
              >
                {/* Node Number Circle */}
                <div
                  className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full border text-xs font-mono font-medium transition-colors ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-600 group-hover:border-slate-400 group-hover:text-slate-900"
                  }`}
                >
                  <span>{idx + 1}</span>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {meta.title}
                      </span>
                      <span className="text-slate-300">·</span>
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {node.label}
                      </h4>
                    </div>

                    <span
                      className={`text-[11px] flex items-center gap-0.5 transition-colors ${
                        isActive
                          ? "text-slate-900 font-medium"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    >
                      <span>Evidence</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {node.explanation}
                  </p>

                  {/* Active verbatim quote callout */}
                  {isActive && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80">
                      <div className="rounded bg-amber-50/80 border border-amber-200/70 px-2.5 py-1.5 text-xs text-amber-950">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 mr-1.5">
                          Evidence quote:
                        </span>
                        <span className="font-mono text-slate-800">
                          &ldquo;{node.evidence_quote}&rdquo;
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
