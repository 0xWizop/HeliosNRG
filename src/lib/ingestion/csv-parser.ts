// ============================================
// HELIOS ENERGY - CSV Ingestion Module
// Schema detection, validation, and normalization
// ============================================

import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import type { 
  DataSourceType, 
  RawDataset, 
  ValidationMessage, 
  NormalizedWorkload 
} from '@/types';
import { calculateEnergy } from '../calculations/energy';
import { calculateCarbon } from '../calculations/carbon';
import { calculateCost } from '../calculations/cost';
import { calculateConfidenceScore } from '../calculations/confidence';

// ============================================
// Schema Definitions for Supported Data Sources
// ============================================

interface ColumnSchema {
  name: string;
  aliases: string[];
  required: boolean;
  type: 'string' | 'number' | 'date' | 'boolean';
}

interface DataSourceSchema {
  type: DataSourceType;
  name: string;
  columns: ColumnSchema[];
  identifierColumns: string[]; // Columns that help identify this schema
}

const DATA_SOURCE_SCHEMAS: DataSourceSchema[] = [
  {
    type: 'aws_cur',
    name: 'AWS Cost & Usage Report',
    identifierColumns: ['lineItem/UsageAccountId', 'lineItem/ProductCode', 'lineItem/BlendedCost'],
    columns: [
      { name: 'lineItem/UsageAccountId', aliases: ['account_id', 'accountid'], required: true, type: 'string' },
      { name: 'lineItem/ProductCode', aliases: ['product_code', 'service'], required: true, type: 'string' },
      { name: 'lineItem/UsageType', aliases: ['usage_type'], required: false, type: 'string' },
      { name: 'lineItem/BlendedCost', aliases: ['cost', 'blended_cost'], required: true, type: 'number' },
      { name: 'lineItem/UnblendedCost', aliases: ['unblended_cost'], required: false, type: 'number' },
      { name: 'lineItem/UsageAmount', aliases: ['usage_amount', 'quantity'], required: false, type: 'number' },
      { name: 'lineItem/UsageStartDate', aliases: ['start_date', 'usage_start'], required: false, type: 'date' },
      { name: 'lineItem/UsageEndDate', aliases: ['end_date', 'usage_end'], required: false, type: 'date' },
      { name: 'product/instanceType', aliases: ['instance_type'], required: false, type: 'string' },
      { name: 'product/region', aliases: ['region'], required: false, type: 'string' },
      { name: 'resourceTags/user:Name', aliases: ['resource_name', 'name'], required: false, type: 'string' },
    ],
  },
  {
    type: 'gcp_billing',
    name: 'GCP Billing Export',
    identifierColumns: ['billing_account_id', 'service.description', 'cost'],
    columns: [
      { name: 'billing_account_id', aliases: ['account_id'], required: true, type: 'string' },
      { name: 'service.description', aliases: ['service', 'service_description'], required: true, type: 'string' },
      { name: 'sku.description', aliases: ['sku', 'sku_description'], required: false, type: 'string' },
      { name: 'cost', aliases: ['total_cost'], required: true, type: 'number' },
      { name: 'usage.amount', aliases: ['usage_amount'], required: false, type: 'number' },
      { name: 'usage.unit', aliases: ['usage_unit'], required: false, type: 'string' },
      { name: 'usage_start_time', aliases: ['start_time'], required: false, type: 'date' },
      { name: 'usage_end_time', aliases: ['end_time'], required: false, type: 'date' },
      { name: 'location.region', aliases: ['region'], required: false, type: 'string' },
      { name: 'project.id', aliases: ['project_id'], required: false, type: 'string' },
    ],
  },
  {
    type: 'snowflake_query_history',
    name: 'Snowflake Query History',
    identifierColumns: ['QUERY_ID', 'WAREHOUSE_NAME', 'TOTAL_ELAPSED_TIME'],
    columns: [
      { name: 'QUERY_ID', aliases: ['query_id'], required: true, type: 'string' },
      { name: 'QUERY_TEXT', aliases: ['query_text', 'sql'], required: false, type: 'string' },
      { name: 'WAREHOUSE_NAME', aliases: ['warehouse_name', 'warehouse'], required: true, type: 'string' },
      { name: 'WAREHOUSE_SIZE', aliases: ['warehouse_size', 'size'], required: false, type: 'string' },
      { name: 'START_TIME', aliases: ['start_time'], required: true, type: 'date' },
      { name: 'END_TIME', aliases: ['end_time'], required: false, type: 'date' },
      { name: 'TOTAL_ELAPSED_TIME', aliases: ['elapsed_time', 'duration_ms'], required: true, type: 'number' },
      { name: 'CREDITS_USED_CLOUD_SERVICES', aliases: ['credits_used'], required: false, type: 'number' },
      { name: 'BYTES_SCANNED', aliases: ['bytes_scanned'], required: false, type: 'number' },
      { name: 'ROWS_PRODUCED', aliases: ['rows_produced'], required: false, type: 'number' },
      { name: 'USER_NAME', aliases: ['user_name', 'user'], required: false, type: 'string' },
    ],
  },
  {
    type: 'databricks_usage',
    name: 'Databricks Usage Logs',
    identifierColumns: ['workspace_id', 'sku_name', 'usage_quantity'],
    columns: [
      { name: 'workspace_id', aliases: ['workspace'], required: true, type: 'string' },
      { name: 'sku_name', aliases: ['sku', 'product'], required: true, type: 'string' },
      { name: 'usage_quantity', aliases: ['quantity', 'dbu'], required: true, type: 'number' },
      { name: 'usage_unit', aliases: ['unit'], required: false, type: 'string' },
      { name: 'usage_date', aliases: ['date'], required: true, type: 'date' },
      { name: 'usage_start_time', aliases: ['start_time'], required: false, type: 'date' },
      { name: 'usage_end_time', aliases: ['end_time'], required: false, type: 'date' },
      { name: 'cluster_id', aliases: ['cluster'], required: false, type: 'string' },
      { name: 'instance_pool_id', aliases: ['instance_pool'], required: false, type: 'string' },
      { name: 'node_type', aliases: ['instance_type'], required: false, type: 'string' },
    ],
  },
  {
    type: 'custom_ai_workload',
    name: 'Custom AI Workload',
    identifierColumns: ['workload_name', 'runtime_hours'],
    columns: [
      { name: 'workload_name', aliases: ['name', 'job_name', 'model_name'], required: true, type: 'string' },
      { name: 'workload_type', aliases: ['type', 'job_type'], required: false, type: 'string' },
      { name: 'runtime_hours', aliases: ['hours', 'duration_hours', 'runtime'], required: true, type: 'number' },
      { name: 'instance_type', aliases: ['instance', 'machine_type'], required: false, type: 'string' },
      { name: 'gpu_model', aliases: ['gpu', 'accelerator'], required: false, type: 'string' },
      { name: 'gpu_count', aliases: ['num_gpus', 'gpus'], required: false, type: 'number' },
      { name: 'cpu_cores', aliases: ['cpus', 'vcpus'], required: false, type: 'number' },
      { name: 'memory_gb', aliases: ['memory', 'ram_gb'], required: false, type: 'number' },
      { name: 'region', aliases: ['location', 'zone'], required: false, type: 'string' },
      { name: 'provider', aliases: ['cloud', 'platform'], required: false, type: 'string' },
      { name: 'cost_usd', aliases: ['cost', 'total_cost'], required: false, type: 'number' },
      { name: 'power_watts', aliases: ['power', 'wattage'], required: false, type: 'number' },
      { name: 'timestamp', aliases: ['date', 'start_time'], required: false, type: 'date' },
    ],
  },
];

