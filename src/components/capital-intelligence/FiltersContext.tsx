import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  TortCategory,
  LitigationStage,
  RiskLevel,
  ConfidenceLevel,
  TortMetric,
} from "@/data/capital-intelligence/types";
import { TORTS } from "@/data/capital-intelligence/torts";
import { useWatchlist } from "./useWatchlist";

export interface FiltersState {
  search: string;
  categories: TortCategory[];
  stages: LitigationStage[];
  risks: RiskLevel[];
  confidences: ConfidenceLevel[];
  firmId: string | "all";
  watchlistOnly: boolean;
  selectedTort: string | null;
  selectedFirm: string | null;
}

const defaults: FiltersState = {
  search: "",
  categories: [],
  stages: [],
  risks: [],
  confidences: [],
  firmId: "all",
  watchlistOnly: false,
  selectedTort: null,
  selectedFirm: null,
};

interface Ctx {
  state: FiltersState;
  set: <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => void;
  reset: () => void;
  filteredTorts: TortMetric[];
  openTort: (code: string) => void;
  closeTort: () => void;
  openFirm: (id: string) => void;
  closeFirm: () => void;
  watchlist: ReturnType<typeof useWatchlist>;
}

const FiltersContext = createContext<Ctx | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FiltersState>(defaults);
  const watchlist = useWatchlist();

  const set = <K extends keyof FiltersState>(key: K, value: FiltersState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const reset = () =>
    setState((s) => ({ ...defaults, selectedTort: s.selectedTort, selectedFirm: s.selectedFirm }));

  const filteredTorts = useMemo(() => {
    return TORTS.filter((t) => {
      if (state.search) {
        const q = state.search.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.code.toLowerCase().includes(q)) return false;
      }
      if (state.categories.length && !state.categories.includes(t.category)) return false;
      if (state.stages.length && !state.stages.includes(t.stage)) return false;
      if (state.risks.length && !state.risks.includes(t.riskLevel)) return false;
      if (state.confidences.length && !state.confidences.includes(t.confidence)) return false;
      if (state.watchlistOnly && !watchlist.has(t.code)) return false;
      return true;
    });
  }, [state, watchlist]);

  const openTort = (code: string) => set("selectedTort", code);
  const closeTort = () => set("selectedTort", null);
  const openFirm = (id: string) => set("selectedFirm", id);
  const closeFirm = () => set("selectedFirm", null);

  return (
    <FiltersContext.Provider
      value={{ state, set, reset, filteredTorts, openTort, closeTort, openFirm, closeFirm, watchlist }}
    >
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider");
  return ctx;
}
