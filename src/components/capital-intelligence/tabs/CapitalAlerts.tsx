import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ALERTS, CATALYSTS } from "@/data/capital-intelligence/misc";
import { SourceBadge, MovementIndicator } from "../badges";
import type { CapitalAlert } from "@/data/capital-intelligence/types";

const SEVERITY_COLORS: Record<CapitalAlert["severity"], string> = {
  Informational: "#667085",
  Watch: "#3E6F9E",
  Material: "#D99A19",
  Critical: "#C94A4A",
};

function KPI({ label, value, tone = "muted" }: { label: string; value: string; tone?: "muted" | "critical" | "positive" }) {
  const bg = tone === "critical" ? "bg-red-50" : tone === "positive" ? "bg-[#F2F7E8]" : "bg-[#F6F7F4]";
  return (
    <Card className="border-[#E5E7E2] shadow-none">
      <CardContent className={`p-3 ${bg}`}>
        <div className="text-[10px] font-medium uppercase tracking-wide text-[#667085]">{label}</div>
        <div className="mt-1 font-condensed text-2xl font-semibold tabular-nums-ci">{value}</div>
      </CardContent>
    </Card>
  );
}

export function CapitalAlerts() {
  const [severityFilter, setSeverityFilter] = useState<CapitalAlert["severity"] | "All">("All");
  const [acked, setAcked] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => (severityFilter === "All" ? ALERTS : ALERTS.filter((a) => a.severity === severityFilter)),
    [severityFilter],
  );

  const critical = ALERTS.filter((a) => a.severity === "Critical").length;
  const material = ALERTS.filter((a) => a.severity === "Material").length;

  const scoreLog = [
    { date: "Jul 12, 2026", tort: "DPV", old: 76, next: 82, trigger: "Litigation catalyst", model: "v3.4", override: "—", data: "Public", by: "System" },
    { date: "Jul 10, 2026", tort: "PQT", old: 62, next: 56, trigger: "Adverse expert ruling", model: "v3.4", override: "Analyst -2", data: "Public", by: "M. Chen" },
    { date: "Jul 09, 2026", tort: "GLP1", old: 53, next: 61, trigger: "Bellwether pool update", model: "v3.4", override: "—", data: "Contributed", by: "System" },
    { date: "Jul 08, 2026", tort: "SMA", old: 74, next: 78, trigger: "CAC decrease", model: "v3.4", override: "—", data: "Proprietary", by: "System" },
    { date: "Jul 07, 2026", tort: "PFAS", old: 66, next: 69, trigger: "Defendant solvency repricing", model: "v3.4", override: "Analyst +1", data: "Modeled", by: "A. Rios" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <KPI label="Critical alerts" value={String(critical)} tone="critical" />
        <KPI label="New developments" value={String(ALERTS.length)} />
        <KPI label="Upcoming catalysts" value={String(CATALYSTS.length)} />
        <KPI label="Firms to review" value={"3"} />
        <KPI label="Score changes" value={String(material + critical + 3)} />
        <KPI label="Data refresh issues" value={"1"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-[#E5E7E2] shadow-none lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Alert Feed</CardTitle>
              <CardDescription>Chronological developments across categories.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-1">
              {(["All", "Informational", "Watch", "Material", "Critical"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={severityFilter === s ? "default" : "outline"}
                  className={severityFilter === s ? "h-7 bg-[#85B918] text-[#090909] hover:bg-[#78a815]" : "h-7 border-[#E5E7E2]"}
                  onClick={() => setSeverityFilter(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filtered.map((a) => {
              const isAcked = acked.has(a.id);
              return (
                <div
                  key={a.id}
                  className={`rounded-md border p-2.5 ${isAcked ? "border-[#E5E7E2] bg-[#F6F7F4] opacity-70" : "border-[#E5E7E2] bg-white"}`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: SEVERITY_COLORS[a.severity] }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                          style={{
                            background: SEVERITY_COLORS[a.severity] + "15",
                            borderColor: SEVERITY_COLORS[a.severity] + "55",
                            color: SEVERITY_COLORS[a.severity],
                          }}
                        >
                          {a.severity}
                        </span>
                        <span className="text-[10px] uppercase text-[#667085]">{a.category}</span>
                        {a.tort && <span className="rounded bg-[#090909] px-1.5 py-0.5 text-[10px] font-semibold text-[#85B918]">{a.tort}</span>}
                        {a.firm && <span className="text-[10px] text-[#667085]">{a.firm}</span>}
                        <span className="ml-auto text-[10px] text-[#667085] tabular-nums-ci">{a.timestamp}</span>
                      </div>
                      <div className="mt-1 text-sm font-medium">{a.headline}</div>
                      <div className="text-xs text-[#667085]">{a.explanation}</div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <SourceBadge source={a.source} />
                          {a.indexImpact !== 0 && (
                            <span className="inline-flex items-center gap-1 text-[#667085]">
                              Est. impact
                              <MovementIndicator value={a.indexImpact} />
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 text-[11px]" onClick={() => toast.info("Note dialog (demo)") }>
                            Note
                          </Button>
                          <Button
                            size="sm"
                            variant={isAcked ? "outline" : "default"}
                            className={isAcked ? "h-6 border-[#E5E7E2] text-[11px]" : "h-6 bg-[#85B918] text-[11px] text-[#090909] hover:bg-[#78a815]"}
                            onClick={() => {
                              const n = new Set(acked);
                              if (isAcked) n.delete(a.id);
                              else n.add(a.id);
                              setAcked(n);
                            }}
                          >
                            {isAcked ? "Reopen" : "Acknowledge"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-[#E5E7E2] shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming Catalysts (90d)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CATALYSTS.map((c) => (
              <div key={c.id} className="rounded-md border border-[#E5E7E2] bg-white p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium tabular-nums-ci">{c.date}</span>
                  <span className="text-[10px] uppercase text-[#667085]">{c.expectedImpact} impact</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded bg-[#090909] px-1.5 py-0.5 text-[10px] font-semibold text-[#85B918]">{c.tort}</span>
                  <span className="font-medium">{c.type}</span>
                </div>
                <div className="mt-1 text-[11px] leading-snug text-[#667085]">{c.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#E5E7E2] shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Score Change Log</CardTitle>
          <CardDescription>Audit trail of index adjustments.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#E5E7E2]">
                <TableHead>Date</TableHead>
                <TableHead>Tort</TableHead>
                <TableHead className="text-right">Old</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead className="text-right">Δ</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Override</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Reviewed by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scoreLog.map((r) => (
                <TableRow key={r.date + r.tort} className="border-[#E5E7E2]">
                  <TableCell className="text-xs tabular-nums-ci">{r.date}</TableCell>
                  <TableCell>
                    <span className="rounded bg-[#090909] px-1.5 py-0.5 text-[10px] font-semibold text-[#85B918]">{r.tort}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums-ci text-xs">{r.old}</TableCell>
                  <TableCell className="text-right tabular-nums-ci text-xs font-semibold">{r.next}</TableCell>
                  <TableCell className="text-right"><MovementIndicator value={r.next - r.old} digits={0} /></TableCell>
                  <TableCell className="text-xs">{r.trigger}</TableCell>
                  <TableCell className="text-xs text-[#667085]">{r.model}</TableCell>
                  <TableCell className="text-xs">{r.override}</TableCell>
                  <TableCell className="text-xs">{r.data}</TableCell>
                  <TableCell className="text-xs text-[#667085]">{r.by}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