// ============================================
// CSV Parsing and Schema Detection
// ============================================

export interface ParseResult {
  success: boolean;
  data: any[];
  columns: string[];
  rowCount: number;
  errors: string[];
}

export function parseCSV(csvContent: string): ParseResult {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  
  return {
    success: result.errors.length === 0,
    data: result.data as any[],
    columns: result.meta.fields || [],
    rowCount: result.data.length,
    errors: result.errors.map(e => `Row ${e.row}: ${e.message}`),
  };
}

export function detectSchema(columns: string[]): DataSourceType | null {
  const normalizedColumns = columns.map(c => c.toLowerCase().trim());
  
  let bestMatch: { type: DataSourceType; score: number } | null = null;
  
  for (const schema of DATA_SOURCE_SCHEMAS) {
    let score = 0;
    
    // Check for identifier columns
    for (const identifier of schema.identifierColumns) {
      const normalizedId = identifier.toLowerCase();
      if (normalizedColumns.some(c => c === normalizedId || c.includes(normalizedId))) {
        score += 3;
      }
    }
    
    // Check for other columns
    for (const col of schema.columns) {
      const normalizedName = col.name.toLowerCase();
      const allNames = [normalizedName, ...col.aliases.map(a => a.toLowerCase())];
      
      if (normalizedColumns.some(c => allNames.includes(c))) {
        score += col.required ? 2 : 1;
      }
    }
    
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { type: schema.type, score };
    }
  }
  
  // Require minimum score to be confident
  return bestMatch && bestMatch.score >= 5 ? bestMatch.type : null;
}

