"use client";

import React from "react";
import { ExtractedEntities, UrlRiskIndicator } from "./types";
import {
  CreditCard,
  Phone,
  Link2,
  Building2,
  Coins,
  AlertCircle,
} from "lucide-react";

interface EntityPillsProps {
  entities: ExtractedEntities;
  urlRisks?: UrlRiskIndicator[];
}

export default function EntityPills({ entities, urlRisks = [] }: EntityPillsProps) {
  const hasEntities =
    entities.upi_ids.length > 0 ||
    entities.phones.length > 0 ||
    entities.amounts.length > 0 ||
    entities.brands_claimed.length > 0 ||
    entities.urls.length > 0;

  if (!hasEntities && urlRisks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Extracted Entities &amp; Indicators
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">
          Deterministic Extraction
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Claimed Brands */}
        {entities.brands_claimed.map((brand, i) => (
          <span
            key={`brand-${i}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700"
          >
            <Building2 className="w-3 h-3 text-slate-400" />
            <span>Brand: <strong>{brand}</strong></span>
          </span>
        ))}

        {/* UPI IDs */}
        {entities.upi_ids.map((upi, i) => (
          <span
            key={`upi-${i}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800"
          >
            <CreditCard className="w-3 h-3 text-slate-400" />
            <span>UPI: <code className="font-mono">{upi}</code></span>
          </span>
        ))}

        {/* Amounts */}
        {entities.amounts.map((amount, i) => (
          <span
            key={`amt-${i}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700"
          >
            <Coins className="w-3 h-3 text-slate-400" />
            <span>Amount: <strong>{amount}</strong></span>
          </span>
        ))}

        {/* Phones */}
        {entities.phones.map((phone, i) => (
          <span
            key={`phone-${i}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700"
          >
            <Phone className="w-3 h-3 text-slate-400" />
            <span>Phone: <code className="font-mono">{phone}</code></span>
          </span>
        ))}

        {/* URLs */}
        {entities.urls.map((url, i) => (
          <span
            key={`url-${i}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 max-w-xs truncate"
            title={url}
          >
            <Link2 className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{url}</span>
          </span>
        ))}
      </div>

      {/* Observable URL Properties */}
      {urlRisks.length > 0 && (
        <div className="mt-3 rounded border border-slate-200 bg-slate-50/70 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Observable URL Properties</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
            {urlRisks.map((risk, i) => (
              <li key={`url-risk-${i}`}>
                <strong className="text-slate-800">{risk.risk_flag}:</strong>{" "}
                {risk.description} (<code className="text-slate-700 font-mono text-[11px]">{risk.url}</code>)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
