import { X, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFilters } from "./FiltersContext";
import type {
  TortCategory,
  LitigationStage,
  RiskLevel,
  ConfidenceLevel,
} from "@/data/capital-intelligence/types";
import { FIRMS } from "@/data/capital-intelligence/firms";

const CATEGORIES: TortCategory[] = [
  "Pharmaceutical",
  "Medical device",
  "Environmental",
  "Consumer product",
  "Technology",
  "Institutional abuse",
  "Other",
];
const STAGES: LitigationStage[] = [
  "Emerging",
  "Consolidation",
  "Discovery",
  "Bellwether preparation",
  "Bellwether trials",
  "Settlement discussions",
  "Resolution",
  "Monitoring",
];
const RISKS: RiskLevel[] = ["Low", "Moderate", "Elevated", "High"];
const CONFS: ConfidenceLevel[] = ["High", "Medium", "Low", "Insufficient"];

function MultiChip<T extends string>({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: readonly T[];
  values: T[];
  onChange: (v: T[]) => void;
}) {
  const toggle = (v: T) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-[#667085]">{label}:</span>
      <div className="flex flex-wrap items-center gap-1">
        {options.map((o) => {
          const active = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] transition-colors ${
                active
                  ? "border-[#85B918] bg-[#F2F7E8] text-[#3d5a08]"
                  : "border-[#E5E7E2] bg-white text-[#151515] hover:border-[#85B918]/50"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterBar() {
  const { state, set, reset } = useFilters();
  const activeCount =
    state.categories.length +
    state.stages.length +
    state.risks.length +
    state.confidences.length +
    (state.firmId !== "all" ? 1 : 0) +
    (state.watchlistOnly ? 1 : 0) +
    (state.search ? 1 : 0);

  return (
    <div className="sticky top-0 z-20 border-b border-[#E5E7E2] bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-[1600px] px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <MultiChip label="Category" options={CATEGORIES} values={state.categories} onChange={(v) => set("categories", v)} />
          <MultiChip label="Stage" options={STAGES} values={state.stages} onChange={(v) => set("stages", v)} />
          <MultiChip label="Risk" options={RISKS} values={state.risks} onChange={(v) => set("risks", v)} />
          <MultiChip label="Confidence" options={CONFS} values={state.confidences} onChange={(v) => set("confidences", v)} />

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[#667085]">Firm:</span>
            <Select value={state.firmId} onValueChange={(v) => set("firmId", v as string)}>
              <SelectTrigger className="h-7 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All firms</SelectItem>
                {FIRMS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="watch-only"
              checked={state.watchlistOnly}
              onCheckedChange={(v) => set("watchlistOnly", v)}
            />
            <Label htmlFor="watch-only" className="text-xs text-[#151515]">
              Watchlist only
            </Label>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {activeCount > 0 && <Badge variant="secondary">{activeCount} active</Badge>}
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="h-7 border-[#E5E7E2] text-[#151515]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
