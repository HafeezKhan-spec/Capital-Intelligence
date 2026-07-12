import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { TORTS } from "@/data/capital-intelligence/torts";
import {
  weightedMOIC,
  weightedIRR,
  weightedDuration,
  portfolioRisk,
  concentration,
  expectedFiledInventory,
  fmtMoney,
  fmtNum,
  fmtPct,
  downloadCSV,
  applyStress,
  type StressFactor,
} from "@/lib/capital-intelligence/calculations";
import type { PortfolioAllocation, PortfolioScenario } from "@/data/capital-intelligence/types";

const STRESS_TESTS: { id: string; label: string; factor: StressFactor }[] = [
  { id: "cac30", label: "CAC +30%", factor: { cacMultiplier: 1.3 } },
  { id: "qual20", label: "Qualification -20%", factor: { qualificationMultiplier: 0.8 } },
  { id: "s2f15", label: "Signed→filed -15%", factor: { signedToFiledMultiplier: 0.85 } },
  { id: "dur2y", label: "Resolution +2y", factor: { durationAddYears: 2 } },
  { id: "rec40", label: "Recovery -40%", factor: { recoveryMultiplier: 0.6 } },
  { id: "expert", label: "Adverse expert ruling", factor: { moicPenalty: 0.18, irrPenalty: 0.2 } },
  { id: "bankruptcy", label: "Defendant bankruptcy", factor: { moicPenalty: 0.25, recoveryMultiplier: 0.75 } },
  { id: "firm", label: "Top firm underperforms", factor: { signedToFiledMultiplier: 0.9, cacMultiplier: 1.1 } },
];

const SCENARIOS_KEY = "ci_scenarios_v1";

