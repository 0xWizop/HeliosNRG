'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Edit3, 
  Check, 
  X, 
  Info, 
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  AlertCircle
} from 'lucide-react';
import { ConfidenceIndicator } from './ConfidenceBadge';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';

interface Assumption {
  id: string;
  name: string;
  value: number;
  unit: string;
  source: 'customer_measurement' | 'industry_default' | 'manufacturer_spec' | 'user_override';
  sourceLabel: string;
  confidenceImpact: number;
  category: 'power' | 'pue' | 'carbon_intensity' | 'utilization' | 'cost';
  editable: boolean;
  description: string;
}

// Validation rules for assumptions
const validationRules: Record<string, { min: number; max: number; warning: string }> = {
  pue: { min: 1.0, max: 3.0, warning: 'PUE must be between 1.0 and 3.0. Typical values are 1.1-1.6.' },
  power: { min: 1, max: 1000, warning: 'Power values should be between 1W and 1000W.' },
  carbon_intensity: { min: 0, max: 1000, warning: 'Carbon intensity should be between 0 and 1000 gCO₂/kWh.' },
  utilization: { min: 0, max: 100, warning: 'Utilization must be between 0% and 100%.' },
  cost: { min: 0, max: 1000, warning: 'Cost values should be positive and reasonable.' },
};

