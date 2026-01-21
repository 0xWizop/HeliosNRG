// ============================================
// HELIOS ENERGY - Confidence Scoring Module
// Enterprise-grade confidence and uncertainty quantification
// ============================================

import type { ConfidenceFactor, ConfidenceLevel, NormalizedWorkload } from '@/types';

export interface ConfidenceScore {
  score: number; // 0-100
  level: ConfidenceLevel;
  factors: ConfidenceFactor[];
  summary: string;
}

/**
 * Calculate overall confidence score from multiple factors
 * Base confidence starts at 50 and is adjusted by factors
 */
export function calculateConfidenceScore(factors: ConfidenceFactor[]): ConfidenceScore {
  const BASE_CONFIDENCE = 50;
  
  // Sum all factor impacts
  const totalImpact = factors.reduce((sum, f) => sum + f.impact, 0);
  
  // Calculate final score, clamped between 0-100
  const rawScore = BASE_CONFIDENCE + totalImpact;
  const score = Math.max(0, Math.min(100, rawScore));
  
  // Determine level
  let level: ConfidenceLevel;
  if (score >= 80) {
    level = 'high';
  } else if (score >= 60) {
    level = 'medium';
  } else if (score >= 40) {
    level = 'low';
  } else {
    level = 'unverified';
  }
  
  // Generate summary
  const summary = generateConfidenceSummary(score, level, factors);
  
  return { score, level, factors, summary };
}

/**
 * Generate human-readable confidence summary
 */
function generateConfidenceSummary(
  score: number,
  level: ConfidenceLevel,
  factors: ConfidenceFactor[]
): string {
  const positiveFactors = factors.filter(f => f.impact > 0);
  const negativeFactors = factors.filter(f => f.impact < 0);
  
  let summary = `Confidence: ${score.toFixed(0)}% (${level}). `;
  
  if (positiveFactors.length > 0) {
    const topPositive = positiveFactors
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 2)
      .map(f => f.reason)
      .join('; ');
    summary += `Strengths: ${topPositive}. `;
  }
  
  if (negativeFactors.length > 0) {
    const topNegative = negativeFactors
      .sort((a, b) => a.impact - b.impact)
      .slice(0, 2)
      .map(f => f.reason)
      .join('; ');
    summary += `Limitations: ${topNegative}.`;
  }
  
  return summary;
}

/**
 * Calculate confidence for a dataset based on its characteristics
 */
export function calculateDatasetConfidence(params: {
  hasExactBilling: boolean;
  hasMeasuredPower: boolean;
  hasKnownRegion: boolean;
  hasKnownInstanceTypes: boolean;
  dataCompleteness: number; // 0-1
  rowCount: number;
  validationWarnings: number;
  validationErrors: number;
}): ConfidenceScore {
  const factors: ConfidenceFactor[] = [];
  
  // Billing data
  if (params.hasExactBilling) {
    factors.push({
      factor: 'billing_data',
      impact: 15,
      reason: 'Exact billing data available',
    });
  } else {
    factors.push({
      factor: 'billing_data',
      impact: -10,
      reason: 'No billing data - costs estimated',
    });
  }
  
  // Power measurement
  if (params.hasMeasuredPower) {
    factors.push({
      factor: 'power_measurement',
      impact: 10,
      reason: 'Measured power data available',
    });
  }
  
  // Region data
  if (params.hasKnownRegion) {
    factors.push({
      factor: 'region_data',
      impact: 8,
      reason: 'Region-specific grid intensity used',
    });
  } else {
    factors.push({
      factor: 'region_data',
      impact: -8,
      reason: 'Unknown region - using global averages',
    });
  }
  
  // Instance type recognition
  if (params.hasKnownInstanceTypes) {
    factors.push({
      factor: 'instance_types',
      impact: 5,
      reason: 'Instance types recognized',
    });
  }
  
  // Data completeness
  const completenessImpact = (params.dataCompleteness - 0.5) * 20;
  factors.push({
    factor: 'data_completeness',
    impact: completenessImpact,
    reason: `Data completeness: ${(params.dataCompleteness * 100).toFixed(0)}%`,
  });
  
  // Sample size
  if (params.rowCount >= 1000) {
    factors.push({
      factor: 'sample_size',
      impact: 5,
      reason: 'Large sample size improves statistical reliability',
    });
  } else if (params.rowCount < 100) {
    factors.push({
      factor: 'sample_size',
      impact: -5,
      reason: 'Small sample size limits reliability',
    });
  }
  
  // Validation issues
  if (params.validationErrors > 0) {
    factors.push({
      factor: 'validation_errors',
      impact: -15,
      reason: `${params.validationErrors} validation error(s) detected`,
    });
  }
  
  if (params.validationWarnings > 0) {
    factors.push({
      factor: 'validation_warnings',
      impact: -5,
      reason: `${params.validationWarnings} validation warning(s)`,
    });
  }
  
  return calculateConfidenceScore(factors);
}

