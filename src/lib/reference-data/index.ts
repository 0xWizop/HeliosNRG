// ============================================
// HELIOS ENERGY - Reference Data Module
// Auditable, source-documented reference data
// ============================================

// ============================================
// Grid Carbon Intensity Data
// Sources: EPA eGRID 2022, Ember 2023, IEA 2023
// ============================================

interface GridIntensityEntry {
  region: string;
  regionName: string;
  provider?: string;
  gCo2PerKwh: number;
  source: string;
  year: number;
}

const GRID_INTENSITY_DATA: GridIntensityEntry[] = [
  // AWS Regions - using EPA eGRID and regional data
  { region: 'us-east-1', regionName: 'US East (N. Virginia)', provider: 'aws', gCo2PerKwh: 337, source: 'EPA eGRID 2022 - SERC Virginia', year: 2022 },
  { region: 'us-east-2', regionName: 'US East (Ohio)', provider: 'aws', gCo2PerKwh: 410, source: 'EPA eGRID 2022 - RFC East', year: 2022 },
  { region: 'us-west-1', regionName: 'US West (N. California)', provider: 'aws', gCo2PerKwh: 210, source: 'EPA eGRID 2022 - CAMX', year: 2022 },
  { region: 'us-west-2', regionName: 'US West (Oregon)', provider: 'aws', gCo2PerKwh: 117, source: 'EPA eGRID 2022 - NWPP', year: 2022 },
  { region: 'eu-west-1', regionName: 'EU (Ireland)', provider: 'aws', gCo2PerKwh: 296, source: 'Ember 2023 - Ireland', year: 2023 },
  { region: 'eu-west-2', regionName: 'EU (London)', provider: 'aws', gCo2PerKwh: 207, source: 'Ember 2023 - UK', year: 2023 },
  { region: 'eu-west-3', regionName: 'EU (Paris)', provider: 'aws', gCo2PerKwh: 56, source: 'Ember 2023 - France', year: 2023 },
  { region: 'eu-central-1', regionName: 'EU (Frankfurt)', provider: 'aws', gCo2PerKwh: 311, source: 'Ember 2023 - Germany', year: 2023 },
  { region: 'eu-north-1', regionName: 'EU (Stockholm)', provider: 'aws', gCo2PerKwh: 28, source: 'Ember 2023 - Sweden', year: 2023 },
  { region: 'ap-southeast-1', regionName: 'Asia Pacific (Singapore)', provider: 'aws', gCo2PerKwh: 408, source: 'Ember 2023 - Singapore', year: 2023 },
  { region: 'ap-southeast-2', regionName: 'Asia Pacific (Sydney)', provider: 'aws', gCo2PerKwh: 505, source: 'Ember 2023 - Australia', year: 2023 },
  { region: 'ap-northeast-1', regionName: 'Asia Pacific (Tokyo)', provider: 'aws', gCo2PerKwh: 465, source: 'Ember 2023 - Japan', year: 2023 },
  { region: 'ap-northeast-2', regionName: 'Asia Pacific (Seoul)', provider: 'aws', gCo2PerKwh: 415, source: 'Ember 2023 - South Korea', year: 2023 },
  { region: 'ap-south-1', regionName: 'Asia Pacific (Mumbai)', provider: 'aws', gCo2PerKwh: 632, source: 'Ember 2023 - India', year: 2023 },
  { region: 'sa-east-1', regionName: 'South America (São Paulo)', provider: 'aws', gCo2PerKwh: 75, source: 'Ember 2023 - Brazil', year: 2023 },
  { region: 'ca-central-1', regionName: 'Canada (Central)', provider: 'aws', gCo2PerKwh: 120, source: 'Ember 2023 - Canada', year: 2023 },
  
  // GCP Regions
  { region: 'us-central1', regionName: 'Iowa', provider: 'gcp', gCo2PerKwh: 394, source: 'EPA eGRID 2022 - MROW', year: 2022 },
  { region: 'us-east1', regionName: 'South Carolina', provider: 'gcp', gCo2PerKwh: 354, source: 'EPA eGRID 2022 - SRSO', year: 2022 },
  { region: 'us-east4', regionName: 'Virginia', provider: 'gcp', gCo2PerKwh: 337, source: 'EPA eGRID 2022 - SERC Virginia', year: 2022 },
  { region: 'us-west1', regionName: 'Oregon', provider: 'gcp', gCo2PerKwh: 117, source: 'EPA eGRID 2022 - NWPP', year: 2022 },
  { region: 'us-west2', regionName: 'Los Angeles', provider: 'gcp', gCo2PerKwh: 210, source: 'EPA eGRID 2022 - CAMX', year: 2022 },
  { region: 'us-west4', regionName: 'Las Vegas', provider: 'gcp', gCo2PerKwh: 394, source: 'EPA eGRID 2022 - AZNM', year: 2022 },
  { region: 'europe-west1', regionName: 'Belgium', provider: 'gcp', gCo2PerKwh: 137, source: 'Ember 2023 - Belgium', year: 2023 },
  { region: 'europe-west2', regionName: 'London', provider: 'gcp', gCo2PerKwh: 207, source: 'Ember 2023 - UK', year: 2023 },
  { region: 'europe-west3', regionName: 'Frankfurt', provider: 'gcp', gCo2PerKwh: 311, source: 'Ember 2023 - Germany', year: 2023 },
  { region: 'europe-west4', regionName: 'Netherlands', provider: 'gcp', gCo2PerKwh: 328, source: 'Ember 2023 - Netherlands', year: 2023 },
  { region: 'europe-north1', regionName: 'Finland', provider: 'gcp', gCo2PerKwh: 79, source: 'Ember 2023 - Finland', year: 2023 },
  { region: 'asia-east1', regionName: 'Taiwan', provider: 'gcp', gCo2PerKwh: 509, source: 'Ember 2023 - Taiwan', year: 2023 },
  { region: 'asia-southeast1', regionName: 'Singapore', provider: 'gcp', gCo2PerKwh: 408, source: 'Ember 2023 - Singapore', year: 2023 },
  { region: 'asia-northeast1', regionName: 'Tokyo', provider: 'gcp', gCo2PerKwh: 465, source: 'Ember 2023 - Japan', year: 2023 },
  
  // Azure Regions
  { region: 'eastus', regionName: 'East US', provider: 'azure', gCo2PerKwh: 337, source: 'EPA eGRID 2022 - SERC Virginia', year: 2022 },
  { region: 'eastus2', regionName: 'East US 2', provider: 'azure', gCo2PerKwh: 337, source: 'EPA eGRID 2022 - SERC Virginia', year: 2022 },
  { region: 'westus', regionName: 'West US', provider: 'azure', gCo2PerKwh: 210, source: 'EPA eGRID 2022 - CAMX', year: 2022 },
  { region: 'westus2', regionName: 'West US 2', provider: 'azure', gCo2PerKwh: 117, source: 'EPA eGRID 2022 - NWPP', year: 2022 },
  { region: 'westeurope', regionName: 'West Europe', provider: 'azure', gCo2PerKwh: 328, source: 'Ember 2023 - Netherlands', year: 2023 },
  { region: 'northeurope', regionName: 'North Europe', provider: 'azure', gCo2PerKwh: 296, source: 'Ember 2023 - Ireland', year: 2023 },
  { region: 'uksouth', regionName: 'UK South', provider: 'azure', gCo2PerKwh: 207, source: 'Ember 2023 - UK', year: 2023 },
  { region: 'francecentral', regionName: 'France Central', provider: 'azure', gCo2PerKwh: 56, source: 'Ember 2023 - France', year: 2023 },
  { region: 'germanywestcentral', regionName: 'Germany West Central', provider: 'azure', gCo2PerKwh: 311, source: 'Ember 2023 - Germany', year: 2023 },
  { region: 'swedencentral', regionName: 'Sweden Central', provider: 'azure', gCo2PerKwh: 28, source: 'Ember 2023 - Sweden', year: 2023 },
  
  // Country-level defaults
  { region: 'US', regionName: 'United States Average', gCo2PerKwh: 376, source: 'EPA eGRID 2022 - National Average', year: 2022 },
  { region: 'EU', regionName: 'European Union Average', gCo2PerKwh: 231, source: 'Ember 2023 - EU27', year: 2023 },
  { region: 'CN', regionName: 'China', gCo2PerKwh: 544, source: 'Ember 2023 - China', year: 2023 },
  { region: 'IN', regionName: 'India', gCo2PerKwh: 632, source: 'Ember 2023 - India', year: 2023 },
  { region: 'JP', regionName: 'Japan', gCo2PerKwh: 465, source: 'Ember 2023 - Japan', year: 2023 },
  { region: 'global', regionName: 'Global Average', gCo2PerKwh: 436, source: 'IEA 2023 - World Average', year: 2023 },
];

