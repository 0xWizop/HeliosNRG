# Helios Calculation Methodology

This document provides detailed technical documentation of all calculation methods, data sources, and assumptions used in the Helios platform.

## 1. Energy Calculation

### Formula

```
Energy (kWh) = (Runtime Hours × Power Draw (W) × PUE) / 1000
```

### Components

#### 1.1 Runtime Hours

The actual duration a workload ran, sourced from:
- Billing data usage hours (AWS CUR, GCP Billing)
- Job completion timestamps (Databricks, custom)
- Query history (Snowflake TOTAL_ELAPSED_TIME)

**Confidence Impact:** +10% when from billing data, -5% when estimated

#### 1.2 Power Draw (Watts)

Electrical power consumed by compute resources.

**Source Priority:**
1. **Customer Measurement** (+15% confidence)
   - Direct power monitoring data
   - Highest accuracy when available
   
2. **Instance Type Reference** (+5% confidence)
   - Pre-populated database of instance power consumption
   - Based on manufacturer TDP and typical utilization
   
3. **GPU TDP Specifications** (0% confidence impact)
   - NVIDIA A100: 400W TDP, 300W typical
   - NVIDIA V100: 300W TDP, 225W typical
   - NVIDIA T4: 70W TDP, 52W typical
   - AMD MI250X: 500W TDP, 375W typical
   
4. **Estimated from Characteristics** (-10 to -20% confidence)
   - Base server power: 50W
   - Per CPU core: 10W typical
   - Per GPU: 250W default

#### 1.3 PUE (Power Usage Effectiveness)

Ratio of total facility energy to IT equipment energy.

| Provider | PUE | Source | Year |
|----------|-----|--------|------|
| AWS | 1.135 | AWS Sustainability Report | 2023 |
| GCP | 1.10 | Google Environmental Report | 2023 |
| Azure | 1.18 | Microsoft Sustainability Report | 2023 |
| On-Premises | 1.58 | Uptime Institute Global Average | 2023 |
| Colocation | 1.45 | Uptime Institute | 2023 |

**Regional Variations:**
- GCP europe-north1 (Finland): 1.08
- GCP us-west1 (Oregon): 1.10
- AWS eu-north-1 (Stockholm): ~1.09 (estimated)

---

## 2. Carbon Calculation

### Formula

```
Carbon (kgCO₂e) = Energy (kWh) × Grid Intensity (gCO₂/kWh) / 1000
```

### Grid Carbon Intensity Data

#### 2.1 Data Sources

| Region | Source | Update Frequency |
|--------|--------|------------------|
| United States | EPA eGRID | Annual |
| Europe | Ember | Annual |
| Asia Pacific | Ember | Annual |
| Global | IEA | Annual |

#### 2.2 Regional Intensities (gCO₂/kWh)

**Low Carbon Regions:**
| Region | Intensity | Notes |
|--------|-----------|-------|
| eu-north-1 (Sweden) | 28 | High hydro/nuclear |
| eu-west-3 (France) | 56 | High nuclear |
| sa-east-1 (Brazil) | 75 | High hydro |
| ca-central-1 (Canada) | 120 | Hydro dominant |
| us-west-2 (Oregon) | 117 | Hydro power |

**Medium Carbon Regions:**
| Region | Intensity | Notes |
|--------|-----------|-------|
| eu-west-2 (London) | 207 | Mixed grid |
| us-west-1 (California) | 210 | CAMX grid |
| eu-west-1 (Ireland) | 296 | Mixed grid |
| eu-central-1 (Frankfurt) | 311 | Coal transition |
| us-east-1 (Virginia) | 337 | SERC grid |

**High Carbon Regions:**
| Region | Intensity | Notes |
|--------|-----------|-------|
| ap-southeast-1 (Singapore) | 408 | Gas/coal |
| us-east-2 (Ohio) | 410 | RFC East grid |
| ap-northeast-1 (Tokyo) | 465 | Post-nuclear |
| ap-southeast-2 (Sydney) | 505 | Coal heavy |
| ap-south-1 (Mumbai) | 632 | Coal dominant |

**Defaults:**
- Global Average: 436 gCO₂/kWh (IEA 2023)

#### 2.3 Confidence Impact

- Customer-provided grid intensity: +15%
- Region-specific data available: +8%
- Using country/regional default: +5%
- Using global average: -15%

---

## 3. Cost Calculation

### Priority System

Cost calculation follows a strict priority order to maximize accuracy:

#### Priority 1: Exact Billing Data (+20% confidence)

When billing data exists (AWS CUR, GCP Billing Export), we use the exact billed amount:

```
Cost = Billed Amount (no calculation needed)
```

**This is the highest confidence source. We never estimate when billing data exists.**

#### Priority 2: Customer Hourly Rate (+10% confidence)

When customer provides their negotiated rates:

```
Cost = Hourly Rate × Runtime Hours
```

#### Priority 3: Reference Pricing (+5% confidence)

For known instance types, on-demand pricing from reference database:

```
Cost = Reference Hourly Rate × Runtime Hours
```

**Sample Reference Prices (USD/hour, on-demand):**

| Instance | AWS | GCP | Azure |
|----------|-----|-----|-------|
| p4d.24xlarge / A100×8 | $32.77 | $29.39 | $27.20 |
| p3.8xlarge / V100×4 | $12.24 | $14.69 | $12.24 |
| g5.4xlarge / A10G×1 | $1.62 | $1.68 | $1.20 |
| g4dn.xlarge / T4×1 | $0.53 | $0.55 | $0.53 |
| inf2.xlarge | $0.76 | N/A | N/A |

