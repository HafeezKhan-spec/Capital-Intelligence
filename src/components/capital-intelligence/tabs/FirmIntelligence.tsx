import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FIRMS } from "@/data/capital-intelligence/firms";
import { fmtMoney, fmtNum, fmtPct } from "@/lib/capital-intelligence/calculations";
import { ConfidenceBadge, SourceBadge } from "../badges";
import { useFilters } from "../FiltersContext";

const STATUS_COLORS: Record<string, string> = {
  Performing: "#2E8B57",
  Monitor: "#D99A19",
  "Needs review": "#C94A4A",
  "Insufficient data": "#667085",
};

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-[#E5E7E2] shadow-none">
      <CardContent className="p-3">
        <div className="text-[10px] font-medium uppercase tracking-wide text-[#667085]">{label}</div>
        <div className="mt-1 font-condensed text-xl font-semibold tabular-nums-ci">{value}</div>
      </CardContent>
    </Card>
  );
}

export function FirmIntelligence() {
  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null);
  const { state } = useFilters();
  const selectedFirm = FIRMS.find((f) => f.id === selectedFirmId) ?? null;
  const [drillFirm, setDrillFirm] = useState<string | null>(null);
  const drillFirmData = FIRMS.find((f) => f.id === drillFirm) ?? null;

  const totalCapital = FIRMS.reduce((s, f) => s + f.capitalDeployed, 0);
  const totalFunded = FIRMS.reduce((s, f) => s + f.fundedInventory, 0);
  const totalFiled = FIRMS.reduce((s, f) => s + f.filedInventory, 0);
  const weightedS2F =
    FIRMS.reduce((s, f) => s + f.signedToFiled * f.signedInventory, 0) /
    FIRMS.reduce((s, f) => s + f.signedInventory, 0);
  const medianDaysToFile = 182;
  const top5 =
    (FIRMS.slice()
      .sort((a, b) => b.capitalDeployed - a.capitalDeployed)
      .slice(0, 5)
      .reduce((s, f) => s + f.capitalDeployed, 0) /
      totalCapital) *
    100;

  const scatter = FIRMS.map((f) => ({
    x: f.costPerFiledCase,
    y: f.signedToFiled * 100,
    z: f.fundedInventory,
    name: f.name,
    id: f.id,
    status: f.status,
    color: STATUS_COLORS[f.status],
  }));

  const donutData = FIRMS.map((f) => ({ name: f.name, value: f.capitalDeployed }));
  const donutColors = ["#85B918", "#3E6F9E", "#D99A19", "#C94A4A", "#252525", "#667085", "#2E8B57", "#151515"];

  const rows = useMemo(() => {
    return FIRMS.filter((f) => (state.firmId === "all" ? true : f.id === state.firmId));
  }, [state.firmId]);

  const inventoryByTort = selectedFirm
    ? selectedFirm.torts.map((code) => ({
        code,
        value: Math.round((selectedFirm.filedInventory / selectedFirm.torts.length) * (0.7 + Math.random() * 0.6)),
      }))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-[#667085]">
          Demonstration firm data — anonymized and illustrative. No actual law-firm performance is depicted.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        <KPI label="Participating firms" value={String(FIRMS.length)} />
        <KPI label="Funded inventory" value={fmtNum(totalFunded)} />
        <KPI label="Filed inventory" value={fmtNum(totalFiled)} />
        <KPI label="Signed → filed" value={fmtPct(weightedS2F * 100, 0)} />
        <KPI label="Median days to file" value={String(medianDaysToFile) + "d"} />
        <KPI label="Doc completeness" value={"86%"} />
        <KPI label="Top-5 concentration" value={fmtPct(top5, 0)} />
        <KPI label="Reporting timeliness" value={"88%"} />
      </div>

      <Card className="border-[#E5E7E2] shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Firm Execution Matrix</CardTitle>
          <CardDescription>Cost per filed case vs signed-to-filed conversion; bubble size = funded inventory.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7E2" />
                <XAxis
                  type="number"
                  dataKey="x"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}K`}
                  label={{ value: "Cost per filed case", position: "insideBottom", offset: -5, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  tick={{ fontSize: 11 }}
                  domain={[40, 90]}
                  tickFormatter={(v: number) => `${v}%`}
                  label={{ value: "Signed → filed", angle: -90, position: "insideLeft", fontSize: 11 }}
                />
                <ZAxis type="number" dataKey="z" range={[100, 500]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as (typeof scatter)[number];
                    return (
                      <div className="rounded border border-[#E5E7E2] bg-white p-2 text-xs shadow-sm">
                        <div className="font-semibold">{p.name}</div>
                        <div>Status: {p.status}</div>
                        <div className="tabular-nums-ci">CPFC: ${p.x.toLocaleString()}</div>
                        <div className="tabular-nums-ci">S→F: {p.y.toFixed(0)}%</div>
                        <div className="tabular-nums-ci">Funded: {p.z.toLocaleString()}</div>
                      </div>
                    );
                  }}
                />
                <Scatter
                  data={scatter}
                  onClick={(e) => e && setDrillFirm((e as { id: string }).id)}
                >
                  {scatter.map((s) => (
                    <Cell key={s.id} fill={s.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#E5E7E2] shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Firm Performance</CardTitle>
          <CardDescription>Illustrative execution metrics — no star ratings.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#E5E7E2]">
                  <TableHead>Firm</TableHead>
                  <TableHead className="text-right">Torts</TableHead>
                  <TableHead className="text-right">Funded</TableHead>
                  <TableHead className="text-right">Signed</TableHead>
                  <TableHead className="text-right">Filed</TableHead>
                  <TableHead className="text-right">S→F</TableHead>
                  <TableHead className="text-right">Days to file</TableHead>
                  <TableHead className="text-right">CPFC</TableHead>
                  <TableHead className="text-right">Docs %</TableHead>
                  <TableHead className="text-right">Attrition</TableHead>
                  <TableHead className="text-right">Reporting</TableHead>
                  <TableHead className="text-right">Capital</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((f) => (
                  <TableRow
                    key={f.id}
                    onClick={() => setDrillFirm(f.id)}
                    className="cursor-pointer border-[#E5E7E2] hover:bg-[#F6F7F4]"
                  >
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell className="text-right tabular-nums-ci">{f.tortsHandled}</TableCell>
                    <TableCell className="text-right tabular-nums-ci">{fmtNum(f.fundedInventory)}</TableCell>
                    <TableCell className="text-right tabular-nums-ci">{fmtNum(f.signedInventory)}</TableCell>
                    <TableCell className="text-right tabular-nums-ci">{fmtNum(f.filedInventory)}</TableCell>
                    <TableCell className="text-right tabular-nums-ci">{fmtPct(f.signedToFiled * 100, 0)}</TableCell>
                    <TableCell className="text-right tabular-nums-ci">{f.medianDaysToFile}</TableCell>
                    <TableCell className="text-right tabular-nums-ci">${fmtNum(f.costPerFiledCase)}</TableCell>
                    <TableCell className="text-right tabular-nums-ci">{fmtPct(f.documentationCompleteness * 100, 0)}</TableCell>
                    <TableCell className="text-right tabular-nums-ci">{fmtPct(f.clientAttrition * 100, 0)}</TableCell>
                    <TableCell className="text-right tabular-nums-ci">{fmtPct(f.reportingTimeliness * 100, 0)}</TableCell>
                    <TableCell className="text-right tabular-nums-ci">{fmtMoney(f.capitalDeployed, { compact: true })}</TableCell>
                    <TableCell><ConfidenceBadge level={f.confidence} /></TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                        style={{ background: STATUS_COLORS[f.status] + "1a", borderColor: STATUS_COLORS[f.status] + "55", color: STATUS_COLORS[f.status] }}
                      >
                        {f.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-[#E5E7E2] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Capital by Firm</CardTitle>
            <CardDescription>Total deployed capital across participating firms.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" innerRadius={50} outerRadius={85}>
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={donutColors[i % donutColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtMoney(v, { compact: true })} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 rounded-md bg-[#F6F7F4] p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#667085]">Top-5 concentration</span>
                <span className="tabular-nums-ci font-semibold">{fmtPct(top5, 1)}</span>
              </div>
              <div className="mt-1 text-[10px] text-[#667085]">
                Concentration risk: elevated. Consider diversification into secondary handling firms.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E5E7E2] shadow-none lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inventory by Tort {selectedFirm ? `— ${selectedFirm.name}` : ""}</CardTitle>
            <CardDescription>
              <span>Select a firm below to inspect its tort mix.</span>
            </CardDescription>
            <div className="flex flex-wrap gap-1 pt-2">
              {FIRMS.map((f) => (
                <Button
                  key={f.id}
                  size="sm"
                  variant={selectedFirmId === f.id ? "default" : "outline"}
                  className={
                    selectedFirmId === f.id
                      ? "h-7 bg-[#85B918] text-[#090909] hover:bg-[#78a815]"
                      : "h-7 border-[#E5E7E2]"
                  }
                  onClick={() => setSelectedFirmId(f.id === selectedFirmId ? null : f.id)}
                >
                  {f.name.split(" ")[0]}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {inventoryByTort.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-xs text-[#667085]">
                Select a firm to see inventory distribution.
              </div>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryByTort} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7E2" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="code" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#85B918" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!drillFirm} onOpenChange={(o) => !o && setDrillFirm(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {drillFirmData && (
            <>
              <SheetHeader className="pb-3">
                <SheetTitle className="flex items-center gap-2">
                  {drillFirmData.name}
                  <ConfidenceBadge level={drillFirmData.confidence} />
                </SheetTitle>
              </SheetHeader>
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="economics">Economics</TabsTrigger>
                  <TabsTrigger value="sources">Sources</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <KPI label="Torts handled" value={String(drillFirmData.tortsHandled)} />
                    <KPI label="Capital deployed" value={fmtMoney(drillFirmData.capitalDeployed, { compact: true })} />
                    <KPI label="Current exposure" value={fmtMoney(drillFirmData.currentExposure, { compact: true })} />
                    <KPI label="Status" value={drillFirmData.status} />
                  </div>
                  <p className="text-xs text-[#667085]">Anonymized illustrative profile.</p>
                </TabsContent>
                <TabsContent value="inventory" className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <KPI label="Funded" value={fmtNum(drillFirmData.fundedInventory)} />
                    <KPI label="Signed" value={fmtNum(drillFirmData.signedInventory)} />
                    <KPI label="Filed" value={fmtNum(drillFirmData.filedInventory)} />
                    <KPI label="Median days to file" value={String(drillFirmData.medianDaysToFile)} />
                  </div>
                </TabsContent>
                <TabsContent value="economics" className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <KPI label="Cost per filed" value={"$" + fmtNum(drillFirmData.costPerFiledCase)} />
                    <KPI label="S→F conversion" value={fmtPct(drillFirmData.signedToFiled * 100, 0)} />
                    <KPI label="Docs completeness" value={fmtPct(drillFirmData.documentationCompleteness * 100, 0)} />
                    <KPI label="Reporting timeliness" value={fmtPct(drillFirmData.reportingTimeliness * 100, 0)} />
                  </div>
                </TabsContent>
                <TabsContent value="sources" className="space-y-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <SourceBadge source="contributed" />
                    <SourceBadge source="proprietary" />
                    <SourceBadge source="modeled" />
                  </div>
                  <p className="text-[#667085]">
                    Metrics blend firm-contributed reports (monthly), CAMG proprietary benchmarks, and modeled estimates. Last reviewed Jul 10, 2026.
                  </p>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