const defaultAssumptions: Assumption[] = [
  // Power - GPUs
  { id: 'gpu_a100', name: 'GPU Power Draw (A100)', value: 400, unit: 'W', source: 'manufacturer_spec', sourceLabel: 'NVIDIA A100 TDP', confidenceImpact: 5, category: 'power', editable: true, description: 'Typical power consumption for NVIDIA A100 GPU at 75% utilization' },
  { id: 'gpu_v100', name: 'GPU Power Draw (V100)', value: 300, unit: 'W', source: 'manufacturer_spec', sourceLabel: 'NVIDIA V100 TDP', confidenceImpact: 5, category: 'power', editable: true, description: 'Typical power consumption for NVIDIA V100 GPU' },
  { id: 'gpu_h100', name: 'GPU Power Draw (H100)', value: 700, unit: 'W', source: 'manufacturer_spec', sourceLabel: 'NVIDIA H100 TDP', confidenceImpact: 5, category: 'power', editable: true, description: 'Typical power consumption for NVIDIA H100 GPU' },
  { id: 'gpu_t4', name: 'GPU Power Draw (T4)', value: 70, unit: 'W', source: 'manufacturer_spec', sourceLabel: 'NVIDIA T4 TDP', confidenceImpact: 5, category: 'power', editable: true, description: 'Typical power consumption for NVIDIA T4 inference GPU' },
  // Power - CPU instances
  { id: 'cpu_small', name: 'Small Instance (2 vCPU)', value: 20, unit: 'W', source: 'industry_default', sourceLabel: 'CCF Coefficients', confidenceImpact: 3, category: 'power', editable: true, description: 'Estimated power for small compute instances (t3.small, e2-small)' },
  { id: 'cpu_medium', name: 'Medium Instance (4 vCPU)', value: 40, unit: 'W', source: 'industry_default', sourceLabel: 'CCF Coefficients', confidenceImpact: 3, category: 'power', editable: true, description: 'Estimated power for medium compute instances (m5.xlarge, n2-standard-4)' },
  { id: 'cpu_large', name: 'Large Instance (8 vCPU)', value: 80, unit: 'W', source: 'industry_default', sourceLabel: 'CCF Coefficients', confidenceImpact: 3, category: 'power', editable: true, description: 'Estimated power for large compute instances (m5.2xlarge, n2-standard-8)' },
  { id: 'cpu_xlarge', name: 'XLarge Instance (16+ vCPU)', value: 160, unit: 'W', source: 'industry_default', sourceLabel: 'CCF Coefficients', confidenceImpact: 3, category: 'power', editable: true, description: 'Estimated power for extra large compute instances' },
  
  // PUE by provider
  { id: 'pue_aws', name: 'AWS Data Center PUE', value: 1.135, unit: '', source: 'industry_default', sourceLabel: 'AWS Sustainability Report 2023', confidenceImpact: 8, category: 'pue', editable: true, description: 'Power Usage Effectiveness for AWS data centers' },
  { id: 'pue_gcp', name: 'GCP Data Center PUE', value: 1.10, unit: '', source: 'industry_default', sourceLabel: 'Google Environmental Report 2023', confidenceImpact: 8, category: 'pue', editable: true, description: 'Power Usage Effectiveness for Google Cloud data centers' },
  { id: 'pue_azure', name: 'Azure Data Center PUE', value: 1.18, unit: '', source: 'industry_default', sourceLabel: 'Microsoft Sustainability Report 2023', confidenceImpact: 8, category: 'pue', editable: true, description: 'Power Usage Effectiveness for Microsoft Azure data centers' },
  { id: 'pue_default', name: 'Default Data Center PUE', value: 1.58, unit: '', source: 'industry_default', sourceLabel: 'Uptime Institute Global Average', confidenceImpact: 3, category: 'pue', editable: true, description: 'Global average PUE for data centers' },
  
  // Carbon Intensity - US Regions
  { id: 'ci_us_east_1', name: 'us-east-1 (N. Virginia)', value: 337, unit: 'gCO₂/kWh', source: 'industry_default', sourceLabel: 'EPA eGRID 2022 - SERC', confidenceImpact: 8, category: 'carbon_intensity', editable: true, description: 'Carbon intensity for AWS us-east-1, GCP us-east4, Azure eastus' },
  { id: 'ci_us_east_2', name: 'us-east-2 (Ohio)', value: 410, unit: 'gCO₂/kWh', source: 'industry_default', sourceLabel: 'EPA eGRID 2022 - RFC', confidenceImpact: 8, category: 'carbon_intensity', editable: true, description: 'Carbon intensity for AWS us-east-2, Azure eastus2' },
  { id: 'ci_us_west_1', name: 'us-west-1 (N. California)', value: 210, unit: 'gCO₂/kWh', source: 'industry_default', sourceLabel: 'EPA eGRID 2022 - WECC', confidenceImpact: 8, category: 'carbon_intensity', editable: true, description: 'Carbon intensity for AWS us-west-1, Azure westus' },
  { id: 'ci_us_west_2', name: 'us-west-2 (Oregon)', value: 117, unit: 'gCO₂/kWh', source: 'industry_default', sourceLabel: 'EPA eGRID 2022 - NWPP', confidenceImpact: 8, category: 'carbon_intensity', editable: true, description: 'Carbon intensity for AWS us-west-2, GCP us-west1 (low due to hydro)' },
  // Carbon Intensity - Europe
  { id: 'ci_eu_west_1', name: 'eu-west-1 (Ireland)', value: 296, unit: 'gCO₂/kWh', source: 'industry_default', sourceLabel: 'Ember 2023', confidenceImpact: 8, category: 'carbon_intensity', editable: true, description: 'Carbon intensity for AWS eu-west-1, GCP europe-west1' },
  { id: 'ci_eu_west_2', name: 'eu-west-2 (London)', value: 231, unit: 'gCO₂/kWh', source: 'industry_default', sourceLabel: 'Ember 2023 - UK', confidenceImpact: 8, category: 'carbon_intensity', editable: true, description: 'Carbon intensity for AWS eu-west-2, Azure uksouth' },
  { id: 'ci_eu_central_1', name: 'eu-central-1 (Frankfurt)', value: 311, unit: 'gCO₂/kWh', source: 'industry_default', sourceLabel: 'Ember 2023 - Germany', confidenceImpact: 8, category: 'carbon_intensity', editable: true, description: 'Carbon intensity for AWS eu-central-1, GCP europe-west3' },
  { id: 'ci_eu_north_1', name: 'eu-north-1 (Stockholm)', value: 28, unit: 'gCO₂/kWh', source: 'industry_default', sourceLabel: 'Ember 2023 - Sweden', confidenceImpact: 8, category: 'carbon_intensity', editable: true, description: 'Very low carbon intensity due to nuclear and hydro' },
  // Carbon Intensity - Asia Pacific
  { id: 'ci_ap_south_1', name: 'ap-south-1 (Mumbai)', value: 708, unit: 'gCO₂/kWh', source: 'industry_default', sourceLabel: 'IEA 2023 - India', confidenceImpact: 8, category: 'carbon_intensity', editable: true, description: 'Carbon intensity for AWS ap-south-1, GCP asia-south1' },
  { id: 'ci_ap_northeast_1', name: 'ap-northeast-1 (Tokyo)', value: 471, unit: 'gCO₂/kWh', source: 'industry_default', sourceLabel: 'IEA 2023 - Japan', confidenceImpact: 8, category: 'carbon_intensity', editable: true, description: 'Carbon intensity for AWS ap-northeast-1, GCP asia-northeast1' },
  { id: 'ci_ap_southeast_1', name: 'ap-southeast-1 (Singapore)', value: 408, unit: 'gCO₂/kWh', source: 'industry_default', sourceLabel: 'IEA 2023 - Singapore', confidenceImpact: 8, category: 'carbon_intensity', editable: true, description: 'Carbon intensity for AWS ap-southeast-1, GCP asia-southeast1' },
  { id: 'ci_ap_southeast_2', name: 'ap-southeast-2 (Sydney)', value: 530, unit: 'gCO₂/kWh', source: 'industry_default', sourceLabel: 'IEA 2023 - Australia', confidenceImpact: 8, category: 'carbon_intensity', editable: true, description: 'Carbon intensity for AWS ap-southeast-2, GCP australia-southeast1' },
  
  // Utilization
  { id: 'util_gpu', name: 'Average GPU Utilization', value: 65, unit: '%', source: 'industry_default', sourceLabel: 'Industry estimate', confidenceImpact: -5, category: 'utilization', editable: true, description: 'Assumed average GPU utilization when not measured' },
  { id: 'util_cpu', name: 'Average CPU Utilization', value: 50, unit: '%', source: 'industry_default', sourceLabel: 'Industry estimate', confidenceImpact: -5, category: 'utilization', editable: true, description: 'Assumed average CPU utilization when not measured' },
  { id: 'util_memory', name: 'Average Memory Utilization', value: 60, unit: '%', source: 'industry_default', sourceLabel: 'Industry estimate', confidenceImpact: -3, category: 'utilization', editable: true, description: 'Assumed average memory utilization' },
  
  // Cost
  { id: 'cost_snowflake', name: 'Snowflake Credit Cost', value: 3.00, unit: '$/credit', source: 'industry_default', sourceLabel: 'Snowflake standard pricing', confidenceImpact: 5, category: 'cost', editable: true, description: 'Cost per Snowflake compute credit' },
  { id: 'cost_databricks', name: 'Databricks DBU Cost', value: 0.55, unit: '$/DBU', source: 'industry_default', sourceLabel: 'Databricks pricing', confidenceImpact: 5, category: 'cost', editable: true, description: 'Cost per Databricks Unit (Jobs Compute)' },
];

