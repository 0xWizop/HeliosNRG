'use client';

import { useState } from 'react';
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

// Sample data for charts
const timeSeriesData = [
  { date: 'Jan 1', cost: 4200, energy: 1580, carbon: 610 },
  { date: 'Jan 8', cost: 3800, energy: 1420, carbon: 548 },
  { date: 'Jan 15', cost: 4500, energy: 1680, carbon: 648 },
  { date: 'Jan 22', cost: 3600, energy: 1350, carbon: 521 },
  { date: 'Jan 29', cost: 4100, energy: 1530, carbon: 590 },
];

const workloadTypeData = [
  { name: 'Training', cost: 52000, energy: 19500, carbon: 7500 },
  { name: 'Inference', cost: 38000, energy: 14200, carbon: 5480 },
  { name: 'Batch', cost: 22000, energy: 8200, carbon: 3160 },
  { name: 'Interactive', cost: 15000, energy: 5600, carbon: 2160 },
];

const regionData = [
  { name: 'us-east-1', cost: 45000, energy: 16800, carbon: 5664, intensity: 337 },
  { name: 'us-west-2', cost: 32000, energy: 12000, carbon: 1404, intensity: 117 },
  { name: 'eu-west-1', cost: 28000, energy: 10500, carbon: 3108, intensity: 296 },
  { name: 'eu-north-1', cost: 22000, energy: 8200, carbon: 230, intensity: 28 },
];

const costEnergyScatter = [
  { workload: 'LLM Training', cost: 12500, energy: 4680, type: 'training' },
  { workload: 'Image Gen', cost: 8200, energy: 3070, type: 'training' },
  { workload: 'Embedding API', cost: 4500, energy: 1680, type: 'inference' },
  { workload: 'Chat API', cost: 6800, energy: 2550, type: 'inference' },
  { workload: 'Batch ETL', cost: 3200, energy: 1200, type: 'batch' },
  { workload: 'Analytics WH', cost: 5600, energy: 2100, type: 'warehouse' },
  { workload: 'Dev Notebooks', cost: 2100, energy: 790, type: 'interactive' },
];

const COLORS = ['#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export function DashboardCharts() {
  const [selectedMetric, setSelectedMetric] = useState<'cost' | 'energy' | 'carbon'>('cost');

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
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
              <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke={selectedMetric === 'cost' ? '#f59e0b' : selectedMetric === 'energy' ? '#22c55e' : '#10b981'}
                strokeWidth={2}
                dot={{ fill: 'white', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Workload Type Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-header mb-0">By Workload Type</h3>
            <ConfidenceBadge score={72} size="sm" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadTypeData} layout="vertical">
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
                  const item = costEnergyScatter.find(d => d.cost === label);
                  return item?.workload || '';
                }}
              />
              <Legend />
              <Scatter 
                name="Workloads" 
                data={costEnergyScatter} 
                fill="#f59e0b"
              >
                {costEnergyScatter.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.type === 'training' ? '#f59e0b' :
                      entry.type === 'inference' ? '#22c55e' :
                      entry.type === 'batch' ? '#3b82f6' :
                      entry.type === 'warehouse' ? '#8b5cf6' : '#ec4899'
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
            <span className="text-slate-600">Training</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-600">Inference</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-600">Batch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-slate-600">Warehouse</span>
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
              <Bar dataKey="intensity" name="Grid Intensity (gCO₂/kWh)" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
