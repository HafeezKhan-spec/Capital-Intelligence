import { cn } from "@/lib/utils";
import type { SourceType, ConfidenceLevel, RiskLevel } from "@/data/capital-intelligence/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

const SOURCE_META: Record<SourceType, { label: string; desc: string; className: string }> = {
  public: {
    label: "Public",
    desc: "Verified public data (courts, regulatory, filings).",
    className: "bg-[#F2F7E8] text-[#3d5a08] border-[#c5dc8e]",
  },
  proprietary: {
    label: "Proprietary",
    desc: "CAMG proprietary benchmark data.",
    className: "bg-slate-100 text-slate-800 border-slate-300",
  },
  contributed: {
    label: "Contributed",
    desc: "Participating firm or funder-contributed data.",
    className: "bg-[#eaf1f8] text-[#274a72] border-[#b9cee2]",
  },
  modeled: {
    label: "Modeled",
    desc: "Modeled estimate — not verified.",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  user: {
    label: "User input",
    desc: "User assumption.",
    className: "bg-violet-50 text-violet-800 border-violet-200",
  },
  insufficient: {
    label: "Insufficient",
    desc: "Insufficient data.",
    className: "bg-neutral-100 text-neutral-600 border-neutral-300",
  },
};

export function SourceBadge({ source, className }: { source: SourceType; className?: string }) {
  const m = SOURCE_META[source];
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              m.className,
              className,
            )}
          >
            {m.label}
          </span>
        </TooltipTrigger>
        <TooltipContent>{m.desc}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const map: Record<ConfidenceLevel, string> = {
    High: "bg-[#F2F7E8] text-[#3d5a08] border-[#c5dc8e]",
    Medium: "bg-amber-50 text-amber-800 border-amber-200",
    Low: "bg-orange-50 text-orange-800 border-orange-200",
    Insufficient: "bg-neutral-100 text-neutral-600 border-neutral-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        map[level],
      )}
    >
      {level} confidence
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, string> = {
    Low: "bg-[#F2F7E8] text-[#3d5a08] border-[#c5dc8e]",
    Moderate: "bg-slate-100 text-slate-700 border-slate-300",
    Elevated: "bg-amber-50 text-amber-800 border-amber-200",
    High: "bg-red-50 text-red-800 border-red-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        map[level],
      )}
    >
      {level} risk
    </span>
  );
}

export function MovementIndicator({ value, digits = 1 }: { value: number; digits?: number }) {
  const positive = value > 0;
  const negative = value < 0;
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;
  const color = positive
    ? "text-[#2E8B57]"
    : negative
      ? "text-[#C94A4A]"
      : "text-[#667085]";
  const sign = positive ? "+" : "";
  return (
    <span className={cn("inline-flex items-center gap-0.5 tabular-nums-ci text-xs font-medium", color)}>
      <Icon className="h-3 w-3" aria-hidden />
      {sign}
      {value.toFixed(digits)}
    </span>
  );
}