export function getGridIntensity(
  region: string,
  provider?: 'aws' | 'gcp' | 'azure'
): { gCo2PerKwh: number; source: string; region: string; regionName: string; isDefault: boolean } {
  const normalizedRegion = region.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  // Try exact match with provider
  if (provider) {
    const exactMatch = GRID_INTENSITY_DATA.find(
      d => d.region.toLowerCase() === normalizedRegion && d.provider === provider
    );
    if (exactMatch) {
      return { ...exactMatch, isDefault: false };
    }
  }
  
  // Try region match without provider
  const regionMatch = GRID_INTENSITY_DATA.find(
    d => d.region.toLowerCase() === normalizedRegion
  );
  if (regionMatch) {
    return { ...regionMatch, isDefault: false };
  }
  
  // Try partial match
  const partialMatch = GRID_INTENSITY_DATA.find(
    d => d.region.toLowerCase().includes(normalizedRegion) || 
         normalizedRegion.includes(d.region.toLowerCase())
  );
  if (partialMatch) {
    return { ...partialMatch, isDefault: true };
  }
  
  // Return global default
  const globalDefault = GRID_INTENSITY_DATA.find(d => d.region === 'global')!;
  return { ...globalDefault, isDefault: true };
}

// ============================================
// PUE (Power Usage Effectiveness) Data
// Sources: Provider sustainability reports, Uptime Institute
// ============================================