/**
 * Aggregate confidence across multiple workloads
 */
export function aggregateConfidence(workloads: NormalizedWorkload[]): ConfidenceScore {
  if (workloads.length === 0) {
    return {
      score: 0,
      level: 'unverified',
      factors: [],
      summary: 'No data available',
    };
  }
  
  // Weighted average by cost (higher cost workloads have more impact)
  const totalCost = workloads.reduce((sum, w) => sum + w.costUsd, 0);
  
  let weightedScore: number;
  if (totalCost > 0) {
    weightedScore = workloads.reduce((sum, w) => {
      const weight = w.costUsd / totalCost;
      return sum + w.confidenceScore * weight;
    }, 0);
  } else {
    // Simple average if no cost data
    weightedScore = workloads.reduce((sum, w) => sum + w.confidenceScore, 0) / workloads.length;
  }
  
  // Aggregate unique factors
  const factorMap = new Map<string, ConfidenceFactor>();
  for (const workload of workloads) {
    for (const factor of workload.confidenceFactors) {
      const existing = factorMap.get(factor.factor);
      if (!existing || Math.abs(factor.impact) > Math.abs(existing.impact)) {
        factorMap.set(factor.factor, factor);
      }
    }
  }
  
  const factors = Array.from(factorMap.values());
  const score = Math.max(0, Math.min(100, weightedScore));
  
  let level: ConfidenceLevel;
  if (score >= 80) level = 'high';
  else if (score >= 60) level = 'medium';
  else if (score >= 40) level = 'low';
  else level = 'unverified';
  
  return {
    score,
    level,
    factors,
    summary: generateConfidenceSummary(score, level, factors),
  };
}

/**
 * Generate enterprise-safe confidence statement for reports
 */
export function generateConfidenceStatement(score: ConfidenceScore): string {
  const { level, score: numScore } = score;
  
  switch (level) {
    case 'high':
      return `This analysis is based on verified first-party data with a confidence level of ${numScore.toFixed(0)}%. ` +
        'The calculations use exact billing records and measured or well-documented power consumption data. ' +
        'Results are suitable for executive decision-making and financial planning.';
    
    case 'medium':
      return `This analysis has a confidence level of ${numScore.toFixed(0)}%. ` +
        'While based on customer-provided data, some values rely on industry reference data rather than direct measurements. ' +
        'Results are suitable for planning purposes but should be validated before major commitments.';
    
    case 'low':
      return `This analysis has a confidence level of ${numScore.toFixed(0)}% and should be treated as directional. ` +
        'Several key inputs are estimated due to incomplete data. ' +
        'We recommend improving data quality before making significant decisions based on these results.';
    
    case 'unverified':
      return `This analysis has a low confidence level of ${numScore.toFixed(0)}% due to significant data gaps. ` +
        'Results should be considered preliminary estimates only. ' +
        'Please provide additional data sources to improve accuracy.';
  }
}

/**
 * Get confidence color for UI display
 */
export function getConfidenceColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high': return 'text-green-600 bg-green-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'low': return 'text-orange-600 bg-orange-50';
    case 'unverified': return 'text-red-600 bg-red-50';
  }
}
