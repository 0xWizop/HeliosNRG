'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { useCurrentUser } from '@/components/AuthGuard';
import { 
  Cloud, 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Settings,
  Trash2,
  Play,
  Pause,
  X
} from 'lucide-react';

interface Integration {
  id: string;
  provider: 'aws' | 'gcp' | 'azure' | 'snowflake' | 'databricks' | 'nvidia';
  name: string;
  status: 'active' | 'paused' | 'error' | 'syncing';
  lastSync: string;
  nextSync: string;
  pollInterval: number;
  metrics: {
    workloadsTracked: number;
    lastCost: number;
    lastEnergy: number;
  };
}

const providerConfig = {
  aws: {
    name: 'Amazon Web Services',
    color: 'text-orange-400 bg-orange-950 border-orange-800',
    logo: 'https://i.imgur.com/22Hn0VN.png',
    fields: ['AWS Account ID', 'IAM Role ARN', 'Region'],
  },
  gcp: {
    name: 'Google Cloud Platform',
    color: 'text-blue-400 bg-blue-950 border-blue-800',
    logo: 'https://i.imgur.com/aXo5AgM.png',
    fields: ['Project ID', 'Service Account JSON', 'Region'],
  },
  azure: {
    name: 'Microsoft Azure',
    color: 'text-cyan-400 bg-cyan-950 border-cyan-800',
    logo: 'https://i.imgur.com/wIE1Gb0.png',
    fields: ['Subscription ID', 'Tenant ID', 'Client ID'],
  },
  snowflake: {
    name: 'Snowflake',
    color: 'text-sky-400 bg-sky-950 border-sky-800',
    logo: 'https://i.imgur.com/5BiKvI9.png',
    fields: ['Account Identifier', 'Username', 'Warehouse'],
  },
  databricks: {
    name: 'Databricks',
    color: 'text-red-400 bg-red-950 border-red-800',
    logo: 'https://i.imgur.com/BQ9x5Ef.png',
    fields: ['Workspace URL', 'Access Token', 'Cluster ID'],
  },
  nvidia: {
    name: 'NVIDIA DGX Cloud',
    color: 'text-green-400 bg-green-950 border-green-800',
    logo: 'https://i.imgur.com/QeF9uu8.png',
    fields: ['API Key', 'Organization ID', 'Cluster Name'],
  },
};

