// ============================================
// HELIOS ENERGY - Provider Detection Module
// Intelligent provider/region inference from workload data
// ============================================

export type CloudProvider = 'aws' | 'gcp' | 'azure' | 'on_prem' | 'unknown';

export interface DetectionResult {
  provider: CloudProvider;
  region: string;
  confidence: number;
  method: string;
}

// Instance type patterns by provider
const INSTANCE_PATTERNS: Record<CloudProvider, RegExp[]> = {
  aws: [
    /^[a-z][0-9]+[a-z]?\.(nano|micro|small|medium|large|xlarge|metal|\d+xlarge)$/i, // m5.xlarge, c6i.2xlarge
    /^(p[2-5]|g[3-5]|inf[1-2]|trn[1-2])\./i, // GPU instances: p4d.24xlarge
    /^(r[5-7]|x[1-2]|z1d)\./i, // Memory optimized
    /^(c[5-7]|hpc[6-7])\./i, // Compute optimized
    /^(i[3-4]|d[2-3]|h1)\./i, // Storage optimized
  ],
  gcp: [
    /^(n[1-2]|e2|c[2-3]|m[1-3]|a2)-(standard|highmem|highcpu|megamem|ultramem)-\d+$/i, // n1-standard-4
    /^(n[1-2]|a2)-\w+-\d+-gpu$/i, // GPU instances
    /^custom-\d+-\d+$/i, // Custom machine types
  ],
  azure: [
    /^Standard_[A-Z]+\d+[a-z]?(_v\d+)?$/i, // Standard_D4s_v3
    /^Standard_(NC|ND|NV)\d+/i, // GPU instances
    /^Standard_(E|M|L)\d+/i, // Memory/storage optimized
    /^Standard_(F|H)\d+/i, // Compute optimized
  ],
  on_prem: [
    /^(bare-?metal|physical|on-?prem)/i,
  ],
  unknown: [],
};

// Region patterns by provider
const REGION_PATTERNS: Record<CloudProvider, RegExp[]> = {
  aws: [
    /^(us|eu|ap|sa|ca|me|af)-(north|south|east|west|central|northeast|southeast|southwest|northwest)-\d$/i,
    /^(us-gov|cn)-(north|south|east|west)-\d$/i,
  ],
  gcp: [
    /^(us|europe|asia|australia|southamerica|northamerica)-(north|south|east|west|central)\d+(-[a-c])?$/i,
  ],
  azure: [
    /^(east|west|central|north|south)(us|europe|asia|india|uk|japan|australia|brazil|canada|france|germany|norway|switzerland|uae|southafrica)\d?$/i,
    /^(us|eu|asia)(east|west|north|south|central)\d?$/i,
  ],
  on_prem: [
    /^(datacenter|dc|colo|private)/i,
  ],
  unknown: [],
};

// Common GPU model patterns
const GPU_PROVIDER_HINTS: Record<string, CloudProvider> = {
  'a100': 'aws', // Also GCP, but AWS more common
  'v100': 'aws',
  'a10g': 'aws',
  't4': 'gcp', // Common on GCP
  'k80': 'gcp',
  'p100': 'gcp',
};

/**
 * Detect cloud provider from instance type
 */
export function detectProviderFromInstanceType(instanceType: string): DetectionResult {
  if (!instanceType) {
    return { provider: 'unknown', region: 'unknown', confidence: 0, method: 'no_data' };
  }

  const normalized = instanceType.trim();

  for (const [provider, patterns] of Object.entries(INSTANCE_PATTERNS)) {
    if (provider === 'unknown') continue;
    
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        return {
          provider: provider as CloudProvider,
          region: 'unknown',
          confidence: 85,
          method: 'instance_type_pattern',
        };
      }
    }
  }

  return { provider: 'unknown', region: 'unknown', confidence: 0, method: 'no_match' };
}

/**
 * Detect cloud provider from region string
 */
export function detectProviderFromRegion(region: string): DetectionResult {
  if (!region) {
    return { provider: 'unknown', region: 'unknown', confidence: 0, method: 'no_data' };
  }

  const normalized = region.trim().toLowerCase();

  for (const [provider, patterns] of Object.entries(REGION_PATTERNS)) {
    if (provider === 'unknown') continue;
    
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        return {
          provider: provider as CloudProvider,
          region: normalized,
          confidence: 90,
          method: 'region_pattern',
        };
      }
    }
  }

  return { provider: 'unknown', region: normalized, confidence: 0, method: 'no_match' };
}

/**
 * Detect provider from GPU model hints
 */
