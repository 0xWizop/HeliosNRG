// ============================================
// HELIOS ENERGY - In-Memory Data Store
// Simple storage for demo/development
// For production, replace with a proper database
// ============================================

// In-memory data store
interface DataStore {
  datasets: Map<string, any>;
  workloads: Map<string, any>;
  assumptionSets: Map<string, any>;
  assumptions: Map<string, any>;
  scenarios: Map<string, any>;
  reports: Map<string, any>;
  auditLog: any[];
}

const store: DataStore = {
  datasets: new Map(),
  workloads: new Map(),
  assumptionSets: new Map(),
  assumptions: new Map(),
  scenarios: new Map(),
  reports: new Map(),
  auditLog: [],
};

export function getDb() {
  return store;
}

export function closeDb() {
  // No-op for in-memory store
}

// Dataset operations
export function saveDataset(dataset: any) {
  store.datasets.set(dataset.id, {
    ...dataset,
    updatedAt: new Date().toISOString(),
  });
}

export function getDatasets() {
  return Array.from(store.datasets.values())
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

export function getDatasetById(id: string) {
  return store.datasets.get(id) || null;
}

// Workload operations
export function saveNormalizedWorkloads(workloads: any[]) {
  for (const w of workloads) {
    store.workloads.set(w.id, w);
  }
}

export function getWorkloadsByDataset(datasetId: string) {
  return Array.from(store.workloads.values())
    .filter(w => w.datasetId === datasetId);
}

export function getAllWorkloads() {
  return Array.from(store.workloads.values());
}

// Assumption operations
export function saveAssumptionSet(set: any) {
  store.assumptionSets.set(set.id, {
    ...set,
    updatedAt: new Date().toISOString(),
  });
  
  for (const a of set.assumptions || []) {
    store.assumptions.set(a.id, {
      ...a,
      assumptionSetId: set.id,
    });
  }
}

export function getAssumptionSets() {
  return Array.from(store.assumptionSets.values()).map(set => {
    const assumptions = Array.from(store.assumptions.values())
      .filter(a => a.assumptionSetId === set.id);
    return { ...set, assumptions };
  });
}

export function getDefaultAssumptionSet() {
  const sets = Array.from(store.assumptionSets.values());
  const defaultSet = sets.find(s => s.isDefault);
  if (!defaultSet) return null;
  
  const assumptions = Array.from(store.assumptions.values())
    .filter(a => a.assumptionSetId === defaultSet.id);
  return { ...defaultSet, assumptions };
}

// Scenario operations
export function saveScenario(scenario: any) {
  store.scenarios.set(scenario.id, {
    ...scenario,
    updatedAt: new Date().toISOString(),
  });
}

export function getScenarios() {
  return Array.from(store.scenarios.values())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

// Audit log
export function logAudit(action: string, entityType: string, entityId?: string, details?: any) {
  store.auditLog.push({
    id: store.auditLog.length + 1,
    action,
    entityType,
    entityId,
    details,
    createdAt: new Date().toISOString(),
  });
}
