import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FiltersProvider } from "@/components/capital-intelligence/FiltersContext";
import { PageHeader } from "@/components/capital-intelligence/PageHeader";
import { FilterBar } from "@/components/capital-intelligence/FilterBar";
import { TickerStrip } from "@/components/capital-intelligence/TickerStrip";
import { MarketOverview } from "@/components/capital-intelligence/tabs/MarketOverview";
import { TortUnderwriting } from "@/components/capital-intelligence/tabs/TortUnderwriting";
import { FirmIntelligence } from "@/components/capital-intelligence/tabs/FirmIntelligence";
import { PortfolioLab } from "@/components/capital-intelligence/tabs/PortfolioLab";
import { CapitalAlerts } from "@/components/capital-intelligence/tabs/CapitalAlerts";
import { TortDrawer } from "@/components/capital-intelligence/TortDrawer";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/capital-intelligence")({
  head: () => ({
    meta: [
      { title: "Capital Intelligence — Tortelligence × CAMG" },
      {
        name: "description",
        content:
          "Institutional-grade capital allocation intelligence for mass-tort litigation: index, underwriting, firm execution, portfolio lab, and alerts.",
      },
      { property: "og:title", content: "Capital Intelligence — Tortelligence × CAMG" },
      {
        property: "og:description",
        content:
          "Screen and underwrite mass-tort opportunities with a composite capital attractiveness index, scenario modeling and portfolio stress-tests.",
      },
    ],
  }),
  component: CapitalIntelligencePage,
});

function CapitalIntelligencePage() {
  return (
    <FiltersProvider>
      <div className="min-h-screen bg-[#F6F7F4] font-sans text-[#151515]">
        <PageHeader />
        <TickerStrip />
        <FilterBar />

        <main className="mx-auto max-w-[1600px] px-4 py-4">
          <Tabs defaultValue="market" className="w-full">
            <TabsList className="grid w-full grid-cols-5 rounded-md border border-[#E5E7E2] bg-white p-1">
              <TabsTrigger
                value="market"
                className="data-[state=active]:bg-[#85B918] data-[state=active]:text-[#090909]"
              >
                Market Overview
              </TabsTrigger>
              <TabsTrigger
                value="underwriting"
                className="data-[state=active]:bg-[#85B918] data-[state=active]:text-[#090909]"
              >
                Tort Underwriting
              </TabsTrigger>
              <TabsTrigger
                value="firms"
                className="data-[state=active]:bg-[#85B918] data-[state=active]:text-[#090909]"
              >
                Firm Intelligence
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className="data-[state=active]:bg-[#85B918] data-[state=active]:text-[#090909]"
              >
                Portfolio Lab
              </TabsTrigger>
              <TabsTrigger
                value="alerts"
                className="data-[state=active]:bg-[#85B918] data-[state=active]:text-[#090909]"
              >
                Capital Alerts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="market" className="mt-4">
              <MarketOverview />
            </TabsContent>
            <TabsContent value="underwriting" className="mt-4">
              <TortUnderwriting />
            </TabsContent>
            <TabsContent value="firms" className="mt-4">
              <FirmIntelligence />
            </TabsContent>
            <TabsContent value="portfolio" className="mt-4">
              <PortfolioLab />
            </TabsContent>
            <TabsContent value="alerts" className="mt-4">
              <CapitalAlerts />
            </TabsContent>
          </Tabs>

          <footer className="mt-8 border-t border-[#E5E7E2] pt-4 text-[10px] leading-relaxed text-[#667085]">
            <p>
              <strong className="text-[#151515]">Disclosures.</strong> Tortelligence Capital Intelligence is a data
              and analytics product for institutional and accredited allocators. Metrics are derived from public
              filings, contributed operator data and Tortelligence proprietary models. Composite scores are
              screening indicators, not investment advice, credit ratings, or an offer to buy or sell any security
              or interest. Forward-looking values (MOIC, IRR, duration, resolution timing) are modeled estimates
              subject to significant uncertainty. Firm-level data is anonymized under NDA and refreshed on a
              rolling basis. © 2026 Tortelligence · CAMG.
            </p>
          </footer>
        </main>

        <TortDrawer />
        <Toaster position="top-right" />
      </div>
    </FiltersProvider>
  );
}