#### Priority 4: Estimation (-15% confidence)

When no better data available:

```
Estimated Rate = Base ($0.10) + (CPU cores × $0.02) + (Memory GB × $0.005) + (GPUs × $2.50)
Cost = Estimated Rate × Runtime Hours
```

---

## 4. Confidence Scoring

### Base Score

All calculations start with a base confidence of **50%**.

### Factor Adjustments

#### Positive Factors (Increase Confidence)

| Factor | Impact | Condition |
|--------|--------|-----------|
| Exact billing data | +15 to +20% | Billing records available |
| Customer power measurement | +10 to +15% | Measured power data |
| Known region | +8% | Region-specific grid intensity |
| Known instance type | +5% | Instance in reference database |
| High data completeness | +5 to +10% | >90% fields populated |
| Large sample size | +5% | >1000 data points |

#### Negative Factors (Decrease Confidence)

| Factor | Impact | Condition |
|--------|--------|-----------|
| Estimated power | -10 to -20% | No power data available |
| Unknown region | -10 to -15% | Using global averages |
| Missing required fields | -10 to -15% | Key data missing |
| Validation warnings | -5% | Data quality issues |
| Validation errors | -15% | Schema/type errors |
| Small sample size | -5% | <100 data points |

### Confidence Levels

| Level | Score Range | Interpretation |
|-------|-------------|----------------|
| High | 80-100% | Suitable for executive decision-making |
| Medium | 60-79% | Good for planning, validate before commitments |
| Low | 40-59% | Directional only, improve data quality |
| Unverified | 0-39% | Preliminary estimates, significant gaps |

---

## 5. Scenario Simulation

### Supported Scenario Types

#### 5.1 Region Migration

Simulates moving workloads to different regions:
- Recalculates carbon using target region grid intensity
- Adjusts cost using regional pricing multipliers
- Updates PUE for target provider/region

**Risks Flagged:**
- Data transfer costs not included
- Latency impact varies by workload

#### 5.2 Instance Right-Sizing

Simulates changing instance types:
- Recalculates energy with new power draw
- Adjusts runtime based on performance ratio
- Updates cost based on new instance pricing

**Risks Flagged:**
- Performance characteristics may differ
- Application compatibility should be verified

#### 5.3 Schedule Optimization

Simulates consolidating workloads:
- Reduces runtime hours by utilization improvement factor
- Proportionally reduces cost and energy

#### 5.4 Custom Scenarios

Arbitrary multipliers for cost, energy, and carbon.

**Confidence Impact:** -15% (relies on user-provided estimates)

---

## 6. Data Validation

### Schema Detection

Automatic detection of data source type based on column patterns:
- AWS CUR: `lineItem/`, `product/` prefixes
- GCP Billing: `billing_account_id`, `service.description`
- Snowflake: `QUERY_ID`, `WAREHOUSE_NAME`, `TOTAL_ELAPSED_TIME`
- Databricks: `workspace_id`, `sku_name`, `usage_quantity`

### Validation Rules

1. **Required Fields** - Must be present and non-empty
2. **Type Checking** - Numbers, dates, strings validated
3. **Range Validation** - Reasonable bounds for values
4. **Completeness** - Percentage of fields populated

### Validation Messages

| Type | Impact | Example |
|------|--------|---------|
| Error | Blocks processing | Required column missing |
| Warning | Reduces confidence | Some rows missing values |
| Info | No impact | Processing statistics |

---

## 7. Limitations and Scope

### Included

- Scope 2 emissions (electricity consumption)
- Operational energy (compute, cooling)
- Direct cloud costs

### Excluded

- **Scope 1 emissions** - On-site fuel combustion
- **Scope 3 emissions** - Hardware manufacturing, supply chain
- **Time-of-day variations** - Grid intensity changes hourly
- **Marginal vs Average emissions** - Uses average grid intensity
- **RECs/Offsets** - Not automatically applied

### Accuracy Considerations

- PUE varies by season, time of day, and workload
- Power consumption varies with utilization (we use ~75% of TDP)
- Grid intensity data is annual average
- Pricing is on-demand; reserved/spot pricing varies

---

## 8. Data Sources and References

### Carbon Intensity

1. **EPA eGRID** - https://www.epa.gov/egrid
   - U.S. regional grid emissions data
   - Updated annually

2. **Ember** - https://ember-climate.org/data/
   - Global electricity data
   - Country and regional coverage

3. **IEA** - https://www.iea.org/data-and-statistics
   - Global energy statistics
   - World average emissions

### PUE Data

1. **AWS Sustainability** - https://sustainability.aboutamazon.com/
2. **Google Environmental Report** - https://sustainability.google/reports/
3. **Microsoft Sustainability** - https://www.microsoft.com/sustainability
4. **Uptime Institute** - https://uptimeinstitute.com/

### Hardware Specifications

1. **NVIDIA Data Center GPUs** - https://www.nvidia.com/en-us/data-center/
2. **AMD Instinct** - https://www.amd.com/en/graphics/instinct-server-accelerators
3. **Cloud Provider Documentation**
   - AWS Instance Types
   - GCP Machine Types
   - Azure VM Sizes

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 2024 | Initial methodology documentation |

---

*This methodology is designed to be transparent, auditable, and defensible for enterprise use cases including ESG reporting and financial planning.*
