# Helios Energy

**Decision-grade AI infrastructure cost & energy intelligence**

Helios is a production-ready web platform that enables companies to precisely analyze, model, and reduce the cost and energy footprint of AI and data infrastructure using customer-provided first-party data and auditable, explainable models.

## Core Principles

- **Precision from Customer Data** - All calculations are based on first-party data, not inference
- **Deterministic Calculations** - Same inputs always produce same outputs, no black boxes
- **Transparent Assumptions** - Every assumption is visible, editable, and source-labeled
- **Confidence Scoring** - Never fake certainty; every result includes a confidence score
- **No Paid AI APIs** - All calculations are deterministic and explainable

## Features

### Data Ingestion
- AWS Cost & Usage Reports (CSV)
- GCP Billing Export
- Snowflake Query History
- Databricks Usage Tables
- Custom AI Workload CSV

### Core Analytics
- **Cost Analysis** - Exact billing data takes precedence; never estimate when data exists
- **Energy Modeling** - `Energy = (Runtime × Power × PUE) / 1000`
- **Carbon Footprint** - `Carbon = Energy × Grid Intensity`
- **Confidence Scoring** - Data quality-based confidence for all metrics

### Optimization Tools
- Infrastructure Energy Map
- AI Workload Analyzer
- Data Warehouse Optimizer
- Scenario Simulator ("What if we move X → Y")
- Executive Reporting (PDF export with methodology appendix)

## Quick Start

```bash
# Install dependencies
npm install

# Set up database
npm run db:setup

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

## Project Structure

```
helios-energy/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   ├── dashboard/          # Main dashboard
│   │   └── methodology/        # Methodology documentation
│   ├── components/             # React components
│   │   ├── AssumptionPanel.tsx
│   │   ├── ConfidenceBadge.tsx
│   │   ├── DashboardCharts.tsx
│   │   └── DataUploader.tsx
│   ├── lib/
│   │   ├── calculations/       # Core calculation modules
│   │   │   ├── carbon.ts       # Carbon emissions calculations
│   │   │   ├── confidence.ts   # Confidence scoring
│   │   │   ├── cost.ts         # Cost calculations
│   │   │   └── energy.ts       # Energy calculations
│   │   ├── db/                 # Database layer
│   │   │   ├── schema.sql      # Database schema
│   │   │   └── sqlite.ts       # SQLite operations
│   │   ├── ingestion/          # Data ingestion
│   │   │   └── csv-parser.ts   # CSV parsing and validation
│   │   ├── reference-data/     # Reference datasets
│   │   │   └── index.ts        # Grid intensity, PUE, instance power
│   │   ├── reports/            # Report generation
│   │   │   └── generator.ts    # Executive report generator
│   │   └── scenarios/          # Scenario simulation
│   │       └── simulator.ts    # What-if analysis
│   └── types/                  # TypeScript type definitions
│       └── index.ts
├── data/
│   ├── samples/                # Sample datasets
│   │   ├── aws_cur_sample.csv
│   │   ├── custom_ai_workload_sample.csv
│   │   └── snowflake_query_history_sample.csv
│   └── uploads/                # User uploaded files
└── docs/                       # Documentation
```

## Calculation Methodology

### Energy Calculation

```
Energy (kWh) = (Runtime Hours × Power Draw (W) × PUE) / 1000
```

**Power Draw Sources (priority order):**
1. Customer measurement (highest confidence)
2. Instance type reference data
3. GPU TDP specifications
4. Estimated from characteristics (lowest confidence)

**PUE Sources:**
| Provider | PUE | Source |
|----------|-----|--------|
| AWS | 1.135 | AWS Sustainability Report 2023 |
| GCP | 1.10 | Google Environmental Report 2023 |
| Azure | 1.18 | Microsoft Sustainability Report 2023 |
| Industry Avg | 1.58 | Uptime Institute 2023 |

### Carbon Calculation

```
Carbon (kgCO₂e) = Energy (kWh) × Grid Intensity (gCO₂/kWh) / 1000
```

**Grid Intensity Data Sources:**
- United States: EPA eGRID 2022
- Europe: Ember 2023
- Asia Pacific: Ember 2023
- Global: IEA 2023

### Cost Calculation

**Priority Order:**
1. Exact billing data (highest confidence)
2. Reference pricing for known instance types
3. Estimation from resource characteristics (lowest confidence)

## Confidence Scoring

Every calculation includes a confidence score (0-100%):

| Level | Score | Description |
|-------|-------|-------------|
| High | 80-100% | Based on verified first-party data |
| Medium | 60-79% | Some values use reference data |
| Low | 40-59% | Several inputs are estimated |
| Unverified | 0-39% | Significant data gaps exist |

**Positive Factors:**
- Exact billing data (+15-20%)
- Customer-measured power (+10-15%)
- Known region with specific grid intensity (+8%)

**Negative Factors:**
- Estimated power consumption (-10-20%)
- Unknown region, using global averages (-10-15%)
- Validation errors (-15%)

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/datasets` | GET | List all datasets |
| `/api/datasets` | POST | Upload new dataset |
| `/api/workloads` | GET | Get normalized workloads |
| `/api/workloads` | POST | Save workloads |
| `/api/assumptions` | GET | Get assumption sets |
| `/api/assumptions` | POST | Save assumption set |
| `/api/scenarios` | GET | List scenarios |
| `/api/scenarios` | POST | Create scenario |

## Enterprise Features

- **No Outbound Data Sharing** - All data stays on your infrastructure
- **Audit Logging** - Track all changes to assumptions and data
- **Methodology Documentation** - Clear, defensible calculations
- **CFO/ESG-Safe Language** - Reports use appropriate business language
- **Deterministic Math Only** - No "AI-powered" claims

## Supported Data Sources

### Cloud Billing
- **AWS CUR** - Cost & Usage Reports with line-item detail
- **GCP Billing** - BigQuery export format
- **Azure Cost** - Cost Management exports

### Data Warehouses
- **Snowflake** - QUERY_HISTORY and WAREHOUSE_METERING_HISTORY
- **Databricks** - System tables and usage logs

### Custom Data
- **AI Workload CSV** - Runtime, model, instance type, GPU details

## Technology Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Charts**: Recharts
- **Database**: SQLite (metadata), DuckDB (analytics)
- **CSV Parsing**: PapaParse
- **PDF Export**: jsPDF

## Limitations

- Historical snapshots only (no real-time)
- Time-of-day grid intensity variations not modeled
- Scope 3 emissions (manufacturing) not included
- PUE is an average; actual varies by workload/season

## License

Proprietary - All rights reserved.

## Support

For enterprise support and custom deployments, contact your Helios administrator.
