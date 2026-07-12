import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TORTS, TORT_BY_CODE } from "@/data/capital-intelligence/torts";
import { CATALYSTS } from "@/data/capital-intelligence/misc";
import { fmtMoney, fmtNum } from "@/lib/capital-intelligence/calculations";
import { SourceBadge, ConfidenceBadge, RiskBadge, MovementIndicator } from "../badges";
import { useFilters } from "../FiltersContext";
import { Bookmark } from "lucide-react";

const FUNNEL = [
  { stage: "Leads", count: 10000, days: 1, cost: 1_600_000 },
  { stage: "Contacted", count: 6800, days: 3, cost: 1_960_000 },
  { stage: "Initially qualified", count: 2550, days: 6, cost: 2_320_000 },
  { stage: "Signed", count: 1620, days: 14, cost: 3_100_000 },
  { stage: "Records initiated", count: 1230, days: 34, cost: 4_040_000 },
  { stage: "Records complete", count: 940, days: 84, cost: 5_020_000 },
  { stage: "Case-ready", count: 790, days: 96, cost: 5_580_000 },
  { stage: "Filed", count: 675, days: 106, cost: 5_970_000 },
];

const COST_BUILDUP = [
  { key: "Media acquisition", value: 3200 },
  { key: "Contact center", value: 620 },
  { key: "Intake", value: 780 },
  { key: "Contract processing", value: 340 },
  { key: "Medical records", value: 2380 },
  { key: "Case review", value: 640 },
  { key: "Filing preparation", value: 380 },
  { key: "Quality control", value: 220 },
  { key: "Overhead allocation", value: 290 },
];

const RESOLUTION_PATH = [
  { name: "Coordinated resolution", value: 48, fill: "#85B918" },
  { name: "Individual settlement", value: 18, fill: "#3E6F9E" },
  { name: "Trial resolution", value: 4, fill: "#D99A19" },
  { name: "Dismissal / attrition", value: 22, fill: "#C94A4A" },
  { name: "Unresolved at horizon", value: 8, fill: "#667085" },
];

const RESOLUTION_STAGES = [
  { stage: "Intake survival", low: 78, base: 84, high: 88 },
  { stage: "SoL survival", low: 82, base: 87, high: 91 },
  { stage: "Product/exposure verified", low: 68, base: 76, high: 82 },
  { stage: "General causation", low: 55, base: 66, high: 78 },
  { stage: "Specific causation", low: 48, base: 58, high: 70 },
  { stage: "Daubert survival", low: 62, base: 72, high: 82 },
  { stage: "Coordinated settlement", low: 34, base: 48, high: 60 },
  { stage: "Individual settlement", low: 8, base: 18, high: 28 },
  { stage: "Bellwether selection", low: 4, base: 6, high: 9 },
  { stage: "Trial", low: 2, base: 4, high: 8 },
  { stage: "Plaintiff success if tried", low: 32, base: 46, high: 58 },
  { stage: "Collection probability", low: 68, base: 82, high: 92 },
];

const RADAR = [
  { axis: "Questionnaire burden", value: 72 },
  { axis: "Product verification", value: 68 },
  { axis: "Exposure verification", value: 74 },
  { axis: "Injury specificity", value: 66 },
  { axis: "Medical-record burden", value: 84 },
  { axis: "Facility identification", value: 62 },
  { axis: "Statute complexity", value: 70 },
  { axis: "Follow-up intensity", value: 76 },
  { axis: "Time to case-ready", value: 78 },
  { axis: "Attrition risk", value: 64 },
];

