import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { TORT_BY_CODE } from "@/data/capital-intelligence/torts";
import { INDEX_COMPONENTS, fmtMoney, fmtNum } from "@/lib/capital-intelligence/calculations";
import { useFilters } from "./FiltersContext";
import { ConfidenceBadge, MovementIndicator, RiskBadge, SourceBadge } from "./badges";
import { FIRMS } from "@/data/capital-intelligence/firms";
import type { SourceType } from "@/data/capital-intelligence/types";

export function TortDrawer() {
  const { state, closeTort, watchlist } = useFilters();
  const tort = state.selectedTort ? TORT_BY_CODE.get(state.selectedTort) : null;
  const activeFirms = tort ? FIRMS.filter((f) => f.torts.includes(tort.code)) : [];

  const sources: { metric: string; source: SourceType; date: string; confidence: string }[] = [
    { metric: "Filing counts", source: "public", date: "Jul 12, 2026", confidence: "High" },
    { metric: "CPL / CAC", source: "contributed", date: "Jul 11, 2026", confidence: "Medium" },
    { metric: "Cost per filed case", source: "modeled", date: "Jul 10, 2026", confidence: "Medium" },
    { metric: "Resolution outlook", source: "modeled", date: "Jul 10, 2026", confidence: "Medium" },
    { metric: "Recovery assumptions", source: "modeled", date: "Jul 10, 2026", confidence: "Low" },
    { metric: "Firm execution", source: "contributed", date: "Jul 09, 2026", confidence: "Medium" },
  ];

  return (
    <Sheet open={!!tort} onOpenChange={(o) => !o && closeTort()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        {tort && (
          <>
            <SheetHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#090909] px-2 py-0.5 text-[11px] font-semibold text-[#85B918]">
                  {tort.code}
                </span>
                <SheetTitle className="text-lg">{tort.name}</SheetTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <ConfidenceBadge level={tort.confidence} />
                <RiskBadge level={tort.riskLevel} />
                <span className="text-[11px] text-[#667085]">
                  {tort.category} · {tort.stage}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <Button size="sm" variant="outline" className="h-7 border-[#E5E7E2]" onClick={() => watchlist.toggle(tort.code)}>
                    {watchlist.has(tort.code) ? <BookmarkCheck className="h-3.5 w-3.5 text-[#85B918]" /> : <Bookmark className="h-3.5 w-3.5" />}
                    Watch
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 border-[#E5E7E2]">
                    Compare
                  </Button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-md bg-[#F2F7E8] p-2">
                  <div className="text-[10px] uppercase text-[#3d5a08]">Index</div>
                  <div className="font-condensed text-xl font-semibold tabular-nums-ci">{tort.score}</div>
                  <MovementIndicator value={tort.movement30d} />
                </div>
                <div className="rounded-md bg-[#F6F7F4] p-2">
                  <div className="text-[10px] uppercase text-[#667085]">Risk</div>
                  <div className="font-condensed text-xl font-semibold tabular-nums-ci">{tort.riskScore}</div>
                </div>
                <div className="rounded-md bg-[#F6F7F4] p-2">
                  <div className="text-[10px] uppercase text-[#667085]">MOIC</div>
                  <div className="font-condensed text-xl font-semibold tabular-nums-ci">{tort.expectedMOIC}x</div>
                </div>
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-6 text-xs">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
                <TabsTrigger value="litigation">Litigation</TabsTrigger>
                <TabsTrigger value="economics">Economics</TabsTrigger>
                <TabsTrigger value="firms">Firms</TabsTrigger>
                <TabsTrigger value="sources">Sources</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3">
                <p className="text-sm text-[#151515]">{tort.description}</p>
                <div>
                  <div className="mb-1 text-[11px] uppercase text-[#667085]">Score history (12m)</div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={tort.scoreHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7E2" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="score" stroke="#85B918" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] uppercase text-[#667085]">Index composition</div>
                  <div className="space-y-1">
                    {INDEX_COMPONENTS.map((c) => (
                      <div key={c.key} className="flex items-center justify-between text-xs">
                        <span>{c.key}</span>
                        <span className="tabular-nums-ci text-[#667085]">{(c.weight * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                    <p className="pt-1 text-[10px] text-[#667085]">
                      Composite screening indicator based on litigation, acquisition, operational and modeled financial factors. Not a security rating or investment recommendation.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="acquisition" className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-[#F6F7F4] p-2">
                    <div className="text-[10px] uppercase text-[#667085]">CPL</div>
                    <div className="font-semibold tabular-nums-ci">${fmtNum(Math.round(tort.medianCAC / 12))}</div>
                  </div>
                  <div className="rounded-md bg-[#F6F7F4] p-2">
                    <div className="text-[10px] uppercase text-[#667085]">Cost per signed</div>
                    <div className="font-semibold tabular-nums-ci">${fmtNum(Math.round(tort.medianCAC * 1.4))}</div>
                  </div>
                  <div className="rounded-md bg-[#F6F7F4] p-2">
                    <div className="text-[10px] uppercase text-[#667085]">Cost per filed</div>
                    <div className="font-semibold tabular-nums-ci">${fmtNum(tort.costPerFiledCase)}</div>
                  </div>
                  <div className="rounded-md bg-[#F6F7F4] p-2">
                    <div className="text-[10px] uppercase text-[#667085]">Blended CAC</div>
                    <div className="font-semibold tabular-nums-ci">${fmtNum(tort.medianCAC)}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[11px] uppercase text-[#667085]">Channel mix (demo)</div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { channel: "TV", cost: 3.1 },
                        { channel: "Paid search", cost: 2.4 },
                        { channel: "Social", cost: 1.9 },
                        { channel: "Affiliate", cost: 1.6 },
                        { channel: "Organic", cost: 0.8 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7E2" />
                        <XAxis dataKey="channel" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${v}K`} />
                        <Tooltip formatter={(v: number) => `$${v}K CPL`} />
                        <Bar dataKey="cost" fill="#85B918" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="litigation" className="space-y-3">
                <div>
                  <div className="mb-1 text-[11px] uppercase text-[#667085]">Monthly filings</div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tort.filingHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7E2" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="filings" fill="#3E6F9E" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-md border border-[#E5E7E2] p-2 text-xs">
                  <div className="mb-1 font-medium">Key rulings & bellwether</div>
                  <ul className="space-y-1 text-[#151515]">
                    <li>· General causation briefing consolidated</li>
                    <li>· First bellwether pool expected in {tort.stage === "Bellwether trials" ? "Q3 2026" : "Q1 2027"}</li>
                    <li>· Coordinated proceeding across federal defendants</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="economics" className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-[#F6F7F4] p-2">
                    <div className="text-[10px] uppercase text-[#667085]">MOIC</div>
                    <div className="font-semibold tabular-nums-ci">{tort.expectedMOIC}x</div>
                  </div>
                  <div className="rounded-md bg-[#F6F7F4] p-2">
                    <div className="text-[10px] uppercase text-[#667085]">IRR</div>
                    <div className="font-semibold tabular-nums-ci">{tort.expectedIRR}%</div>
                  </div>
                  <div className="rounded-md bg-[#F6F7F4] p-2">
                    <div className="text-[10px] uppercase text-[#667085]">Duration</div>
                    <div className="font-semibold tabular-nums-ci">{tort.duration}y</div>
                  </div>
                  <div className="rounded-md bg-[#F6F7F4] p-2">
                    <div className="text-[10px] uppercase text-[#667085]">Capital / 1K filed</div>
                    <div className="font-semibold tabular-nums-ci">{fmtMoney(tort.costPerFiledCase * 1000, { compact: true })}</div>
                  </div>
                </div>
                <p className="text-[#667085]">Modeled base scenario. Downside/upside available in the Underwriting tab.</p>
              </TabsContent>

              <TabsContent value="firms" className="space-y-2 text-xs">
                {activeFirms.map((f) => (
                  <div key={f.id} className="rounded-md border border-[#E5E7E2] p-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{f.name}</div>
                      <span className="text-[10px] text-[#667085]">{f.status}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-[#667085]">
                      <span>Filed: <span className="tabular-nums-ci text-[#151515]">{fmtNum(f.filedInventory)}</span></span>
                      <span>S→F: <span className="tabular-nums-ci text-[#151515]">{(f.signedToFiled * 100).toFixed(0)}%</span></span>
                      <span>CPFC: <span className="tabular-nums-ci text-[#151515]">${fmtNum(f.costPerFiledCase)}</span></span>
                    </div>
                  </div>
                ))}
                {activeFirms.length === 0 && <p className="text-[#667085]">No firms currently mapped to this tort.</p>}
              </TabsContent>

              <TabsContent value="sources" className="space-y-2 text-xs">
                {sources.map((s) => (
                  <div key={s.metric} className="flex items-center justify-between rounded-md border border-[#E5E7E2] p-2">
                    <div>
                      <div className="font-medium">{s.metric}</div>
                      <div className="text-[10px] text-[#667085]">Last reviewed {s.date} · {s.confidence} confidence</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SourceBadge source={s.source} />
                      <button className="text-[10px] text-[#3E6F9E] underline">Link</button>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
