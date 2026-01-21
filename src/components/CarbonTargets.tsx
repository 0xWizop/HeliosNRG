'use client';

import { useState, useEffect } from 'react';
import { 
  Target, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  Leaf,
  X,
  Check
} from 'lucide-react';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';

interface CarbonTarget {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  unit: 'kgCO2' | 'tCO2' | 'percent_reduction';
  deadline: string;
  baselineValue?: number;
  baselineDate?: string;
  status: 'on_track' | 'at_risk' | 'off_track' | 'achieved';
  createdAt: string;
}

export function CarbonTargets() {
  const [targets, setTargets] = useState<CarbonTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<CarbonTarget | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formUnit, setFormUnit] = useState<CarbonTarget['unit']>('tCO2');
  const [formDeadline, setFormDeadline] = useState('');
  const [formBaseline, setFormBaseline] = useState('');

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

    const unsubscribe = onSnapshot(doc(db, 'carbon_targets', currentTeamId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setTargets(data.targets || []);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentTeamId]);

  const saveTargets = async (newTargets: CarbonTarget[]) => {
    if (!currentTeamId) return;
    
    await setDoc(doc(db, 'carbon_targets', currentTeamId), {
      targets: newTargets,
      updatedAt: Timestamp.now(),
    });
  };

  const handleAddTarget = async () => {
    if (!formName || !formTarget || !formDeadline) return;

    const newTarget: CarbonTarget = {
      id: Date.now().toString(),
      name: formName,
      targetValue: parseFloat(formTarget),
      currentValue: formBaseline ? parseFloat(formBaseline) : 0,
      unit: formUnit,
      deadline: formDeadline,
      baselineValue: formBaseline ? parseFloat(formBaseline) : undefined,
      baselineDate: new Date().toISOString().split('T')[0],
      status: 'on_track',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const newTargets = [...targets, newTarget];
    setTargets(newTargets);
    await saveTargets(newTargets);
    resetForm();
  };

  const handleUpdateTarget = async () => {
    if (!editingTarget || !formName || !formTarget || !formDeadline) return;

    const updatedTargets = targets.map(t => 
      t.id === editingTarget.id
        ? {
            ...t,
            name: formName,
            targetValue: parseFloat(formTarget),
            unit: formUnit,
            deadline: formDeadline,
            baselineValue: formBaseline ? parseFloat(formBaseline) : t.baselineValue,
          }
        : t
    );

    setTargets(updatedTargets);
    await saveTargets(updatedTargets);
    resetForm();
  };

  const handleDeleteTarget = async (id: string) => {
    const newTargets = targets.filter(t => t.id !== id);
    setTargets(newTargets);
    await saveTargets(newTargets);
  };

  const openEditModal = (target: CarbonTarget) => {
    setEditingTarget(target);
    setFormName(target.name);
    setFormTarget(target.targetValue.toString());
    setFormUnit(target.unit);
    setFormDeadline(target.deadline);
    setFormBaseline(target.baselineValue?.toString() || '');
    setShowAddModal(true);
  };

  const resetForm = () => {
    setShowAddModal(false);
    setEditingTarget(null);
    setFormName('');
    setFormTarget('');
    setFormUnit('tCO2');
    setFormDeadline('');
    setFormBaseline('');
  };

  const getStatusConfig = (status: CarbonTarget['status']) => {
    switch (status) {
      case 'achieved':
        return { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-950', border: 'border-emerald-800', label: 'Achieved' };
      case 'on_track':
        return { icon: TrendingDown, color: 'text-blue-400', bg: 'bg-blue-950', border: 'border-blue-800', label: 'On Track' };
      case 'at_risk':
        return { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-950', border: 'border-amber-800', label: 'At Risk' };
      case 'off_track':
        return { icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-950', border: 'border-red-800', label: 'Off Track' };
    }
  };

  const calculateProgress = (target: CarbonTarget) => {
    if (target.unit === 'percent_reduction') {
      return Math.min(100, (target.currentValue / target.targetValue) * 100);
    }
    if (target.baselineValue) {
      const reduction = target.baselineValue - target.currentValue;
      const targetReduction = target.baselineValue - target.targetValue;
      return Math.min(100, (reduction / targetReduction) * 100);
    }
    return target.targetValue > 0 
      ? Math.min(100, ((target.targetValue - target.currentValue) / target.targetValue) * 100)
      : 0;
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const target = new Date(deadline);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatUnit = (value: number, unit: CarbonTarget['unit']) => {
    switch (unit) {
      case 'kgCO2': return `${value.toLocaleString()} kg CO₂`;
      case 'tCO2': return `${value.toLocaleString()} t CO₂`;
      case 'percent_reduction': return `${value}%`;
    }
  };

  // Calculate overall stats
  const overallStats = {
    totalTargets: targets.length,
    onTrack: targets.filter(t => t.status === 'on_track' || t.status === 'achieved').length,
    atRisk: targets.filter(t => t.status === 'at_risk').length,
    offTrack: targets.filter(t => t.status === 'off_track').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-mono text-neutral-100 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Carbon Targets
          </h2>
          <p className="text-neutral-500 text-sm mt-1">Track progress towards your sustainability goals</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Target
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-px bg-neutral-800">
        <div className="bg-neutral-950 p-4 text-center">
          <p className="text-2xl font-mono text-neutral-100">{overallStats.totalTargets}</p>
          <p className="text-xs text-neutral-500 uppercase mt-1">Total Targets</p>
        </div>
        <div className="bg-neutral-950 p-4 text-center">
          <p className="text-2xl font-mono text-emerald-400">{overallStats.onTrack}</p>
          <p className="text-xs text-neutral-500 uppercase mt-1">On Track</p>
        </div>
        <div className="bg-neutral-950 p-4 text-center">
          <p className="text-2xl font-mono text-amber-400">{overallStats.atRisk}</p>
          <p className="text-xs text-neutral-500 uppercase mt-1">At Risk</p>
        </div>
        <div className="bg-neutral-950 p-4 text-center">
          <p className="text-2xl font-mono text-red-400">{overallStats.offTrack}</p>
          <p className="text-xs text-neutral-500 uppercase mt-1">Off Track</p>
        </div>
      </div>

      {/* Targets List */}
      {targets.length === 0 ? (
        <div className="card text-center py-12">
          <Leaf className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
          <h3 className="text-neutral-300 font-medium mb-2">No Carbon Targets Set</h3>
          <p className="text-neutral-500 text-sm mb-4">Create your first carbon reduction target to start tracking progress.</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            Create Target
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {targets.map((target) => {
            const statusConfig = getStatusConfig(target.status);
            const StatusIcon = statusConfig.icon;
            const progress = calculateProgress(target);
            const daysRemaining = getDaysRemaining(target.deadline);

            return (
              <div key={target.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 ${statusConfig.bg} ${statusConfig.border} border`}>
                      <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-200">{target.name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className={`px-2 py-0.5 text-xs ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
                          {statusConfig.label}
                        </span>
                        <span className="text-neutral-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {daysRemaining > 0 ? `${daysRemaining} days left` : 'Deadline passed'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => openEditModal(target)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-300"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTarget(target.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-400">
                      Current: <span className="text-neutral-200 font-mono">{formatUnit(target.currentValue, target.unit)}</span>
                    </span>
                    <span className="text-sm text-neutral-400">
                      Target: <span className="text-emerald-400 font-mono">{formatUnit(target.targetValue, target.unit)}</span>
                    </span>
                  </div>
                  <div className="w-full h-3 bg-neutral-800 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        target.status === 'achieved' ? 'bg-emerald-500' :
                        target.status === 'on_track' ? 'bg-blue-500' :
                        target.status === 'at_risk' ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-neutral-600">
                      {target.baselineValue && `Baseline: ${formatUnit(target.baselineValue, target.unit)}`}
                    </span>
                    <span className="text-xs font-mono text-neutral-500">{progress.toFixed(0)}% complete</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-mono text-neutral-100 uppercase tracking-wider">
                {editingTarget ? 'Edit Target' : 'New Carbon Target'}
              </h3>
              <button onClick={resetForm} className="text-neutral-500 hover:text-neutral-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Target Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., 2025 Carbon Reduction Goal"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Target Value</label>
                  <input
                    type="number"
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    className="input w-full"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as CarbonTarget['unit'])}
                    className="input w-full"
                  >
                    <option value="tCO2">Tonnes CO₂</option>
                    <option value="kgCO2">Kilograms CO₂</option>
                    <option value="percent_reduction">% Reduction</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Deadline</label>
                <input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">Baseline Value (Optional)</label>
                <input
                  type="number"
                  value={formBaseline}
                  onChange={(e) => setFormBaseline(e.target.value)}
                  className="input w-full"
                  placeholder="Current emissions to compare against"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={resetForm} className="btn-outline">
                  Cancel
                </button>
                <button 
                  onClick={editingTarget ? handleUpdateTarget : handleAddTarget}
                  className="btn-primary flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingTarget ? 'Save Changes' : 'Create Target'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