export function detectProviderFromGPU(gpuModel: string): DetectionResult {
  if (!gpuModel) {
    return { provider: 'unknown', region: 'unknown', confidence: 0, method: 'no_data' };
  }

  const normalized = gpuModel.toLowerCase();

  for (const [hint, provider] of Object.entries(GPU_PROVIDER_HINTS)) {
    if (normalized.includes(hint)) {
      return {
        provider,
        region: 'unknown',
        confidence: 60, // Lower confidence - GPUs are cross-provider
        method: 'gpu_hint',
      };
    }
  }

  return { provider: 'unknown', region: 'unknown', confidence: 0, method: 'no_match' };
}

/**
 * Comprehensive provider detection using all available signals
 */
export function detectProvider(workload: {
  provider?: string;
  region?: string;
  instanceType?: string;
  gpuModel?: string;
}): DetectionResult {
  // 1. If provider is explicitly set and valid, use it
  if (workload.provider && workload.provider !== 'unknown') {
    const normalized = workload.provider.toLowerCase();
    if (['aws', 'gcp', 'azure', 'on_prem'].includes(normalized)) {
      return {
        provider: normalized as CloudProvider,
        region: workload.region || 'unknown',
        confidence: 100,
        method: 'explicit',
      };
    }
  }

  // 2. Try instance type detection
  if (workload.instanceType) {
    const result = detectProviderFromInstanceType(workload.instanceType);
    if (result.provider !== 'unknown') {
      return { ...result, region: workload.region || result.region };
    }
  }

  // 3. Try region detection
  if (workload.region) {
    const result = detectProviderFromRegion(workload.region);
    if (result.provider !== 'unknown') {
      return result;
    }
  }

  // 4. Try GPU hint detection
  if (workload.gpuModel) {
    const result = detectProviderFromGPU(workload.gpuModel);
    if (result.provider !== 'unknown') {
      return { ...result, region: workload.region || result.region };
    }
  }

  // 5. Fallback to unknown
  return {
    provider: 'unknown',
    region: workload.region || 'unknown',
    confidence: 0,
    method: 'fallback',
  };
}

/**
 * Normalize region name to standard format
 */
export function normalizeRegion(region: string, provider: CloudProvider): string {
  if (!region || region === 'unknown') return 'unknown';

  const normalized = region.trim().toLowerCase();

  // AWS region normalization
  if (provider === 'aws') {
    // Already in standard format
    if (/^(us|eu|ap|sa|ca|me|af)-(north|south|east|west|central|northeast|southeast)-\d$/.test(normalized)) {
      return normalized;
    }
    // Common aliases
    const awsAliases: Record<string, string> = {
      'virginia': 'us-east-1',
      'ohio': 'us-east-2',
      'california': 'us-west-1',
      'oregon': 'us-west-2',
      'ireland': 'eu-west-1',
      'frankfurt': 'eu-central-1',
      'tokyo': 'ap-northeast-1',
      'singapore': 'ap-southeast-1',
      'sydney': 'ap-southeast-2',
    };
    if (awsAliases[normalized]) return awsAliases[normalized];
  }

  // GCP region normalization
  if (provider === 'gcp') {
    const gcpAliases: Record<string, string> = {
      'iowa': 'us-central1',
      'south carolina': 'us-east1',
      'virginia': 'us-east4',
      'oregon': 'us-west1',
      'los angeles': 'us-west2',
      'belgium': 'europe-west1',
      'london': 'europe-west2',
      'frankfurt': 'europe-west3',
    };
    if (gcpAliases[normalized]) return gcpAliases[normalized];
  }

  return normalized;
}

/**
 * Get human-readable region name
 */
export function getRegionDisplayName(region: string, provider: CloudProvider): string {
  const displayNames: Record<string, string> = {
    // AWS
    'us-east-1': 'N. Virginia',
    'us-east-2': 'Ohio',
    'us-west-1': 'N. California',
    'us-west-2': 'Oregon',
    'eu-west-1': 'Ireland',
    'eu-west-2': 'London',
    'eu-central-1': 'Frankfurt',
    'ap-northeast-1': 'Tokyo',
    'ap-southeast-1': 'Singapore',
    'ap-southeast-2': 'Sydney',
    // GCP
    'us-central1': 'Iowa',
    'us-east1': 'South Carolina',
    'us-east4': 'Virginia',
    'us-west1': 'Oregon',
    'europe-west1': 'Belgium',
    'europe-west2': 'London',
    'europe-west3': 'Frankfurt',
    'asia-east1': 'Taiwan',
    // Azure
    'eastus': 'East US',
    'westus': 'West US',
    'westeurope': 'West Europe',
    'northeurope': 'North Europe',
  };

  return displayNames[region.toLowerCase()] || region;
}
