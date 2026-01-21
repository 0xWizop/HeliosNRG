// ============================================
// HELIOS ENERGY - Cost Calculation Module
// Use exact billing where available, never estimate if billing exists
// ============================================

import type { ConfidenceFactor } from '@/types';

export interface CostInput {
  // Exact billing data (highest priority)
  billedCostUsd?: number;
  
  // For calculation when billing not available
  runtimeHours?: number;
  instanceType?: string;
  provider?: 'aws' | 'gcp' | 'azure' | 'on_prem';
  region?: string;
  
  // Resource details for estimation
  gpuCount?: number;
  cpuCores?: number;
  memoryGB?: number;
  
  // Custom pricing
  customHourlyRate?: number;
}

export interface CostResult {
  costUsd: number;
  source: 'billing_exact' | 'calculated' | 'estimated';
  calculation: CostCalculation;
  confidenceFactors: ConfidenceFactor[];
}

export interface CostCalculation {
  method: string;
  hourlyRate?: number;
  runtimeHours?: number;
  formula: string;
  result: number;
}

/**
 * Calculate or retrieve cost.
 * PRINCIPLE: Never estimate cost if billing data exists.
 * Exact billing data always takes precedence.
 */
export function calculateCost(input: CostInput): CostResult {
  const confidenceFactors: ConfidenceFactor[] = [];
  
  // Priority 1: Exact billing data
  if (input.billedCostUsd !== undefined && input.billedCostUsd >= 0) {
    confidenceFactors.push({
      factor: 'cost_source',
      impact: 20,
      reason: 'Cost from exact billing data',
    });
    
    return {
      costUsd: input.billedCostUsd,
      source: 'billing_exact',
      calculation: {
        method: 'Exact billing data',
        formula: `Billed amount: $${input.billedCostUsd.toFixed(4)}`,
        result: input.billedCostUsd,
      },
      confidenceFactors,
    };
  }
  
  // Priority 2: Custom hourly rate with runtime
  if (input.customHourlyRate !== undefined && input.runtimeHours !== undefined) {
    const costUsd = input.customHourlyRate * input.runtimeHours;
    
    confidenceFactors.push({
      factor: 'cost_source',
      impact: 10,
      reason: 'Cost calculated from customer-provided hourly rate',
    });
    
    return {
      costUsd,
      source: 'calculated',
      calculation: {
        method: 'Customer hourly rate',
        hourlyRate: input.customHourlyRate,
        runtimeHours: input.runtimeHours,
        formula: `$${input.customHourlyRate.toFixed(4)}/hr × ${input.runtimeHours.toFixed(2)} hrs = $${costUsd.toFixed(4)}`,
        result: costUsd,
      },
      confidenceFactors,
    };
  }
  
  // Priority 3: Reference pricing lookup
  if (input.instanceType && input.provider && input.runtimeHours !== undefined) {
    const hourlyRate = getInstanceHourlyRate(input.instanceType, input.provider, input.region);
    
    if (hourlyRate !== null) {
      const costUsd = hourlyRate * input.runtimeHours;
      
      confidenceFactors.push({
        factor: 'cost_source',
        impact: 5,
        reason: `Cost calculated from reference pricing for ${input.instanceType}`,
      });
      
      return {
        costUsd,
        source: 'calculated',
        calculation: {
          method: 'Reference pricing',
          hourlyRate,
          runtimeHours: input.runtimeHours,
          formula: `$${hourlyRate.toFixed(4)}/hr × ${input.runtimeHours.toFixed(2)} hrs = $${costUsd.toFixed(4)}`,
          result: costUsd,
        },
        confidenceFactors,
      };
    }
  }
  
  // Priority 4: Estimation based on resource characteristics
  if (input.runtimeHours !== undefined) {
    const estimatedRate = estimateHourlyRate(input);
    const costUsd = estimatedRate * input.runtimeHours;
    
    confidenceFactors.push({
      factor: 'cost_source',
      impact: -15,
      reason: 'Cost estimated from resource characteristics - no billing data available',
    });
    
    return {
      costUsd,
      source: 'estimated',
      calculation: {
        method: 'Estimated from resources',
        hourlyRate: estimatedRate,
        runtimeHours: input.runtimeHours,
        formula: `~$${estimatedRate.toFixed(4)}/hr × ${input.runtimeHours.toFixed(2)} hrs = ~$${costUsd.toFixed(4)} (estimated)`,
        result: costUsd,
      },
      confidenceFactors,
    };
  }
  
  // No data available
  confidenceFactors.push({
    factor: 'cost_source',
    impact: -25,
    reason: 'Insufficient data to calculate cost',
  });
  
  return {
    costUsd: 0,
    source: 'estimated',
    calculation: {
      method: 'No data',
      formula: 'Unable to calculate - insufficient data',
      result: 0,
    },
    confidenceFactors,
  };
}

/**
 * Reference pricing for common instance types
 * These are on-demand prices and may vary by region and time
 */
