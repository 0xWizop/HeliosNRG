'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ConfidenceBadge } from './ConfidenceBadge';

interface WorkloadData {
  name: string;
  provider: string;
  region: string;
  cost: number;
  energy: number;
  carbon: number;
  utilization: number;
}

interface DashboardChartsProps {
  workloads?: WorkloadData[];
}

const COLORS = ['#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function DashboardCharts({ workloads = [] }: DashboardChartsProps) {
  const [selectedMetric, setSelectedMetric] = useState<'cost' | 'energy' | 'carbon'>('cost');

  // Generate chart data from real workloads
  const { providerData, regionData, topWorkloadsData } = useMemo(() => {
    // Group by provider
    const byProvider: Record<string, { cost: number; energy: number; carbon: number }> = {};
    // Group by region
    const byRegion: Record<string, { cost: number; energy: number; carbon: number }> = {};
    
    workloads.forEach(w => {
      // Provider aggregation
      if (!byProvider[w.provider]) {
        byProvider[w.provider] = { cost: 0, energy: 0, carbon: 0 };
      }
      byProvider[w.provider].cost += w.cost;
      byProvider[w.provider].energy += w.energy;
      byProvider[w.provider].carbon += w.carbon;

      // Region aggregation
      if (!byRegion[w.region]) {
        byRegion[w.region] = { cost: 0, energy: 0, carbon: 0 };
      }
      byRegion[w.region].cost += w.cost;
      byRegion[w.region].energy += w.energy;
      byRegion[w.region].carbon += w.carbon;
    });

    const providerData = Object.entries(byProvider)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.cost - a.cost);

    const regionData = Object.entries(byRegion)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 6);

    const topWorkloadsData = workloads
      .slice(0, 10)
      .map(w => ({
        workload: w.name.length > 20 ? w.name.substring(0, 17) + '...' : w.name,
        cost: w.cost,
        energy: w.energy,
        provider: w.provider,
      }));

    return { providerData, regionData, topWorkloadsData };
  }, [workloads]);

  // Show empty state if no data
  if (workloads.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-neutral-500 text-sm">No workload data available for charts. Upload data to see visualizations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Series Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="card-header mb-0">Trends Over Time</h3>
            <p className="text-sm text-slate-500">Weekly aggregated metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="input text-sm w-32"
            >
              <option value="cost">Cost ($)</option>
              <option value="energy">Energy (kWh)</option>
              <option value="carbon">Carbon (kg)</option>
            </select>
            <ConfidenceBadge score={75} size="sm" />
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topWorkloadsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="workload" tick={{ fontSize: 10 }} stroke="#64748b" angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cost']}
              />
              <Bar 
                dataKey={selectedMetric} 
                fill={selectedMetric === 'cost' ? '#f59e0b' : selectedMetric === 'energy' ? '#22c55e' : '#10b981'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* By Provider */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-header mb-0">By Provider</h3>
            <ConfidenceBadge score={72} size="sm" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#64748b" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cost']}
                />
                <Bar dataKey="cost" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-header mb-0">By Region</h3>
            <ConfidenceBadge score={78} size="sm" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="cost"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: '#64748b' }}
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Cost']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cost vs Energy Scatter */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="card-header mb-0">Cost vs Energy Analysis</h3>
            <p className="text-sm text-slate-500">
              Identify workloads with disproportionate cost or energy consumption
            </p>
          </div>
          <ConfidenceBadge score={70} size="sm" />
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="cost" 
                name="Cost" 
                unit="$" 
                tick={{ fontSize: 11 }} 
                stroke="#64748b"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                dataKey="energy" 
                name="Energy" 
                unit=" kWh" 
                tick={{ fontSize: 11 }} 
                stroke="#64748b"
                tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
                label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11 } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => [
                  name === 'cost' ? `$${value.toLocaleString()}` : `${value.toLocaleString()} kWh`,
                  name === 'cost' ? 'Cost' : 'Energy'
                ]}
                labelFormatter={(label) => {
                  const item = topWorkloadsData.find((d: { cost: number; workload: string }) => d.cost === label);
                  return item?.workload || '';
                }}
              />
              <Legend />
              <Scatter 
                name="Workloads" 
                data={topWorkloadsData} 
                fill="#f59e0b"
              >
                {topWorkloadsData.map((entry: { provider: string }, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.provider === 'aws' ? '#f59e0b' :
                      entry.provider === 'gcp' ? '#22c55e' :
                      entry.provider === 'azure' ? '#3b82f6' : '#8b5cf6'
                    }
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-600">AWS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-600">GCP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-600">Azure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-slate-600">Other</span>
          </div>
        </div>
      </div>

      {/* Carbon Intensity by Region */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="card-header mb-0">Carbon Intensity by Region</h3>
            <p className="text-sm text-slate-500">
              Grid carbon intensity affects emissions regardless of workload efficiency
            </p>
          </div>
          <ConfidenceBadge score={82} size="sm" />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => [
                  name === 'intensity' ? `${value} gCO₂/kWh` : `${value.toLocaleString()} kgCO₂e`,
                  name === 'intensity' ? 'Grid Intensity' : 'Total Carbon'
                ]}
              />
              <Legend />
              <Bar dataKey="carbon" name="Carbon (kgCO₂e)" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
