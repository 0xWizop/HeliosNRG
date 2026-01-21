'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { Plus, X, ArrowUpDown, Zap, DollarSign, Leaf, RefreshCw, Database } from 'lucide-react';
import { ConfidenceBadge } from './ConfidenceBadge';

interface Workload {
  id: string;
  name: string;
  type: 'training' | 'inference' | 'data_processing';
  provider: string;
  region: string;
  instanceType: string;
  runtime: number; // hours
  cost: number;
  energyKwh: number;
  carbonKg: number;
  confidence: number;
}

// Demo team ID - would come from auth context in production
const DEMO_TEAM_ID = 'demo-team';

type SortKey = 'cost' | 'energyKwh' | 'carbonKg' | 'efficiency';

export function WorkloadComparison() {
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [selectedWorkloads, setSelectedWorkloads] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('cost');
  const [showSelector, setShowSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to workloads from Firebase
  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.WORKLOADS),
      where('teamId', '==', DEMO_TEAM_ID)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const workloadData: Workload[] = [];
      
      for (const docSnap of snapshot.docs) {
        const d = docSnap.data();
        
        // Calculate metrics from the metrics collection or use stored values
        workloadData.push({
          id: docSnap.id,
          name: d.name || 'Unnamed Workload',
          type: d.type || 'other',
          provider: d.provider?.toUpperCase() || 'Unknown',
          region: d.region || 'Unknown',
          instanceType: d.instanceType || 'Unknown',
          runtime: d.runtime || 0,
          cost: d.totalCost || 0,
          energyKwh: d.totalEnergy || 0,
          carbonKg: d.totalCarbon || 0,
          confidence: d.confidence || 70,
        });
      }
      
      setWorkloads(workloadData);
      // Auto-select first two workloads if none selected
      if (selectedWorkloads.length === 0 && workloadData.length >= 2) {
        setSelectedWorkloads([workloadData[0].id, workloadData[1].id]);
      } else if (selectedWorkloads.length === 0 && workloadData.length === 1) {
        setSelectedWorkloads([workloadData[0].id]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const selected = workloads.filter(w => selectedWorkloads.includes(w.id));
  const available = workloads.filter(w => !selectedWorkloads.includes(w.id));

  const addWorkload = (id: string) => {
    setSelectedWorkloads(prev => [...prev, id]);
    setShowSelector(false);
  };

  const removeWorkload = (id: string) => {
    setSelectedWorkloads(prev => prev.filter(wId => wId !== id));
  };

  // Calculate efficiency metrics
  const getEfficiency = (w: Workload) => ({
    costPerHour: w.cost / w.runtime,
    energyPerHour: w.energyKwh / w.runtime,
    carbonPerDollar: w.carbonKg / w.cost * 1000,
    costPerKwh: w.cost / w.energyKwh,
  });

  // Find best/worst for highlighting
  const getBestWorst = (key: keyof Workload | 'efficiency') => {
    if (selected.length < 2) return { best: '', worst: '' };
    
    let values: { id: string; value: number }[];
    
    if (key === 'efficiency') {
      values = selected.map(w => ({ id: w.id, value: w.carbonKg / w.cost }));
    } else {
      values = selected.map(w => ({ id: w.id, value: w[key] as number }));
    }
    
    const sorted = [...values].sort((a, b) => a.value - b.value);
    return { best: sorted[0].id, worst: sorted[sorted.length - 1].id };
  };

  const costBestWorst = getBestWorst('cost');
  const energyBestWorst = getBestWorst('energyKwh');
  const carbonBestWorst = getBestWorst('carbonKg');

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider">Workload Comparison</h3>
          <p className="text-xs text-neutral-500 mt-1">Compare efficiency across workloads</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-mono">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="input py-1.5 px-3 w-auto"
          >
            <option value="cost">Cost</option>
            <option value="energyKwh">Energy</option>
            <option value="carbonKg">Carbon</option>
            <option value="efficiency">Efficiency</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-neutral-600 animate-spin mx-auto mb-3" />
          <p className="text-neutral-500">Loading workloads...</p>
        </div>
      ) : workloads.length === 0 ? (
        <div className="text-center py-12">
          <Database className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <p className="text-neutral-400 mb-2">No workloads found</p>
          <p className="text-sm text-neutral-600">Add workloads through integrations to compare them</p>
        </div>
      ) : selected.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-500 mb-4">Select workloads to compare</p>
          <button
            onClick={() => setShowSelector(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Workload
          </button>
        </div>
      ) : (
        <>
          {/* Comparison table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-3 px-4 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Workload</th>
                  <th className="text-left py-3 px-4 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Type</th>
                  <th className="text-left py-3 px-4 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Provider</th>
                  <th className="text-right py-3 px-4 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Runtime</th>
                  <th className="text-right py-3 px-4 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="w-3 h-3" />
                      Cost
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      <Zap className="w-3 h-3" />
                      Energy
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                    <div className="flex items-center justify-end gap-1">
                      <Leaf className="w-3 h-3" />
                      Carbon
                    </div>
                  </th>
                  <th className="text-right py-3 px-4 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Confidence</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {selected.map((workload) => {
                  const efficiency = getEfficiency(workload);
                  const typeColors = {
                    training: 'text-purple-400 bg-purple-950 border-purple-800',
                    inference: 'text-blue-400 bg-blue-950 border-blue-800',
                    data_processing: 'text-amber-400 bg-amber-950 border-amber-800',
                  };

                  return (
                    <tr key={workload.id} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm font-medium text-neutral-200">{workload.name}</p>
                          <p className="text-xs text-neutral-500">{workload.instanceType}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`badge ${typeColors[workload.type]}`}>
                          {workload.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-sm text-neutral-300">{workload.provider}</p>
                          <p className="text-xs text-neutral-500">{workload.region}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-mono text-neutral-300">{workload.runtime}h</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className={`${workload.id === costBestWorst.best ? 'text-emerald-400' : workload.id === costBestWorst.worst ? 'text-red-400' : 'text-neutral-200'}`}>
                          <span className="font-mono">${workload.cost.toLocaleString()}</span>
                          <p className="text-xs text-neutral-500">${efficiency.costPerHour.toFixed(0)}/hr</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className={`${workload.id === energyBestWorst.best ? 'text-emerald-400' : workload.id === energyBestWorst.worst ? 'text-red-400' : 'text-neutral-200'}`}>
                          <span className="font-mono">{workload.energyKwh.toLocaleString()} kWh</span>
                          <p className="text-xs text-neutral-500">{efficiency.energyPerHour.toFixed(1)} kWh/hr</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className={`${workload.id === carbonBestWorst.best ? 'text-emerald-400' : workload.id === carbonBestWorst.worst ? 'text-red-400' : 'text-neutral-200'}`}>
                          <span className="font-mono">{workload.carbonKg.toLocaleString()} kg</span>
                          <p className="text-xs text-neutral-500">{efficiency.carbonPerDollar.toFixed(1)} g/$</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <ConfidenceBadge score={workload.confidence} size="sm" />
                      </td>
                      <td className="py-4 px-2">
                        <button
                          onClick={() => removeWorkload(workload.id)}
                          className="p-1.5 text-neutral-600 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add more button */}
          <div className="mt-4 flex items-center justify-between">
            <div className="relative">
              <button
                onClick={() => setShowSelector(!showSelector)}
                className="btn-outline inline-flex items-center gap-2"
                disabled={available.length === 0}
              >
                <Plus className="w-4 h-4" />
                Add Workload
              </button>

              {/* Dropdown selector */}
              {showSelector && available.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 shadow-xl z-20">
                  {available.map((workload) => (
                    <button
                      key={workload.id}
                      onClick={() => addWorkload(workload.id)}
                      className="w-full text-left px-4 py-3 hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-neutral-200">{workload.name}</p>
                      <p className="text-xs text-neutral-500">{workload.provider} • {workload.type}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="text-neutral-500">Best</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-neutral-500">Worst</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
