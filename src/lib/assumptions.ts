import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase/config';

// Default assumption values (same as in AssumptionPanel)
export const DEFAULT_ASSUMPTIONS = {
  // Power - GPUs
  gpu_a100: 400,
  gpu_v100: 300,
  gpu_h100: 700,
  gpu_t4: 70,
  // Power - CPU instances
  cpu_small: 20,
  cpu_medium: 40,
  cpu_large: 80,
  cpu_xlarge: 160,
  // PUE by provider
  pue_aws: 1.135,
  pue_gcp: 1.10,
  pue_azure: 1.18,
  pue_default: 1.58,
  // Carbon Intensity by region
  ci_us_east_1: 337,
  ci_us_east_2: 410,
  ci_us_west_1: 210,
  ci_us_west_2: 117,
  ci_eu_west_1: 296,
  ci_eu_west_2: 231,
  ci_eu_central_1: 311,
  ci_eu_north_1: 28,
  ci_ap_south_1: 708,
  ci_ap_northeast_1: 471,
  ci_ap_southeast_1: 408,
  ci_ap_southeast_2: 530,
  // Utilization
  util_gpu: 65,
  util_cpu: 50,
  util_memory: 60,
  // Cost
  cost_snowflake: 3.00,
  cost_databricks: 0.55,
};

export type AssumptionKey = keyof typeof DEFAULT_ASSUMPTIONS;

export interface TeamAssumptions {
  [key: string]: number;
}

// Get team's assumptions (with overrides merged)
export async function getTeamAssumptions(teamId: string): Promise<TeamAssumptions> {
  const assumptions = { ...DEFAULT_ASSUMPTIONS };
  
  try {
    const assumptionsDoc = await getDoc(doc(db, 'team_assumptions', teamId));
    if (assumptionsDoc.exists()) {
      const overrides = assumptionsDoc.data().overrides || {};
      Object.entries(overrides).forEach(([key, data]: [string, any]) => {
        if (data?.value !== undefined && key in assumptions) {
          (assumptions as any)[key] = data.value;
        }
      });
    }
  } catch (error) {
    console.error('Failed to load team assumptions:', error);
  }
  
  return assumptions;
}

// Get PUE for a provider
export function getPUE(assumptions: TeamAssumptions, provider: string): number {
  const providerLower = provider.toLowerCase();
  if (providerLower.includes('aws') || providerLower.includes('amazon')) {
    return assumptions.pue_aws;
  }
  if (providerLower.includes('gcp') || providerLower.includes('google')) {
    return assumptions.pue_gcp;
  }
  if (providerLower.includes('azure') || providerLower.includes('microsoft')) {
    return assumptions.pue_azure;
  }
  return assumptions.pue_default;
}

// Get carbon intensity for a region
export function getCarbonIntensity(assumptions: TeamAssumptions, region: string): number {
  const regionLower = region.toLowerCase();
  
  // US regions
  if (regionLower.includes('us-east-1') || regionLower.includes('virginia') || regionLower.includes('us-east4')) {
    return assumptions.ci_us_east_1;
  }
  if (regionLower.includes('us-east-2') || regionLower.includes('ohio')) {
    return assumptions.ci_us_east_2;
  }
  if (regionLower.includes('us-west-1') || regionLower.includes('california')) {
    return assumptions.ci_us_west_1;
  }
  if (regionLower.includes('us-west-2') || regionLower.includes('oregon')) {
    return assumptions.ci_us_west_2;
  }
  
  // Europe regions
  if (regionLower.includes('eu-west-1') || regionLower.includes('ireland')) {
    return assumptions.ci_eu_west_1;
  }
  if (regionLower.includes('eu-west-2') || regionLower.includes('london') || regionLower.includes('uk')) {
    return assumptions.ci_eu_west_2;
  }
  if (regionLower.includes('eu-central-1') || regionLower.includes('frankfurt') || regionLower.includes('germany')) {
    return assumptions.ci_eu_central_1;
  }
  if (regionLower.includes('eu-north-1') || regionLower.includes('stockholm') || regionLower.includes('sweden')) {
    return assumptions.ci_eu_north_1;
  }
  
  // Asia Pacific regions
  if (regionLower.includes('ap-south-1') || regionLower.includes('mumbai') || regionLower.includes('india')) {
    return assumptions.ci_ap_south_1;
  }
  if (regionLower.includes('ap-northeast-1') || regionLower.includes('tokyo') || regionLower.includes('japan')) {
    return assumptions.ci_ap_northeast_1;
  }
  if (regionLower.includes('ap-southeast-1') || regionLower.includes('singapore')) {
    return assumptions.ci_ap_southeast_1;
  }
  if (regionLower.includes('ap-southeast-2') || regionLower.includes('sydney') || regionLower.includes('australia')) {
    return assumptions.ci_ap_southeast_2;
  }
  
  // Default to US average
  return assumptions.ci_us_east_1;
}

