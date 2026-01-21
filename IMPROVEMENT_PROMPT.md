# Helios Platform Improvement Prompt

> **Use with**: Claude Opus 4.5 or equivalent advanced AI assistant  
> **Context**: AI IDE pair programming session  
> **Last Updated**: 2026-01-21

---

## System Context

You are Claude Opus 4.5, an advanced AI assistant specialized in:
- **Software engineering** (TypeScript, Next.js 14, React, Firebase, Python)
- **Sustainability technology** (carbon accounting, energy metrics, ESG reporting)
- **User-centric design** (accessibility, data visualization, enterprise UX)

You are helping improve **Helios**, a decision-grade AI infrastructure cost and energy intelligence platform. Helios helps organizations track, analyze, and reduce the cost, energy consumption, and carbon footprint of their AI and cloud workloads.

---

## Platform Overview

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, TailwindCSS |
| Backend | Firebase (Auth, Firestore, Functions), Next.js API routes |
| Data | CSV ingestion, real-time calculations, historical tracking |
| Export | Static export (`output: 'export'`), PDF/CSV report generation |
| Integrations | AWS, GCP, Azure, Snowflake, Databricks (planned) |

### Current Features
- Multi-provider cloud cost aggregation
- Energy (kWh) and carbon (kgCO₂e) calculations per workload
- Confidence scoring for data quality transparency
- Team/organization management with RBAC
- Assumption panel for customizable emission factors
- GPU fleet tracking and optimization recommendations
- Historical trend analysis and comparisons

---

## Sample Report Output (Current State)

```csv
Helios Energy Report,2026-01-21T17:28:22.791Z

Summary
Total Workloads,9
Total Energy (kWh),0.29
Total Carbon (kg CO2),0.1
Avg Confidence,70%

By Provider,Count,Energy (kWh),Carbon (kg)
Unknown,9,0.29,0.10

By Region,Count,Energy (kWh),Carbon (kg)
unknown,9,0.29,0.10
```

---

## Critical Issues to Address

### 1. Data Attribution Problems
| Issue | Impact | Root Cause |
|-------|--------|------------|
| High "Unknown" rate for providers/regions | Breakdowns are useless | Missing metadata extraction, no API integrations |
| 70% average confidence | Users distrust estimates | Reliance on heuristics, no real-time grid data |
| No per-workload granularity | Can't identify optimization targets | Aggregation too aggressive |

### 2. Report Quality Gaps
- **No timestamps or trends**: Can't track progress over time
- **No benchmarks**: Users can't compare against industry or historical baselines
- **Raw CSV format**: Machine-readable but not actionable or engaging
- **Missing recommendations**: Reports describe problems but don't prescribe solutions

### 3. Missing Capabilities
- No carbon-aware scheduling recommendations
- No integration with real-time grid carbon intensity APIs (e.g., Electricity Maps, WattTime)
- No Scope 3 emissions tracking (supply chain, embodied carbon)
- No predictive analytics or forecasting
- No alerting or threshold notifications

### 4. UX/Engagement Issues
- Reports feel like logs, not decision tools
- No customization or personalization
- No gamification or sustainability analogies
- Limited accessibility considerations

---

## Target Users

| Persona | Needs | Success Metric |
|---------|-------|----------------|
| **AI Developer** | Quick feedback on model training energy | < 5 sec to understand impact |
| **Cloud Engineer** | Cost-carbon tradeoff analysis | Identify top 3 optimization opportunities |
| **ESG/Sustainability Lead** | Compliance-ready reports | Export audit-ready PDF in 1 click |
| **Finance/FinOps** | Budget forecasting with carbon factor | Accurate 90-day projections |

---

## Your Task

Analyze the current state and provide a **comprehensive improvement plan** structured as follows:

### 1. Executive Summary
- High-level overview of proposed changes
- Estimated impact (quantified where possible)
- Strategic alignment with EU AI Act, SEC climate disclosure rules, and ESG frameworks

### 2. Data Accuracy Improvements

#### 2.1 Reduce "Unknown" Attribution
- **API Integrations**: Steps to integrate AWS Carbon Footprint Tool, GCP Carbon Sense, Azure Emissions Impact Dashboard
- **ML-based inference**: Train models to predict provider/region from workload patterns
- **User tagging**: Allow manual attribution with autocomplete suggestions
- **IP geolocation**: Fallback for region detection

#### 2.2 Improve Confidence Scores
- **Real-time grid data**: Integrate Electricity Maps or WattTime API for live carbon intensity
- **Hardware-specific PUE**: Use actual datacenter efficiency ratios instead of estimates
- **Confidence breakdown**: Show users exactly what factors affect their score

Provide implementation guidance with:
```typescript
// Example: Confidence calculation with transparency
interface ConfidenceBreakdown {
  overall: number;
  factors: {
    providerKnown: { weight: 0.3; score: number; source: string };
    regionKnown: { weight: 0.25; score: number; source: string };
    gridDataRealtime: { weight: 0.25; score: number; source: string };
    hardwareSpecific: { weight: 0.2; score: number; source: string };
  };
}
```

### 3. Enhanced Reporting

#### 3.1 New Metrics & Dimensions
- Per-workload breakdown with drill-down
- Scope 1/2/3 emissions categorization
- Cost-per-kgCO₂e efficiency metric
- PUE-adjusted energy calculations
- Water usage estimates (for applicable regions)

#### 3.2 Output Format Improvements
- **Interactive dashboard**: Real-time charts with Recharts/D3
- **PDF exports**: Branded, chart-rich reports using react-pdf
- **API endpoints**: JSON/GraphQL for programmatic access
- **Slack/Teams integration**: Scheduled report delivery

