// ============================================
// HELIOS ENERGY - Scenario Simulator
// What-if analysis for infrastructure optimization
// ============================================

import { v4 as uuidv4 } from 'uuid';
import type { 
  Scenario, 
  ScenarioChange, 
  ScenarioResults, 
  NormalizedWorkload,
  ConfidenceFactor 
} from '@/types';
import { calculateEnergy } from '../calculations/energy';
import { calculateCarbon } from '../calculations/carbon';
import { calculateCost } from '../calculations/cost';
import { calculateConfidenceScore } from '../calculations/confidence';
import { getGridIntensity, getRegionalPUE } from '../reference-data';

export interface SimulationInput {
  baselineWorkloads: NormalizedWorkload[];
  changes: ScenarioChange[];
}

/**
 * Simulate the impact of infrastructure changes
 * All calculations are deterministic and explainable
 */
export function simulateScenario(input: SimulationInput): ScenarioResults {
  const { baselineWorkloads, changes } = input;
  
  // Calculate baseline totals
  const baseline = calculateTotals(baselineWorkloads);
  
  // Apply changes and recalculate
  const modifiedWorkloads = applyChanges(baselineWorkloads, changes);
  const projected = calculateTotals(modifiedWorkloads);
  
  // Calculate deltas
  const delta = {
    costUsd: projected.totalCostUsd - baseline.totalCostUsd,
    costPercent: baseline.totalCostUsd > 0 
      ? ((projected.totalCostUsd - baseline.totalCostUsd) / baseline.totalCostUsd) * 100 
      : 0,
    energyKwh: projected.totalEnergyKwh - baseline.totalEnergyKwh,
    energyPercent: baseline.totalEnergyKwh > 0
      ? ((projected.totalEnergyKwh - baseline.totalEnergyKwh) / baseline.totalEnergyKwh) * 100
      : 0,
    carbonKgCo2e: projected.totalCarbonKgCo2e - baseline.totalCarbonKgCo2e,
    carbonPercent: baseline.totalCarbonKgCo2e > 0
      ? ((projected.totalCarbonKgCo2e - baseline.totalCarbonKgCo2e) / baseline.totalCarbonKgCo2e) * 100
      : 0,
  };
  
  // Generate risks and assumptions
  const { risks, assumptions } = analyzeChanges(changes);
  
  // Calculate confidence
  const confidenceFactors = calculateScenarioConfidence(changes, baselineWorkloads);
  const confidence = calculateConfidenceScore(confidenceFactors);
  
  return {
    baseline,
    projected,
    delta,
    confidence: confidence.score,
    risks,
    assumptions,
  };
}

function calculateTotals(workloads: NormalizedWorkload[]) {
  return {
    totalCostUsd: workloads.reduce((sum, w) => sum + w.costUsd, 0),
    totalEnergyKwh: workloads.reduce((sum, w) => sum + w.energyKwh, 0),
    totalCarbonKgCo2e: workloads.reduce((sum, w) => sum + w.carbonKgCo2e, 0),
  };
}

function applyChanges(
  workloads: NormalizedWorkload[],
  changes: ScenarioChange[]
): NormalizedWorkload[] {
  let modified = [...workloads];
  
  for (const change of changes) {
    modified = modified.map(workload => {
      // Check if this workload should be affected
      const shouldApply = change.targetWorkloads.includes('all') || 
                          change.targetWorkloads.includes(workload.id);
      
      if (!shouldApply) return workload;
      
      switch (change.type) {
        case 'migrate_region':
          return applyRegionMigration(workload, change.parameters);
        case 'change_instance':
          return applyInstanceChange(workload, change.parameters);
        case 'optimize_schedule':
          return applyScheduleOptimization(workload, change.parameters);
        case 'reduce_runtime':
          return applyRuntimeReduction(workload, change.parameters);
        case 'custom':
          return applyCustomChange(workload, change.parameters);
        default:
          return workload;
      }
    });
  }
  
  return modified;
}

