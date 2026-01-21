// ============================================
// HELIOS ENERGY - Energy Calculation Module
// Deterministic, explainable energy calculations
// ============================================

import type { EnergyCalculation, ConfidenceFactor } from '@/types';
import { getInstancePower, getRegionalPUE } from '../reference-data';

export interface EnergyInput {
  runtimeHours: number;
  instanceType?: string;
  gpuModel?: string;
  gpuCount?: number;
  cpuCores?: number;
  region?: string;
  provider?: string;
  
  // Optional overrides from customer
  measuredPowerWatts?: number;
  customPUE?: number;
}

export interface EnergyResult {
  energyKwh: number;
  calculation: EnergyCalculation;
  source: 'measured' | 'calculated' | 'estimated';
  confidenceFactors: ConfidenceFactor[];
}

/**
 * Calculate energy consumption using the formula:
 * Energy (kWh) = (Runtime Hours × Power Draw Watts × PUE) / 1000
 * 
 * This is a deterministic calculation - same inputs always produce same outputs.
 * All assumptions are explicit and traceable.
 */
export function calculateEnergy(input: EnergyInput): EnergyResult {
  const confidenceFactors: ConfidenceFactor[] = [];
  
  // Determine power draw
  let powerDrawWatts: number;
  let powerSource: string;
  
  if (input.measuredPowerWatts !== undefined && input.measuredPowerWatts > 0) {
    // Customer-provided measurement - highest confidence
    powerDrawWatts = input.measuredPowerWatts;
    powerSource = 'Customer measurement';
    confidenceFactors.push({
      factor: 'power_source',
      impact: 15,
      reason: 'Power draw based on customer-provided measurement',
    });
  } else if (input.instanceType && input.provider) {
    // Look up from reference data
    const instancePower = getInstancePower(input.instanceType, input.provider as any);
    if (instancePower) {
      powerDrawWatts = instancePower.typicalWatts;
      powerSource = `Reference data: ${instancePower.source}`;
      confidenceFactors.push({
        factor: 'power_source',
        impact: 5,
        reason: `Power draw from ${instancePower.source} for ${input.instanceType}`,
      });
    } else {
      // Estimate based on instance characteristics
      powerDrawWatts = estimatePowerFromCharacteristics(input);
      powerSource = 'Estimated from instance characteristics';
      confidenceFactors.push({
        factor: 'power_source',
        impact: -10,
        reason: 'Power draw estimated - no reference data for instance type',
      });
    }
  } else if (input.gpuModel && input.gpuCount) {
    // GPU-based estimation
    powerDrawWatts = estimateGpuPower(input.gpuModel, input.gpuCount);
    powerSource = 'Estimated from GPU specifications';
    confidenceFactors.push({
      factor: 'power_source',
      impact: 0,
      reason: 'Power draw estimated from GPU TDP specifications',
    });
  } else {
    // Fallback estimation
    powerDrawWatts = estimatePowerFromCharacteristics(input);
    powerSource = 'Estimated (limited data)';
    confidenceFactors.push({
      factor: 'power_source',
      impact: -20,
      reason: 'Power draw estimated with limited information',
    });
  }
  
  // Determine PUE
  let pue: number;
  let pueSource: string;
  
  if (input.customPUE !== undefined && input.customPUE > 0) {
    pue = input.customPUE;
    pueSource = 'Customer-provided PUE';
    confidenceFactors.push({
      factor: 'pue_source',
      impact: 10,
      reason: 'PUE based on customer-provided value',
    });
  } else if (input.region && input.provider) {
    const regionalPUE = getRegionalPUE(input.region, input.provider as any);
    pue = regionalPUE.pue;
    pueSource = regionalPUE.source;
    confidenceFactors.push({
      factor: 'pue_source',
      impact: regionalPUE.isDefault ? -5 : 5,
      reason: `PUE from ${regionalPUE.source}`,
    });
  } else {
    // Industry average PUE
    pue = 1.58;
    pueSource = 'Industry average (Uptime Institute 2023)';
    confidenceFactors.push({
      factor: 'pue_source',
      impact: -10,
      reason: 'Using industry average PUE - region/provider unknown',
    });
  }
  
  // Calculate energy
  const energyKwh = (input.runtimeHours * powerDrawWatts * pue) / 1000;
  
  // Build human-readable formula
  const formula = `(${input.runtimeHours.toFixed(2)} hours × ${powerDrawWatts.toFixed(0)}W × ${pue.toFixed(2)} PUE) / 1000 = ${energyKwh.toFixed(4)} kWh`;
  
  // Determine source classification
  let source: 'measured' | 'calculated' | 'estimated';
  if (input.measuredPowerWatts !== undefined) {
    source = 'measured';
  } else if (input.instanceType && input.provider) {
    source = 'calculated';
  } else {
    source = 'estimated';
  }
  
  return {
    energyKwh,
    calculation: {
      powerDrawWatts,
      powerSource,
      pue,
      pueSource,
      runtimeHours: input.runtimeHours,
      formula,
      result: energyKwh,
    },
    source,
    confidenceFactors,
  };
}

/**
 * Estimate power draw from instance characteristics when no reference data exists
 */
function estimatePowerFromCharacteristics(input: EnergyInput): number {
  let basePower = 50; // Base server power
  
  // Add CPU power (rough estimate: 10W per core at typical load)
  if (input.cpuCores) {
    basePower += input.cpuCores * 10;
  } else {
    basePower += 80; // Assume 8 cores typical
  }
  
  // Add GPU power if present
  if (input.gpuCount && input.gpuCount > 0) {
    const gpuPower = input.gpuModel 
      ? estimateGpuPower(input.gpuModel, 1)
      : 250; // Default GPU power estimate
    basePower += gpuPower * input.gpuCount;
  }
  
  return basePower;
}

/**
 * Estimate GPU power based on model specifications
 */
function estimateGpuPower(gpuModel: string, count: number): number {
  const gpuTdpMap: Record<string, number> = {
    // NVIDIA Data Center GPUs
    'a100': 400,
    'a100-40gb': 400,
    'a100-80gb': 400,
    'h100': 700,
    'h100-80gb': 700,
    'a10': 150,
    'a10g': 150,
    'l4': 72,
    'l40': 300,
    't4': 70,
    'v100': 300,
    'v100-16gb': 300,
    'v100-32gb': 300,
    'p100': 250,
    'p4': 75,
    
    // NVIDIA Consumer/Workstation (sometimes used)
    'rtx4090': 450,
    'rtx3090': 350,
    'rtx4080': 320,
    'rtx3080': 320,
    
    // AMD
    'mi250x': 500,
    'mi210': 300,
    'mi100': 300,
  };
  
  const modelLower = gpuModel.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  for (const [key, tdp] of Object.entries(gpuTdpMap)) {
    if (modelLower.includes(key.replace(/[^a-z0-9]/g, ''))) {
      // TDP is max power; typical is ~70-80% of TDP
      return tdp * 0.75 * count;
    }
  }
  
  // Default estimate for unknown GPU
  return 250 * count;
}

/**
 * Batch calculate energy for multiple workloads
 */
export function calculateEnergyBatch(inputs: EnergyInput[]): EnergyResult[] {
  return inputs.map(input => calculateEnergy(input));
}