export function getSchemaForType(type: DataSourceType): DataSourceSchema | null {
  return DATA_SOURCE_SCHEMAS.find(s => s.type === type) || null;
}

// ============================================
// Column Mapping
// ============================================

export interface ColumnMapping {
  sourceColumn: string;
  targetColumn: string;
  confidence: number;
}

export function suggestColumnMapping(
  sourceColumns: string[],
  schemaType: DataSourceType
): ColumnMapping[] {
  const schema = getSchemaForType(schemaType);
  if (!schema) return [];
  
  const mappings: ColumnMapping[] = [];
  const normalizedSource = sourceColumns.map(c => c.toLowerCase().trim());
  
  for (const schemaCol of schema.columns) {
    const normalizedTarget = schemaCol.name.toLowerCase();
    const allTargets = [normalizedTarget, ...schemaCol.aliases.map(a => a.toLowerCase())];
    
    let bestMatch: { col: string; confidence: number } | null = null;
    
    for (let i = 0; i < normalizedSource.length; i++) {
      const sourceCol = normalizedSource[i];
      
      // Exact match
      if (allTargets.includes(sourceCol)) {
        bestMatch = { col: sourceColumns[i], confidence: 1.0 };
        break;
      }
      
      // Partial match
      for (const target of allTargets) {
        if (sourceCol.includes(target) || target.includes(sourceCol)) {
          const confidence = Math.min(sourceCol.length, target.length) / 
                           Math.max(sourceCol.length, target.length);
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { col: sourceColumns[i], confidence: confidence * 0.8 };
          }
        }
      }
    }
    
    if (bestMatch) {
      mappings.push({
        sourceColumn: bestMatch.col,
        targetColumn: schemaCol.name,
        confidence: bestMatch.confidence,
      });
    }
  }
  
  return mappings;
}

// ============================================
// Data Validation
// ============================================

export function validateData(
  data: any[],
  schemaType: DataSourceType,
  columnMapping: Record<string, string>
): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const schema = getSchemaForType(schemaType);
  
  if (!schema) {
    messages.push({
      type: 'error',
      message: `Unknown schema type: ${schemaType}`,
    });
    return messages;
  }
  
  // Check required columns
  for (const col of schema.columns.filter(c => c.required)) {
    const mappedColumn = Object.entries(columnMapping)
      .find(([, target]) => target === col.name)?.[0];
    
    if (!mappedColumn) {
      messages.push({
        type: 'error',
        column: col.name,
        message: `Required column "${col.name}" is not mapped`,
      });
    }
  }
  
  // Validate data types and values
  const reverseMapping: Record<string, string> = {};
  for (const [source, target] of Object.entries(columnMapping)) {
    reverseMapping[target] = source;
  }
  
  for (let i = 0; i < Math.min(data.length, 1000); i++) {
    const row = data[i];
    
    for (const col of schema.columns) {
      const sourceCol = reverseMapping[col.name];
      if (!sourceCol) continue;
      
      const value = row[sourceCol];
      
      // Check for missing required values
      if (col.required && (value === undefined || value === null || value === '')) {
        messages.push({
          type: 'warning',
          column: col.name,
          row: i + 1,
          message: `Missing value for required column "${col.name}"`,
        });
      }
      
      // Type validation
      if (value !== undefined && value !== null && value !== '') {
        switch (col.type) {
          case 'number':
            if (isNaN(parseFloat(value))) {
              messages.push({
                type: 'warning',
                column: col.name,
                row: i + 1,
                message: `Invalid number value "${value}" for column "${col.name}"`,
              });
            }
            break;
          case 'date':
            if (isNaN(Date.parse(value))) {
              messages.push({
                type: 'warning',
                column: col.name,
                row: i + 1,
                message: `Invalid date value "${value}" for column "${col.name}"`,
              });
            }
            break;
        }
      }
    }
    
    // Limit validation messages
    if (messages.length > 100) {
      messages.push({
        type: 'info',
        message: 'Validation stopped after 100 messages. Please fix errors and re-validate.',
      });
      break;
    }
  }
  
  // Add summary
  const errorCount = messages.filter(m => m.type === 'error').length;
  const warningCount = messages.filter(m => m.type === 'warning').length;
  
  if (errorCount === 0 && warningCount === 0) {
    messages.push({
      type: 'info',
      message: 'Data validation passed with no issues.',
    });
  } else {
    messages.unshift({
      type: 'info',
      message: `Validation complete: ${errorCount} error(s), ${warningCount} warning(s)`,
    });
  }
  
  return messages;
}

