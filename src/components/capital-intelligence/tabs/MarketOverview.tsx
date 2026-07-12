import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useFilters } from "../FiltersContext";
import { MovementIndicator, SourceBadge, RiskBadge, ConfidenceBadge } from "../badges";
import { fmtMoney, fmtPct } from "@/lib/capital-intelligence/calculations";
import type { SourceType } from "@/data/capital-intelligence/types";

interface KPI {
  label: string;
  value: string;
  change: string;
  changePositive?: boolean;
  hint: string;
  source: SourceType;
  spark: number[];
  badge?: string;
}

const KPIS: KPI[] = [
  {
    label: "Active torts",
    value: "18",
    change: "+2 this quarter",
    changePositive: true,
    hint: "Count of torts currently under active screening or underwriting.",
    source: "proprietary",
    spark: [12, 13, 14, 14, 15, 16, 16, 17, 17, 17, 18, 18],
  },
  {
    label: "Modeled capital opportunity",
    value: "$1.84B",
    change: "+8.6% over 90d",
    changePositive: true,
    hint: "Aggregate modeled qualified-case capital opportunity across active torts.",
    source: "modeled",
    spark: [1.5, 1.55, 1.6, 1.62, 1.66, 1.68, 1.7, 1.72, 1.75, 1.78, 1.82, 1.84],
    badge: "Modeled",
  },
  {
    label: "Median cost per filed case",
    value: "$9,480",
    change: "+4.2% over 90d",
    changePositive: false,
    hint: "Cross-tort median of blended cost per filed case.",
    source: "contributed",
    spark: [8800, 8900, 9000, 9080, 9100, 9200, 9260, 9300, 9350, 9400, 9440, 9480],
  },
  {
    label: "Weighted expected MOIC",
    value: "2.1x",
    change: "+0.1x",
    changePositive: true,
    hint: "Base-case, inventory-weighted expected multiple on invested capital.",
    source: "modeled",
    spark: [1.9, 1.95, 2.0, 2.02, 2.03, 2.04, 2.05, 2.06, 2.07, 2.08, 2.09, 2.1],
    badge: "Base scenario",
  },
  {
    label: "Weighted expected IRR",
    value: "23.4%",
    change: "-1.3pp",
    changePositive: false,
    hint: "Base-case, inventory-weighted expected IRR.",
    source: "modeled",
    spark: [26, 25.5, 25.2, 25.0, 24.7, 24.5, 24.2, 24.0, 23.9, 23.7, 23.5, 23.4],
    badge: "Base scenario",
  },
  {
    label: "Median time to resolution",
    value: "5.9 yrs",
    change: "+0.4 yrs",
    changePositive: false,
    hint: "Median modeled duration to resolution across active torts.",
    source: "modeled",
    spark: [5.5, 5.5, 5.6, 5.6, 5.7, 5.7, 5.7, 5.8, 5.8, 5.8, 5.9, 5.9],
  },
];

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const d = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={d}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={positive ? "#2E8B57" : "#C94A4A"}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function KPICard({ kpi }: { kpi: KPI }) {
  return (
    <Card className="border-[#E5E7E2] shadow-none">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[11px] font-medium uppercase tracking-wide text-[#667085]">
            {kpi.label}
          </div>
          <SourceBadge source={kpi.source} />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="font-condensed text-2xl font-semibold tabular-nums-ci text-[#151515]">
            {kpi.value}
          </div>
          {kpi.badge && (
            <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800">
              {kpi.badge}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span
            className={`tabular-nums-ci text-xs ${
              kpi.changePositive ? "text-[#2E8B57]" : "text-[#C94A4A]"
            }`}
          >
            {kpi.change}
          </span>
          <span className="text-[10px] text-[#667085]">Updated Jul 12</span>
        </div>
        <Sparkline data={kpi.spark} positive={!!kpi.changePositive} />
        <p className="text-[11px] leading-snug text-[#667085]">{kpi.hint}</p>
      </CardContent>
    </Card>
  );
}

function CapitalMap() {
  const { filteredTorts, openTort } = useFilters();
  const data = filteredTorts.map((t) => ({
    x: t.riskScore,
    y: t.expectedMOIC,
    z: t.filedInventory,
    code: t.code,
    name: t.name,
    score: t.score,
    irr: t.expectedIRR,
    cac: t.medianCAC,
    duration: t.duration,
    confidence: t.confidence,
  }));

  return (
    <Card className="border-[#E5E7E2] shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Capital Allocation Map</CardTitle>
        <CardDescription>
          Risk vs modeled MOIC; bubble size represents modeled qualified-case opportunity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px]">
          <div className="pointer-events-none absolute inset-x-6 top-2 flex justify-between text-[10px] uppercase text-[#667085]">
            <span>Higher return · lower risk</span>
            <span>Higher return · higher risk</span>
          </div>
          <div className="pointer-events-none absolute inset-x-6 bottom-10 flex justify-between text-[10px] uppercase text-[#667085]">
            <span>Defensive</span>
            <span>Reassessment required</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 24, right: 20, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7E2" />
              <XAxis
                type="number"
                dataKey="x"
                name="Risk"
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                label={{ value: "Risk score", position: "insideBottom", offset: -5, fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="MOIC"
                domain={[1, 3]}
                tick={{ fontSize: 11 }}
                label={{ value: "Expected MOIC", angle: -90, position: "insideLeft", fontSize: 11 }}
              />
              <ZAxis type="number" dataKey="z" range={[80, 600]} />
              <ReferenceLine x={65} stroke="#E5E7E2" />
              <ReferenceLine y={2} stroke="#E5E7E2" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload as (typeof data)[number];
                  return (
                    <div className="rounded-md border border-[#E5E7E2] bg-white p-2 text-xs shadow-sm">
                      <div className="font-semibold">
                        {p.name} <span className="text-[#667085]">({p.code})</span>
                      </div>
                      <div className="tabular-nums-ci">Index: {p.score}</div>
                      <div className="tabular-nums-ci">Risk: {p.x}</div>
                      <div className="tabular-nums-ci">MOIC: {p.y}x</div>
                      <div className="tabular-nums-ci">IRR: {p.irr}%</div>
                      <div className="tabular-nums-ci">CAC: ${p.cac}</div>
                      <div className="tabular-nums-ci">Duration: {p.duration}y</div>
                      <div>Confidence: {p.confidence}</div>
                    </div>
                  );
                }}
              />
              <Scatter
                data={data}
                fill="#85B918"
                onClick={(e) => e && openTort((e as { code: string }).code)}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-[#667085]">
          Click a bubble to open tort detail. All values are modeled estimates.
        </p>
      </CardContent>
    </Card>
  );
}

function FilingMomentum() {
  const { filteredTorts } = useFilters();
  const top = filteredTorts.slice(0, 5);
  const merged = useMemo(() => {
    if (top.length === 0) return [];
    return top[0].filingHistory.map((_, i) => {
      const row: Record<string, number | string> = { month: `M${i - 11}` };
      for (const t of top) row[t.code] = t.filingHistory[i]?.filings ?? 0;
      return row;
    });
  }, [top]);
  const colors = ["#85B918", "#3E6F9E", "#D99A19", "#C94A4A", "#252525"];

  return (
    <Card className="border-[#E5E7E2] shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Filing Velocity & Litigation Momentum</CardTitle>
        <CardDescription>Monthly filings across leading torts (12-month view).</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={merged} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7E2" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {top.map((t, i) => (
                <Line
                  key={t.code}
                  type="monotone"
                  dataKey={t.code}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function AcquisitionTrend() {
  const [metric, setMetric] = useState<"CPL" | "CPQL" | "CPS" | "CPF">("CPL");
  const factors: Record<typeof metric, number> = { CPL: 1, CPQL: 2.1, CPS: 4.6, CPF: 6.2 };
  const label: Record<typeof metric, string> = {
    CPL: "Cost per lead",
    CPQL: "Cost per qualified lead",
    CPS: "Cost per signed case",
    CPF: "Cost per filed case",
  };
  const data = useMemo(() => {
    const base = 12;
    return Array.from({ length: 12 }, (_, i) => {
      const t = i / 11;
      return {
        month: `M-${11 - i}`,
        DPV: Math.round((85 + 20 * t + Math.sin(i) * 6) * factors[metric]),
        SMA: Math.round((72 + 18 * t + Math.cos(i * 0.9) * 5) * factors[metric]),
        SBX: Math.round((65 + 14 * t + Math.sin(i * 1.1) * 4) * factors[metric]),
        PFAS: Math.round((100 + 30 * t + Math.sin(i * 0.7) * 8) * factors[metric]),
        PQT: Math.round((92 + 26 * t + Math.cos(i * 1.2) * 7) * factors[metric]),
        Benchmark: Math.round((base + 70) * factors[metric]),
      };
    });
  }, [metric]);

  return (
    <Card className="border-[#E5E7E2] shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-base">Cost of Acquisition Trends</CardTitle>
          <CardDescription>
            Illustrative benchmark data across the top five torts (12 months).
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-1">
          {(["CPL", "CPQL", "CPS", "CPF"] as const).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={metric === m ? "default" : "outline"}
              onClick={() => setMetric(m)}
              className={
                metric === m
                  ? "h-7 bg-[#85B918] text-[#090909] hover:bg-[#78a815]"
                  : "h-7 border-[#E5E7E2]"
              }
            >
              {label[m]}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7E2" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="DPV" stroke="#85B918" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="SMA" stroke="#3E6F9E" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="SBX" stroke="#D99A19" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="PFAS" stroke="#C94A4A" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="PQT" stroke="#252525" strokeWidth={2} dot={false} />
              <Line
                type="monotone"
                dataKey="Benchmark"
                stroke="#667085"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function MomentumLeaders() {
  const { filteredTorts, openTort, watchlist } = useFilters();
  const rows = [...filteredTorts].sort((a, b) => b.movement30d - a.movement30d);
  return (
    <Card className="border-[#E5E7E2] shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Momentum Leaders</CardTitle>
        <CardDescription>Ranked by 30-day index movement; click a row for detail.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7E2]">
                <TableHead className="w-10">#</TableHead>
                <TableHead>Tort</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Index</TableHead>
                <TableHead className="text-right">30d Δ</TableHead>
                <TableHead className="text-right">Filing accel.</TableHead>
                <TableHead className="text-right">CAC Δ</TableHead>
                <TableHead className="text-right">MOIC</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t, i) => (
                <TableRow
                  key={t.code}
                  onClick={() => openTort(t.code)}
                  className="cursor-pointer border-[#E5E7E2] hover:bg-[#F6F7F4]"
                >
                  <TableCell className="text-[#667085]">{i + 1}</TableCell>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="tabular-nums-ci text-[#667085]">{t.code}</TableCell>
                  <TableCell className="text-right tabular-nums-ci font-semibold">
                    {t.score}
                  </TableCell>
                  <TableCell className="text-right">
                    <MovementIndicator value={t.movement30d} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums-ci text-xs">
                    {fmtPct((t.movement30d / 100) * 40 + 2)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums-ci text-xs">
                    {fmtPct(t.riskScore > 70 ? 4.2 : -1.8)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums-ci">{t.expectedMOIC}x</TableCell>
                  <TableCell>
                    <RiskBadge level={t.riskLevel} />
                  </TableCell>
                  <TableCell>
                    <ConfidenceBadge level={t.confidence} />
                  </TableCell>
                  <TableCell className="text-xs text-[#151515]">{t.status}</TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        watchlist.toggle(t.code);
                      }}
                    >
                      {watchlist.has(t.code) ? (
                        <BookmarkCheck className="h-4 w-4 text-[#85B918]" />
                      ) : (
                        <Bookmark className="h-4 w-4 text-[#667085]" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="py-8 text-center text-sm text-[#667085]">
                    No torts match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskRepricing() {
  const items = [
    {
      code: "PQT",
      previous: 62,
      current: 56,
      reason: "Adverse expert ruling",
      date: "Jul 10, 2026",
      source: "public" as SourceType,
    },
    {
      code: "GLP1",
      previous: 53,
      current: 61,
      reason: "Positive bellwether development",
      date: "Jul 09, 2026",
      source: "public" as SourceType,
    },
    {
      code: "PFAS",
      previous: 66,
      current: 69,
      reason: "Defendant solvency concerns priced in",
      date: "Jul 08, 2026",
      source: "modeled" as SourceType,
    },
    {
      code: "SMA",
      previous: 74,
      current: 78,
      reason: "Reduced acquisition costs",
      date: "Jul 07, 2026",
      source: "contributed" as SourceType,
    },
  ];
  const { openTort } = useFilters();
  return (
    <Card className="border-[#E5E7E2] shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Material Risk Repricing</CardTitle>
        <CardDescription>Largest recent score changes with attributed drivers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((r) => {
          const delta = r.current - r.previous;
          return (
            <button
              key={r.code}
              onClick={() => openTort(r.code)}
              className="flex w-full items-center justify-between rounded-md border border-[#E5E7E2] bg-white p-2.5 text-left hover:border-[#85B918]/60"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-condensed text-sm font-semibold">{r.code}</span>
                  <SourceBadge source={r.source} />
                </div>
                <div className="truncate text-xs text-[#151515]">{r.reason}</div>
                <div className="text-[10px] text-[#667085]">{r.date}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-[#667085]">Score</div>
                <div className="tabular-nums-ci text-sm">
                  {r.previous} → <span className="font-semibold">{r.current}</span>
                </div>
                <MovementIndicator value={delta} digits={0} />
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function MarketOverview() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {KPIS.map((k) => (
          <KPICard key={k.label} kpi={k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CapitalMap />
        </div>
        <RiskRepricing />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FilingMomentum />
        <AcquisitionTrend />
      </div>

      <MomentumLeaders />

      <p className="text-[11px] text-[#667085]">
        All KPI figures illustrate {fmtMoney(1_840_000_000, { compact: true })} of modeled capital
        opportunity based on demonstration data.
      </p>
    </div>
  );
}
