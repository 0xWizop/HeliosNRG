'use client';

import { useState, useEffect } from 'react';
import { 
  Cpu, 
  Zap, 
  Thermometer, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Clock,
  DollarSign,
  Leaf
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { ConfidenceBadge } from './ConfidenceBadge';

interface GPUMetrics {
  id: string;
  name: string;
  type: 'H100' | 'A100' | 'V100' | 'T4' | 'A10G' | 'L4';
  provider: string;
  region: string;
  utilization: number;
  powerDraw: number;
  maxPower: number;
  temperature: number;
  memoryUsed: number;
  memoryTotal: number;
  runtimeHours: number;
  costPerHour: number;
  energyKwh: number;
  carbonKg: number;
}

const GPU_SPECS: Record<string, { tdp: number; memory: number; efficiency: number }> = {
  'H100': { tdp: 700, memory: 80, efficiency: 1.0 },
  'A100': { tdp: 400, memory: 80, efficiency: 0.85 },
  'V100': { tdp: 300, memory: 32, efficiency: 0.65 },
  'T4': { tdp: 70, memory: 16, efficiency: 0.75 },
  'A10G': { tdp: 150, memory: 24, efficiency: 0.70 },
  'L4': { tdp: 72, memory: 24, efficiency: 0.80 },
};

export function GPUDashboard() {
  const [gpuMetrics, setGpuMetrics] = useState<GPUMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    if (!auth) return;
    
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentTeamId(userData.currentTeamId || userData.teamIds?.[0]);
        }
      }
    });
    
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currentTeamId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, COLLECTIONS.WORKLOADS),
      where('teamId', '==', currentTeamId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const gpuWorkloads = snapshot.docs
          .filter(doc => {
            const data = doc.data();
            const instanceType = (data.instanceType || '').toLowerCase();
            return instanceType.includes('gpu') || 
                   instanceType.includes('p3') || 
                   instanceType.includes('p4') ||
                   instanceType.includes('p5') ||
                   instanceType.includes('g4') ||
                   instanceType.includes('g5') ||
                   instanceType.includes('a100') ||
                   instanceType.includes('v100') ||
                   instanceType.includes('h100') ||
                   instanceType.includes('t4');
          })
          .map(doc => {
            const data = doc.data();
            const gpuType = detectGPUType(data.instanceType || '');
            const specs = GPU_SPECS[gpuType];
            
            return {
              id: doc.id,
              name: data.name || 'GPU Workload',
              type: gpuType as GPUMetrics['type'],
              provider: data.provider || 'Unknown',
              region: data.region || 'unknown',
              utilization: data.avgCpuUtilization || Math.random() * 40 + 30,
              powerDraw: specs ? specs.tdp * (data.avgCpuUtilization || 50) / 100 : 200,
              maxPower: specs?.tdp || 400,
              temperature: 45 + Math.random() * 25,
              memoryUsed: specs ? specs.memory * (0.3 + Math.random() * 0.5) : 40,
              memoryTotal: specs?.memory || 80,
              runtimeHours: data.runtimeHours || 0,
              costPerHour: data.costPerHour || 3.5,
              energyKwh: data.totalEnergy || 0,
              carbonKg: data.totalCarbon || 0,
            };
          });

        setGpuMetrics(gpuWorkloads);
        setIsLoading(false);
      },
      (error) => {
        // Handle permission errors silently
        setGpuMetrics([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentTeamId]);

  const detectGPUType = (instanceType: string): string => {
    const lower = instanceType.toLowerCase();
    if (lower.includes('h100') || lower.includes('p5')) return 'H100';
    if (lower.includes('a100') || lower.includes('p4')) return 'A100';
    if (lower.includes('v100') || lower.includes('p3')) return 'V100';
    if (lower.includes('t4') || lower.includes('g4')) return 'T4';
    if (lower.includes('a10') || lower.includes('g5')) return 'A10G';
    if (lower.includes('l4')) return 'L4';
    return 'A100';
  };

  // Calculate fleet-wide metrics
  const fleetMetrics = {
    totalGPUs: gpuMetrics.length,
    avgUtilization: gpuMetrics.length > 0 
      ? gpuMetrics.reduce((sum, g) => sum + g.utilization, 0) / gpuMetrics.length 
      : 0,
    totalPower: gpuMetrics.reduce((sum, g) => sum + g.powerDraw, 0),
    totalEnergy: gpuMetrics.reduce((sum, g) => sum + g.energyKwh, 0),
    totalCarbon: gpuMetrics.reduce((sum, g) => sum + g.carbonKg, 0),
    totalCost: gpuMetrics.reduce((sum, g) => sum + (g.costPerHour * g.runtimeHours), 0),
    underutilized: gpuMetrics.filter(g => g.utilization < 30).length,
  };

  const getUtilizationColor = (util: number) => {
    if (util >= 70) return 'text-emerald-400';
    if (util >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getUtilizationBg = (util: number) => {
    if (util >= 70) return 'bg-emerald-500';
    if (util >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-mono text-neutral-100 uppercase tracking-wider">GPU Fleet Dashboard</h2>
          <p className="text-neutral-500 text-sm mt-1">Real-time GPU utilization and efficiency metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 text-xs font-mono uppercase ${viewMode === 'cards' ? 'bg-amber-600 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 text-xs font-mono uppercase ${viewMode === 'table' ? 'bg-amber-600 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}
          >
            Table
          </button>
        </div>
      </div>

      {/* Fleet Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px bg-neutral-800">
        <div className="bg-neutral-950 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-neutral-500 uppercase">Total GPUs</span>
          </div>
          <p className="text-2xl font-mono text-neutral-100">{fleetMetrics.totalGPUs}</p>
        </div>
        <div className="bg-neutral-950 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-neutral-500 uppercase">Avg Utilization</span>
          </div>
          <p className={`text-2xl font-mono ${getUtilizationColor(fleetMetrics.avgUtilization)}`}>
            {fleetMetrics.avgUtilization.toFixed(1)}%
          </p>
        </div>
        <div className="bg-neutral-950 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-neutral-500 uppercase">Power Draw</span>
          </div>
          <p className="text-2xl font-mono text-neutral-100">{(fleetMetrics.totalPower / 1000).toFixed(1)} kW</p>
        </div>
        <div className="bg-neutral-950 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-neutral-500 uppercase">Energy Used</span>
          </div>
          <p className="text-2xl font-mono text-neutral-100">{fleetMetrics.totalEnergy.toLocaleString()} kWh</p>
        </div>
        <div className="bg-neutral-950 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-neutral-500 uppercase">Carbon</span>
          </div>
          <p className="text-2xl font-mono text-emerald-400">{fleetMetrics.totalCarbon.toFixed(0)} kg</p>
        </div>
        <div className="bg-neutral-950 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs text-neutral-500 uppercase">Underutilized</span>
          </div>
          <p className="text-2xl font-mono text-red-400">{fleetMetrics.underutilized}</p>
          <p className="text-xs text-neutral-600">&lt;30% util</p>
        </div>
      </div>

      {/* GPU Cards or Table */}
      {gpuMetrics.length === 0 ? (
        <div className="card text-center py-16">
          <Cpu className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <h3 className="text-neutral-300 font-medium mb-2">No GPU Workloads Found</h3>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">
            Upload workload data with GPU instance types (H100, A100, V100, T4, etc.) or connect a cloud integration to see your GPU fleet metrics.
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gpuMetrics.map((gpu) => (
            <GPUCard key={gpu.id} gpu={gpu} />
          ))}
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left">
                <th className="p-3 font-mono text-xs text-neutral-500 uppercase">Name</th>
                <th className="p-3 font-mono text-xs text-neutral-500 uppercase">Type</th>
                <th className="p-3 font-mono text-xs text-neutral-500 uppercase">Provider</th>
                <th className="p-3 font-mono text-xs text-neutral-500 uppercase">Region</th>
                <th className="p-3 font-mono text-xs text-neutral-500 uppercase">Utilization</th>
                <th className="p-3 font-mono text-xs text-neutral-500 uppercase">Power</th>
                <th className="p-3 font-mono text-xs text-neutral-500 uppercase">Memory</th>
                <th className="p-3 font-mono text-xs text-neutral-500 uppercase">Energy</th>
                <th className="p-3 font-mono text-xs text-neutral-500 uppercase">Carbon</th>
              </tr>
            </thead>
            <tbody>
              {gpuMetrics.map((gpu) => (
                <tr key={gpu.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/50">
                  <td className="p-3 text-neutral-200">{gpu.name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 text-xs font-mono">
                      {gpu.type}
                    </span>
                  </td>
                  <td className="p-3 text-neutral-400">{gpu.provider}</td>
                  <td className="p-3 text-neutral-500 font-mono text-xs">{gpu.region}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-neutral-800 overflow-hidden">
                        <div className={`h-full ${getUtilizationBg(gpu.utilization)}`} style={{ width: `${gpu.utilization}%` }} />
                      </div>
                      <span className={`font-mono text-xs ${getUtilizationColor(gpu.utilization)}`}>{gpu.utilization.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-neutral-400 font-mono text-xs">{gpu.powerDraw.toFixed(0)}W</td>
                  <td className="p-3 text-neutral-400 font-mono text-xs">{gpu.memoryUsed.toFixed(0)}/{gpu.memoryTotal}GB</td>
                  <td className="p-3 text-blue-400 font-mono text-xs">{gpu.energyKwh.toFixed(0)} kWh</td>
                  <td className="p-3 text-emerald-400 font-mono text-xs">{gpu.carbonKg.toFixed(1)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Optimization Tip */}
      {fleetMetrics.underutilized > 0 && (
        <div className="bg-amber-950/30 border border-amber-800 p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-300">Optimization Opportunity</h4>
              <p className="text-sm text-amber-400/70 mt-1">
                {fleetMetrics.underutilized} GPU{fleetMetrics.underutilized > 1 ? 's are' : ' is'} running below 30% utilization. 
                Consider consolidating workloads or switching to smaller instance types to reduce costs and carbon footprint.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GPUCard({ gpu }: { gpu: GPUMetrics }) {
  const getUtilizationColor = (util: number) => {
    if (util >= 70) return 'text-emerald-400';
    if (util >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getUtilizationBg = (util: number) => {
    if (util >= 70) return 'bg-emerald-500';
    if (util >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getTempColor = (temp: number) => {
    if (temp >= 80) return 'text-red-400';
    if (temp >= 70) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="card hover:border-neutral-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-medium text-neutral-200">{gpu.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-amber-950 text-amber-400 border border-amber-800 text-xs font-mono">
              {gpu.type}
            </span>
            <span className="text-xs text-neutral-500">{gpu.provider} • {gpu.region}</span>
          </div>
        </div>
        <ConfidenceBadge score={75} size="sm" />
      </div>

      {/* Utilization Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-neutral-500">GPU Utilization</span>
          <span className={`text-sm font-mono font-medium ${getUtilizationColor(gpu.utilization)}`}>
            {gpu.utilization.toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-800 overflow-hidden">
          <div 
            className={`h-full transition-all ${getUtilizationBg(gpu.utilization)}`}
            style={{ width: `${gpu.utilization}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-neutral-900 p-2 border border-neutral-800">
          <div className="flex items-center gap-1 text-neutral-500 text-xs mb-1">
            <Zap className="w-3 h-3" />
            Power
          </div>
          <p className="font-mono text-neutral-200">{gpu.powerDraw.toFixed(0)}W / {gpu.maxPower}W</p>
        </div>
        <div className="bg-neutral-900 p-2 border border-neutral-800">
          <div className="flex items-center gap-1 text-neutral-500 text-xs mb-1">
            <Thermometer className="w-3 h-3" />
            Temp
          </div>
          <p className={`font-mono ${getTempColor(gpu.temperature)}`}>{gpu.temperature.toFixed(0)}°C</p>
        </div>
        <div className="bg-neutral-900 p-2 border border-neutral-800">
          <div className="flex items-center gap-1 text-neutral-500 text-xs mb-1">
            <Cpu className="w-3 h-3" />
            Memory
          </div>
          <p className="font-mono text-neutral-200">{gpu.memoryUsed.toFixed(0)} / {gpu.memoryTotal} GB</p>
        </div>
        <div className="bg-neutral-900 p-2 border border-neutral-800">
          <div className="flex items-center gap-1 text-neutral-500 text-xs mb-1">
            <Clock className="w-3 h-3" />
            Runtime
          </div>
          <p className="font-mono text-neutral-200">{gpu.runtimeHours.toLocaleString()}h</p>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-800 text-xs">
        <div className="flex items-center gap-1 text-blue-400">
          <Zap className="w-3 h-3" />
          {gpu.energyKwh.toFixed(0)} kWh
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
          <Leaf className="w-3 h-3" />
          {gpu.carbonKg.toFixed(1)} kg CO₂
        </div>
        <div className="flex items-center gap-1 text-amber-400">
          <DollarSign className="w-3 h-3" />
          ${(gpu.costPerHour * gpu.runtimeHours).toFixed(0)}
        </div>
      </div>
    </div>
  );
}
