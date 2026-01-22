'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Zap, Database, Cpu, Activity } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-800/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono font-medium tracking-wider">HELIOS</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/pricing" className="text-neutral-500 hover:text-neutral-200 text-xs font-mono uppercase tracking-wider transition-colors">
              Pricing
            </Link>
            <Link href="/methodology" className="hidden sm:block text-neutral-500 hover:text-neutral-200 text-xs font-mono uppercase tracking-wider transition-colors">
              Docs
            </Link>
            <Link href="/dashboard" className="btn-primary whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2">
              Launch App
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-center px-6 pt-14">
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="text-xs font-mono text-amber-500 uppercase tracking-widest">◆ Infrastructure Intelligence</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium text-neutral-100 mb-6 leading-[1.1] tracking-tight">
              See what your
              <br />
              <span className="text-amber-500">AI infrastructure</span>
              <br />
              really costs.
            </h1>
            
            <p className="text-neutral-500 text-lg leading-relaxed mb-10 max-w-md font-light">
              Precise cost, energy, and carbon analytics for GPU clusters, data warehouses, and cloud workloads. No estimates. No black boxes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/methodology" className="btn-outline inline-flex items-center gap-2">
                Read Methodology <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex gap-6 sm:gap-12">
              <div>
                <div className="text-2xl font-mono text-neutral-100">100%</div>
                <div className="text-xs font-mono text-neutral-600 uppercase tracking-wider">Deterministic</div>
              </div>
              <div>
                <div className="text-2xl font-mono text-neutral-100">0</div>
                <div className="text-xs font-mono text-neutral-600 uppercase tracking-wider">Black Boxes</div>
              </div>
              <div>
                <div className="text-2xl font-mono text-neutral-100">∞</div>
                <div className="text-xs font-mono text-neutral-600 uppercase tracking-wider">Auditability</div>
              </div>
            </div>
          </div>

          {/* Right - Visual */}
          <div className="relative hidden lg:block">
            {/* Arch/Portal frame */}
            <div className="relative aspect-[3/4] max-w-md mx-auto">
              {/* Outer glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent rounded-t-[200px] blur-2xl" />
              
              {/* Arch shape */}
              <div className="absolute inset-4 border border-neutral-800 rounded-t-[180px] overflow-hidden bg-neutral-900/50">
                {/* Inner content - abstract visualization */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    {/* Concentric circles */}
                    <div className="absolute inset-0 border border-amber-500/20 rounded-full animate-pulse" />
                    <div className="absolute inset-4 border border-amber-500/30 rounded-full" />
                    <div className="absolute inset-8 border border-amber-500/40 rounded-full" />
                    <div className="absolute inset-12 border border-amber-500/50 rounded-full" />
                    {/* Center sun */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full shadow-lg shadow-amber-500/30" />
                    </div>
                    {/* Orbital dots */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-amber-400 rounded-full" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-amber-400 rounded-full" />
                  </div>
                </div>
                
                {/* Decorative grid lines */}
                <div className="absolute inset-0 opacity-10">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="absolute left-0 right-0 border-t border-neutral-500" style={{ top: `${i * 10}%` }} />
                  ))}
                </div>
              </div>

              {/* Corner decorations */}
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-neutral-700" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-neutral-700" />
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y border-neutral-800 py-4 overflow-hidden">
        <div className="marquee">
          <div className="marquee-content flex items-center gap-4 sm:gap-8 text-sm sm:text-xl font-mono text-neutral-600">
            <span>◆ AWS CUR</span>
            <span>◆ GCP BILLING</span>
            <span>◆ AZURE COST</span>
            <span>◆ SNOWFLAKE</span>
            <span>◆ DATABRICKS</span>
            <span>◆ NVIDIA GPU</span>
            <span>◆ CUSTOM WORKLOADS</span>
            <span>◆ AWS CUR</span>
            <span>◆ GCP BILLING</span>
            <span>◆ AZURE COST</span>
            <span>◆ SNOWFLAKE</span>
            <span>◆ DATABRICKS</span>
            <span>◆ NVIDIA GPU</span>
            <span>◆ CUSTOM WORKLOADS</span>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section className="py-12 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-800">
            {/* Cost */}
            <div className="bg-neutral-950 p-8 group hover:bg-neutral-900 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <Database className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">01</span>
              </div>
              <h3 className="text-lg font-display font-medium text-neutral-100 mb-3">Cost Analysis</h3>
              <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                Ingest billing data from cloud providers. Never estimate when exact data exists.
              </p>
              <div className="font-mono text-xs text-neutral-600">
                → AWS CUR<br/>
                → GCP Billing<br/>
                → Snowflake
              </div>
            </div>

            {/* Energy */}
            <div className="bg-neutral-950 p-8 group hover:bg-neutral-900 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">02</span>
              </div>
              <h3 className="text-lg font-display font-medium text-neutral-100 mb-3">Energy Modeling</h3>
              <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                Calculate consumption using runtime, power draw, and PUE from documented sources.
              </p>
              <div className="bg-neutral-900 border border-neutral-800 p-3 font-mono text-xs">
                <span className="text-neutral-500">E =</span>
                <span className="text-amber-500"> (R × P × PUE)</span>
                <span className="text-neutral-500"> / 1000</span>
              </div>
            </div>

            {/* Carbon */}
            <div className="bg-neutral-950 p-8 group hover:bg-neutral-900 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">03</span>
              </div>
              <h3 className="text-lg font-display font-medium text-neutral-100 mb-3">Carbon Footprint</h3>
              <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                Convert energy to emissions using regional grid intensity from EPA, Ember, IEA.
              </p>
              <div className="bg-neutral-900 border border-neutral-800 p-3 font-mono text-xs">
                <span className="text-neutral-500">C =</span>
                <span className="text-emerald-500"> E × Grid Intensity</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-12 sm:py-24 px-4 sm:px-6 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8 sm:mb-12">
            <span className="text-xs font-mono text-amber-500 uppercase tracking-widest">◆ Core Principles</span>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            <div>
              <div className="text-3xl font-mono text-neutral-700 mb-4">01</div>
              <h3 className="text-sm font-mono text-neutral-100 mb-2 uppercase tracking-wider">Customer Data First</h3>
              <p className="text-sm text-neutral-500">Precision from your data, not inference or estimation.</p>
            </div>
            <div>
              <div className="text-3xl font-mono text-neutral-700 mb-4">02</div>
              <h3 className="text-sm font-mono text-neutral-100 mb-2 uppercase tracking-wider">Deterministic Math</h3>
              <p className="text-sm text-neutral-500">Every calculation is explainable and reproducible.</p>
            </div>
            <div>
              <div className="text-3xl font-mono text-neutral-700 mb-4">03</div>
              <h3 className="text-sm font-mono text-neutral-100 mb-2 uppercase tracking-wider">Auditable Assumptions</h3>
              <p className="text-sm text-neutral-500">Every value is visible, editable, and source-labeled.</p>
            </div>
            <div>
              <div className="text-3xl font-mono text-neutral-700 mb-4">04</div>
              <h3 className="text-sm font-mono text-neutral-100 mb-2 uppercase tracking-wider">Confidence Scoring</h3>
              <p className="text-sm text-neutral-500">Every result includes data quality metrics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-24 px-4 sm:px-6 border-t border-neutral-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-display font-medium text-neutral-100 mb-4">
            Ready to see the truth?
          </h2>
          <p className="text-neutral-500 mb-8">
            Upload your data and get decision-grade infrastructure intelligence in minutes.
          </p>
          <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
            Launch Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-xs font-mono text-neutral-400 tracking-wider">HELIOS</span>
          </div>
          <div className="flex items-center gap-8 text-xs font-mono text-neutral-600">
            <Link href="/methodology" className="hover:text-neutral-300 transition-colors">DOCS</Link>
            <Link href="/dashboard" className="hover:text-neutral-300 transition-colors">APP</Link>
            <span className="text-neutral-700">NO OUTBOUND DATA SHARING</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
