import {
  Stage,
  AttackChainNode,
  Signal,
  ExtractedEntities,
  UrlRiskIndicator,
  ScamAutopsy,
} from "@/lib/schema";

export type {
  Stage,
  AttackChainNode,
  Signal,
  ExtractedEntities,
  UrlRiskIndicator,
  ScamAutopsy,
};

export interface StageMeta {
  step: string;
  icon: string;
  title: string;
  badgeBg: string;
  badgeText: string;
  activeBorder: string;
  activeBg: string;
}

export const STAGE_META: Record<Stage, StageMeta> = {
  trigger: {
    step: "01",
    icon: "⚡",
    title: "Trigger",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    activeBorder: "border-slate-900",
    activeBg: "bg-slate-50",
  },
  impersonation: {
    step: "02",
    icon: "🏦",
    title: "Impersonation",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    activeBorder: "border-slate-900",
    activeBg: "bg-slate-50",
  },
  deception: {
    step: "03",
    icon: "⚠️",
    title: "Deception",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    activeBorder: "border-slate-900",
    activeBg: "bg-slate-50",
  },
  action_request: {
    step: "04",
    icon: "🔗",
    title: "Action Request",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    activeBorder: "border-slate-900",
    activeBg: "bg-slate-50",
  },
  target: {
    step: "05",
    icon: "🔐",
    title: "Target",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    activeBorder: "border-slate-900",
    activeBg: "bg-slate-50",
  },
  consequence: {
    step: "06",
    icon: "💥",
    title: "Consequence",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    activeBorder: "border-slate-900",
    activeBg: "bg-slate-50",
  },
};
