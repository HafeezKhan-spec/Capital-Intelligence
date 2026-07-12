import type { TortMetric, PortfolioAllocation } from "@/data/capital-intelligence/types";

export function fmtMoney(n: number, opts?: { compact?: boolean; digits?: number }) {
  const compact = opts?.compact ?? false;
  if (compact) {
    if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  }
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: opts?.digits ?? 0,
    maximumFractionDigits: opts?.digits ?? 0,
  })}`;
}

export function fmtPct(n: number, digits = 1) {
  return `${n >= 0 ? "" : ""}${n.toFixed(digits)}%`;
}

export function fmtNum(n: number, digits = 0) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function weightedMOIC(
  torts: TortMetric[],
  allocations: PortfolioAllocation[],
): number {
  const total = allocations.reduce((s, a) => s + a.allocation, 0);
  if (total === 0) return 0;
  return (
    allocations.reduce((s, a) => {
      const t = torts.find((x) => x.code === a.code);
      return s + (t ? t.expectedMOIC * a.allocation : 0);
    }, 0) / total
  );
}

export function weightedIRR(
  torts: TortMetric[],
  allocations: PortfolioAllocation[],
): number {
  const total = allocations.reduce((s, a) => s + a.allocation, 0);
  if (total === 0) return 0;
  return (
    allocations.reduce((s, a) => {
      const t = torts.find((x) => x.code === a.code);
      return s + (t ? t.expectedIRR * a.allocation : 0);
    }, 0) / total
  );
}

export function weightedDuration(
  torts: TortMetric[],
  allocations: PortfolioAllocation[],
): number {
  const total = allocations.reduce((s, a) => s + a.allocation, 0);
  if (total === 0) return 0;
  return (
    allocations.reduce((s, a) => {
      const t = torts.find((x) => x.code === a.code);
      return s + (t ? t.duration * a.allocation : 0);
    }, 0) / total
  );
}

export function portfolioRisk(
  torts: TortMetric[],
  allocations: PortfolioAllocation[],
): number {
  const total = allocations.reduce((s, a) => s + a.allocation, 0);
  if (total === 0) return 0;
  return (
    allocations.reduce((s, a) => {
      const t = torts.find((x) => x.code === a.code);
      return s + (t ? t.riskScore * a.allocation : 0);
    }, 0) / total
  );
}

export function concentration(allocations: PortfolioAllocation[]): number {
  const total = allocations.reduce((s, a) => s + a.allocation, 0);
  if (total === 0) return 0;
  return Math.max(...allocations.map((a) => a.allocation / total));
}

export function expectedFiledInventory(
  torts: TortMetric[],
  allocations: PortfolioAllocation[],
): number {
  return allocations.reduce((s, a) => {
    const t = torts.find((x) => x.code === a.code);
    if (!t) return s;
    return s + a.allocation / t.costPerFiledCase;
  }, 0);
}

export interface StressFactor {
  cacMultiplier?: number;
  qualificationMultiplier?: number;
  signedToFiledMultiplier?: number;
  durationAddYears?: number;
  recoveryMultiplier?: number;
  moicPenalty?: number;
  irrPenalty?: number;
}

export function applyStress(
  base: {
    moic: number;
    irr: number;
    duration: number;
    filedInventory: number;
    capital: number;
  },
  factors: StressFactor[],
) {
  let moic = base.moic;
  let irr = base.irr;
  let duration = base.duration;
  let filed = base.filedInventory;
  let capital = base.capital;
  for (const f of factors) {
    if (f.cacMultiplier) {
      capital *= f.cacMultiplier;
      moic /= f.cacMultiplier;
      irr *= 1 / f.cacMultiplier;
    }
    if (f.qualificationMultiplier) {
      filed *= f.qualificationMultiplier;
      moic *= f.qualificationMultiplier;
      irr *= f.qualificationMultiplier;
    }
    if (f.signedToFiledMultiplier) {
      filed *= f.signedToFiledMultiplier;
      moic *= 0.5 + 0.5 * f.signedToFiledMultiplier;
      irr *= 0.5 + 0.5 * f.signedToFiledMultiplier;
    }
    if (f.durationAddYears) {
      duration += f.durationAddYears;
      irr *= Math.pow(0.92, f.durationAddYears);
    }
    if (f.recoveryMultiplier) {
      moic *= f.recoveryMultiplier;
      irr *= f.recoveryMultiplier;
    }
    if (f.moicPenalty) moic *= 1 - f.moicPenalty;
    if (f.irrPenalty) irr *= 1 - f.irrPenalty;
  }
  return { moic, irr, duration, filedInventory: filed, capital };
}

export const INDEX_COMPONENTS = [
  { key: "Litigation momentum", weight: 0.2 },
  { key: "Scientific & evidentiary", weight: 0.15 },
  { key: "Legal posture", weight: 0.15 },
  { key: "Acquisition economics", weight: 0.15 },
  { key: "Intake viability", weight: 0.1 },
  { key: "Case economics", weight: 0.15 },
  { key: "Defendant collectability", weight: 0.05 },
  { key: "Firm capacity", weight: 0.05 },
];

export function csvEscape(v: string | number): string {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const header = keys.join(",");
  const lines = rows.map((r) => keys.map((k) => csvEscape(r[k] ?? "")).join(","));
  return [header, ...lines].join("\n");
}

export function downloadCSV(filename: string, rows: Record<string, string | number>[]) {
  const csv = toCSV(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
