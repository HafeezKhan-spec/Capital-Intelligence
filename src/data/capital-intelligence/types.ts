export type SourceType =
  | "public"
  | "proprietary"
  | "contributed"
  | "modeled"
  | "user"
  | "insufficient";

export type RiskLevel = "Low" | "Moderate" | "Elevated" | "High";
export type ConfidenceLevel = "High" | "Medium" | "Low" | "Insufficient";
export type LitigationStage =
  | "Emerging"
  | "Consolidation"
  | "Discovery"
  | "Bellwether preparation"
  | "Bellwether trials"
  | "Settlement discussions"
  | "Resolution"
  | "Monitoring"
  | "Reassessment";

export type TortCategory =
  | "Pharmaceutical"
  | "Medical device"
  | "Environmental"
  | "Consumer product"
  | "Technology"
  | "Institutional abuse"
  | "Other";

export type TortStatus =
  | "Due diligence"
  | "Monitoring"
  | "Reassessment required"
  | "Emerging"
  | "Mature";

export interface ScoreHistoryPoint {
  date: string;
  score: number;
}

export interface FilingPoint {
  month: string;
  filings: number;
  cumulative: number;
}

export interface TortMetric {
  code: string;
  name: string;
  category: TortCategory;
  stage: LitigationStage;
  score: number;
  previousScore: number;
  movement30d: number;
  riskScore: number;
  riskLevel: RiskLevel;
  expectedMOIC: number;
  expectedIRR: number;
  medianCAC: number;
  costPerFiledCase: number;
  duration: number;
  complexity: number;
  confidence: ConfidenceLevel;
  status: TortStatus;
  filingVelocity: number;
  filedInventory: number;
  description: string;
  scoreHistory: ScoreHistoryPoint[];
  filingHistory: FilingPoint[];
  sourceMix: SourceType[];
}

export interface FirmMetric {
  id: string;
  name: string;
  tortsHandled: number;
  fundedInventory: number;
  signedInventory: number;
  filedInventory: number;
  signedToFiled: number;
  medianDaysToFile: number;
  costPerFiledCase: number;
  documentationCompleteness: number;
  clientAttrition: number;
  reportingTimeliness: number;
  capitalDeployed: number;
  currentExposure: number;
  confidence: ConfidenceLevel;
  status: "Performing" | "Monitor" | "Needs review" | "Insufficient data";
  concentration: number;
  torts: string[];
}

export interface CatalystEvent {
  id: string;
  date: string;
  tort: string;
  type: string;
  description: string;
  expectedImpact: "Low" | "Medium" | "High";
  confidence: ConfidenceLevel;
  source: SourceType;
}

export interface CapitalAlert {
  id: string;
  timestamp: string;
  category:
    | "Litigation"
    | "Acquisition cost"
    | "Firm execution"
    | "Regulatory"
    | "Scientific"
    | "Defendant solvency"
    | "Portfolio concentration"
    | "Data quality";
  severity: "Informational" | "Watch" | "Material" | "Critical";
  tort?: string;
  firm?: string;
  headline: string;
  explanation: string;
  indexImpact: number;
  source: SourceType;
}

export interface AcquisitionTrendPoint {
  month: string;
  DPV: number;
  SMA: number;
  SBX: number;
  PFAS: number;
  PQT: number;
}

export interface PortfolioAllocation {
  code: string;
  allocation: number;
}

export interface PortfolioScenario {
  id: string;
  name: string;
  allocations: PortfolioAllocation[];
  totalCapital: number;
  createdAt: string;
}

export interface CashFlowPoint {
  year: number;
  deployment: number;
  expenses: number;
  grossRecovery: number;
  netCashFlow: number;
  cumulative: number;
}

export interface MetricSource {
  metric: string;
  source: SourceType;
  lastReviewed: string;
  confidence: ConfidenceLevel;
}
