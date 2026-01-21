'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookOpen, 
  Zap, 
  DollarSign, 
  Leaf, 
  Shield, 
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Server,
  Globe,
  TrendingUp,
  CheckCircle
} from 'lucide-react';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'energy', label: 'Energy Calculation' },
  { id: 'carbon', label: 'Carbon Calculation' },
  { id: 'cost', label: 'Cost Calculation' },
  { id: 'confidence', label: 'Confidence Scoring' },
  { id: 'data-sources', label: 'Data Sources' },
  { id: 'limitations', label: 'Limitations' },
];

export default function MethodologyPage() {
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800 sticky top-0 z-50 bg-neutral-950/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-sm font-mono font-medium tracking-wider text-neutral-100">HELIOS</span>
            <span className="text-neutral-600 font-mono text-xs">/</span>
            <span className="text-neutral-400 font-mono text-xs">Documentation</span>
          </Link>
          <Link href="/dashboard" className="text-neutral-400 hover:text-neutral-100 flex items-center gap-2 text-xs font-mono uppercase tracking-wider transition-colors">
            <ArrowLeft className="w-3 h-3" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar - Navigation */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-neutral-800">
          <nav className="sticky top-14 p-6 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-4">Documentation</p>
            <ul className="space-y-1">
              {sections.map(({ id, label }) => (
                <li key={id}>
                  <button
                    onClick={() => scrollToSection(id)}
                    className={`w-full text-left px-3 py-2 text-sm font-mono transition-colors ${
                      activeSection === id
                        ? 'text-amber-500 bg-amber-500/10 border-l-2 border-amber-500'
                        : 'text-neutral-400 hover:text-neutral-100 border-l-2 border-transparent'
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-neutral-800">
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-3">Resources</p>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    Data Sources
                  </a>
                </li>
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-8 sm:py-12 lg:px-12">
          {/* Mobile Navigation */}
          <div className="lg:hidden mb-8">
            <select 
              value={activeSection}
              onChange={(e) => scrollToSection(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 px-4 py-3 text-sm font-mono"
            >
              {sections.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>

          {/* Overview Section */}
          <section id="overview" className="mb-16 scroll-mt-20">
            <div className="flex items-center gap-2 text-amber-500 mb-3">
              <BookOpen className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Methodology</span>
            </div>
            <h1 className="text-3xl font-mono text-neutral-100 tracking-tight mb-4">
              Calculation Methodology
            </h1>
            <p className="text-neutral-400 text-lg leading-relaxed max-w-2xl">
              Helios converts your cloud infrastructure data into actionable cost, energy, and carbon metrics 
              using transparent, auditable calculations.
            </p>

            {/* Key Stats Visual */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-neutral-900 border border-neutral-800 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-amber-500/10 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Cost</span>
                </div>
                <p className="text-sm text-neutral-400">Real billing data with reference pricing fallback</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-amber-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Energy</span>
                </div>
                <p className="text-sm text-neutral-400">Power consumption × runtime with PUE adjustment</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-amber-500/10 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">Carbon</span>
                </div>
                <p className="text-sm text-neutral-400">Energy × regional grid carbon intensity</p>
              </div>
            </div>

            {/* Core Principles */}
            <div className="mt-10 p-6 bg-neutral-900/50 border border-neutral-800">
              <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                Core Principles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-neutral-200 font-medium">Deterministic</p>
                    <p className="text-xs text-neutral-500">Same inputs always produce same outputs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-neutral-200 font-medium">Transparent</p>
                    <p className="text-xs text-neutral-500">Every assumption is visible and editable</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-neutral-200 font-medium">Auditable</p>
                    <p className="text-xs text-neutral-500">Full calculation trace for compliance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-neutral-200 font-medium">Confidence-Scored</p>
                    <p className="text-xs text-neutral-500">Uncertainty is always quantified</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-mono text-neutral-100 tracking-tight mb-6">How It Works</h2>
            
            {/* Flow Diagram */}
            <div className="bg-neutral-900 border border-neutral-800 p-8">
              <div className="flex items-center justify-between">
                {/* Step 1 */}
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 mx-auto mb-3 flex items-center justify-center">
                    <Server className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-xs font-mono text-amber-500 uppercase tracking-wider mb-1">Step 1</p>
                  <p className="text-sm text-neutral-200 font-medium">Data Ingestion</p>
                  <p className="text-xs text-neutral-500 mt-1">Upload CSV, connect cloud APIs</p>
                </div>
                
                <ArrowRight className="w-5 h-5 text-neutral-700 shrink-0" />
                
                {/* Step 2 */}
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 mx-auto mb-3 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-xs font-mono text-amber-500 uppercase tracking-wider mb-1">Step 2</p>
                  <p className="text-sm text-neutral-200 font-medium">Normalization</p>
                  <p className="text-xs text-neutral-500 mt-1">Map to standard schema</p>
                </div>
                
                <ArrowRight className="w-5 h-5 text-neutral-700 shrink-0" />
                
                {/* Step 3 */}
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 mx-auto mb-3 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-xs font-mono text-amber-500 uppercase tracking-wider mb-1">Step 3</p>
                  <p className="text-sm text-neutral-200 font-medium">Calculation</p>
                  <p className="text-xs text-neutral-500 mt-1">Apply formulas with assumptions</p>
                </div>
                
                <ArrowRight className="w-5 h-5 text-neutral-700 shrink-0" />
                
                {/* Step 4 */}
                <div className="flex-1 text-center">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 mx-auto mb-3 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-xs font-mono text-amber-500 uppercase tracking-wider mb-1">Step 4</p>
                  <p className="text-sm text-neutral-200 font-medium">Results</p>
                  <p className="text-xs text-neutral-500 mt-1">Cost, energy, carbon metrics</p>
                </div>
              </div>
            </div>
          </section>

          {/* Energy Calculation */}
          <section id="energy" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-mono text-neutral-100 tracking-tight mb-6">Energy Calculation</h2>
            
            {/* Formula Box */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 mb-6">
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-2">Formula</p>
              <p className="text-xl font-mono text-neutral-100">
                Energy <span className="text-neutral-500">(kWh)</span> = <span className="text-amber-500">(Runtime × Power × PUE)</span> / 1000
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-200 mb-2">Runtime Hours</h3>
                <p className="text-sm text-neutral-500">
                  Actual workload duration from billing data, job logs, or query timestamps.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-neutral-200 mb-2">Power Draw (Watts)</h3>
                <p className="text-sm text-neutral-500 mb-3">Determined by priority:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 bg-amber-500/20 text-amber-500 text-xs flex items-center justify-center font-mono">1</span>
                    <span className="text-neutral-300">Customer measurement</span>
                    <span className="text-neutral-600">—</span>
                    <span className="text-neutral-500">Highest confidence</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 bg-neutral-800 text-neutral-400 text-xs flex items-center justify-center font-mono">2</span>
                    <span className="text-neutral-300">Instance type lookup</span>
                    <span className="text-neutral-600">—</span>
                    <span className="text-neutral-500">Reference database</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 bg-neutral-800 text-neutral-400 text-xs flex items-center justify-center font-mono">3</span>
                    <span className="text-neutral-300">GPU TDP specs</span>
                    <span className="text-neutral-600">—</span>
                    <span className="text-neutral-500">Manufacturer data</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 bg-neutral-800 text-neutral-400 text-xs flex items-center justify-center font-mono">4</span>
                    <span className="text-neutral-300">Estimation</span>
                    <span className="text-neutral-600">—</span>
                    <span className="text-neutral-500">Lowest confidence</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-200 mb-3">PUE by Provider</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-neutral-800">
                  <div className="bg-neutral-900 p-4 text-center">
                    <p className="text-lg font-mono text-neutral-100">1.135</p>
                    <p className="text-xs text-neutral-500 mt-1">AWS</p>
                  </div>
                  <div className="bg-neutral-900 p-4 text-center">
                    <p className="text-lg font-mono text-neutral-100">1.10</p>
                    <p className="text-xs text-neutral-500 mt-1">GCP</p>
                  </div>
                  <div className="bg-neutral-900 p-4 text-center">
                    <p className="text-lg font-mono text-neutral-100">1.18</p>
                    <p className="text-xs text-neutral-500 mt-1">Azure</p>
                  </div>
                  <div className="bg-neutral-900 p-4 text-center">
                    <p className="text-lg font-mono text-neutral-100">1.58</p>
                    <p className="text-xs text-neutral-500 mt-1">Industry Avg</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Carbon Calculation */}
          <section id="carbon" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-mono text-neutral-100 tracking-tight mb-6">Carbon Calculation</h2>
            
            <div className="bg-neutral-900 border border-neutral-800 p-6 mb-6">
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-2">Formula</p>
              <p className="text-xl font-mono text-neutral-100">
                Carbon <span className="text-neutral-500">(kgCO₂e)</span> = <span className="text-amber-500">Energy × Grid Intensity</span> / 1000
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-200 mb-3">Regional Carbon Intensity</h3>
              <p className="text-sm text-neutral-500 mb-4">
                Grid intensity varies by region based on energy mix. Lower values indicate cleaner grids.
              </p>
              
              {/* Visual Bar Chart */}
              <div className="space-y-3">
                {[
                  { region: 'eu-north-1 (Sweden)', value: 28, color: 'bg-amber-500' },
                  { region: 'eu-west-3 (France)', value: 56, color: 'bg-amber-500' },
                  { region: 'us-west-2 (Oregon)', value: 117, color: 'bg-amber-500' },
                  { region: 'us-east-1 (Virginia)', value: 337, color: 'bg-amber-500/70' },
                  { region: 'ap-south-1 (Mumbai)', value: 632, color: 'bg-amber-500/50' },
                ].map((item) => (
                  <div key={item.region} className="flex items-center gap-4">
                    <span className="text-xs text-neutral-400 w-36 shrink-0 font-mono">{item.region}</span>
                    <div className="flex-1 h-6 bg-neutral-800 relative">
                      <div 
                        className={`h-full ${item.color}`}
                        style={{ width: `${(item.value / 700) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-neutral-300 w-16 text-right">{item.value} g</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Cost Calculation */}
          <section id="cost" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-mono text-neutral-100 tracking-tight mb-6">Cost Calculation</h2>
            
            <div className="bg-neutral-900 border border-neutral-800 p-6 mb-6">
              <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-2">Priority Order</p>
              <div className="flex items-center gap-4">
                <span className="px-3 py-1.5 bg-amber-500/20 text-amber-500 text-sm font-mono">Exact Billing</span>
                <ChevronRight className="w-4 h-4 text-neutral-600" />
                <span className="px-3 py-1.5 bg-neutral-800 text-neutral-300 text-sm font-mono">Reference Pricing</span>
                <ChevronRight className="w-4 h-4 text-neutral-600" />
                <span className="px-3 py-1.5 bg-neutral-800 text-neutral-500 text-sm font-mono">Estimation</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 border border-neutral-800">
                <p className="text-sm text-neutral-200 font-medium mb-1">Exact Billing</p>
                <p className="text-xs text-neutral-500">AWS CUR, GCP Billing Export, Azure Cost Management — highest confidence</p>
              </div>
              <div className="p-4 border border-neutral-800">
                <p className="text-sm text-neutral-200 font-medium mb-1">Reference Pricing</p>
                <p className="text-xs text-neutral-500">On-demand pricing from reference database: Hourly Rate × Runtime Hours</p>
              </div>
              <div className="p-4 border border-neutral-800">
                <p className="text-sm text-neutral-200 font-medium mb-1">Estimation</p>
                <p className="text-xs text-neutral-500">Based on CPU/GPU count and memory — lowest confidence</p>
              </div>
            </div>
          </section>

          {/* Confidence Scoring */}
          <section id="confidence" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-mono text-neutral-100 tracking-tight mb-6">Confidence Scoring</h2>
            
            <p className="text-sm text-neutral-500 mb-6">
              Every calculation includes a confidence score (0-100%) based on data quality. 
              Scores start at 50% and adjust based on available data.
            </p>

            {/* Confidence Scale Visual */}
            <div className="mb-8">
              <div className="h-3 flex">
                <div className="flex-1 bg-neutral-700" />
                <div className="flex-1 bg-neutral-600" />
                <div className="flex-1 bg-amber-600/70" />
                <div className="flex-1 bg-amber-500" />
              </div>
              <div className="flex mt-2">
                <div className="flex-1 text-center">
                  <p className="text-xs font-mono text-neutral-500">0-39%</p>
                  <p className="text-[10px] text-neutral-600">Unverified</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs font-mono text-neutral-500">40-59%</p>
                  <p className="text-[10px] text-neutral-600">Low</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs font-mono text-neutral-400">60-79%</p>
                  <p className="text-[10px] text-neutral-600">Medium</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs font-mono text-amber-500">80-100%</p>
                  <p className="text-[10px] text-neutral-600">High</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-200 mb-3">Increases Confidence</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-neutral-400">
                    <span className="text-amber-500 font-mono text-xs">+15-20%</span>
                    Exact billing data
                  </li>
                  <li className="flex items-center gap-2 text-neutral-400">
                    <span className="text-amber-500 font-mono text-xs">+10-15%</span>
                    Customer measurements
                  </li>
                  <li className="flex items-center gap-2 text-neutral-400">
                    <span className="text-amber-500 font-mono text-xs">+8%</span>
                    Known region
                  </li>
                  <li className="flex items-center gap-2 text-neutral-400">
                    <span className="text-amber-500 font-mono text-xs">+5%</span>
                    Recognized instance
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-neutral-200 mb-3">Decreases Confidence</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-neutral-400">
                    <span className="text-neutral-500 font-mono text-xs">-10-20%</span>
                    Estimated power
                  </li>
                  <li className="flex items-center gap-2 text-neutral-400">
                    <span className="text-neutral-500 font-mono text-xs">-10-15%</span>
                    Unknown region
                  </li>
                  <li className="flex items-center gap-2 text-neutral-400">
                    <span className="text-neutral-500 font-mono text-xs">-10-15%</span>
                    Missing fields
                  </li>
                  <li className="flex items-center gap-2 text-neutral-400">
                    <span className="text-neutral-500 font-mono text-xs">-15%</span>
                    Validation errors
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Sources */}
          <section id="data-sources" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-mono text-neutral-100 tracking-tight mb-6">Data Sources</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-neutral-800">
                <p className="text-sm text-neutral-200 font-medium mb-2">Grid Carbon Intensity</p>
                <ul className="text-xs text-neutral-500 space-y-1">
                  <li>EPA eGRID 2022 (US)</li>
                  <li>Ember 2023 (Europe, APAC)</li>
                  <li>IEA 2023 (Global)</li>
                </ul>
              </div>
              <div className="p-4 border border-neutral-800">
                <p className="text-sm text-neutral-200 font-medium mb-2">PUE Values</p>
                <ul className="text-xs text-neutral-500 space-y-1">
                  <li>AWS Sustainability Report 2023</li>
                  <li>Google Environmental Report 2023</li>
                  <li>Microsoft Sustainability Report 2023</li>
                </ul>
              </div>
              <div className="p-4 border border-neutral-800">
                <p className="text-sm text-neutral-200 font-medium mb-2">Instance Specifications</p>
                <ul className="text-xs text-neutral-500 space-y-1">
                  <li>Cloud provider documentation</li>
                  <li>Hardware manufacturer specs</li>
                  <li>Third-party benchmarks</li>
                </ul>
              </div>
              <div className="p-4 border border-neutral-800">
                <p className="text-sm text-neutral-200 font-medium mb-2">Pricing Data</p>
                <ul className="text-xs text-neutral-500 space-y-1">
                  <li>AWS, GCP, Azure pricing APIs</li>
                  <li>Updated monthly</li>
                  <li>On-demand rates</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Limitations */}
          <section id="limitations" className="mb-16 scroll-mt-20">
            <h2 className="text-xl font-mono text-neutral-100 tracking-tight mb-6">Limitations</h2>
            
            <div className="space-y-4">
              {[
                { title: 'Historical snapshots', desc: 'Analysis reflects data at time of upload. Real-time changes are not captured.' },
                { title: 'Time-of-day variations', desc: 'Grid carbon intensity varies throughout the day. We use annual averages.' },
                { title: 'Scope 3 emissions', desc: 'Hardware manufacturing and supply chain emissions are not included.' },
                { title: 'Cooling efficiency', desc: 'PUE is an average; actual efficiency may vary by workload and season.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 p-4 border border-neutral-800">
                  <div className="w-1 h-1 bg-neutral-600 rounded-full mt-2 shrink-0" />
                  <div>
                    <p className="text-sm text-neutral-200 font-medium">{item.title}</p>
                    <p className="text-xs text-neutral-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-8 border-t border-neutral-800 text-center">
            <p className="text-xs text-neutral-600 font-mono">Last updated: January 2026</p>
          </footer>
        </main>

        {/* Right Sidebar - On This Page */}
        <aside className="hidden xl:block w-56 shrink-0">
          <div className="sticky top-14 p-6 h-[calc(100vh-3.5rem)]">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-4">On This Page</p>
            <ul className="space-y-2">
              {sections.map(({ id, label }) => (
                <li key={id}>
                  <button
                    onClick={() => scrollToSection(id)}
                    className={`text-xs transition-colors ${
                      activeSection === id
                        ? 'text-amber-500'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