function KPI({ label, value, source, badge }: { label: string; value: string; source: "modeled" | "contributed" | "proprietary" | "public"; badge?: string }) {
  return (
    <Card className="border-[#E5E7E2] shadow-none">
      <CardContent className="space-y-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-[#667085]">{label}</div>
          <SourceBadge source={source} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <div className="font-condensed text-lg font-semibold tabular-nums-ci text-[#151515]">{value}</div>
          {badge && (
            <span className="rounded border border-amber-200 bg-amber-50 px-1 text-[9px] uppercase text-amber-800">
              {badge}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface Scenario {
  leads: number;
  cpl: number;
  qualRate: number;
  signedRate: number;
  filedRate: number;
  avgRecovery: number;
  feePct: number;
  firmSplit: number;
  cbFee: number;
  devCost: number;
  finRate: number;
  duration: number;
}

const scenarioDefaults: Record<"Downside" | "Base" | "Upside", Scenario> = {
  Downside: {
    leads: 8000, cpl: 210, qualRate: 0.22, signedRate: 0.55, filedRate: 0.6, avgRecovery: 85000, feePct: 0.4, firmSplit: 0.35, cbFee: 0.06, devCost: 1900, finRate: 0.14, duration: 7,
  },
  Base: {
    leads: 10000, cpl: 165, qualRate: 0.26, signedRate: 0.62, filedRate: 0.68, avgRecovery: 120000, feePct: 0.4, firmSplit: 0.4, cbFee: 0.06, devCost: 1600, finRate: 0.12, duration: 5.8,
  },
  Upside: {
    leads: 12000, cpl: 140, qualRate: 0.3, signedRate: 0.68, filedRate: 0.74, avgRecovery: 165000, feePct: 0.4, firmSplit: 0.45, cbFee: 0.06, devCost: 1400, finRate: 0.1, duration: 4.5,
  },
};

function scenarioOutputs(s: Scenario) {
  const qualified = s.leads * s.qualRate;
  const signed = qualified * s.signedRate;
  const filed = signed * s.filedRate;
  const acquisitionCost = s.leads * s.cpl;
  const devTotal = filed * s.devCost;
  const capitalRequired = acquisitionCost + devTotal;
  const finCost = capitalRequired * s.finRate * s.duration;
  const grossRecovery = filed * s.avgRecovery;
  const feeToPlaintiff = grossRecovery * s.feePct;
  const funderShare = feeToPlaintiff * (1 - s.firmSplit) * (1 - s.cbFee);
  const net = funderShare - finCost;
  const moic = capitalRequired > 0 ? (net + capitalRequired) / capitalRequired : 0;
  const irr = moic > 0 ? (Math.pow(Math.max(moic, 0.01), 1 / s.duration) - 1) * 100 : 0;
  const breakeven = filed > 0 ? capitalRequired / filed / s.feePct / (1 - s.firmSplit) : 0;
  return { filed: Math.round(filed), capitalRequired, grossRecovery, net, moic, irr, breakeven };
}

function ScenarioCard({
  name,
  scenario,
  onChange,
  accent,
}: {
  name: string;
  scenario: Scenario;
  onChange: (s: Scenario) => void;
  accent: string;
}) {
  const o = scenarioOutputs(scenario);
  const fields: [keyof Scenario, string, number][] = [
    ["leads", "Leads", 100],
    ["cpl", "CPL", 5],
    ["qualRate", "Qual rate", 0.01],
    ["signedRate", "Signed rate", 0.01],
    ["filedRate", "Filed rate", 0.01],
    ["avgRecovery", "Avg recovery", 5000],
    ["feePct", "Fee %", 0.01],
    ["firmSplit", "Firm split", 0.01],
    ["devCost", "Dev cost/case", 100],
    ["finRate", "Financing rate", 0.005],
    ["duration", "Duration (yrs)", 0.1],
  ];
  return (
    <Card className="border-[#E5E7E2] shadow-none">
      <CardHeader className="pb-2" style={{ borderTop: `3px solid ${accent}` }}>
        <CardTitle className="text-sm">{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {fields.map(([k, label, step]) => (
            <div key={k}>
              <Label className="text-[10px] uppercase tracking-wide text-[#667085]">{label}</Label>
              <Input
                type="number"
                step={step}
                value={scenario[k]}
                onChange={(e) => onChange({ ...scenario, [k]: Number(e.target.value) })}
                className="h-7 text-xs tabular-nums-ci"
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-md bg-[#F6F7F4] p-2 text-xs">
          <div>
            <div className="text-[10px] uppercase text-[#667085]">Filed</div>
            <div className="font-semibold tabular-nums-ci">{fmtNum(o.filed)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#667085]">Capital</div>
            <div className="font-semibold tabular-nums-ci">{fmtMoney(o.capitalRequired, { compact: true })}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#667085]">MOIC</div>
            <div className="font-semibold tabular-nums-ci">{o.moic.toFixed(2)}x</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#667085]">IRR</div>
            <div className="font-semibold tabular-nums-ci">{o.irr.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#667085]">Net</div>
            <div className="font-semibold tabular-nums-ci">{fmtMoney(o.net, { compact: true })}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[#667085]">Break-even/case</div>
            <div className="font-semibold tabular-nums-ci">{fmtMoney(o.breakeven, { compact: true })}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TortUnderwriting() {
  const { state, set, openTort, watchlist } = useFilters();
  const selected = state.selectedTort ?? "DPV";
  const tort = TORT_BY_CODE.get(selected) ?? TORTS[0];

  const [downside, setDownside] = useState<Scenario>(scenarioDefaults.Downside);
  const [base, setBase] = useState<Scenario>(scenarioDefaults.Base);
  const [upside, setUpside] = useState<Scenario>(scenarioDefaults.Upside);

  const compareData = useMemo(
    () => [
      { name: "Downside", ...scenarioOutputs(downside) },
      { name: "Base", ...scenarioOutputs(base) },
      { name: "Upside", ...scenarioOutputs(upside) },
    ],
    [downside, base, upside],
  );

  return (
    <div className="space-y-4">
      <Card className="border-[#E5E7E2] shadow-none">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <Label className="text-xs uppercase tracking-wide text-[#667085]">Select tort</Label>
            <Select value={selected} onValueChange={(v) => set("selectedTort", v)}>
              <SelectTrigger className="h-9 w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TORTS.map((t) => (
                  <SelectItem key={t.code} value={t.code}>
                    {t.name} — {t.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-[#E5E7E2]"
              onClick={() => watchlist.toggle(tort.code)}
            >
              <Bookmark className={`h-3.5 w-3.5 ${watchlist.has(tort.code) ? "fill-[#85B918] text-[#85B918]" : ""}`} />
              Watchlist
            </Button>
            <Button size="sm" variant="outline" className="h-8 border-[#E5E7E2]">
              Compare
            </Button>
            <Button size="sm" variant="outline" className="h-8 border-[#E5E7E2]" onClick={() => openTort(tort.code)}>
              Source panel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E5E7E2] shadow-none">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="font-condensed text-2xl font-semibold">{tort.name}</div>
              <span className="rounded bg-[#090909] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#85B918]">
                {tort.code}
              </span>
              <ConfidenceBadge level={tort.confidence} />
              <RiskBadge level={tort.riskLevel} />
            </div>
            <div className="text-xs text-[#667085]">
              {tort.category} · {tort.stage} · Last reviewed Jul 12, 2026
            </div>
            <p className="max-w-3xl text-sm text-[#151515]">{tort.description}</p>
          </div>
          <div className="flex items-center gap-6 tabular-nums-ci">
            <div>
              <div className="text-[10px] uppercase text-[#667085]">Index</div>
              <div className="font-condensed text-3xl font-semibold">{tort.score}</div>
              <MovementIndicator value={tort.movement30d} />
            </div>
            <div>
              <div className="text-[10px] uppercase text-[#667085]">Risk score</div>
              <div className="font-condensed text-3xl font-semibold">{tort.riskScore}</div>
              <span className="text-[10px] text-[#667085]">0–100 scale</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <KPI label="Filing velocity /mo" value={fmtNum(tort.filingVelocity)} source="public" />
        <KPI label="Median CPL" value={"$" + fmtNum(Math.round(tort.medianCAC / 12))} source="contributed" />
        <KPI label="Cost per qualified" value={"$" + fmtNum(Math.round(tort.medianCAC / 5))} source="modeled" badge="Modeled" />
        <KPI label="Cost per signed" value={"$" + fmtNum(Math.round(tort.medianCAC * 1.4))} source="modeled" badge="Modeled" />
        <KPI label="Cost per filed" value={"$" + fmtNum(tort.costPerFiledCase)} source="contributed" />
        <KPI label="Lead → signed" value={"16.2%"} source="modeled" badge="Modeled" />
        <KPI label="Signed → filed" value={"68%"} source="contributed" />
        <KPI label="Avg dev time" value={"96 d"} source="contributed" />
        <KPI label="Expected MOIC" value={tort.expectedMOIC.toFixed(1) + "x"} source="modeled" badge="Base" />
        <KPI label="Expected IRR" value={tort.expectedIRR.toFixed(1) + "%"} source="modeled" badge="Base" />
        <KPI label="Duration" value={tort.duration + "y"} source="modeled" badge="Modeled" />
        <KPI label="Break-even/case" value={"$" + fmtNum(Math.round(tort.costPerFiledCase / 0.4 / 0.6))} source="modeled" badge="Modeled" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-[#E5E7E2] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Acquisition & Intake Funnel</CardTitle>
            <CardDescription>Illustrative funnel per 10,000-lead cohort.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {FUNNEL.map((s, i) => {
              const pctOfTop = (s.count / FUNNEL[0].count) * 100;
              const conv = i === 0 ? 100 : (s.count / FUNNEL[i - 1].count) * 100;
              return (
                <div key={s.stage} className="rounded-md border border-[#E5E7E2] bg-white p-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-medium">{s.stage}</div>
                    <div className="tabular-nums-ci text-[#667085]">
                      {fmtNum(s.count)} · {conv.toFixed(0)}% · avg {s.days}d
                    </div>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded bg-[#F6F7F4]">
                    <div className="h-full bg-[#85B918]" style={{ width: `${pctOfTop}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-[#E5E7E2] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estimated Cost per Filed Case</CardTitle>
            <CardDescription>Waterfall of cost components — modeled estimate.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={COST_BUILDUP} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7E2" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
                  <YAxis type="category" dataKey="key" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#85B918" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-[#667085]">Total cost per filed case</span>
              <span className="font-semibold tabular-nums-ci">
                ${fmtNum(COST_BUILDUP.reduce((s, c) => s + c.value, 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-[#E5E7E2] shadow-none lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resolution Pathway</CardTitle>
            <CardDescription>Low, base and high probability estimates by stage — scenario model, not a prediction.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={RESOLUTION_STAGES} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7E2" />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="low" name="Low" fill="#C94A4A" />
                  <Bar dataKey="base" name="Base" fill="#85B918" />
                  <Bar dataKey="high" name="High" fill="#2E8B57" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7E2] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Modeled Resolution Path</CardTitle>
            <CardDescription>Scenario model, not a prediction.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={RESOLUTION_PATH} dataKey="value" innerRadius={50} outerRadius={80}>
                    {RESOLUTION_PATH.map((r) => (
                      <Cell key={r.name} fill={r.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 text-xs">
              {RESOLUTION_PATH.map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.fill }} />
                    {r.name}
                  </div>
                  <span className="tabular-nums-ci">{r.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-[#E5E7E2] shadow-none lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Intake Complexity Radar</CardTitle>
            <CardDescription>Composite complexity score across intake dimensions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={RADAR}>
                  <PolarGrid stroke="#E5E7E2" />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Complexity" dataKey="value" stroke="#85B918" fill="#85B918" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7E2] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Complexity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="rounded-md bg-[#F2F7E8] p-3">
              <div className="text-[10px] uppercase text-[#3d5a08]">Overall score</div>
              <div className="font-condensed text-3xl font-semibold text-[#151515] tabular-nums-ci">
                {tort.complexity}
              </div>
              <div className="text-xs text-[#3d5a08]">Elevated — records-heavy intake</div>
            </div>
            <div className="text-xs text-[#667085]">Main drivers</div>
            <ul className="space-y-1 text-xs">
              <li>· High medical-record burden</li>
              <li>· Long time to case-ready</li>
              <li>· Follow-up intensity for exposure verification</li>
            </ul>
            <div className="text-xs text-[#667085]">Recommendations</div>
            <ul className="space-y-1 text-xs">
              <li>· Dedicated records team per 800 signed cases</li>
              <li>· Staged retainer with attrition safeguards</li>
              <li>· Automated exposure questionnaire triage</li>
            </ul>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div>
                <div className="text-[10px] uppercase text-[#667085]">Staff hrs/signed</div>
                <div className="tabular-nums-ci font-semibold">6.4</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-[#667085]">Days to case-ready</div>
                <div className="tabular-nums-ci font-semibold">96</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ScenarioCard name="Downside" scenario={downside} onChange={setDownside} accent="#C94A4A" />
        <ScenarioCard name="Base" scenario={base} onChange={setBase} accent="#85B918" />
        <ScenarioCard name="Upside" scenario={upside} onChange={setUpside} accent="#2E8B57" />
      </div>

      <Card className="border-[#E5E7E2] shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Scenario Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7E2" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}x`} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="irr" name="IRR %" fill="#3E6F9E" />
                <Bar yAxisId="right" dataKey="moic" name="MOIC (x)" fill="#85B918" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E5E7E2] shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Catalyst Timeline</CardTitle>
          <CardDescription>Upcoming legal and regulatory catalysts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute inset-x-0 top-5 h-0.5 bg-[#E5E7E2]" />
            <div className="flex gap-3 overflow-x-auto pb-2">
              {CATALYSTS.map((c) => (
                <div key={c.id} className="relative w-52 shrink-0 rounded-md border border-[#E5E7E2] bg-white p-2 text-xs">
                  <div className="absolute -top-1 left-3 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#85B918]" />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="tabular-nums-ci font-medium">{c.date}</span>
                    <SourceBadge source={c.source} />
                  </div>
                  <div className="mt-1 font-semibold">{c.type}</div>
                  <div className="text-[#667085]">{c.tort} · {c.expectedImpact} impact</div>
                  <div className="mt-1 text-[11px] leading-snug">{c.description}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