function applyRegionMigration(
  workload: NormalizedWorkload,
  params: Record<string, any>
): NormalizedWorkload {
  const newRegion = params.targetRegion as string;
  const provider = workload.provider || 'aws';
  
  // Get new grid intensity
  const gridData = getGridIntensity(newRegion, provider as any);
  const pueData = getRegionalPUE(newRegion, provider as any);
  
  // Recalculate energy with new PUE
  const energyResult = calculateEnergy({
    runtimeHours: workload.runtimeHours,
    instanceType: workload.instanceType,
    gpuModel: workload.gpuModel,
    gpuCount: workload.gpuCount,
    region: newRegion,
    provider: provider,
    customPUE: pueData.pue,
  });
  
  // Recalculate carbon with new grid intensity
  const carbonResult = calculateCarbon({
    energyKwh: energyResult.energyKwh,
    region: newRegion,
    provider: provider,
  });
  
  // Cost may change due to regional pricing (simplified model)
  const costMultiplier = getRegionalCostMultiplier(workload.region, newRegion);
  
  return {
    ...workload,
    region: newRegion,
    energyKwh: energyResult.energyKwh,
    energyCalculation: energyResult.calculation,
    carbonKgCo2e: carbonResult.carbonKgCo2e,
    carbonCalculation: carbonResult.calculation,
    costUsd: workload.costUsd * costMultiplier,
  };
}

function applyInstanceChange(
  workload: NormalizedWorkload,
  params: Record<string, any>
): NormalizedWorkload {
  const newInstanceType = params.targetInstance as string;
  const costReduction = params.costReduction as number || 0;
  const performanceRatio = params.performanceRatio as number || 1;
  
  // Recalculate with new instance
  const energyResult = calculateEnergy({
    runtimeHours: workload.runtimeHours / performanceRatio, // May take longer
    instanceType: newInstanceType,
    region: workload.region,
    provider: workload.provider,
  });
  
  const carbonResult = calculateCarbon({
    energyKwh: energyResult.energyKwh,
    region: workload.region,
    provider: workload.provider,
  });
  
  return {
    ...workload,
    instanceType: newInstanceType,
    runtimeHours: workload.runtimeHours / performanceRatio,
    energyKwh: energyResult.energyKwh,
    energyCalculation: energyResult.calculation,
    carbonKgCo2e: carbonResult.carbonKgCo2e,
    carbonCalculation: carbonResult.calculation,
    costUsd: workload.costUsd * (1 - costReduction / 100),
  };
}

function applyScheduleOptimization(
  workload: NormalizedWorkload,
  params: Record<string, any>
): NormalizedWorkload {
  const utilizationImprovement = params.utilizationImprovement as number || 0;
  const runtimeReduction = utilizationImprovement / 100;
  
  const newRuntimeHours = workload.runtimeHours * (1 - runtimeReduction);
  
  const energyResult = calculateEnergy({
    runtimeHours: newRuntimeHours,
    instanceType: workload.instanceType,
    gpuModel: workload.gpuModel,
    gpuCount: workload.gpuCount,
    region: workload.region,
    provider: workload.provider,
  });
  
  const carbonResult = calculateCarbon({
    energyKwh: energyResult.energyKwh,
    region: workload.region,
    provider: workload.provider,
  });
  
  return {
    ...workload,
    runtimeHours: newRuntimeHours,
    energyKwh: energyResult.energyKwh,
    energyCalculation: energyResult.calculation,
    carbonKgCo2e: carbonResult.carbonKgCo2e,
    carbonCalculation: carbonResult.calculation,
    costUsd: workload.costUsd * (1 - runtimeReduction),
  };
}

function applyRuntimeReduction(
  workload: NormalizedWorkload,
  params: Record<string, any>
): NormalizedWorkload {
  const reductionPercent = params.reductionPercent as number || 0;
  const newRuntimeHours = workload.runtimeHours * (1 - reductionPercent / 100);
  
  const energyResult = calculateEnergy({
    runtimeHours: newRuntimeHours,
    instanceType: workload.instanceType,
    gpuModel: workload.gpuModel,
    gpuCount: workload.gpuCount,
    region: workload.region,
    provider: workload.provider,
  });
  
  const carbonResult = calculateCarbon({
    energyKwh: energyResult.energyKwh,
    region: workload.region,
    provider: workload.provider,
  });
  
  return {
    ...workload,
    runtimeHours: newRuntimeHours,
    energyKwh: energyResult.energyKwh,
    energyCalculation: energyResult.calculation,
    carbonKgCo2e: carbonResult.carbonKgCo2e,
    carbonCalculation: carbonResult.calculation,
    costUsd: workload.costUsd * (1 - reductionPercent / 100),
  };
}

function applyCustomChange(
  workload: NormalizedWorkload,
  params: Record<string, any>
): NormalizedWorkload {
  // Apply arbitrary multipliers
  const costMultiplier = params.costMultiplier as number || 1;
  const energyMultiplier = params.energyMultiplier as number || 1;
  const carbonMultiplier = params.carbonMultiplier as number || 1;
  
  return {
    ...workload,
    costUsd: workload.costUsd * costMultiplier,
    energyKwh: workload.energyKwh * energyMultiplier,
    carbonKgCo2e: workload.carbonKgCo2e * carbonMultiplier,
  };
}