#### 3.3 Contextual Insights
- Sustainability analogies (e.g., "Equivalent to 47 smartphone charges")
- Industry benchmarks (e.g., "23% below average for ML training workloads")
- Historical comparisons (e.g., "↓12% vs. last month")

### 4. Feature Roadmap

#### Phase 1: Quick Wins (1-3 months)
| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| Confidence explainer | Tooltip showing score breakdown | S | High |
| Basic recommendations | "Consider region X for 30% lower carbon" | M | High |
| Provider detection | Parse CSV headers for AWS/GCP/Azure patterns | S | Medium |
| Export improvements | Add charts to PDF, improve CSV structure | M | Medium |

#### Phase 2: Integrations (3-6 months)
| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| Electricity Maps API | Real-time grid carbon intensity | M | Very High |
| Cloud provider APIs | Direct cost/usage data ingestion | L | Very High |
| Carbon-aware scheduling | Recommend optimal run times | L | High |
| Trend forecasting | 30/60/90 day projections | M | Medium |

#### Phase 3: Platform Maturity (6+ months)
| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| Custom dashboards | User-configurable widgets | L | High |
| Alert system | Threshold notifications via email/Slack | M | High |
| Community benchmarks | Anonymous aggregated comparisons | L | Medium |
| Carbon offsetting marketplace | Partner integrations for offsets | L | Medium |

For each feature, provide:
- **Rationale**: Why this matters
- **Implementation steps**: High-level approach with code snippets where relevant
- **Challenges**: Potential blockers and mitigations
- **Success metrics**: How to measure impact

### 5. UX/UI Enhancements

#### 5.1 Report Engagement
- Progress rings showing targets vs. actuals
- Color-coded severity indicators
- Expandable sections with progressive disclosure
- Mobile-responsive report viewer

#### 5.2 Gamification & Motivation
- Sustainability score (0-100) with badges
- Team leaderboards (opt-in)
- Achievement system ("First carbon-neutral sprint!")
- Social sharing for milestones

#### 5.3 Accessibility
- WCAG 2.1 AA compliance checklist
- Screen reader optimization
- High contrast mode
- Keyboard navigation improvements

### 6. Technical Architecture

#### 6.1 Backend Refactoring
```
┌─────────────────────────────────────────────────────────┐
│                    Data Pipeline                        │
├─────────────┬─────────────┬─────────────┬──────────────┤
│ Ingestion   │ Enrichment  │ Calculation │ Storage      │
│ (CSV/API)   │ (ML/APIs)   │ (Engine)    │ (Firestore)  │
└─────────────┴─────────────┴─────────────┴──────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Real-time Enrichment Layer                 │
├─────────────┬─────────────┬─────────────┬──────────────┤
│ Electricity │ Provider    │ Hardware    │ Geolocation  │
│ Maps API    │ Detection   │ Lookup      │ Service      │
└─────────────┴─────────────┴─────────────┴──────────────┘
```

#### 6.2 Security & Privacy
- Data anonymization for benchmarking
- SOC 2 Type II compliance path
- GDPR data retention controls
- Encryption at rest and in transit

#### 6.3 Scaling Considerations
- Batch processing for large uploads (>10k workloads)
- Caching layer for repeat calculations
- Rate limiting for API integrations
- Cost optimization for Firebase usage

### 7. Monetization Strategy

#### Pricing Tiers
| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 100 workloads/mo, basic reports, 30-day retention |
| **Pro** | $49/mo | 10k workloads, API access, PDF exports, 1-year retention |
| **Enterprise** | Custom | Unlimited, SSO, custom integrations, dedicated support |

#### Growth Levers
- "Powered by Helios" badge for free tier
- Open-source calculation methodology (builds trust)
- Integration partnerships (dbt, Airflow, MLflow)
- Developer community and documentation

### 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API rate limits | Medium | High | Caching, graceful degradation |
| Data accuracy liability | Medium | High | Clear disclaimers, confidence scores |
| Privacy concerns | Low | Very High | Anonymization, compliance certifications |
| Integration dependencies | Medium | Medium | Fallback calculations, multi-provider |

### 9. Compliance & Standards

- **EU AI Act**: Document energy consumption of AI systems
- **SEC Climate Disclosure**: Scope 1/2/3 reporting readiness
- **GHG Protocol**: Align calculations with corporate standard
- **ISO 14064**: Greenhouse gas accounting alignment

---

## Deliverables Expected

1. **Detailed technical specification** for top 3 priority features
2. **Code snippets** for critical implementations (TypeScript/Python)
3. **Database schema updates** if needed
4. **API design** for new integrations
5. **UI mockup descriptions** for key screens
6. **Testing strategy** for accuracy validation

---

## Prioritized Action Items

End your response with **5 concrete next steps** I can implement immediately, formatted as:

```markdown
## Immediate Action Items

### 1. [Feature Name]
- **Why**: [1-sentence rationale]
- **How**: [Implementation approach]
- **Time**: [Estimated effort]
- **Files to modify**: [Specific paths]

### 2. [Feature Name]
...
```

---

## Additional Context

- The platform already has a tutorial/tooltip system for user onboarding
- Loader components are standardized across the app
- SEO optimization is complete with metadata, robots.txt, and sitemap
- Organization settings include a Preferences tab for user controls

Be thorough, creative, and practical. Draw from best practices in:
- **CodeCarbon** (Python library for ML carbon tracking)
- **Cloud Carbon Footprint** (open-source multi-cloud tool)
- **WattTime** / **Electricity Maps** (real-time grid APIs)
- **Climatiq** (carbon calculation API)

Prioritize changes that improve **accuracy**, **actionability**, and **user trust**.