export function PortfolioLab() {
  const [totalCapital, setTotalCapital] = useState(10_000_000);
  const [deploymentYears, setDeploymentYears] = useState(3);
  const [targetMOIC, setTargetMOIC] = useState(2.2);
  const [targetIRR, setTargetIRR] = useState(22);
  const [maxTortConcentration, setMaxTortConcentration] = useState(35);
  const [maxFirmConcentration, setMaxFirmConcentration] = useState(30);
  const [minConfidence, setMinConfidence] = useState<"High" | "Medium" | "Low">("Medium");
  const [riskTolerance, setRiskTolerance] = useState(60);
  const [financingRate, setFinancingRate] = useState(12);

  const [allocations, setAllocations] = useState<PortfolioAllocation[]>(
    TORTS.map((t) => ({ code: t.code, allocation: totalCapital / TORTS.length })),
  );
  const [activeStress, setActiveStress] = useState<Set<string>>(new Set());
  const [savedScenarios, setSavedScenarios] = useState<PortfolioScenario[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCENARIOS_KEY);
      if (raw) setSavedScenarios(JSON.parse(raw) as PortfolioScenario[]);
    } catch {
      /* noop */
    }
  }, []);

  const persistScenarios = (s: PortfolioScenario[]) => {
    setSavedScenarios(s);
    try {
      localStorage.setItem(SCENARIOS_KEY, JSON.stringify(s));
    } catch {
      /* noop */
    }
  };

  const totalAllocated = allocations.reduce((s, a) => s + a.allocation, 0);
  const unallocated = totalCapital - totalAllocated;
  const wMOIC = weightedMOIC(TORTS, allocations);
  const wIRR = weightedIRR(TORTS, allocations);
  const wDur = weightedDuration(TORTS, allocations);
  const pRisk = portfolioRisk(TORTS, allocations);
  const conc = concentration(allocations);
  const filed = expectedFiledInventory(TORTS, allocations);
  const breakevenRecovery = totalAllocated / Math.max(filed, 1) / 0.4 / 0.6;

  const stressedResult = useMemo(() => {
    const base = { moic: wMOIC, irr: wIRR, duration: wDur, filedInventory: filed, capital: totalAllocated };
    const factors = STRESS_TESTS.filter((s) => activeStress.has(s.id)).map((s) => s.factor);
    return applyStress(base, factors);
  }, [wMOIC, wIRR, wDur, filed, totalAllocated, activeStress]);

  const setAllocation = (code: string, value: number) => {
    setAllocations((prev) => prev.map((a) => (a.code === code ? { ...a, allocation: value } : a)));
  };

  const equalWeight = () => {
    setAllocations(TORTS.map((t) => ({ code: t.code, allocation: totalCapital / TORTS.length })));
    toast.success("Equal-weight allocation applied");
  };

  const optimizeReturn = () => {
    const scores = TORTS.map((t) => t.expectedIRR / (t.riskScore || 1));
    const total = scores.reduce((s, x) => s + x, 0);
    setAllocations(TORTS.map((t, i) => ({ code: t.code, allocation: (scores[i] / total) * totalCapital })));
    toast.success("Return-optimized allocation applied", { description: "Demonstration allocation logic" });
  };

  const optimizeRisk = () => {
    const scores = TORTS.map((t) => 100 / (t.riskScore || 1));
    const total = scores.reduce((s, x) => s + x, 0);
    setAllocations(TORTS.map((t, i) => ({ code: t.code, allocation: (scores[i] / total) * totalCapital })));
    toast.success("Risk-optimized allocation applied", { description: "Demonstration allocation logic" });
  };

  const resetAlloc = () => {
    setAllocations(TORTS.map((t) => ({ code: t.code, allocation: 0 })));
    toast.info("Allocations reset");
  };

  const cashflowData = useMemo(() => {
    const rows: { year: number; deployment: number; expenses: number; grossRecovery: number; netCashFlow: number; cumulative: number }[] = [];
    let cumulative = 0;
    for (let y = 1; y <= 10; y++) {
      const inDeploy = y <= deploymentYears;
      const deployment = inDeploy ? totalAllocated * 0.4 * (1 / deploymentYears) : 0;
      const expenses = inDeploy ? totalAllocated * 0.6 * (1 / deploymentYears) : 0;
      const recoveryPeak = wDur;
      const bell = Math.exp(-Math.pow((y - recoveryPeak) / 1.4, 2));
      const grossRecovery = totalAllocated * wMOIC * (bell / 2.2);
      const net = grossRecovery - (deployment + expenses);
      cumulative += net;
      rows.push({ year: y, deployment: -deployment, expenses: -expenses, grossRecovery, netCashFlow: net, cumulative });
    }
    return rows;
  }, [totalAllocated, deploymentYears, wDur, wMOIC]);

  const breakEvenYear = cashflowData.find((r) => r.cumulative >= 0)?.year ?? null;

  const donutTort = allocations.filter((a) => a.allocation > 0).map((a) => ({ name: a.code, value: a.allocation }));
  const colors = ["#85B918", "#3E6F9E", "#D99A19", "#C94A4A", "#252525", "#667085", "#2E8B57", "#8b5cf6"];

  const categoryBars = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of allocations) {
      const t = TORTS.find((x) => x.code === a.code);
      if (!t) continue;
      map[t.category] = (map[t.category] ?? 0) + a.allocation;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allocations]);

  const scenariosCompare = [
    { name: "Base", capital: totalAllocated, filed, moic: wMOIC, irr: wIRR, duration: wDur, breakEven: breakEvenYear ?? 0, risk: pRisk, net: totalAllocated * (wMOIC - 1) },
    { name: "Downside", capital: totalAllocated, filed: filed * 0.85, moic: wMOIC * 0.75, irr: wIRR * 0.7, duration: wDur + 1, breakEven: (breakEvenYear ?? 0) + 1, risk: pRisk * 1.15, net: totalAllocated * (wMOIC * 0.75 - 1) },
    { name: "Severe downside", capital: totalAllocated, filed: filed * 0.7, moic: wMOIC * 0.55, irr: wIRR * 0.4, duration: wDur + 2, breakEven: (breakEvenYear ?? 0) + 2, risk: pRisk * 1.3, net: totalAllocated * (wMOIC * 0.55 - 1) },
    { name: "Stressed", capital: stressedResult.capital, filed: stressedResult.filedInventory, moic: stressedResult.moic, irr: stressedResult.irr, duration: stressedResult.duration, breakEven: (breakEvenYear ?? 0) + Math.round(stressedResult.duration - wDur), risk: pRisk, net: stressedResult.capital * (stressedResult.moic - 1) },
  ];

  const saveScenario = () => {
    const s: PortfolioScenario = {
      id: `s_${Date.now()}`,
      name: `Scenario ${savedScenarios.length + 1}`,
      allocations,
      totalCapital,
      createdAt: new Date().toISOString(),
    };
    persistScenarios([...savedScenarios, s]);
    toast.success("Scenario saved", { description: s.name });
  };

  const duplicateScenario = () => {
    if (savedScenarios.length === 0) {
      toast.error("No scenario to duplicate");
      return;
    }
    const last = savedScenarios[savedScenarios.length - 1];
    persistScenarios([...savedScenarios, { ...last, id: `s_${Date.now()}`, name: last.name + " (copy)", createdAt: new Date().toISOString() }]);
    toast.success("Scenario duplicated");
  };

  const exportCSV = () => {
    downloadCSV(
      "portfolio-allocation.csv",
      allocations.map((a) => {
        const t = TORTS.find((x) => x.code === a.code)!;
        return {
          code: a.code,
          allocation: Math.round(a.allocation),
          pct: ((a.allocation / totalCapital) * 100).toFixed(2),
          moic: t.expectedMOIC,
          irr: t.expectedIRR,
          risk: t.riskScore,
          duration: t.duration,
        };
      }),
    );
    toast.success("Portfolio CSV exported");
  };

  const exportPDF = () => {
    window.print();
  };

  const shareScenario = () => {
    const url = `${window.location.origin}/capital-intelligence?scenario=demo_${Date.now()}`;
    void navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  };

  return (
    <div className="space-y-4">
      <Card className="border-[#E5E7E2] shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Portfolio Inputs</CardTitle>
          <CardDescription>Define capital, targets and constraints. All values are demonstrative.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <div>
              <Label className="text-[10px] uppercase text-[#667085]">Total capital</Label>
              <Input type="number" step={100000} value={totalCapital} onChange={(e) => setTotalCapital(Number(e.target.value))} className="h-8 tabular-nums-ci" />
            </div>
            <div>
              <Label className="text-[10px] uppercase text-[#667085]">Deployment period (yrs)</Label>
              <Input type="number" step={1} value={deploymentYears} onChange={(e) => setDeploymentYears(Math.max(1, Number(e.target.value)))} className="h-8 tabular-nums-ci" />
            </div>
            <div>
              <Label className="text-[10px] uppercase text-[#667085]">Target MOIC</Label>
              <Input type="number" step={0.1} value={targetMOIC} onChange={(e) => setTargetMOIC(Number(e.target.value))} className="h-8 tabular-nums-ci" />
            </div>
            <div>
              <Label className="text-[10px] uppercase text-[#667085]">Target IRR (%)</Label>
              <Input type="number" step={1} value={targetIRR} onChange={(e) => setTargetIRR(Number(e.target.value))} className="h-8 tabular-nums-ci" />
            </div>
            <div>
              <Label className="text-[10px] uppercase text-[#667085]">Financing rate (%)</Label>
              <Input type="number" step={0.5} value={financingRate} onChange={(e) => setFinancingRate(Number(e.target.value))} className="h-8 tabular-nums-ci" />
            </div>
            <div>
              <Label className="text-[10px] uppercase text-[#667085]">Max tort concentration (%)</Label>
              <Slider value={[maxTortConcentration]} min={5} max={100} step={1} onValueChange={([v]) => setMaxTortConcentration(v)} />
              <div className="text-xs tabular-nums-ci">{maxTortConcentration}%</div>
            </div>
            <div>
              <Label className="text-[10px] uppercase text-[#667085]">Max firm concentration (%)</Label>
              <Slider value={[maxFirmConcentration]} min={5} max={100} step={1} onValueChange={([v]) => setMaxFirmConcentration(v)} />
              <div className="text-xs tabular-nums-ci">{maxFirmConcentration}%</div>
            </div>
            <div>
              <Label className="text-[10px] uppercase text-[#667085]">Min data confidence</Label>
              <div className="flex gap-1">
                {(["High", "Medium", "Low"] as const).map((c) => (
                  <Button key={c} variant={minConfidence === c ? "default" : "outline"} size="sm" className={minConfidence === c ? "h-8 bg-[#85B918] text-[#090909] hover:bg-[#78a815]" : "h-8 border-[#E5E7E2]"} onClick={() => setMinConfidence(c)}>
                    {c}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[10px] uppercase text-[#667085]">Risk tolerance</Label>
              <Slider value={[riskTolerance]} min={0} max={100} step={1} onValueChange={([v]) => setRiskTolerance(v)} />
              <div className="text-xs tabular-nums-ci">{riskTolerance}/100</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-[#E5E7E2] shadow-none lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Allocation Builder</CardTitle>
              <CardDescription>Distribute capital across active torts. Demonstration allocation logic.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant="outline" className="h-7 border-[#E5E7E2]" onClick={equalWeight}>
                Equal weight
              </Button>
              <Button size="sm" variant="outline" className="h-7 border-[#E5E7E2]" onClick={optimizeReturn}>
                Optimize return
              </Button>
              <Button size="sm" variant="outline" className="h-7 border-[#E5E7E2]" onClick={optimizeRisk}>
                Lower risk
              </Button>
              <Button size="sm" variant="outline" className="h-7 border-[#E5E7E2]" onClick={resetAlloc}>
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {TORTS.map((t) => {
              const a = allocations.find((x) => x.code === t.code)!;
              const pct = totalCapital > 0 ? (a.allocation / totalCapital) * 100 : 0;
              const cases = a.allocation / t.costPerFiledCase;
              return (
                <div key={t.code} className="rounded-md border border-[#E5E7E2] bg-white p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-condensed w-10 text-sm font-semibold">{t.code}</span>
                      <span className="text-xs text-[#151515]">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs tabular-nums-ci">
                      <span>{fmtMoney(a.allocation, { compact: true })}</span>
                      <span className="text-[#667085]">{pct.toFixed(1)}%</span>
                      <span className="text-[#667085]">{fmtNum(cases, 0)} cases</span>
                      <span className="text-[#667085]">MOIC {t.expectedMOIC}x</span>
                    </div>
                  </div>
                  <Slider
                    value={[a.allocation]}
                    min={0}
                    max={totalCapital}
                    step={totalCapital / 500}
                    onValueChange={([v]) => setAllocation(t.code, v)}
                    className="mt-2"
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-[#E5E7E2] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Portfolio Outputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-[#F6F7F4] p-2">
                <div className="text-[10px] uppercase text-[#667085]">Allocated</div>
                <div className="font-semibold tabular-nums-ci">{fmtMoney(totalAllocated, { compact: true })}</div>
              </div>
              <div className={`rounded-md p-2 ${unallocated < 0 ? "bg-red-50" : "bg-[#F6F7F4]"}`}>
                <div className="text-[10px] uppercase text-[#667085]">Unallocated</div>
                <div className="font-semibold tabular-nums-ci">{fmtMoney(unallocated, { compact: true })}</div>
              </div>
              <div className="rounded-md bg-[#F2F7E8] p-2">
                <div className="text-[10px] uppercase text-[#3d5a08]">Weighted MOIC</div>
                <div className="font-semibold tabular-nums-ci">{wMOIC.toFixed(2)}x</div>
              </div>
              <div className="rounded-md bg-[#F2F7E8] p-2">
                <div className="text-[10px] uppercase text-[#3d5a08]">Weighted IRR</div>
                <div className="font-semibold tabular-nums-ci">{wIRR.toFixed(1)}%</div>
              </div>
              <div className="rounded-md bg-[#F6F7F4] p-2">
                <div className="text-[10px] uppercase text-[#667085]">Duration</div>
                <div className="font-semibold tabular-nums-ci">{wDur.toFixed(1)}y</div>
              </div>
              <div className="rounded-md bg-[#F6F7F4] p-2">
                <div className="text-[10px] uppercase text-[#667085]">Risk score</div>
                <div className="font-semibold tabular-nums-ci">{pRisk.toFixed(0)}</div>
              </div>
              <div className="rounded-md bg-[#F6F7F4] p-2">
                <div className="text-[10px] uppercase text-[#667085]">Filed inventory</div>
                <div className="font-semibold tabular-nums-ci">{fmtNum(filed, 0)}</div>
              </div>
              <div className="rounded-md bg-[#F6F7F4] p-2">
                <div className="text-[10px] uppercase text-[#667085]">Break-even/case</div>
                <div className="font-semibold tabular-nums-ci">{fmtMoney(breakevenRecovery, { compact: true })}</div>
              </div>
              <div className="col-span-2 rounded-md bg-[#F6F7F4] p-2">
                <div className="text-[10px] uppercase text-[#667085]">Max tort concentration</div>
                <div className="font-semibold tabular-nums-ci">{fmtPct(conc * 100, 1)} <span className={`ml-2 text-[10px] ${conc * 100 > maxTortConcentration ? "text-[#C94A4A]" : "text-[#2E8B57]"}`}>{conc * 100 > maxTortConcentration ? "over limit" : "within limit"}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#E5E7E2] shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Expected Cash-Flow Curve</CardTitle>
          <CardDescription>Modeled deployment, expenses, gross recoveries and cumulative net cash flow.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7E2" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `Y${v}`} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmtMoney(v, { compact: true })} />
                <Tooltip formatter={(v: number) => fmtMoney(v, { compact: true })} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="deployment" stackId="1" name="Deployment" stroke="#3E6F9E" fill="#3E6F9E" fillOpacity={0.4} />
                <Area type="monotone" dataKey="expenses" stackId="1" name="Expenses" stroke="#C94A4A" fill="#C94A4A" fillOpacity={0.4} />
                <Area type="monotone" dataKey="grossRecovery" name="Gross recovery" stroke="#85B918" fill="#85B918" fillOpacity={0.35} />
                <Area type="monotone" dataKey="cumulative" name="Cumulative net" stroke="#151515" fill="#151515" fillOpacity={0.15} />
                {breakEvenYear && <ReferenceLine x={breakEvenYear} stroke="#85B918" strokeDasharray="4 4" label={{ value: `Break-even Y${breakEvenYear}`, fontSize: 10, fill: "#3d5a08" }} />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-[#E5E7E2] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tort allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutTort} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                    {donutTort.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtMoney(v, { compact: true })} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#E5E7E2] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Category allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBars} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7E2" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => fmtMoney(v, { compact: true })} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmtMoney(v, { compact: true })} />
                  <Bar dataKey="value" fill="#85B918" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#E5E7E2] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stage distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            {Array.from(
              allocations.reduce((m, a) => {
                const t = TORTS.find((x) => x.code === a.code);
                if (!t) return m;
                m.set(t.stage, (m.get(t.stage) ?? 0) + a.allocation);
                return m;
              }, new Map<string, number>()),
            ).map(([stage, val]) => (
              <div key={stage} className="flex items-center justify-between">
                <span>{stage}</span>
                <span className="tabular-nums-ci font-medium">{fmtMoney(val, { compact: true })}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#E5E7E2] shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Stress Testing</CardTitle>
            <CardDescription>Toggle scenarios to recalculate portfolio metrics.</CardDescription>
          </div>
          <Button size="sm" variant="outline" className="h-7 border-[#E5E7E2]" onClick={() => setActiveStress(new Set())}>
            Reset stress tests
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {STRESS_TESTS.map((s) => {
              const on = activeStress.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    const next = new Set(activeStress);
                    if (on) next.delete(s.id);
                    else next.add(s.id);
                    setActiveStress(next);
                  }}
                  className={`flex items-center justify-between rounded-md border p-2 text-left text-xs transition ${on ? "border-[#85B918] bg-[#F2F7E8]" : "border-[#E5E7E2] bg-white"}`}
                >
                  <span>{s.label}</span>
                  <Switch checked={on} />
                </button>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="rounded-md bg-[#F6F7F4] p-2 text-xs">
              <div className="text-[10px] uppercase text-[#667085]">Stressed MOIC</div>
              <div className="font-semibold tabular-nums-ci">{stressedResult.moic.toFixed(2)}x</div>
            </div>
            <div className="rounded-md bg-[#F6F7F4] p-2 text-xs">
              <div className="text-[10px] uppercase text-[#667085]">Stressed IRR</div>
              <div className="font-semibold tabular-nums-ci">{stressedResult.irr.toFixed(1)}%</div>
            </div>
            <div className="rounded-md bg-[#F6F7F4] p-2 text-xs">
              <div className="text-[10px] uppercase text-[#667085]">Capital required</div>
              <div className="font-semibold tabular-nums-ci">{fmtMoney(stressedResult.capital, { compact: true })}</div>
            </div>
            <div className="rounded-md bg-[#F6F7F4] p-2 text-xs">
              <div className="text-[10px] uppercase text-[#667085]">Expected loss</div>
              <div className="font-semibold tabular-nums-ci">
                {fmtMoney(Math.max(0, stressedResult.capital - stressedResult.capital * stressedResult.moic), { compact: true })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E5E7E2] shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Scenario Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7E2]">
                <TableHead>Scenario</TableHead>
                <TableHead className="text-right">Capital</TableHead>
                <TableHead className="text-right">Filed</TableHead>
                <TableHead className="text-right">MOIC</TableHead>
                <TableHead className="text-right">IRR</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Break-even</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenariosCompare.map((s) => (
                <TableRow key={s.name} className="border-[#E5E7E2]">
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right tabular-nums-ci">{fmtMoney(s.capital, { compact: true })}</TableCell>
                  <TableCell className="text-right tabular-nums-ci">{fmtNum(s.filed, 0)}</TableCell>
                  <TableCell className="text-right tabular-nums-ci">{s.moic.toFixed(2)}x</TableCell>
                  <TableCell className="text-right tabular-nums-ci">{s.irr.toFixed(1)}%</TableCell>
                  <TableCell className="text-right tabular-nums-ci">{s.duration.toFixed(1)}y</TableCell>
                  <TableCell className="text-right tabular-nums-ci">Y{s.breakEven || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums-ci">{fmtMoney(s.net, { compact: true })}</TableCell>
                  <TableCell className="text-right tabular-nums-ci">{s.risk.toFixed(0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button className="bg-[#85B918] text-[#090909] hover:bg-[#78a815]" onClick={saveScenario}>
          Save scenario
        </Button>
        <Button variant="outline" className="border-[#E5E7E2]" onClick={duplicateScenario}>
          Duplicate
        </Button>
        <Button variant="outline" className="border-[#E5E7E2]" onClick={exportCSV}>
          Export CSV
        </Button>
        <Button variant="outline" className="border-[#E5E7E2]" onClick={exportPDF}>
          Export PDF
        </Button>
        <Button variant="outline" className="border-[#E5E7E2]" onClick={shareScenario}>
          Share scenario
        </Button>
        {savedScenarios.length > 0 && (
          <span className="text-xs text-[#667085] self-center">{savedScenarios.length} saved</span>
        )}
      </div>
    </div>
  );
}