export function IntegrationsPanel() {
  const { userData } = useCurrentUser();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<keyof typeof providerConfig | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Get team ID from user data
  const teamId = userData?.currentTeamId || userData?.teamIds?.[0] || null;

  // Subscribe to integrations from Firebase
  useEffect(() => {
    // If no team yet, show empty state
    if (!teamId) {
      setIntegrations([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, COLLECTIONS.INTEGRATIONS),
      where('teamId', '==', teamId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            provider: d.provider,
            name: d.name,
            status: d.status || 'active',
            lastSync: d.lastSyncAt ? formatTimeAgo(d.lastSyncAt.toDate()) : 'Never',
            nextSync: d.status === 'active' ? `in ${d.config?.pollIntervalMinutes || 5} min` : 'paused',
            pollInterval: d.config?.pollIntervalMinutes || 5,
            metrics: d.metrics || { workloadsTracked: 0, lastCost: 0, lastEnergy: 0 },
          } as Integration;
        });
        setIntegrations(data);
        setIsLoading(false);
      },
      (error) => {
        // Handle permission errors silently - user may not have access yet
        console.error('Integrations listener error:', error.code);
        setIntegrations([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [teamId]);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await updateDoc(doc(db, COLLECTIONS.INTEGRATIONS, id), {
        status: 'syncing',
      });

      // Simulate sync process (in production, this would trigger actual API calls)
      await new Promise(resolve => setTimeout(resolve, 2000));

      await updateDoc(doc(db, COLLECTIONS.INTEGRATIONS, id), {
        status: 'active',
        lastSyncAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncingId(null);
    }
  };

  const handleToggle = async (id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration) return;
    
    try {
      await updateDoc(doc(db, COLLECTIONS.INTEGRATIONS, id), {
        status: integration.status === 'active' ? 'inactive' : 'active',
      });
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.INTEGRATIONS, id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleAddIntegration = async () => {
    if (!selectedProvider) return;

    const config = providerConfig[selectedProvider];
    try {
      if (!teamId) return;
      await addDoc(collection(db, COLLECTIONS.INTEGRATIONS), {
        teamId,
        provider: selectedProvider,
        name: formData.name || `${config.name} Integration`,
        status: 'active',
        config: {
          pollIntervalMinutes: 5,
          ...Object.fromEntries(
            config.fields.map(field => [field.toLowerCase().replace(/\s+/g, '_'), formData[field] || ''])
          ),
        },
        credentials: {},
        createdAt: Timestamp.now(),
        lastSyncAt: null,
        metrics: {
          workloadsTracked: 0,
          lastCost: 0,
          lastEnergy: 0,
        },
      });
      setShowAddModal(false);
      setSelectedProvider(null);
      setFormData({});
    } catch (error) {
      console.error('Failed to add integration:', error);
    }
  };

  const statusConfig = {
    active: { icon: CheckCircle, color: 'text-emerald-500', label: 'Active' },
    paused: { icon: Pause, color: 'text-amber-500', label: 'Paused' },
    error: { icon: AlertCircle, color: 'text-red-500', label: 'Error' },
    syncing: { icon: RefreshCw, color: 'text-blue-500', label: 'Syncing' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-mono text-neutral-100 uppercase tracking-wider">Live Integrations</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Real-time polling from your cloud providers
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Integration</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-neutral-800">
        <div className="bg-neutral-900 p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Active Sources</p>
          <p className="text-2xl font-mono text-neutral-100">
            {integrations.filter(i => i.status === 'active').length}
          </p>
        </div>
        <div className="bg-neutral-900 p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Workloads Tracked</p>
          <p className="text-2xl font-mono text-neutral-100">
            {integrations.reduce((sum, i) => sum + i.metrics.workloadsTracked, 0)}
          </p>
        </div>
        <div className="bg-neutral-900 p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Today's Cost</p>
          <p className="text-2xl font-mono text-amber-500">
            ${integrations.reduce((sum, i) => sum + i.metrics.lastCost, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-neutral-900 p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Today's Energy</p>
          <p className="text-2xl font-mono text-blue-400">
            {integrations.reduce((sum, i) => sum + i.metrics.lastEnergy, 0).toLocaleString()} kWh
          </p>
        </div>
      </div>

      {/* Integrations list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="card text-center py-12">
            <RefreshCw className="w-8 h-8 text-neutral-600 animate-spin mx-auto mb-3" />
            <p className="text-neutral-500">Loading integrations...</p>
          </div>
        ) : integrations.length === 0 ? (
          <div className="card text-center py-12">
            <Cloud className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
            <p className="text-neutral-400 mb-2">No integrations configured</p>
            <p className="text-sm text-neutral-600 mb-4">Connect your cloud providers to start tracking metrics</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Your First Integration
            </button>
          </div>
        ) : integrations.map((integration) => {
          const config = providerConfig[integration.provider];
          const status = statusConfig[integration.status];
          const StatusIcon = status.icon;

          return (
            <div
              key={integration.id}
              className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-800 border border-neutral-700 flex items-center justify-center p-2 shrink-0">
                  <img src={config.logo} alt={config.name} className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-neutral-200 truncate">{integration.name}</h3>
                    <span className={`badge ${config.color} text-[10px]`}>{config.name}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 mt-1 text-[10px] sm:text-xs text-neutral-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <StatusIcon className={`w-3 h-3 ${status.color} ${integration.status === 'syncing' ? 'animate-spin' : ''}`} />
                      {status.label}
                    </span>
                    <span className="hidden sm:inline">Last: {integration.lastSync}</span>
                    <span className="hidden sm:inline">Next: {integration.nextSync}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-neutral-500">{integration.metrics.workloadsTracked} workloads</p>
                  <p className="text-sm font-mono text-neutral-300">
                    ${integration.metrics.lastCost.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSync(integration.id)}
                    disabled={syncingId === integration.id}
                    className="p-2 text-neutral-500 hover:text-neutral-200 transition-colors disabled:opacity-50"
                    title="Sync now"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingId === integration.id ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleToggle(integration.id)}
                    className="p-2 text-neutral-500 hover:text-neutral-200 transition-colors"
                    title={integration.status === 'active' ? 'Pause' : 'Resume'}
                  >
                    {integration.status === 'active' ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    className="p-2 text-neutral-500 hover:text-neutral-200 transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(integration.id)}
                    className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-mono text-neutral-100 uppercase tracking-wider">Add Integration</h3>
              <button
                onClick={() => { setShowAddModal(false); setSelectedProvider(null); }}
                className="p-1.5 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-neutral-400 mb-4">
              Select a cloud provider to connect for live metrics polling.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {(Object.entries(providerConfig) as [keyof typeof providerConfig, typeof providerConfig[keyof typeof providerConfig]][]).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedProvider(key)}
                  className={`p-4 text-left transition-colors ${
                    selectedProvider === key
                      ? 'bg-amber-950/50 border border-amber-800'
                      : 'bg-neutral-800 border border-neutral-700 hover:border-neutral-600'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <img src={config.logo} alt={config.name} className="w-6 h-6 object-contain" />
                    <span className="text-sm font-medium text-neutral-200">{config.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedProvider && (
              <div className="space-y-3 mb-6 p-4 bg-neutral-800 border border-neutral-700">
                <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-3">
                  Required credentials
                </p>
                <div>
                  <label className="label">Integration Name</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder={`My ${providerConfig[selectedProvider].name}`}
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                {providerConfig[selectedProvider].fields.map((field) => (
                  <div key={field}>
                    <label className="label">{field}</label>
                    <input 
                      type={field.toLowerCase().includes('key') || field.toLowerCase().includes('token') || field.toLowerCase().includes('secret') ? 'password' : 'text'}
                      className="input" 
                      placeholder={`Enter ${field.toLowerCase()}`}
                      value={formData[field] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowAddModal(false); setSelectedProvider(null); setFormData({}); }}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIntegration}
                disabled={!selectedProvider}
                className="btn-primary flex items-center gap-2"
              >
                <Cloud className="w-4 h-4" />
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