function getInstanceHourlyRate(
  instanceType: string,
  provider: string,
  region?: string
): number | null {
  // AWS GPU instances (us-east-1 on-demand prices, approximate)
  const awsPricing: Record<string, number> = {
    'p4d.24xlarge': 32.77,
    'p4de.24xlarge': 40.97,
    'p3.2xlarge': 3.06,
    'p3.8xlarge': 12.24,
    'p3.16xlarge': 24.48,
    'p3dn.24xlarge': 31.21,
    'g5.xlarge': 1.006,
    'g5.2xlarge': 1.212,
    'g5.4xlarge': 1.624,
    'g5.8xlarge': 2.448,
    'g5.12xlarge': 5.672,
    'g5.16xlarge': 4.096,
    'g5.24xlarge': 8.144,
    'g5.48xlarge': 16.288,
    'g4dn.xlarge': 0.526,
    'g4dn.2xlarge': 0.752,
    'g4dn.4xlarge': 1.204,
    'g4dn.8xlarge': 2.176,
    'g4dn.12xlarge': 3.912,
    'g4dn.16xlarge': 4.352,
    'inf1.xlarge': 0.228,
    'inf1.2xlarge': 0.362,
    'inf1.6xlarge': 1.18,
    'inf2.xlarge': 0.758,
    'inf2.8xlarge': 1.968,
    'inf2.24xlarge': 6.49,
    'inf2.48xlarge': 12.98,
    'trn1.2xlarge': 1.34,
    'trn1.32xlarge': 21.5,
    'trn1n.32xlarge': 24.78,
  };
  
  // GCP GPU instances (approximate)
  const gcpPricing: Record<string, number> = {
    'a2-highgpu-1g': 3.67,
    'a2-highgpu-2g': 7.35,
    'a2-highgpu-4g': 14.69,
    'a2-highgpu-8g': 29.39,
    'a2-megagpu-16g': 55.74,
    'a2-ultragpu-1g': 5.0,
    'a2-ultragpu-2g': 10.0,
    'a2-ultragpu-4g': 20.0,
    'a2-ultragpu-8g': 40.0,
    'g2-standard-4': 0.84,
    'g2-standard-8': 1.13,
    'g2-standard-12': 1.42,
    'g2-standard-16': 1.68,
    'g2-standard-24': 2.52,
    'g2-standard-32': 2.82,
    'g2-standard-48': 4.23,
    'g2-standard-96': 8.46,
    'n1-standard-4-nvidia-t4-1': 0.55,
    'n1-standard-8-nvidia-t4-1': 0.65,
  };
  
  // Azure GPU instances (approximate)
  const azurePricing: Record<string, number> = {
    'standard_nc6': 0.90,
    'standard_nc12': 1.80,
    'standard_nc24': 3.60,
    'standard_nc6s_v3': 3.06,
    'standard_nc12s_v3': 6.12,
    'standard_nc24s_v3': 12.24,
    'standard_nd40rs_v2': 22.032,
    'standard_nd96asr_v4': 27.20,
    'standard_nc4as_t4_v3': 0.526,
    'standard_nc8as_t4_v3': 0.752,
    'standard_nc16as_t4_v3': 1.204,
    'standard_nc64as_t4_v3': 4.352,
    'standard_nv6': 1.14,
    'standard_nv12': 2.28,
    'standard_nv24': 4.56,
  };
  
  const normalizedType = instanceType.toLowerCase().replace(/[^a-z0-9.-]/g, '');
  
  switch (provider.toLowerCase()) {
    case 'aws':
      return awsPricing[normalizedType] || null;
    case 'gcp':
    case 'google':
      return gcpPricing[normalizedType] || null;
    case 'azure':
      return azurePricing[normalizedType.replace('standard_', '')] || 
             azurePricing[normalizedType] || null;
    default:
      return null;
  }
}

/**
 * Estimate hourly rate based on resource characteristics
 */
function estimateHourlyRate(input: CostInput): number {
  let rate = 0.10; // Base rate
  
  // Add for CPU cores
  if (input.cpuCores) {
    rate += input.cpuCores * 0.02;
  }
  
  // Add for memory
  if (input.memoryGB) {
    rate += input.memoryGB * 0.005;
  }
  
  // Add for GPUs (significant cost driver)
  if (input.gpuCount) {
    rate += input.gpuCount * 2.50; // Rough estimate per GPU
  }
  
  return rate;
}

/**
 * Batch calculate costs
 */
export function calculateCostBatch(inputs: CostInput[]): CostResult[] {
  return inputs.map(input => calculateCost(input));
}

/**
 * Calculate cost per unit metrics
 */
export function calculateCostMetrics(
  totalCost: number,
  metrics: { queries?: number; inferences?: number; trainingRuns?: number; runtimeHours?: number }
) {
  return {
    costPerQuery: metrics.queries ? totalCost / metrics.queries : null,
    costPerInference: metrics.inferences ? totalCost / metrics.inferences : null,
    costPerTrainingRun: metrics.trainingRuns ? totalCost / metrics.trainingRuns : null,
    costPerHour: metrics.runtimeHours ? totalCost / metrics.runtimeHours : null,
  };
}