// Get power estimate for instance type
export function getInstancePower(assumptions: TeamAssumptions, instanceType: string, vcpus: number): number {
  const typeLower = instanceType.toLowerCase();
  
  // GPU instances
  if (typeLower.includes('a100') || typeLower.includes('p4d') || typeLower.includes('a2-highgpu')) {
    return assumptions.gpu_a100;
  }
  if (typeLower.includes('v100') || typeLower.includes('p3')) {
    return assumptions.gpu_v100;
  }
  if (typeLower.includes('h100') || typeLower.includes('p5')) {
    return assumptions.gpu_h100;
  }
  if (typeLower.includes('t4') || typeLower.includes('g4')) {
    return assumptions.gpu_t4;
  }
  
  // CPU instances - estimate by vCPU count
  if (vcpus <= 2) return assumptions.cpu_small;
  if (vcpus <= 4) return assumptions.cpu_medium;
  if (vcpus <= 8) return assumptions.cpu_large;
  return assumptions.cpu_xlarge;
}

// Calculate energy and carbon for a workload
export function calculateWorkloadMetrics(
  assumptions: TeamAssumptions,
  workload: {
    provider?: string;
    region?: string;
    instanceType?: string;
    vcpus?: number;
    runtimeHours?: number;
    cpuUtilization?: number;
  }
): { energyKwh: number; carbonKg: number; confidenceScore: number } {
  const {
    provider = 'unknown',
    region = 'us-east-1',
    instanceType = 'unknown',
    vcpus = 4,
    runtimeHours = 1,
    cpuUtilization,
  } = workload;

  // Get values from assumptions
  const pue = getPUE(assumptions, provider);
  const carbonIntensity = getCarbonIntensity(assumptions, region);
  const basePower = getInstancePower(assumptions, instanceType, vcpus);
  
  // Use provided utilization or default
  const utilization = cpuUtilization ?? assumptions.util_cpu;
  
  // Calculate energy: Power (W) × Utilization × Hours / 1000 = kWh
  const computeEnergy = (basePower * (utilization / 100) * runtimeHours) / 1000;
  const totalEnergy = computeEnergy * pue; // Apply PUE
  
  // Calculate carbon: Energy (kWh) × Carbon Intensity (gCO2/kWh) / 1000 = kgCO2
  const carbonKg = (totalEnergy * carbonIntensity) / 1000;
  
  // Calculate confidence score based on data quality
  let confidenceScore = 70; // Base score
  
  // Boost confidence if we have specific data
  if (instanceType !== 'unknown') confidenceScore += 10;
  if (region !== 'us-east-1' && region !== 'unknown') confidenceScore += 5;
  if (cpuUtilization !== undefined) confidenceScore += 15; // Customer measurement
  
  return {
    energyKwh: Math.round(totalEnergy * 1000) / 1000,
    carbonKg: Math.round(carbonKg * 1000) / 1000,
    confidenceScore: Math.min(100, confidenceScore),
  };
}
