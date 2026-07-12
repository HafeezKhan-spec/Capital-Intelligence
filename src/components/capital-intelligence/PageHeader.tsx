import { Search, Bookmark, Download, CalendarDays, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFilters } from "./FiltersContext";
import { downloadCSV } from "@/lib/capital-intelligence/calculations";
import { TORTS } from "@/data/capital-intelligence/torts";
import { toast } from "sonner";

export function PageHeader() {
  const { state, set } = useFilters();

  const handleExport = () => {
    downloadCSV(
      "capital-intelligence-torts.csv",
      TORTS.map((t) => ({
        code: t.code,
        name: t.name,
        stage: t.stage,
        score: t.score,
        movement30d: t.movement30d,
        risk: t.riskScore,
        moic: t.expectedMOIC,
        irr: t.expectedIRR,
        cpfc: t.costPerFiledCase,
        duration: t.duration,
        confidence: t.confidence,
      })),
    );
    toast.success("CSV export downloaded");
  };

  return (
    <header className="bg-[#090909] text-white">
      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/camg-logo.png"
                alt="Consumer Attorney Marketing Group"
                className="h-10 w-auto object-contain"
              />
              <div className="leading-tight">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">
                  CAMG-Intelligence
                </div>
                <div className="font-condensed text-xl font-semibold tracking-tight">
                  Capital Intelligence
                </div>
              </div>
            </div>
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-[#85B918]/40 bg-[#85B918]/10 px-2.5 py-1 text-[11px] font-medium text-[#c9e69a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#85B918]" />
              Powered by CAMG Capital Connect
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
              <Input
                value={state.search}
                onChange={(e) => set("search", e.target.value)}
                placeholder="Search torts, codes..."
                className="h-9 w-56 border-white/15 bg-white/5 pl-8 text-sm text-white placeholder:text-white/40 focus-visible:ring-[#85B918]/60"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              onClick={() => set("watchlistOnly", !state.watchlistOnly)}
            >
              <Bookmark className={`h-4 w-4 ${state.watchlistOnly ? "fill-[#85B918] text-[#85B918]" : ""}`} />
              Watchlist
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <div className="flex h-9 items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 text-xs text-white/70">
              <CalendarDays className="h-4 w-4" />
              Last 90 days
            </div>
            <div className="hidden md:flex h-9 items-center rounded-md border border-white/15 bg-white/5 px-3 text-xs tabular-nums-ci text-white/70">
              As of Jul 12, 2026
            </div>
            <Avatar className="h-9 w-9 border border-white/20">
              <AvatarFallback className="bg-[#252525] text-xs text-white">AN</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          Underwriting mass-tort opportunities with litigation, acquisition, firm and portfolio intelligence.
        </p>
      </div>

      <div className="border-t border-white/10 bg-[#151515]">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-white/70">
                  <Info className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                All financial, firm and tort-level values are illustrative demonstration data.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Alert className="border-0 bg-transparent p-0 text-white/70">
            <AlertDescription className="text-[11px]">
              Demonstration environment — all financial, law-firm and tort-level values shown on this page
              are illustrative mock data and do not constitute legal, financial or investment advice.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </header>
  );
}
