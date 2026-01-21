// ============================================
// HELIOS ENERGY - Report Generator
// Executive-ready, CFO/ESG-safe reports
// ============================================

import { v4 as uuidv4 } from 'uuid';
import type { 
  Report, 
  ReportSection, 
  MethodologySection,
  NormalizedWorkload,
  CostEnergySummary,
  Scenario
} from '@/types';
import { generateConfidenceStatement } from '../calculations/confidence';
import { 
  getEnergyAnalogies, 
  getCarbonAnalogies, 
  formatAnalogy,
  getSustainabilityScore 
} from '../utils/sustainability-analogies';

export interface ReportInput {
  workloads: NormalizedWorkload[];
  summary: CostEnergySummary;
  scenarios?: Scenario[];
  dateRange: { start: string; end: string };
  organizationName?: string;
}

/**
 * Generate an executive summary report
 */
export function generateExecutiveSummary(input: ReportInput): Report {
  const { workloads, summary, scenarios, dateRange, organizationName } = input;
  
  const sections: ReportSection[] = [
    generateOverviewSection(summary, dateRange, organizationName),
    generateCostSection(summary, workloads),
    generateEnergySection(summary, workloads),
    generateCarbonSection(summary, workloads),
    generateRecommendationsSection(workloads, scenarios),
  ];
  
  const methodology = generateMethodology(workloads);
  const confidenceStatement = generateConfidenceStatement({
    score: summary.averageConfidence,
    level: summary.averageConfidence >= 80 ? 'high' : 
           summary.averageConfidence >= 60 ? 'medium' : 
           summary.averageConfidence >= 40 ? 'low' : 'unverified',
    factors: [],
    summary: '',
  });
  
  return {
    id: uuidv4(),
    name: `Executive Summary - ${new Date().toLocaleDateString()}`,
    type: 'executive_summary',
    createdAt: new Date().toISOString(),
    sections,
    methodology,
    confidenceStatement,
    exportFormats: ['pdf', 'csv'],
  };
}

function generateOverviewSection(
  summary: CostEnergySummary,
  dateRange: { start: string; end: string },
  organizationName?: string
): ReportSection {
  const org = organizationName || 'Your Organization';
  
  // Get sustainability analogies
  const energyAnalogies = getEnergyAnalogies(summary.totalEnergyKwh);
  const carbonAnalogies = getCarbonAnalogies(summary.totalCarbonKgCo2e);
  
  // Calculate sustainability score
  const carbonPerDollar = summary.totalCostUsd > 0 
    ? summary.totalCarbonKgCo2e / summary.totalCostUsd 
    : 0;
  const avgGridIntensity = summary.totalEnergyKwh > 0
    ? (summary.totalCarbonKgCo2e * 1000) / summary.totalEnergyKwh
    : 436;
  const sustainabilityScore = getSustainabilityScore({
    carbonKgPerDollar: carbonPerDollar,
    avgGridIntensity,
  });

  // Format analogies for display
  const energyAnalogyText = energyAnalogies.length > 0 
    ? `\n**What This Means:**\n${energyAnalogies.map(a => `- ${formatAnalogy(a)}`).join('\n')}`
    : '';
  const carbonAnalogyText = carbonAnalogies.length > 0
    ? `\n${carbonAnalogies.map(a => `- ${formatAnalogy(a)}`).join('\n')}`
    : '';
  
  return {
    title: 'Executive Overview',
    content: `
This report provides a comprehensive analysis of ${org}'s AI and data infrastructure 
costs, energy consumption, and carbon emissions for the period ${dateRange.start} to ${dateRange.end}.

**Sustainability Score: ${sustainabilityScore.score}/100 (${sustainabilityScore.grade})**
${sustainabilityScore.description}

**Key Metrics:**
- Total Infrastructure Cost: $${summary.totalCostUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
- Total Energy Consumption: ${summary.totalEnergyKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh
- Total Carbon Emissions: ${(summary.totalCarbonKgCo2e / 1000).toFixed(2)} metric tons CO₂e
- Carbon Efficiency: ${carbonPerDollar.toFixed(3)} kgCO₂e per dollar spent
${energyAnalogyText}${carbonAnalogyText}

**Data Quality:**
- Average Confidence Score: ${summary.averageConfidence.toFixed(0)}%
- Data Completeness: ${(summary.dataCompleteness * 100).toFixed(0)}%
    `.trim(),
    confidenceNote: `This analysis is based on ${summary.dataCompleteness >= 0.9 ? 'comprehensive' : 'partial'} data coverage.`,
  };
}