function getRegionalCostMultiplier(fromRegion?: string, toRegion?: string): number {
  // Simplified regional pricing model
  const regionalCostIndex: Record<string, number> = {
    'us-east-1': 1.0,
    'us-east-2': 0.95,
    'us-west-1': 1.1,
    'us-west-2': 1.0,
    'eu-west-1': 1.15,
    'eu-west-2': 1.2,
    'eu-central-1': 1.18,
    'eu-north-1': 1.12,
    'ap-southeast-1': 1.25,
    'ap-southeast-2': 1.3,
    'ap-northeast-1': 1.35,
  };
  
  const fromCost = regionalCostIndex[fromRegion || 'us-east-1'] || 1.0;
  const toCost = regionalCostIndex[toRegion || 'us-east-1'] || 1.0;
  
  return toCost / fromCost;
}

function analyzeChanges(changes: ScenarioChange[]): { risks: string[]; assumptions: string[] } {
  const risks: string[] = [];
  const assumptions: string[] = [];
  
  for (const change of changes) {
    switch (change.type) {
      case 'migrate_region':
        risks.push('Data transfer costs during migration not included');
        risks.push('Latency impact on workloads may vary');
        assumptions.push('Grid intensity based on latest available data');
        assumptions.push('Regional pricing differences are estimates');
        break;
      case 'change_instance':
        risks.push('Performance characteristics may differ');
        risks.push('Application compatibility should be verified');
        assumptions.push('Workload will complete in adjusted runtime');
        break;
      case 'optimize_schedule':
        risks.push('Scheduling changes may affect downstream dependencies');
        assumptions.push('Utilization can be improved as specified');
        break;
      case 'reduce_runtime':
        risks.push('Runtime reduction may impact job completion');
        assumptions.push('Workload efficiency can be improved');
        break;
    }
  }
  
  return { 
    risks: Array.from(new Set(risks)), 
    assumptions: Array.from(new Set(assumptions)) 
  };
}

function calculateScenarioConfidence(
  changes: ScenarioChange[],
  workloads: NormalizedWorkload[]
): ConfidenceFactor[] {
  const factors: ConfidenceFactor[] = [];
  
  // Base confidence from workload data quality
  const avgWorkloadConfidence = workloads.reduce((sum, w) => sum + w.confidenceScore, 0) / workloads.length;
  factors.push({
    factor: 'baseline_data_quality',
    impact: (avgWorkloadConfidence - 50) / 5,
    reason: `Baseline workload confidence: ${avgWorkloadConfidence.toFixed(0)}%`,
  });
  
  // Scenario complexity
  if (changes.length > 3) {
    factors.push({
      factor: 'scenario_complexity',
      impact: -10,
      reason: 'Complex scenario with multiple changes increases uncertainty',
    });
  }
  
  // Change type impacts
  for (const change of changes) {
    switch (change.type) {
      case 'migrate_region':
        factors.push({
          factor: 'region_migration',
          impact: 5,
          reason: 'Region migrations have well-documented impacts',
        });
        break;
      case 'change_instance':
        factors.push({
          factor: 'instance_change',
          impact: -5,
          reason: 'Instance changes have variable performance impacts',
        });
        break;
      case 'custom':
        factors.push({
          factor: 'custom_change',
          impact: -15,
          reason: 'Custom changes rely on user-provided estimates',
        });
        break;
    }
  }
  
  return factors;
}

/**
 * Create a new scenario
 */
export function createScenario(
  name: string,
  description: string,
  baselineId: string,
  changes: ScenarioChange[]
): Scenario {
  return {
    id: uuidv4(),
    name,
    description,
    baselineId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    changes,
  };
}

/**
 * Pre-defined scenario templates
 */
export const SCENARIO_TEMPLATES = {
  migrateToLowCarbon: {
    name: 'Migrate to Low-Carbon Region',
    description: 'Move workloads to a region with lower grid carbon intensity',
    type: 'migrate_region' as const,
    suggestedRegions: ['eu-north-1', 'eu-west-3', 'us-west-2'],
  },
  rightSizeInstances: {
    name: 'Right-Size Instances',
    description: 'Reduce instance sizes based on actual utilization',
    type: 'change_instance' as const,
  },
  optimizeScheduling: {
    name: 'Optimize Scheduling',
    description: 'Consolidate batch workloads and reduce idle time',
    type: 'optimize_schedule' as const,
  },
  spotInstances: {
    name: 'Use Spot Instances',
    description: 'Move fault-tolerant workloads to spot/preemptible instances',
    type: 'custom' as const,
    defaultParams: { costMultiplier: 0.3 },
  },
};