interface PUEEntry {
  provider: string;
  region?: string;
  pue: number;
  source: string;
  year: number;
}

const PUE_DATA: PUEEntry[] = [
  // Provider-specific averages from sustainability reports
  { provider: 'aws', pue: 1.135, source: 'AWS Sustainability Report 2023', year: 2023 },
  { provider: 'gcp', pue: 1.10, source: 'Google Environmental Report 2023', year: 2023 },
  { provider: 'azure', pue: 1.18, source: 'Microsoft Sustainability Report 2023', year: 2023 },
  
  // Region-specific where known
  { provider: 'gcp', region: 'europe-north1', pue: 1.08, source: 'Google - Hamina Finland DC', year: 2023 },
  { provider: 'gcp', region: 'us-west1', pue: 1.10, source: 'Google - The Dalles Oregon DC', year: 2023 },
  { provider: 'aws', region: 'eu-north-1', pue: 1.09, source: 'AWS - Stockholm (estimated)', year: 2023 },
  
  // Industry defaults
  { provider: 'on_prem', pue: 1.58, source: 'Uptime Institute 2023 Global Average', year: 2023 },
  { provider: 'colocation', pue: 1.45, source: 'Uptime Institute 2023 - Colocation Average', year: 2023 },
  { provider: 'default', pue: 1.58, source: 'Uptime Institute 2023 Global Average', year: 2023 },
];

export function getRegionalPUE(
  region: string,
  provider: 'aws' | 'gcp' | 'azure' | 'on_prem' | 'unknown'
): { pue: number; source: string; isDefault: boolean } {
  const normalizedRegion = region.toLowerCase();
  const normalizedProvider = provider.toLowerCase();
  
  // Try exact region + provider match
  const exactMatch = PUE_DATA.find(
    d => d.region?.toLowerCase() === normalizedRegion && 
         d.provider.toLowerCase() === normalizedProvider
  );
  if (exactMatch) {
    return { pue: exactMatch.pue, source: exactMatch.source, isDefault: false };
  }
  
  // Try provider default
  const providerMatch = PUE_DATA.find(
    d => d.provider.toLowerCase() === normalizedProvider && !d.region
  );
  if (providerMatch) {
    return { pue: providerMatch.pue, source: providerMatch.source, isDefault: false };
  }
  
  // Return industry default
  const defaultEntry = PUE_DATA.find(d => d.provider === 'default')!;
  return { pue: defaultEntry.pue, source: defaultEntry.source, isDefault: true };
}

// ============================================
// Instance Power Consumption Data
// Sources: Manufacturer specs, cloud carbon footprint project
// ============================================

