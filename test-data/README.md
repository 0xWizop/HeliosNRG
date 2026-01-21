# Helios Test Data

Comprehensive test datasets for validating Helios Energy's AI workload tracking and sustainability reporting features.

## Files Overview

| File | Records | Purpose |
|------|---------|---------|
| `ai-workloads-comprehensive.csv` | 30 | Diverse workloads across AWS, GCP, Azure with various instance types and GPUs |
| `edge-cases-missing-data.csv` | 15 | Tests provider detection, missing fields, region aliases |
| `large-scale-workloads.csv` | 50 | Production-scale dataset simulating enterprise ML infrastructure |
| `scenario-comparison-baseline.csv` | 5 | Baseline scenario for cost/carbon comparison |
| `scenario-comparison-optimized.csv` | 5 | Optimized scenario showing potential savings |

---

## Test Coverage

### Provider Detection Tests (`edge-cases-missing-data.csv`)

| Test Case | Description | Expected Detection |
|-----------|-------------|-------------------|
| EC-001 | Empty provider, AWS region | Detect AWS from region |
| EC-002 | Empty provider, p4d instance | Detect AWS from instance type |
| EC-003 | Empty provider + region, c6i instance | Detect AWS from instance type |
| EC-004 | Empty provider, n1-standard instance | Detect GCP from instance type |
| EC-005 | Empty provider, Standard_D8s instance | Detect Azure from instance type |
| EC-006 | GPU hint only (A100) | Detect AWS from GPU model |
| EC-008 | Region alias "virginia" | Normalize to us-east-1 |
| EC-009 | Region alias "iowa" | Normalize to us-central1 |
| EC-015 | On-prem workload | Detect on_prem provider |

### Confidence Scoring Tests

| Scenario | Expected Confidence |
|----------|-------------------|
| Full data (all fields) | 85-95% |
| Missing provider (auto-detected) | 75-85% |
| Missing provider + region | 60-70% |
| Minimal data | 40-50% |
| On-prem with custom data | 70-80% |

### Sustainability Analogies Tests (`large-scale-workloads.csv`)

Total estimated metrics for validation:
- **Total Cost**: ~$250,000
- **Total Energy**: ~150,000 kWh
- **Total Carbon**: ~50 metric tons CO₂e

Expected analogies:
- 📱 ~12.5 million smartphone charges
- 🚗 ~500,000 EV miles
- 🌳 ~2,300 tree-years to offset
- ✈️ ~280 LA→NY flights

---

## Column Definitions

| Column | Type | Description |
|--------|------|-------------|
| `workload_id` | string | Unique identifier |
| `name` | string | Human-readable workload name |
| `provider` | string | Cloud provider (aws, gcp, azure, on_prem) |
| `region` | string | Cloud region or datacenter |
| `instance_type` | string | VM/instance type |
| `vcpus` | number | Virtual CPU count |
| `memory_gb` | number | Memory in GB |
| `gpu_model` | string | GPU model (A100, V100, T4, etc.) |
| `gpu_count` | number | Number of GPUs |
| `runtime_hours` | number | Total runtime in hours |
| `cpu_utilization` | number | Average CPU utilization (0-100) |
| `memory_utilization` | number | Average memory utilization (0-100) |
| `cost` | number | Total cost in USD |
| `start_time` | ISO8601 | Workload start timestamp |
| `end_time` | ISO8601 | Workload end timestamp |

---

## Scenario Comparison

### Baseline vs Optimized

| Metric | Baseline | Optimized | Savings |
|--------|----------|-----------|---------|
| Total Cost | $22,416 | $9,320 | **58%** |
| Runtime Hours | 1,824 | 1,536 | 16% |
| Avg Utilization | 56% | 76% | +36% efficiency |

**Key Optimizations Demonstrated:**
1. Right-sizing GPU instances (8x A100 → 4x A100)
2. Region optimization (us-east-1 → us-west-2 for cleaner grid)
3. Instance family upgrades (p4d → a2-highgpu for training)
4. Inference optimization (g5 → inf1 dedicated chips)

---

## Usage

1. Navigate to Helios dashboard
2. Click "Upload Data" 
3. Select any CSV file from this directory
4. Map columns (auto-detection should handle most)
5. Review validation and confidence scores
6. Generate reports to verify analogies and scores

## Validation Checklist

- [ ] Provider detection reduces "Unknown" below 20%
- [ ] Confidence scores match expected ranges
- [ ] Sustainability analogies appear in reports
- [ ] Scenario comparison shows correct savings calculations
- [ ] Large dataset processes within 30 seconds