// ============================================
// Data Normalization
// ============================================

export function normalizeWorkloads(
  data: any[],
  schemaType: DataSourceType,
  columnMapping: Record<string, string>,
  datasetId: string
): NormalizedWorkload[] {
  const reverseMapping: Record<string, string> = {};
  for (const [source, target] of Object.entries(columnMapping)) {
    reverseMapping[target] = source;
  }
  
  const getValue = (row: any, targetCol: string): any => {
    const sourceCol = reverseMapping[targetCol];
    return sourceCol ? row[sourceCol] : undefined;
  };
  
  const getNumber = (row: any, targetCol: string): number => {
    const val = getValue(row, targetCol);
    return val !== undefined && val !== '' ? parseFloat(val) || 0 : 0;
  };
  
  const getString = (row: any, targetCol: string): string => {
    const val = getValue(row, targetCol);
    return val !== undefined ? String(val).trim() : '';
  };
  
  return data.map((row, index) => {
    // Extract base data based on schema type
    let workloadData = extractWorkloadData(row, schemaType, getValue, getNumber, getString);
    
    // Calculate energy
    const energyResult = calculateEnergy({
      runtimeHours: workloadData.runtimeHours,
      instanceType: workloadData.instanceType,
      gpuModel: workloadData.gpuModel,
      gpuCount: workloadData.gpuCount,
      cpuCores: workloadData.cpuCores,
      region: workloadData.region,
      provider: workloadData.provider,
      measuredPowerWatts: workloadData.measuredPowerWatts,
    });
    
    // Calculate carbon
    const carbonResult = calculateCarbon({
      energyKwh: energyResult.energyKwh,
      region: workloadData.region,
      provider: workloadData.provider,
    });
    
    // Calculate cost
    const costResult = calculateCost({
      billedCostUsd: workloadData.billedCostUsd,
      runtimeHours: workloadData.runtimeHours,
      instanceType: workloadData.instanceType,
      provider: workloadData.provider as any,
      region: workloadData.region,
      gpuCount: workloadData.gpuCount,
      cpuCores: workloadData.cpuCores,
    });
    
    // Combine confidence factors
    const allFactors = [
      ...energyResult.confidenceFactors,
      ...carbonResult.confidenceFactors,
      ...costResult.confidenceFactors,
    ];
    const confidenceScore = calculateConfidenceScore(allFactors);
    
    const normalized: NormalizedWorkload = {
      id: uuidv4(),
      datasetId,
      timestamp: workloadData.timestamp || new Date().toISOString(),
      
      workloadName: workloadData.workloadName || `Workload ${index + 1}`,
      workloadType: (workloadData.workloadType as 'training' | 'inference' | 'batch' | 'warehouse' | 'interactive' | 'unknown') || 'unknown',
      resourceType: workloadData.gpuCount && workloadData.gpuCount > 0 ? 'gpu' : 'cpu',
      
      instanceType: workloadData.instanceType,
      gpuModel: workloadData.gpuModel,
      gpuCount: workloadData.gpuCount,
      cpuCores: workloadData.cpuCores,
      memoryGB: workloadData.memoryGB,
      region: workloadData.region,
      provider: workloadData.provider as any,
      
      runtimeHours: workloadData.runtimeHours,
      
      costUsd: costResult.costUsd,
      costSource: costResult.source,
      
      energyKwh: energyResult.energyKwh,
      energySource: energyResult.source,
      energyCalculation: energyResult.calculation,
      
      carbonKgCo2e: carbonResult.carbonKgCo2e,
      carbonSource: carbonResult.source,
      carbonCalculation: carbonResult.calculation,
      
      confidenceScore: confidenceScore.score,
      confidenceFactors: allFactors,
    };
    
    return normalized;
  });
}

interface ExtractedWorkloadData {
  workloadName?: string;
  workloadType?: string;
  runtimeHours: number;
  instanceType?: string;
  gpuModel?: string;
  gpuCount?: number;
  cpuCores?: number;
  memoryGB?: number;
  region?: string;
  provider?: string;
  billedCostUsd?: number;
  measuredPowerWatts?: number;
  timestamp?: string;
}