interface InstancePowerEntry {
  instanceType: string;
  provider: 'aws' | 'gcp' | 'azure';
  tdpWatts: number;
  typicalWatts: number;
  source: string;
  gpuModel?: string;
  gpuTdpWatts?: number;
  gpuCount?: number;
}

const INSTANCE_POWER_DATA: InstancePowerEntry[] = [
  // AWS GPU Instances
  { instanceType: 'p4d.24xlarge', provider: 'aws', tdpWatts: 5200, typicalWatts: 3900, source: 'NVIDIA A100 TDP + Intel Cascade Lake', gpuModel: 'A100-40GB', gpuTdpWatts: 400, gpuCount: 8 },
  { instanceType: 'p4de.24xlarge', provider: 'aws', tdpWatts: 5600, typicalWatts: 4200, source: 'NVIDIA A100 80GB TDP + Intel Ice Lake', gpuModel: 'A100-80GB', gpuTdpWatts: 400, gpuCount: 8 },
  { instanceType: 'p3.2xlarge', provider: 'aws', tdpWatts: 450, typicalWatts: 340, source: 'NVIDIA V100 TDP + Intel Xeon', gpuModel: 'V100', gpuTdpWatts: 300, gpuCount: 1 },
  { instanceType: 'p3.8xlarge', provider: 'aws', tdpWatts: 1600, typicalWatts: 1200, source: 'NVIDIA V100 TDP + Intel Xeon', gpuModel: 'V100', gpuTdpWatts: 300, gpuCount: 4 },
  { instanceType: 'p3.16xlarge', provider: 'aws', tdpWatts: 3000, typicalWatts: 2250, source: 'NVIDIA V100 TDP + Intel Xeon', gpuModel: 'V100', gpuTdpWatts: 300, gpuCount: 8 },
  { instanceType: 'g5.xlarge', provider: 'aws', tdpWatts: 350, typicalWatts: 265, source: 'NVIDIA A10G TDP + AMD EPYC', gpuModel: 'A10G', gpuTdpWatts: 150, gpuCount: 1 },
  { instanceType: 'g5.2xlarge', provider: 'aws', tdpWatts: 400, typicalWatts: 300, source: 'NVIDIA A10G TDP + AMD EPYC', gpuModel: 'A10G', gpuTdpWatts: 150, gpuCount: 1 },
  { instanceType: 'g5.4xlarge', provider: 'aws', tdpWatts: 450, typicalWatts: 340, source: 'NVIDIA A10G TDP + AMD EPYC', gpuModel: 'A10G', gpuTdpWatts: 150, gpuCount: 1 },
  { instanceType: 'g5.12xlarge', provider: 'aws', tdpWatts: 1100, typicalWatts: 825, source: 'NVIDIA A10G TDP + AMD EPYC', gpuModel: 'A10G', gpuTdpWatts: 150, gpuCount: 4 },
  { instanceType: 'g4dn.xlarge', provider: 'aws', tdpWatts: 200, typicalWatts: 150, source: 'NVIDIA T4 TDP + Intel Cascade Lake', gpuModel: 'T4', gpuTdpWatts: 70, gpuCount: 1 },
  { instanceType: 'g4dn.2xlarge', provider: 'aws', tdpWatts: 220, typicalWatts: 165, source: 'NVIDIA T4 TDP + Intel Cascade Lake', gpuModel: 'T4', gpuTdpWatts: 70, gpuCount: 1 },
  { instanceType: 'g4dn.4xlarge', provider: 'aws', tdpWatts: 280, typicalWatts: 210, source: 'NVIDIA T4 TDP + Intel Cascade Lake', gpuModel: 'T4', gpuTdpWatts: 70, gpuCount: 1 },
  { instanceType: 'g4dn.12xlarge', provider: 'aws', tdpWatts: 700, typicalWatts: 525, source: 'NVIDIA T4 TDP + Intel Cascade Lake', gpuModel: 'T4', gpuTdpWatts: 70, gpuCount: 4 },
  { instanceType: 'inf1.xlarge', provider: 'aws', tdpWatts: 150, typicalWatts: 115, source: 'AWS Inferentia TDP estimate', gpuModel: 'Inferentia', gpuTdpWatts: 75, gpuCount: 1 },
  { instanceType: 'inf2.xlarge', provider: 'aws', tdpWatts: 180, typicalWatts: 135, source: 'AWS Inferentia2 TDP estimate', gpuModel: 'Inferentia2', gpuTdpWatts: 90, gpuCount: 1 },
  { instanceType: 'trn1.2xlarge', provider: 'aws', tdpWatts: 280, typicalWatts: 210, source: 'AWS Trainium TDP estimate', gpuModel: 'Trainium', gpuTdpWatts: 150, gpuCount: 1 },
  { instanceType: 'trn1.32xlarge', provider: 'aws', tdpWatts: 3000, typicalWatts: 2250, source: 'AWS Trainium TDP estimate', gpuModel: 'Trainium', gpuTdpWatts: 150, gpuCount: 16 },
  
  // GCP GPU Instances
  { instanceType: 'a2-highgpu-1g', provider: 'gcp', tdpWatts: 600, typicalWatts: 450, source: 'NVIDIA A100 TDP + AMD EPYC', gpuModel: 'A100-40GB', gpuTdpWatts: 400, gpuCount: 1 },
  { instanceType: 'a2-highgpu-8g', provider: 'gcp', tdpWatts: 4000, typicalWatts: 3000, source: 'NVIDIA A100 TDP + AMD EPYC', gpuModel: 'A100-40GB', gpuTdpWatts: 400, gpuCount: 8 },
  { instanceType: 'a2-megagpu-16g', provider: 'gcp', tdpWatts: 7500, typicalWatts: 5625, source: 'NVIDIA A100 TDP + AMD EPYC', gpuModel: 'A100-40GB', gpuTdpWatts: 400, gpuCount: 16 },
  { instanceType: 'g2-standard-4', provider: 'gcp', tdpWatts: 350, typicalWatts: 265, source: 'NVIDIA L4 TDP + Intel Cascade Lake', gpuModel: 'L4', gpuTdpWatts: 72, gpuCount: 1 },
  { instanceType: 'n1-standard-4-nvidia-t4-1', provider: 'gcp', tdpWatts: 200, typicalWatts: 150, source: 'NVIDIA T4 TDP + Intel Skylake', gpuModel: 'T4', gpuTdpWatts: 70, gpuCount: 1 },
  
  // Azure GPU Instances
  { instanceType: 'standard_nc6s_v3', provider: 'azure', tdpWatts: 450, typicalWatts: 340, source: 'NVIDIA V100 TDP + Intel Xeon', gpuModel: 'V100', gpuTdpWatts: 300, gpuCount: 1 },
  { instanceType: 'standard_nc24s_v3', provider: 'azure', tdpWatts: 1600, typicalWatts: 1200, source: 'NVIDIA V100 TDP + Intel Xeon', gpuModel: 'V100', gpuTdpWatts: 300, gpuCount: 4 },
  { instanceType: 'standard_nd96asr_v4', provider: 'azure', tdpWatts: 5200, typicalWatts: 3900, source: 'NVIDIA A100 TDP + AMD EPYC', gpuModel: 'A100-80GB', gpuTdpWatts: 400, gpuCount: 8 },
  { instanceType: 'standard_nc4as_t4_v3', provider: 'azure', tdpWatts: 180, typicalWatts: 135, source: 'NVIDIA T4 TDP + AMD EPYC', gpuModel: 'T4', gpuTdpWatts: 70, gpuCount: 1 },
];

export function getInstancePower(
  instanceType: string,
  provider: 'aws' | 'gcp' | 'azure'
): InstancePowerEntry | null {
  const normalizedType = instanceType.toLowerCase().replace(/[^a-z0-9.-]/g, '');
  
  const match = INSTANCE_POWER_DATA.find(
    d => d.instanceType.toLowerCase().replace(/[^a-z0-9.-]/g, '') === normalizedType &&
         d.provider === provider
  );
  
  return match || null;
}

// ============================================
// All Reference Data Export
// ============================================

export function getAllGridIntensityData(): GridIntensityEntry[] {
  return [...GRID_INTENSITY_DATA];
}

export function getAllPUEData(): PUEEntry[] {
  return [...PUE_DATA];
}

export function getAllInstancePowerData(): InstancePowerEntry[] {
  return [...INSTANCE_POWER_DATA];
}
