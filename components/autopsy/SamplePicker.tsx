"use client";

import React from "react";
import { SAMPLE_SCAMS, SampleScam } from "@/lib/samples";

interface SamplePickerProps {
  onSelectSample: (sample: SampleScam) => void;
  activeSampleId?: string | null;
}

export default function SamplePicker({
  onSelectSample,
  activeSampleId,
}: SamplePickerProps) {
  const threats = SAMPLE_SCAMS.filter((s) => !s.isBenign);
  const controls = SAMPLE_SCAMS.filter((s) => s.isBenign);

  return (
    <div className="space-y-3">
      {/* Scam Scenarios */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Sample Scam Scenarios
          </span>
          <span className="text-[11px] text-slate-400">
            Click to populate
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {threats.map((sample) => {
            const isSelected = activeSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSelectSample(sample)}
                className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {sample.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Control / Safe Cases */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Safe Control Messages (Context vs. Keyword Check)
          </span>
          <span className="text-[11px] text-slate-400">
            Legitimate text with OTP / KYC
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {controls.map((sample) => {
            const isSelected = activeSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSelectSample(sample)}
                className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                {sample.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
