// ============================================
// HELIOS ENERGY - Core Type Definitions
// ============================================

// Data Source Types
export type DataSourceType = 
  | 'aws_cur' 
  | 'gcp_billing' 
  | 'azure_billing'
  | 'snowflake_query_history'
  | 'databricks_usage'
  | 'custom_ai_workload';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unverified';

// ============================================
// Assumption Governance
// ============================================
export interface Assumption {
  id: string;
  name: string;
  value: number;
  unit: string;
  source: 'customer_measurement' | 'industry_default' | 'manufacturer_spec' | 'user_override' | 'calculated';
  sourceLabel: string;
  confidenceImpact: number; // percentage impact on confidence score
  category: 'power' | 'pue' | 'carbon_intensity' | 'utilization' | 'cost';
  editable: boolean;
  lastModified: string;
  modifiedBy?: string;
}

export interface AssumptionSet {
  id: string;
  name: string;
  assumptions: Assumption[];
  overallConfidence: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Raw Data Models
// ============================================
export interface RawDataset {
  id: string;
  name: string;
  sourceType: DataSourceType;
  uploadedAt: string;
  rowCount: number;
  columns: string[];
  columnMapping: Record<string, string>;
  validationStatus: 'pending' | 'valid' | 'warnings' | 'errors';
  validationMessages: ValidationMessage[];
  confidenceScore: number;
  filePath?: string;
}

export interface ValidationMessage {
  type: 'error' | 'warning' | 'info';
  column?: string;
  row?: number;
  message: string;
}

// ============================================
// Normalized Metrics
// ============================================
export interface NormalizedWorkload {
  id: string;
  datasetId: string;
  timestamp: string;
  
  // Workload identification
  workloadName: string;
  workloadType: 'training' | 'inference' | 'batch' | 'interactive' | 'warehouse' | 'unknown';
  resourceType: 'gpu' | 'cpu' | 'mixed';
  
  // Resource details
  instanceType?: string;
  gpuModel?: string;
  gpuCount?: number;
  cpuCores?: number;
  memoryGB?: number;
  region?: string;
  provider?: 'aws' | 'gcp' | 'azure' | 'on_prem' | 'unknown';
  
  // Raw metrics
  runtimeHours: number;
  
  // Calculated metrics (deterministic)
  costUsd: number;
  costSource: 'billing_exact' | 'calculated' | 'estimated';
  
  energyKwh: number;
  energySource: 'measured' | 'calculated' | 'estimated';
  energyCalculation?: EnergyCalculation;
  
  carbonKgCo2e: number;
  carbonSource: 'measured' | 'calculated' | 'estimated';
  carbonCalculation?: CarbonCalculation;
  
  // Confidence
  confidenceScore: number;
  confidenceFactors: ConfidenceFactor[];
}

export interface EnergyCalculation {
  powerDrawWatts: number;
  powerSource: string;
  pue: number;
  pueSource: string;
  runtimeHours: number;
  formula: string; // Human-readable formula
  result: number;
}

export interface CarbonCalculation {
  energyKwh: number;
  gridIntensityGCo2PerKwh: number;
  gridIntensitySource: string;
  region: string;
  formula: string;
  result: number;
}

export interface ConfidenceFactor {
  factor: string;
  impact: number; // positive = increases confidence, negative = decreases
  reason: string;
}

// ============================================
// Aggregated Analytics
// ============================================
export interface CostEnergySummary {
  totalCostUsd: number;
  totalEnergyKwh: number;
  totalCarbonKgCo2e: number;
  
  byWorkloadType: Record<string, { cost: number; energy: number; carbon: number }>;
  byResourceType: Record<string, { cost: number; energy: number; carbon: number }>;
  byRegion: Record<string, { cost: number; energy: number; carbon: number }>;
  byProvider: Record<string, { cost: number; energy: number; carbon: number }>;
  
  timeSeriesDaily: TimeSeriesPoint[];
  
  averageConfidence: number;
  dataCompleteness: number;
}

export interface TimeSeriesPoint {
  date: string;
  cost: number;
  energy: number;
  carbon: number;
}

// ============================================
// Hotspot Analysis
// ============================================
export interface Hotspot {
  id: string;
  workloadId: string;
  workloadName: string;
  type: 'high_cost' | 'high_energy' | 'low_utilization' | 'idle_resource';
  severity: 'critical' | 'high' | 'medium' | 'low';
  metric: string;
  value: number;
  threshold: number;
  potentialSavings: {
    costUsd: number;
    energyKwh: number;
    carbonKgCo2e: number;
  };
  recommendation: string;
  confidence: number;
}

// ============================================
// Scenario Modeling
// ============================================
export interface Scenario {
  id: string;
  name: string;
  description: string;
  baselineId: string;
  createdAt: string;
  updatedAt: string;
  
  changes: ScenarioChange[];
  results?: ScenarioResults;
}

export interface ScenarioChange {
  id: string;
  type: 'migrate_region' | 'change_instance' | 'optimize_schedule' | 'reduce_runtime' | 'custom';
  targetWorkloads: string[]; // workload IDs or 'all'
  parameters: Record<string, any>;
  description: string;
}

export interface ScenarioResults {
  baseline: {
    totalCostUsd: number;
    totalEnergyKwh: number;
    totalCarbonKgCo2e: number;
  };
  projected: {
    totalCostUsd: number;
    totalEnergyKwh: number;
    totalCarbonKgCo2e: number;
  };
  delta: {
    costUsd: number;
    costPercent: number;
    energyKwh: number;
    energyPercent: number;
    carbonKgCo2e: number;
    carbonPercent: number;
  };
  confidence: number;
  risks: string[];
  assumptions: string[];
}

// ============================================
// Report Generation
// ============================================
export interface Report {
  id: string;
  name: string;
  type: 'executive_summary' | 'detailed_analysis' | 'scenario_comparison';
  createdAt: string;
  
  sections: ReportSection[];
  methodology: MethodologySection;
  confidenceStatement: string;
  
  exportFormats: ('pdf' | 'csv' | 'json')[];
}

export interface ReportSection {
  title: string;
  content: string;
  charts?: ChartConfig[];
  tables?: TableConfig[];
  confidenceNote?: string;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'scatter' | 'pie';
  title: string;
  data: any[];
  xKey: string;
  yKeys: string[];
}

export interface TableConfig {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface MethodologySection {
  energyCalculation: string;
  carbonCalculation: string;
  dataSourcesUsed: string[];
  assumptionsSummary: string;
  limitations: string[];
}

// ============================================
// Grid Carbon Intensity Data
// ============================================
export interface GridIntensityData {
  region: string;
  regionName: string;
  provider?: string;
  gCo2PerKwh: number;
  source: string;
  year: number;
  notes?: string;
}

// ============================================
// Instance Power Data
// ============================================
export interface InstancePowerData {
  instanceType: string;
  provider: 'aws' | 'gcp' | 'azure';
  tdpWatts: number;
  typicalWatts: number;
  source: string;
  gpuModel?: string;
  gpuTdpWatts?: number;
  gpuCount?: number;
}
