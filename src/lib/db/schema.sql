-- ============================================
-- HELIOS ENERGY - Database Schema
-- SQLite for metadata, DuckDB for analytics
-- ============================================

-- ============================================
-- METADATA TABLES (SQLite)
-- ============================================

-- Datasets uploaded by users
CREATE TABLE IF NOT EXISTS datasets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    row_count INTEGER,
    columns TEXT, -- JSON array
    column_mapping TEXT, -- JSON object
    validation_status TEXT DEFAULT 'pending',
    validation_messages TEXT, -- JSON array
    confidence_score REAL DEFAULT 0,
    file_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Assumption sets
CREATE TABLE IF NOT EXISTS assumption_sets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Individual assumptions
CREATE TABLE IF NOT EXISTS assumptions (
    id TEXT PRIMARY KEY,
    assumption_set_id TEXT NOT NULL,
    name TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    source TEXT NOT NULL,
    source_label TEXT,
    confidence_impact REAL DEFAULT 0,
    category TEXT NOT NULL,
    editable INTEGER DEFAULT 1,
    last_modified TEXT,
    modified_by TEXT,
    FOREIGN KEY (assumption_set_id) REFERENCES assumption_sets(id)
);

-- Saved scenarios
CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    baseline_id TEXT,
    changes TEXT, -- JSON array
    results TEXT, -- JSON object
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Generated reports
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT, -- JSON object
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for enterprise compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details TEXT, -- JSON object
    user_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ANALYTICS TABLES (DuckDB)
-- ============================================

-- Raw ingested data (partitioned by dataset)
CREATE TABLE IF NOT EXISTS raw_workloads (
    id TEXT,
    dataset_id TEXT,
    raw_data JSON,
    ingested_at TIMESTAMP
);

-- Normalized workload metrics
CREATE TABLE IF NOT EXISTS normalized_workloads (
    id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    timestamp TIMESTAMP,
    
    -- Workload identification
    workload_name TEXT,
    workload_type TEXT,
    resource_type TEXT,
    
    -- Resource details
    instance_type TEXT,
    gpu_model TEXT,
    gpu_count INTEGER,
    cpu_cores INTEGER,
    memory_gb REAL,
    region TEXT,
    provider TEXT,
    
    -- Raw metrics
    runtime_hours REAL,
    
    -- Cost
    cost_usd REAL,
    cost_source TEXT,
    
    -- Energy
    energy_kwh REAL,
    energy_source TEXT,
    power_draw_watts REAL,
    pue REAL,
    
    -- Carbon
    carbon_kg_co2e REAL,
    carbon_source TEXT,
    grid_intensity_g_co2_per_kwh REAL,
    
    -- Confidence
    confidence_score REAL,
    confidence_factors JSON
);

-- Aggregated daily metrics for fast queries
CREATE TABLE IF NOT EXISTS daily_aggregates (
    date DATE,
    dataset_id TEXT,
    workload_type TEXT,
    resource_type TEXT,
    region TEXT,
    provider TEXT,
    
    total_cost_usd REAL,
    total_energy_kwh REAL,
    total_carbon_kg_co2e REAL,
    total_runtime_hours REAL,
    workload_count INTEGER,
    avg_confidence REAL,
    
    PRIMARY KEY (date, dataset_id, workload_type, resource_type, region, provider)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_normalized_dataset ON normalized_workloads(dataset_id);
CREATE INDEX IF NOT EXISTS idx_normalized_timestamp ON normalized_workloads(timestamp);
CREATE INDEX IF NOT EXISTS idx_normalized_workload_type ON normalized_workloads(workload_type);
CREATE INDEX IF NOT EXISTS idx_normalized_region ON normalized_workloads(region);
CREATE INDEX IF NOT EXISTS idx_daily_agg_date ON daily_aggregates(date);
