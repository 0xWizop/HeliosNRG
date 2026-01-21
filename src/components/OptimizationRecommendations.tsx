'use client';

import { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  TrendingDown, 
  MapPin, 
  Clock, 
  Zap,
  DollarSign,
  Leaf,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Cpu,
  Server,
  RefreshCw
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';

interface Recommendation {
  id: string;
  type: 'region_migration' | 'right_sizing' | 'scheduling' | 'instance_switch' | 'consolidation';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentState: string;
  recommendedAction: string;
  impact: {
    carbonSavingsKg: number;
    costSavingsUsd: number;
    energySavingsKwh: number;
  };
  affectedWorkloads: string[];
  effort: 'low' | 'medium' | 'high';
  status: 'new' | 'accepted' | 'dismissed' | 'implemented';
  createdAt: string;
}

const REGION_CARBON_INTENSITY: Record<string, { intensity: number; name: string }> = {
  'us-east-1': { intensity: 379, name: 'N. Virginia' },
  'us-east-2': { intensity: 425, name: 'Ohio' },
  'us-west-1': { intensity: 234, name: 'N. California' },
  'us-west-2': { intensity: 102, name: 'Oregon' },
  'eu-west-1': { intensity: 316, name: 'Ireland' },
  'eu-west-2': { intensity: 225, name: 'London' },
  'eu-west-3': { intensity: 56, name: 'Paris' },
  'eu-north-1': { intensity: 8, name: 'Stockholm' },
  'eu-central-1': { intensity: 338, name: 'Frankfurt' },
  'ap-northeast-1': { intensity: 506, name: 'Tokyo' },
  'ap-southeast-1': { intensity: 408, name: 'Singapore' },
  'ap-southeast-2': { intensity: 656, name: 'Sydney' },
  'ca-central-1': { intensity: 120, name: 'Canada' },
};

const INSTANCE_EFFICIENCY: Record<string, number> = {
  'p5': 1.0,
  'p4d': 0.85,
  'p4de': 0.87,
  'p3': 0.65,
  'g5': 0.80,
  'g4dn': 0.70,
  'g4ad': 0.72,
  'inf2': 0.95,
  'inf1': 0.75,
  'trn1': 0.92,
};

export function OptimizationRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [showDismissed, setShowDismissed] = useState(false);

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
    loadRecommendations();
  }, [currentTeamId]);

  const loadRecommendations = async () => {
    if (!currentTeamId) return;
    
    try {
      const recDoc = await getDoc(doc(db, 'recommendations', currentTeamId));
      if (recDoc.exists()) {
        setRecommendations(recDoc.data().items || []);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
    setIsLoading(false);
  };

  const analyzeWorkloads = async () => {
    if (!currentTeamId) return;
    
    setIsAnalyzing(true);
    const newRecommendations: Recommendation[] = [];
    
    try {
      const workloadsQuery = query(
        collection(db, COLLECTIONS.WORKLOADS),
        where('teamId', '==', currentTeamId)
      );
      const snapshot = await getDocs(workloadsQuery);
      const workloads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (workloads.length === 0) {
        setIsAnalyzing(false);
        return;
      }

      // Analyze each workload for optimization opportunities
      for (const workload of workloads) {
        const w = workload as any;
        
        // 1. Region Migration Analysis
        const currentRegion = w.region || 'us-east-1';
        const currentIntensity = REGION_CARBON_INTENSITY[currentRegion]?.intensity || 400;
        
        // Find best alternative region
        const betterRegions = Object.entries(REGION_CARBON_INTENSITY)
          .filter(([region]) => region !== currentRegion)
          .filter(([, data]) => data.intensity < currentIntensity * 0.5)
          .sort((a, b) => a[1].intensity - b[1].intensity);
        
        if (betterRegions.length > 0) {
          const [bestRegion, bestData] = betterRegions[0];
          const energyKwh = w.totalEnergy || 100;
          const carbonReduction = (currentIntensity - bestData.intensity) * energyKwh / 1000;
          
          if (carbonReduction > 10) {
            newRecommendations.push({
              id: `region-${w.id}`,
              type: 'region_migration',
              priority: carbonReduction > 100 ? 'high' : carbonReduction > 50 ? 'medium' : 'low',
              title: `Migrate to ${bestData.name} (${bestRegion})`,
              description: `Moving this workload from ${REGION_CARBON_INTENSITY[currentRegion]?.name || currentRegion} to ${bestData.name} would significantly reduce carbon emissions due to cleaner grid energy.`,
              currentState: `Running in ${currentRegion} (${currentIntensity} gCO₂/kWh)`,
              recommendedAction: `Migrate to ${bestRegion} (${bestData.intensity} gCO₂/kWh)`,
              impact: {
                carbonSavingsKg: Math.round(carbonReduction),
                costSavingsUsd: 0,
                energySavingsKwh: 0,
              },
              affectedWorkloads: [w.name || w.id],
              effort: 'medium',
              status: 'new',
              createdAt: new Date().toISOString(),
            });
          }
        }

        // 2. Right-sizing Analysis (underutilization)
        const utilization = w.avgCpuUtilization || w.utilization || 0;
        if (utilization > 0 && utilization < 30) {
          const potentialSavings = (w.costPerHour || 1) * (w.runtimeHours || 100) * 0.4;
          const energySavings = (w.totalEnergy || 50) * 0.4;
          
          newRecommendations.push({
            id: `rightsize-${w.id}`,
            type: 'right_sizing',
            priority: utilization < 15 ? 'high' : 'medium',
            title: `Right-size underutilized workload`,
            description: `This workload is running at only ${utilization.toFixed(0)}% average utilization. Consider downsizing to a smaller instance type.`,
            currentState: `${w.instanceType || 'Unknown instance'} at ${utilization.toFixed(0)}% utilization`,
            recommendedAction: `Downsize to smaller instance or consolidate workloads`,
            impact: {
              carbonSavingsKg: Math.round(energySavings * 0.4),
              costSavingsUsd: Math.round(potentialSavings),
              energySavingsKwh: Math.round(energySavings),
            },
            affectedWorkloads: [w.name || w.id],
            effort: 'low',
            status: 'new',
            createdAt: new Date().toISOString(),
          });
        }

        // 3. Scheduling Optimization (batch workloads)
        const workloadType = (w.workloadType || '').toLowerCase();
        if (workloadType.includes('batch') || workloadType.includes('training') || workloadType.includes('etl')) {
          const currentIntensityVal = REGION_CARBON_INTENSITY[currentRegion]?.intensity || 400;
          if (currentIntensityVal > 200) {
            newRecommendations.push({
              id: `schedule-${w.id}`,
              type: 'scheduling',
              priority: 'low',
              title: `Schedule for off-peak carbon hours`,
              description: `Batch workloads can be scheduled to run during periods of lower grid carbon intensity, typically overnight or during high renewable generation.`,
              currentState: `Running on-demand`,
              recommendedAction: `Schedule to run between 1AM-6AM local time when grid is typically cleaner`,
              impact: {
                carbonSavingsKg: Math.round((w.totalCarbon || 20) * 0.15),
                costSavingsUsd: Math.round((w.costPerHour || 1) * (w.runtimeHours || 50) * 0.1),
                energySavingsKwh: 0,
              },
              affectedWorkloads: [w.name || w.id],
              effort: 'low',
              status: 'new',
              createdAt: new Date().toISOString(),
            });
          }
        }

        // 4. Instance Generation Upgrade
        const instanceType = (w.instanceType || '').toLowerCase();
        if (instanceType.includes('p3') || instanceType.includes('g4')) {
          newRecommendations.push({
            id: `upgrade-${w.id}`,
            type: 'instance_switch',
            priority: 'medium',
            title: `Upgrade to newer GPU generation`,
            description: `Newer GPU instances (P4d, P5, G5) offer significantly better performance per watt, reducing both cost and carbon for the same workload.`,
            currentState: `Using ${w.instanceType || 'older generation GPU'}`,
            recommendedAction: instanceType.includes('p3') 
              ? 'Upgrade to p4d.24xlarge or p5.48xlarge' 
              : 'Upgrade to g5.xlarge or newer',
            impact: {
              carbonSavingsKg: Math.round((w.totalCarbon || 30) * 0.35),
              costSavingsUsd: Math.round((w.costPerHour || 2) * (w.runtimeHours || 100) * 0.2),
              energySavingsKwh: Math.round((w.totalEnergy || 80) * 0.35),
            },
            affectedWorkloads: [w.name || w.id],
            effort: 'medium',
            status: 'new',
            createdAt: new Date().toISOString(),
          });
        }
      }

      // 5. Consolidation opportunities (multiple small workloads)
      const smallWorkloads = workloads.filter((w: any) => 
        (w.avgCpuUtilization || 0) < 50 && (w.runtimeHours || 0) > 100
      );
      
      if (smallWorkloads.length >= 3) {
        const totalEnergy = smallWorkloads.reduce((sum: number, w: any) => sum + (w.totalEnergy || 0), 0);
        const totalCost = smallWorkloads.reduce((sum: number, w: any) => sum + ((w.costPerHour || 0) * (w.runtimeHours || 0)), 0);
        
        newRecommendations.push({
          id: 'consolidation-multi',
          type: 'consolidation',
          priority: 'high',
          title: `Consolidate ${smallWorkloads.length} underutilized workloads`,
          description: `Multiple workloads are running at low utilization. Consolidating onto fewer, larger instances could reduce overhead and improve efficiency.`,
          currentState: `${smallWorkloads.length} separate instances with low utilization`,
          recommendedAction: `Consolidate into 1-2 larger instances with container orchestration`,
          impact: {
            carbonSavingsKg: Math.round(totalEnergy * 0.3 * 0.4),
            costSavingsUsd: Math.round(totalCost * 0.4),
            energySavingsKwh: Math.round(totalEnergy * 0.3),
          },
          affectedWorkloads: smallWorkloads.map((w: any) => w.name || w.id),
          effort: 'high',
          status: 'new',
          createdAt: new Date().toISOString(),
        });
      }

      // Dedupe by ID and merge with existing
      const existingIds = new Set(recommendations.filter(r => r.status !== 'new').map(r => r.id));
      const uniqueNew = newRecommendations.filter(r => !existingIds.has(r.id));
      const merged = [...recommendations.filter(r => r.status !== 'new'), ...uniqueNew];
      
      // Save to Firebase
      await setDoc(doc(db, 'recommendations', currentTeamId), {
        items: merged,
        lastAnalyzed: Timestamp.now(),
      });
      
      setRecommendations(merged);
    } catch (error) {
      console.error('Error analyzing workloads:', error);
    }
    
    setIsAnalyzing(false);
  };

  const updateRecommendationStatus = async (id: string, status: Recommendation['status']) => {
    const updated = recommendations.map(r => 
      r.id === id ? { ...r, status } : r
    );
    setRecommendations(updated);
    
    if (currentTeamId) {
      await setDoc(doc(db, 'recommendations', currentTeamId), {
        items: updated,
        lastUpdated: Timestamp.now(),
      });
    }
  };

  const getPriorityConfig = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'high':
        return { color: 'text-red-400', bg: 'bg-red-950', border: 'border-red-800', label: 'High Impact' };
      case 'medium':
        return { color: 'text-amber-400', bg: 'bg-amber-950', border: 'border-amber-800', label: 'Medium Impact' };
      case 'low':
        return { color: 'text-blue-400', bg: 'bg-blue-950', border: 'border-blue-800', label: 'Low Impact' };
    }
  };

  const getTypeIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'region_migration': return MapPin;
      case 'right_sizing': return Server;
      case 'scheduling': return Clock;
      case 'instance_switch': return Cpu;
      case 'consolidation': return Zap;
    }
  };

  const getEffortLabel = (effort: Recommendation['effort']) => {
    switch (effort) {
      case 'low': return 'Quick Win';
      case 'medium': return 'Moderate Effort';
      case 'high': return 'Major Project';
    }
  };

  // Calculate totals
  const activeRecs = recommendations.filter(r => r.status === 'new' || r.status === 'accepted');
  const filteredRecs = activeRecs.filter(r => filter === 'all' || r.priority === filter);
  const displayRecs = showDismissed 
    ? recommendations.filter(r => filter === 'all' || r.priority === filter)
    : filteredRecs;

  const totalSavings = {
    carbon: activeRecs.reduce((sum, r) => sum + r.impact.carbonSavingsKg, 0),
    cost: activeRecs.reduce((sum, r) => sum + r.impact.costSavingsUsd, 0),
    energy: activeRecs.reduce((sum, r) => sum + r.impact.energySavingsKwh, 0),
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
          <h2 className="text-lg font-mono text-neutral-100 uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Optimization Recommendations
          </h2>
          <p className="text-neutral-500 text-sm mt-1">AI-powered suggestions to reduce carbon and costs</p>
        </div>
        <button
          onClick={analyzeWorkloads}
          disabled={isAnalyzing}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Analyze Workloads'}
        </button>
      </div>

      {/* Potential Savings Summary */}
      {activeRecs.length > 0 && (
        <div className="grid grid-cols-3 gap-px bg-neutral-800">
          <div className="bg-neutral-950 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-neutral-500 uppercase">Carbon Savings</span>
            </div>
            <p className="text-2xl font-mono text-emerald-400">{totalSavings.carbon.toLocaleString()} kg</p>
            <p className="text-xs text-neutral-600">CO₂ per year</p>
          </div>
          <div className="bg-neutral-950 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-neutral-500 uppercase">Cost Savings</span>
            </div>
            <p className="text-2xl font-mono text-amber-400">${totalSavings.cost.toLocaleString()}</p>
            <p className="text-xs text-neutral-600">estimated annually</p>
          </div>
          <div className="bg-neutral-950 p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-neutral-500 uppercase">Energy Savings</span>
            </div>
            <p className="text-2xl font-mono text-blue-400">{totalSavings.energy.toLocaleString()} kWh</p>
            <p className="text-xs text-neutral-600">per year</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(['all', 'high', 'medium', 'low'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-mono uppercase ${
                filter === f 
                  ? 'bg-amber-600 text-neutral-950' 
                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
              }`}
            >
              {f === 'all' ? 'All' : `${f} Impact`}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-500 cursor-pointer">
          <input
            type="checkbox"
            checked={showDismissed}
            onChange={(e) => setShowDismissed(e.target.checked)}
            className="w-4 h-4 bg-neutral-800 border-neutral-700"
          />
          Show dismissed
        </label>
      </div>

      {/* Recommendations List */}
      {displayRecs.length === 0 ? (
        <div className="card text-center py-16">
          <Lightbulb className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <h3 className="text-neutral-300 font-medium mb-2">No Recommendations Yet</h3>
          <p className="text-neutral-500 text-sm max-w-md mx-auto mb-6">
            Upload workload data and click "Analyze Workloads" to get AI-powered optimization suggestions.
          </p>
          <button onClick={analyzeWorkloads} disabled={isAnalyzing} className="btn-primary">
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayRecs.map((rec) => {
            const priorityConfig = getPriorityConfig(rec.priority);
            const TypeIcon = getTypeIcon(rec.type);
            const isDismissed = rec.status === 'dismissed';
            const isImplemented = rec.status === 'implemented';

            return (
              <div 
                key={rec.id} 
                className={`card ${isDismissed ? 'opacity-50' : ''} ${isImplemented ? 'border-emerald-800' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${priorityConfig.bg} ${priorityConfig.border} border shrink-0`}>
                    <TypeIcon className={`w-5 h-5 ${priorityConfig.color}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-medium text-neutral-200">{rec.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`px-2 py-0.5 text-xs ${priorityConfig.bg} ${priorityConfig.color} ${priorityConfig.border} border`}>
                            {priorityConfig.label}
                          </span>
                          <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5">
                            {getEffortLabel(rec.effort)}
                          </span>
                          {isImplemented && (
                            <span className="text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 border border-emerald-800 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Implemented
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {!isDismissed && !isImplemented && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => updateRecommendationStatus(rec.id, 'implemented')}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-950 transition-colors"
                            title="Mark as implemented"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateRecommendationStatus(rec.id, 'dismissed')}
                            className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-950 transition-colors"
                            title="Dismiss"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-neutral-400 mb-4">{rec.description}</p>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-neutral-900 border border-neutral-800 p-3">
                        <p className="text-xs text-neutral-500 uppercase mb-1">Current State</p>
                        <p className="text-sm text-neutral-300">{rec.currentState}</p>
                      </div>
                      <div className="bg-neutral-900 border border-emerald-900 p-3">
                        <p className="text-xs text-emerald-500 uppercase mb-1">Recommended Action</p>
                        <p className="text-sm text-neutral-300">{rec.recommendedAction}</p>
                      </div>
                    </div>

                    {/* Impact metrics */}
                    <div className="flex items-center gap-6 text-sm">
                      {rec.impact.carbonSavingsKg > 0 && (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Leaf className="w-3.5 h-3.5" />
                          <span className="font-mono">-{rec.impact.carbonSavingsKg} kg CO₂</span>
                        </div>
                      )}
                      {rec.impact.costSavingsUsd > 0 && (
                        <div className="flex items-center gap-1 text-amber-400">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="font-mono">-${rec.impact.costSavingsUsd}</span>
                        </div>
                      )}
                      {rec.impact.energySavingsKwh > 0 && (
                        <div className="flex items-center gap-1 text-blue-400">
                          <Zap className="w-3.5 h-3.5" />
                          <span className="font-mono">-{rec.impact.energySavingsKwh} kWh</span>
                        </div>
                      )}
                    </div>

                    {rec.affectedWorkloads.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-800">
                        <p className="text-xs text-neutral-500">
                          Affects: {rec.affectedWorkloads.slice(0, 3).join(', ')}
                          {rec.affectedWorkloads.length > 3 && ` +${rec.affectedWorkloads.length - 3} more`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
