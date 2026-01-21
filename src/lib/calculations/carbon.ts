// ============================================
// HELIOS ENERGY - Carbon Calculation Module
// Deterministic, explainable carbon calculations
// ============================================

import type { CarbonCalculation, ConfidenceFactor } from '@/types';
import { getGridIntensity } from '../reference-data';

export interface CarbonInput {
  energyKwh: number;
  region?: string;
  provider?: string;
  
  // Optional overrides
  customGridIntensity?: number; // gCO2/kWh
}

export interface CarbonResult {
  carbonKgCo2e: number;
  calculation: CarbonCalculation;
  source: 'measured' | 'calculated' | 'estimated';
  confidenceFactors: ConfidenceFactor[];
}

/**
 * Calculate carbon emissions using the formula:
 * Carbon (kgCO₂e) = Energy (kWh) × Grid Intensity (gCO₂/kWh) / 1000
 * 
 * Grid intensity data sourced from EPA, Ember, and IEA datasets.
 * All calculations are deterministic and fully traceable.
 */
export function calculateCarbon(input: CarbonInput): CarbonResult {
  const confidenceFactors: ConfidenceFactor[] = [];
  
  // Determine grid intensity
  let gridIntensityGCo2PerKwh: number;
  let gridIntensitySource: string;
  let region: string;
  
  if (input.customGridIntensity !== undefined && input.customGridIntensity > 0) {
    // Customer-provided intensity - highest confidence
    gridIntensityGCo2PerKwh = input.customGridIntensity;
    gridIntensitySource = 'Customer-provided grid intensity';
    region = input.region || 'custom';
    confidenceFactors.push({
      factor: 'grid_intensity_source',
      impact: 15,
      reason: 'Grid intensity based on customer-provided data',
    });
  } else if (input.region) {
    // Look up from reference data
    const gridData = getGridIntensity(input.region, input.provider as any);
    gridIntensityGCo2PerKwh = gridData.gCo2PerKwh;
    gridIntensitySource = gridData.source;
    region = gridData.region;
    
    if (gridData.isDefault) {
      confidenceFactors.push({
        factor: 'grid_intensity_source',
        impact: -10,
        reason: `Using default grid intensity - specific data not available for ${input.region}`,
      });
    } else {
      confidenceFactors.push({
        factor: 'grid_intensity_source',
        impact: 8,
        reason: `Grid intensity from ${gridData.source} for ${gridData.regionName}`,
      });
    }
  } else {
    // Global average fallback
    gridIntensityGCo2PerKwh = 436; // Global average from IEA 2023
    gridIntensitySource = 'IEA Global Average (2023)';
    region = 'global';
    confidenceFactors.push({
      factor: 'grid_intensity_source',
      impact: -15,
      reason: 'Using global average grid intensity - region unknown',
    });
  }
  
  // Calculate carbon
  const carbonKgCo2e = (input.energyKwh * gridIntensityGCo2PerKwh) / 1000;
  
  // Build human-readable formula
  const formula = `${input.energyKwh.toFixed(4)} kWh × ${gridIntensityGCo2PerKwh.toFixed(1)} gCO₂/kWh / 1000 = ${carbonKgCo2e.toFixed(4)} kgCO₂e`;
  
  // Determine source classification
  let source: 'measured' | 'calculated' | 'estimated';
  if (input.customGridIntensity !== undefined) {
    source = 'measured';
  } else if (input.region) {
    source = 'calculated';
  } else {
    source = 'estimated';
  }
  
  return {
    carbonKgCo2e,
    calculation: {
      energyKwh: input.energyKwh,
      gridIntensityGCo2PerKwh,
      gridIntensitySource,
      region,
      formula,
      result: carbonKgCo2e,
    },
    source,
    confidenceFactors,
  };
}

/**
 * Calculate carbon with renewable energy offset
 */
export function calculateCarbonWithRenewables(
  input: CarbonInput,
  renewablePercentage: number
): CarbonResult {
  const baseResult = calculateCarbon(input);
  
  // Apply renewable offset
  const offsetFactor = 1 - (renewablePercentage / 100);
  const adjustedCarbon = baseResult.carbonKgCo2e * offsetFactor;
  
  // Update formula
  const formula = `${baseResult.calculation.formula} × (1 - ${renewablePercentage}% renewable) = ${adjustedCarbon.toFixed(4)} kgCO₂e`;
  
  baseResult.carbonKgCo2e = adjustedCarbon;
  baseResult.calculation.formula = formula;
  baseResult.calculation.result = adjustedCarbon;
  
  baseResult.confidenceFactors.push({
    factor: 'renewable_offset',
    impact: renewablePercentage > 0 ? 5 : 0,
    reason: renewablePercentage > 0 
      ? `${renewablePercentage}% renewable energy offset applied`
      : 'No renewable energy offset',
  });
  
  return baseResult;
}

/**
 * Batch calculate carbon for multiple inputs
 */
export function calculateCarbonBatch(inputs: CarbonInput[]): CarbonResult[] {
  return inputs.map(input => calculateCarbon(input));
}

/**
 * Calculate annual carbon equivalent metrics
 */
export function calculateCarbonEquivalents(carbonKgCo2e: number) {
  return {
    // EPA equivalencies (https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator)
    milesDriver: carbonKgCo2e * 2.48, // Miles driven by average passenger vehicle
    homesEnergy: carbonKgCo2e / 7500, // Homes' electricity use for one year
    treeSeedlings: carbonKgCo2e / 60, // Tree seedlings grown for 10 years
    smartphonesCharged: carbonKgCo2e * 121.6, // Smartphones charged
    gallonsGasoline: carbonKgCo2e / 8.89, // Gallons of gasoline consumed
  };
}