function generateCostSection(
  summary: CostEnergySummary,
  workloads: NormalizedWorkload[]
): ReportSection {
  const byWorkloadType = Object.entries(summary.byWorkloadType)
    .sort((a, b) => b[1].cost - a[1].cost)
    .slice(0, 5);
  
  const topWorkloads = [...workloads]
    .sort((a, b) => b.costUsd - a.costUsd)
    .slice(0, 5);
  
  let content = `
**Cost Distribution by Workload Type:**
${byWorkloadType.map(([type, data]) => 
  `- ${capitalizeFirst(type)}: $${data.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${((data.cost / summary.totalCostUsd) * 100).toFixed(1)}%)`
).join('\n')}

**Top 5 Cost Drivers:**
${topWorkloads.map((w, i) => 
  `${i + 1}. ${w.workloadName}: $${w.costUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
).join('\n')}
  `.trim();
  
  return {
    title: 'Cost Analysis',
    content,
    charts: [{
      type: 'bar',
      title: 'Cost by Workload Type',
      data: byWorkloadType.map(([type, data]) => ({ name: type, cost: data.cost })),
      xKey: 'name',
      yKeys: ['cost'],
    }],
  };
}

function generateEnergySection(
  summary: CostEnergySummary,
  workloads: NormalizedWorkload[]
): ReportSection {
  const byResourceType = Object.entries(summary.byResourceType)
    .sort((a, b) => b[1].energy - a[1].energy);
  
  const gpuWorkloads = workloads.filter(w => w.resourceType === 'gpu');
  const gpuEnergy = gpuWorkloads.reduce((sum, w) => sum + w.energyKwh, 0);
  
  return {
    title: 'Energy Consumption',
    content: `
**Energy by Resource Type:**
${byResourceType.map(([type, data]) => 
  `- ${type.toUpperCase()}: ${data.energy.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh (${((data.energy / summary.totalEnergyKwh) * 100).toFixed(1)}%)`
).join('\n')}