const categoryLabels: Record<string, string> = {
  power: 'Power Consumption',
  pue: 'PUE (Power Usage Effectiveness)',
  carbon_intensity: 'Grid Carbon Intensity',
  utilization: 'Utilization',
  cost: 'Cost Rates',
};

const sourceLabels: Record<string, { label: string; color: string }> = {
  customer_measurement: { label: 'Customer Measurement', color: 'bg-emerald-950 text-emerald-400 border border-emerald-800' },
  industry_default: { label: 'Industry Default', color: 'bg-blue-950 text-blue-400 border border-blue-800' },
  manufacturer_spec: { label: 'Manufacturer Spec', color: 'bg-purple-950 text-purple-400 border border-purple-800' },
  user_override: { label: 'User Override', color: 'bg-amber-950 text-amber-400 border border-amber-800' },
};

export function AssumptionPanel() {
  const [assumptions, setAssumptions] = useState<Assumption[]>(defaultAssumptions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from Firebase on mount
  useEffect(() => {
    if (!auth) return;
    
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const teamId = userData.currentTeamId || userData.teamIds?.[0];
          setCurrentTeamId(teamId);
          
          // Load team's custom assumptions
          if (teamId) {
            const assumptionsDoc = await getDoc(doc(db, 'team_assumptions', teamId));
            if (assumptionsDoc.exists()) {
              const savedOverrides = assumptionsDoc.data().overrides || {};
              setAssumptions(prev => prev.map(a => 
                savedOverrides[a.id] ? { ...a, ...savedOverrides[a.id] } : a
              ));
            }
          }
        }
      }
    });
    
    return () => unsubAuth();
  }, []);

  // Save to Firebase when assumptions change
  const saveToFirebase = async (updatedAssumptions: Assumption[]) => {
    if (!currentTeamId) return;
    
    setIsSaving(true);
    try {
      const overrides: Record<string, Partial<Assumption>> = {};
      updatedAssumptions.forEach(a => {
        const original = defaultAssumptions.find(d => d.id === a.id);
        if (original && (a.value !== original.value || a.source === 'user_override')) {
          overrides[a.id] = { value: a.value, source: a.source, sourceLabel: a.sourceLabel };
        }
      });
      
      await setDoc(doc(db, 'team_assumptions', currentTeamId), {
        overrides,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (error) {
      console.error('Failed to save assumptions:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(assumptions.map(a => a.category)))];
  
  const filteredAssumptions = selectedCategory === 'all' 
    ? assumptions 
    : assumptions.filter(a => a.category === selectedCategory);

  const overallConfidence = calculateOverallConfidence(assumptions);

  const validateValue = (value: number, category: string): string | null => {
    const rules = validationRules[category];
    if (!rules) return null;
    if (value < rules.min || value > rules.max) {
      return rules.warning;
    }
    return null;
  };

  const startEditing = (assumption: Assumption) => {
    setEditingId(assumption.id);
    setEditValue(assumption.value.toString());
    setValidationWarning(null);
  };

  const saveEdit = (id: string) => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue)) {
      const assumption = assumptions.find(a => a.id === id);
      const warning = assumption ? validateValue(newValue, assumption.category) : null;
      setValidationWarning(warning);
      
      const updated = assumptions.map(a => 
        a.id === id 
          ? { ...a, value: newValue, source: 'user_override' as const, sourceLabel: 'User override' }
          : a
      );
      setAssumptions(updated);
      saveToFirebase(updated);
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
    setValidationWarning(null);
  };

  const resetToDefault = (id: string) => {
    const original = defaultAssumptions.find(a => a.id === id);
    if (original) {
      const updated = assumptions.map(a => a.id === id ? original : a);
      setAssumptions(updated);
      saveToFirebase(updated);
    }
  };

  const handleExport = () => {
    const exportData = assumptions.map(a => ({
      id: a.id,
      name: a.name,
      value: a.value,
      unit: a.unit,
      category: a.category,
      source: a.source,
      sourceLabel: a.sourceLabel,
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helios-assumptions-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          const updated = assumptions.map(a => {
            const match = imported.find((i: any) => i.id === a.id);
            if (match && typeof match.value === 'number') {
              return { ...a, value: match.value, source: 'user_override' as const, sourceLabel: 'Imported' };
            }
            return a;
          });
          setAssumptions(updated);
          saveToFirebase(updated);
        }
      } catch (err) {
        console.error('Failed to parse import file:', err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-mono text-neutral-100 uppercase tracking-wider">Assumptions</h2>
          <p className="text-neutral-400 mt-1 text-xs sm:text-sm">
            Editable values affecting confidence
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && <span className="text-xs text-amber-500">Saving...</span>}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn-outline flex items-center gap-1 text-xs px-2 py-1.5"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button 
            onClick={handleExport}
            className="btn-outline flex items-center gap-1 text-xs px-2 py-1.5"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Overall Confidence */}
      <div className="card bg-amber-950/30 border-amber-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-medium text-neutral-100 mb-1 text-sm">Overall Confidence</h3>
            <p className="text-xs text-neutral-400">
              Based on data sources
            </p>
          </div>
          <div className="w-full sm:w-48">
            <ConfidenceIndicator score={overallConfidence} />
          </div>
        </div>
      </div>

      {/* Validation Warning */}
      {validationWarning && (
        <div className="bg-amber-950/50 border border-amber-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-300">Validation Warning</h4>
              <p className="text-sm text-amber-400/70 mt-1">{validationWarning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-950/50 border border-blue-800 p-3 hidden sm:block">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-medium text-blue-300 text-sm">How Assumptions Work</h4>
            <p className="text-xs text-blue-400/70 mt-1">
              Override values with your own measurements. Customer data increases confidence.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
              selectedCategory === category
                ? 'bg-amber-500 text-neutral-950'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700'
            }`}
          >
            {category === 'all' ? 'All' : categoryLabels[category] || category}
          </button>
        ))}
      </div>

      {/* Assumptions List */}
      <div className="space-y-4">
        {Object.entries(categoryLabels).map(([category, label]) => {
          const categoryAssumptions = filteredAssumptions.filter(a => a.category === category);
          if (categoryAssumptions.length === 0) return null;

          return (
            <div key={category} className="card">
              <h3 className="font-mono text-sm text-neutral-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-neutral-500" />
                {label}
              </h3>
              <div className="space-y-3">
                {categoryAssumptions.map(assumption => (
                  <AssumptionRow
                    key={assumption.id}
                    assumption={assumption}
                    isEditing={editingId === assumption.id}
                    editValue={editValue}
                    onStartEdit={() => startEditing(assumption)}
                    onEditValueChange={setEditValue}
                    onSave={() => saveEdit(assumption.id)}
                    onCancel={cancelEdit}
                    onReset={() => resetToDefault(assumption.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface AssumptionRowProps {
  assumption: Assumption;
  isEditing: boolean;
  editValue: string;
  onStartEdit: () => void;
  onEditValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}

function AssumptionRow({
  assumption,
  isEditing,
  editValue,
  onStartEdit,
  onEditValueChange,
  onSave,
  onCancel,
  onReset,
}: AssumptionRowProps) {
  const sourceInfo = sourceLabels[assumption.source];
  const isOverridden = assumption.source === 'user_override';

  return (
    <div className={`flex items-start gap-4 p-4 ${isOverridden ? 'bg-amber-950/30 border border-amber-800' : 'bg-neutral-900 border border-neutral-800'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-neutral-200">{assumption.name}</h4>
          <span className={`badge ${sourceInfo.color}`}>
            {sourceInfo.label}
          </span>
          {isOverridden && (
            <button 
              onClick={onReset}
              className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
        <p className="text-sm text-neutral-500 mb-2">{assumption.description}</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-neutral-600">Source: {assumption.sourceLabel}</span>
          <span className={`font-mono ${assumption.confidenceImpact >= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
            Confidence: {assumption.confidenceImpact >= 0 ? '+' : ''}{assumption.confidenceImpact}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <input
              type="number"
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              className="w-24 input text-right"
              autoFocus
            />
            <span className="text-neutral-500 w-16">{assumption.unit}</span>
            <button onClick={onSave} className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-500">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={onCancel} className="p-1.5 bg-neutral-700 text-neutral-300 hover:bg-neutral-600">
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <span className="text-lg font-mono font-medium text-neutral-100 w-24 text-right">
              {assumption.value.toLocaleString()}
            </span>
            <span className="text-neutral-500 w-16">{assumption.unit}</span>
            {assumption.editable && (
              <button 
                onClick={onStartEdit}
                className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function calculateOverallConfidence(assumptions: Assumption[]): number {
  const baseConfidence = 50;
  const totalImpact = assumptions.reduce((sum, a) => sum + a.confidenceImpact, 0);
  return Math.max(0, Math.min(100, baseConfidence + totalImpact));
}