function extractWorkloadData(
  row: any,
  schemaType: DataSourceType,
  getValue: (row: any, col: string) => any,
  getNumber: (row: any, col: string) => number,
  getString: (row: any, col: string) => string
): ExtractedWorkloadData {
  switch (schemaType) {
    case 'aws_cur':
      return {
        workloadName: getString(row, 'resourceTags/user:Name') || getString(row, 'lineItem/ProductCode'),
        workloadType: inferWorkloadType(getString(row, 'lineItem/UsageType')),
        runtimeHours: getNumber(row, 'lineItem/UsageAmount'),
        instanceType: getString(row, 'product/instanceType'),
        region: getString(row, 'product/region'),
        provider: 'aws',
        billedCostUsd: getNumber(row, 'lineItem/BlendedCost'),
        timestamp: getString(row, 'lineItem/UsageStartDate'),
      };
      
    case 'gcp_billing':
      return {
        workloadName: getString(row, 'sku.description') || getString(row, 'service.description'),
        workloadType: inferWorkloadType(getString(row, 'sku.description')),
        runtimeHours: getNumber(row, 'usage.amount'),
        region: getString(row, 'location.region'),
        provider: 'gcp',
        billedCostUsd: getNumber(row, 'cost'),
        timestamp: getString(row, 'usage_start_time'),
      };
      
    case 'snowflake_query_history':
      return {
        workloadName: getString(row, 'WAREHOUSE_NAME'),
        workloadType: 'warehouse',
        runtimeHours: getNumber(row, 'TOTAL_ELAPSED_TIME') / 3600000, // ms to hours
        region: 'unknown',
        provider: 'snowflake',
        billedCostUsd: getNumber(row, 'CREDITS_USED_CLOUD_SERVICES') * 3, // ~$3 per credit
        timestamp: getString(row, 'START_TIME'),
      };
      
    case 'databricks_usage':
      return {
        workloadName: getString(row, 'cluster_id') || getString(row, 'sku_name'),
        workloadType: inferWorkloadType(getString(row, 'sku_name')),
        runtimeHours: getNumber(row, 'usage_quantity'),
        instanceType: getString(row, 'node_type'),
        provider: 'databricks',
        timestamp: getString(row, 'usage_date'),
      };
      
    case 'custom_ai_workload':
      return {
        workloadName: getString(row, 'workload_name'),
        workloadType: getString(row, 'workload_type') || 'unknown',
        runtimeHours: getNumber(row, 'runtime_hours'),
        instanceType: getString(row, 'instance_type'),
        gpuModel: getString(row, 'gpu_model'),
        gpuCount: getNumber(row, 'gpu_count') || undefined,
        cpuCores: getNumber(row, 'cpu_cores') || undefined,
        memoryGB: getNumber(row, 'memory_gb') || undefined,
        region: getString(row, 'region'),
        provider: getString(row, 'provider'),
        billedCostUsd: getNumber(row, 'cost_usd') || undefined,
        measuredPowerWatts: getNumber(row, 'power_watts') || undefined,
        timestamp: getString(row, 'timestamp'),
      };
      
    default:
      return {
        runtimeHours: 0,
      };
  }
}

function inferWorkloadType(description: string): string {
  const lower = description.toLowerCase();
  
  if (lower.includes('train')) return 'training';
  if (lower.includes('infer')) return 'inference';
  if (lower.includes('batch')) return 'batch';
  if (lower.includes('interactive') || lower.includes('notebook')) return 'interactive';
  if (lower.includes('warehouse') || lower.includes('query')) return 'warehouse';
  
  return 'unknown';
}

// ============================================
// Dataset Creation Helper
// ============================================

export function createDataset(
  name: string,
  sourceType: DataSourceType,
  columns: string[],
  columnMapping: Record<string, string>,
  rowCount: number,
  validationMessages: ValidationMessage[]
): RawDataset {
  const errorCount = validationMessages.filter(m => m.type === 'error').length;
  const warningCount = validationMessages.filter(m => m.type === 'warning').length;
  
  let validationStatus: 'pending' | 'valid' | 'warnings' | 'errors';
  if (errorCount > 0) {
    validationStatus = 'errors';
  } else if (warningCount > 0) {
    validationStatus = 'warnings';
  } else {
    validationStatus = 'valid';
  }
  
  // Calculate confidence based on data quality
  let confidenceScore = 50;
  if (validationStatus === 'valid') confidenceScore += 20;
  if (validationStatus === 'errors') confidenceScore -= 30;
  if (validationStatus === 'warnings') confidenceScore -= 10;
  if (rowCount > 100) confidenceScore += 5;
  if (rowCount > 1000) confidenceScore += 5;
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));
  
  return {
    id: uuidv4(),
    name,
    sourceType,
    uploadedAt: new Date().toISOString(),
    rowCount,
    columns,
    columnMapping,
    validationStatus,
    validationMessages,
    confidenceScore,
  };
}