**GPU Workload Analysis:**
- GPU workloads consume ${gpuEnergy.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh (${((gpuEnergy / summary.totalEnergyKwh) * 100).toFixed(1)}% of total)
- ${gpuWorkloads.length} workloads utilize GPU resources

**Calculation Methodology:**
Energy consumption is calculated using the formula:
Energy (kWh) = (Runtime Hours × Power Draw × PUE) / 1000

Power draw values are sourced from manufacturer specifications or customer-provided measurements.
PUE values are based on cloud provider sustainability reports.
    `.trim(),
  };
}

function generateCarbonSection(
  summary: CostEnergySummary,
  workloads: NormalizedWorkload[]
): ReportSection {
  const byRegion = Object.entries(summary.byRegion)
    .sort((a, b) => b[1].carbon - a[1].carbon)
    .slice(0, 5);
  
  // Calculate carbon intensity efficiency
  const avgCarbonIntensity = workloads.length > 0
    ? workloads.reduce((sum, w) => sum + (w.carbonCalculation?.gridIntensityGCo2PerKwh || 0), 0) / workloads.length
    : 0;
  
  return {
    title: 'Carbon Emissions',
    content: `
**Carbon Emissions by Region:**
${byRegion.map(([region, data]) => 
  `- ${region}: ${data.carbon.toLocaleString(undefined, { maximumFractionDigits: 0 })} kgCO₂e`
).join('\n')}

**Grid Carbon Intensity:**
- Weighted Average: ${avgCarbonIntensity.toFixed(0)} gCO₂/kWh
- Global Average (reference): 436 gCO₂/kWh

**Calculation Methodology:**
Carbon emissions are calculated using the formula:
Carbon (kgCO₂e) = Energy (kWh) × Grid Intensity (gCO₂/kWh) / 1000

Grid intensity data is sourced from EPA eGRID (US), Ember (Europe), and IEA (global).
    `.trim(),
    charts: [{
      type: 'bar',
      title: 'Carbon by Region',
      data: byRegion.map(([region, data]) => ({ name: region, carbon: data.carbon })),
      xKey: 'name',
      yKeys: ['carbon'],
    }],
  };
}

function generateRecommendationsSection(
  workloads: NormalizedWorkload[],
  scenarios?: Scenario[]
): ReportSection {
  const recommendations: string[] = [];
  
  // Analyze for low-utilization workloads
  const lowUtilization = workloads.filter(w => 
    w.workloadType === 'training' && w.runtimeHours < 1
  );
  if (lowUtilization.length > 0) {
    recommendations.push(
      `Consider consolidating ${lowUtilization.length} short-running training jobs to improve efficiency.`
    );
  }
  
  // Analyze for high-carbon regions
  const highCarbonWorkloads = workloads.filter(w => 
    w.carbonCalculation && w.carbonCalculation.gridIntensityGCo2PerKwh > 400
  );
  if (highCarbonWorkloads.length > 0) {
    const potentialReduction = highCarbonWorkloads.reduce((sum, w) => {
      const currentCarbon = w.carbonKgCo2e;
      const potentialCarbon = w.energyKwh * 100 / 1000; // If moved to low-carbon region
      return sum + (currentCarbon - potentialCarbon);
    }, 0);
    
    recommendations.push(
      `Migrating ${highCarbonWorkloads.length} workloads from high-carbon regions could reduce emissions by up to ${potentialReduction.toFixed(0)} kgCO₂e.`
    );
  }
  
  // Include scenario recommendations
  if (scenarios && scenarios.length > 0) {
    for (const scenario of scenarios.slice(0, 3)) {
      if (scenario.results) {
        const { delta } = scenario.results;
        if (delta.costPercent < -5 || delta.carbonPercent < -10) {
          recommendations.push(
            `${scenario.name}: Potential ${Math.abs(delta.costPercent).toFixed(0)}% cost reduction and ${Math.abs(delta.carbonPercent).toFixed(0)}% carbon reduction.`
          );
        }
      }
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Current infrastructure appears well-optimized. Continue monitoring for optimization opportunities.');
  }
  
  return {
    title: 'Recommendations',
    content: `
**Optimization Opportunities:**
${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

**Next Steps:**
1. Review detailed workload analysis for specific optimization targets
2. Validate recommendations with engineering teams
3. Create implementation plan for approved optimizations
4. Monitor impact and adjust as needed
    `.trim(),
  };
}

function generateMethodology(workloads: NormalizedWorkload[]): MethodologySection {
  const costSources = new Set(workloads.map(w => w.costSource));
  const energySources = new Set(workloads.map(w => w.energySource));
  
  return {
    energyCalculation: `
Energy consumption is calculated using the formula:
Energy (kWh) = (Runtime Hours × Power Draw (W) × PUE) / 1000

Where:
- Runtime Hours: Actual runtime from billing/usage data
- Power Draw: From manufacturer TDP specifications or customer measurements
- PUE (Power Usage Effectiveness): From cloud provider sustainability reports
    `.trim(),
    carbonCalculation: `
Carbon emissions are calculated using the formula:
Carbon (kgCO₂e) = Energy (kWh) × Grid Intensity (gCO₂/kWh) / 1000

Grid intensity data sources:
- United States: EPA eGRID 2022
- Europe: Ember 2023
- Asia Pacific: Ember 2023
- Global: IEA 2023
    `.trim(),
    dataSourcesUsed: [
      ...Array.from(costSources).map(s => `Cost data: ${s}`),
      ...Array.from(energySources).map(s => `Energy data: ${s}`),
      'Grid intensity: EPA eGRID, Ember, IEA',
      'PUE: Cloud provider sustainability reports',
    ],
    assumptionsSummary: `
All assumptions used in this analysis are documented and available for review.
Default values are sourced from reputable industry references and can be overridden with customer-specific data.
Confidence scores reflect the quality and source of input data.
    `.trim(),
    limitations: [
      'Historical data may not reflect current infrastructure state',
      'Power consumption estimates are based on typical workload profiles',
      'Grid intensity varies by time of day (not modeled)',
      'Scope 3 emissions from hardware manufacturing not included',
    ],
  };
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate detailed analysis report
 */
export function generateDetailedAnalysis(input: ReportInput): Report {
  const { workloads, summary, dateRange } = input;
  
  const sections: ReportSection[] = [
    generateOverviewSection(summary, dateRange),
    {
      title: 'Detailed Workload Analysis',
      content: `
This section provides granular analysis of ${workloads.length} workloads.

**Workload Distribution:**
- Training workloads: ${workloads.filter(w => w.workloadType === 'training').length}
- Inference workloads: ${workloads.filter(w => w.workloadType === 'inference').length}
- Batch workloads: ${workloads.filter(w => w.workloadType === 'batch').length}
- Interactive workloads: ${workloads.filter(w => w.workloadType === 'interactive').length}
- Warehouse workloads: ${workloads.filter(w => w.workloadType === 'warehouse').length}
      `.trim(),
      tables: [{
        title: 'Top 10 Workloads by Cost',
        headers: ['Workload', 'Type', 'Cost', 'Energy', 'Carbon', 'Confidence'],
        rows: [...workloads]
          .sort((a, b) => b.costUsd - a.costUsd)
          .slice(0, 10)
          .map(w => [
            w.workloadName,
            w.workloadType,
            `$${w.costUsd.toFixed(2)}`,
            `${w.energyKwh.toFixed(2)} kWh`,
            `${w.carbonKgCo2e.toFixed(2)} kg`,
            `${w.confidenceScore.toFixed(0)}%`,
          ]),
      }],
    },
    generateCostSection(summary, workloads),
    generateEnergySection(summary, workloads),
    generateCarbonSection(summary, workloads),
  ];
  
  const methodology = generateMethodology(workloads);
  const confidenceStatement = generateConfidenceStatement({
    score: summary.averageConfidence,
    level: summary.averageConfidence >= 80 ? 'high' : 
           summary.averageConfidence >= 60 ? 'medium' : 
           summary.averageConfidence >= 40 ? 'low' : 'unverified',
    factors: [],
    summary: '',
  });
  
  return {
    id: uuidv4(),
    name: `Detailed Analysis - ${new Date().toLocaleDateString()}`,
    type: 'detailed_analysis',
    createdAt: new Date().toISOString(),
    sections,
    methodology,
    confidenceStatement,
    exportFormats: ['pdf', 'csv', 'json'],
  };
}

/**
 * Export report to CSV format
 */
export function exportReportToCSV(report: Report): string {
  const lines: string[] = [];
  
  lines.push(`"Report Name","${report.name}"`);
  lines.push(`"Generated","${report.createdAt}"`);
  lines.push(`"Type","${report.type}"`);
  lines.push('');
  
  for (const section of report.sections) {
    lines.push(`"${section.title}"`);
    lines.push(`"${section.content.replace(/"/g, '""')}"`);
    lines.push('');
    
    if (section.tables) {
      for (const table of section.tables) {
        lines.push(`"${table.title}"`);
        lines.push(table.headers.map(h => `"${h}"`).join(','));
        for (const row of table.rows) {
          lines.push(row.map(cell => `"${cell}"`).join(','));
        }
        lines.push('');
      }
    }
  }
  
  lines.push('"Methodology"');
  lines.push(`"Energy Calculation","${report.methodology.energyCalculation.replace(/"/g, '""')}"`);
  lines.push(`"Carbon Calculation","${report.methodology.carbonCalculation.replace(/"/g, '""')}"`);
  lines.push('');
  lines.push(`"Confidence Statement","${report.confidenceStatement.replace(/"/g, '""')}"`);
  
  return lines.join('\n');
}
