'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Target,
  TrendingUp,
  Zap,
  Plus,
  X,
  Edit3,
  Trash2,
  Mail,
  Clock,
  Check,
  Leaf
} from 'lucide-react';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';

interface AlertRule {
  id: string;
  name: string;
  type: 'threshold' | 'target_risk' | 'anomaly' | 'budget';
  metric: 'carbon' | 'cost' | 'energy' | 'utilization';
  condition: 'above' | 'below' | 'equals';
  threshold: number;
  unit: string;
  enabled: boolean;
  notifyEmail: boolean;
  notifyInApp: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  createdAt: string;
}

interface Notification {
  id: string;
  ruleId: string;
  ruleName: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'carbon-budget-80',
    name: 'Carbon Budget 80% Warning',
    type: 'budget',
    metric: 'carbon',
    condition: 'above',
    threshold: 80,
    unit: '%',
    enabled: true,
    notifyEmail: true,
    notifyInApp: true,
    frequency: 'immediate',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cost-spike',
    name: 'Daily Cost Spike',
    type: 'anomaly',
    metric: 'cost',
    condition: 'above',
    threshold: 150,
    unit: '% of average',
    enabled: true,
    notifyEmail: false,
    notifyInApp: true,
    frequency: 'daily',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'low-utilization',
    name: 'Low GPU Utilization',
    type: 'threshold',
    metric: 'utilization',
    condition: 'below',
    threshold: 20,
    unit: '%',
    enabled: true,
    notifyEmail: false,
    notifyInApp: true,
    frequency: 'hourly',
    createdAt: new Date().toISOString(),
  },
];

export function AlertsNotifications() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'rules'>('notifications');
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AlertRule['type']>('threshold');
  const [formMetric, setFormMetric] = useState<AlertRule['metric']>('carbon');
  const [formCondition, setFormCondition] = useState<AlertRule['condition']>('above');
  const [formThreshold, setFormThreshold] = useState('');
  const [formEmail, setFormEmail] = useState(false);
  const [formInApp, setFormInApp] = useState(true);
  const [formFrequency, setFormFrequency] = useState<AlertRule['frequency']>('immediate');

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

    // Load rules
    const unsubRules = onSnapshot(doc(db, 'alert_rules', currentTeamId), (snapshot) => {
      if (snapshot.exists()) {
        setRules(snapshot.data().rules || []);
      } else {
        // Initialize with default rules
        setRules(DEFAULT_RULES);
        saveRules(DEFAULT_RULES);
      }
    });

    // Load notifications
    const unsubNotifications = onSnapshot(doc(db, 'notifications', currentTeamId), (snapshot) => {
      if (snapshot.exists()) {
        setNotifications(snapshot.data().items || []);
      }
      setIsLoading(false);
    });

    return () => {
      unsubRules();
      unsubNotifications();
    };
  }, [currentTeamId]);

  const saveRules = async (newRules: AlertRule[]) => {
    if (!currentTeamId) return;
    await setDoc(doc(db, 'alert_rules', currentTeamId), {
      rules: newRules,
      updatedAt: Timestamp.now(),
    });
  };

  const saveNotifications = async (newNotifications: Notification[]) => {
    if (!currentTeamId) return;
    await setDoc(doc(db, 'notifications', currentTeamId), {
      items: newNotifications,
      updatedAt: Timestamp.now(),
    });
  };

  const handleAddRule = async () => {
    if (!formName || !formThreshold) return;

    const unit = formMetric === 'carbon' ? 'kg CO₂' 
      : formMetric === 'cost' ? 'USD'
      : formMetric === 'energy' ? 'kWh'
      : '%';

    const newRule: AlertRule = {
      id: Date.now().toString(),
      name: formName,
      type: formType,
      metric: formMetric,
      condition: formCondition,
      threshold: parseFloat(formThreshold),
      unit,
      enabled: true,
      notifyEmail: formEmail,
      notifyInApp: formInApp,
      frequency: formFrequency,
      createdAt: new Date().toISOString(),
    };

    const newRules = [...rules, newRule];
    setRules(newRules);
    await saveRules(newRules);
    resetForm();
  };

  const handleUpdateRule = async () => {
    if (!editingRule || !formName || !formThreshold) return;

    const unit = formMetric === 'carbon' ? 'kg CO₂' 
      : formMetric === 'cost' ? 'USD'
      : formMetric === 'energy' ? 'kWh'
      : '%';

    const updatedRules = rules.map(r => 
      r.id === editingRule.id
        ? {
            ...r,
            name: formName,
            type: formType,
            metric: formMetric,
            condition: formCondition,
            threshold: parseFloat(formThreshold),
            unit,
            notifyEmail: formEmail,
            notifyInApp: formInApp,
            frequency: formFrequency,
          }
        : r
    );

    setRules(updatedRules);
    await saveRules(updatedRules);
    resetForm();
  };

  const toggleRule = async (id: string) => {
    const updatedRules = rules.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setRules(updatedRules);
    await saveRules(updatedRules);
  };

  const deleteRule = async (id: string) => {
    const newRules = rules.filter(r => r.id !== id);
    setRules(newRules);
    await saveRules(newRules);
  };

  const markAsRead = async (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    await saveNotifications(updated);
  };

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    await saveNotifications(updated);
  };

  const clearNotification = async (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    await saveNotifications(updated);
  };

  const openEditModal = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormType(rule.type);
    setFormMetric(rule.metric);
    setFormCondition(rule.condition);
    setFormThreshold(rule.threshold.toString());
    setFormEmail(rule.notifyEmail);
    setFormInApp(rule.notifyInApp);
    setFormFrequency(rule.frequency);
    setShowAddRule(true);
  };

  const resetForm = () => {
    setShowAddRule(false);
    setEditingRule(null);
    setFormName('');
    setFormType('threshold');
    setFormMetric('carbon');
    setFormCondition('above');
    setFormThreshold('');
    setFormEmail(false);
    setFormInApp(true);
    setFormFrequency('immediate');
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'critical': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      case 'info': return Info;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'critical': return 'text-red-400 bg-red-950 border-red-800';
      case 'warning': return 'text-amber-400 bg-amber-950 border-amber-800';
      case 'success': return 'text-emerald-400 bg-emerald-950 border-emerald-800';
      case 'info': return 'text-blue-400 bg-blue-950 border-blue-800';
    }
  };

  const getMetricIcon = (metric: AlertRule['metric']) => {
    switch (metric) {
      case 'carbon': return Leaf;
      case 'cost': return TrendingUp;
      case 'energy': return Zap;
      case 'utilization': return Target;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
            <Bell className="w-5 h-5 text-amber-500" />
            Alerts & Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-mono rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-neutral-500 text-sm mt-1">Configure alerts and view notifications</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-4">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 text-sm font-mono uppercase tracking-wider flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'bg-amber-600 text-neutral-950'
              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-red-600 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 text-sm font-mono uppercase tracking-wider flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'bg-amber-600 text-neutral-950'
              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Alert Rules
          <span className="text-xs opacity-70">({rules.filter(r => r.enabled).length})</span>
        </button>
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {notifications.length > 0 && (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={markAllAsRead}
                className="text-xs text-neutral-500 hover:text-neutral-300"
              >
                Mark all as read
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="card text-center py-16">
              <Bell className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <h3 className="text-neutral-300 font-medium mb-2">No Notifications</h3>
              <p className="text-neutral-500 text-sm max-w-md mx-auto">
                You're all caught up! Notifications will appear here when alert rules are triggered.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClasses = getNotificationColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={`card flex items-start gap-4 ${!notification.read ? 'border-l-2 border-l-amber-500' : 'opacity-70'}`}
                  >
                    <div className={`p-2 border ${colorClasses}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-neutral-200">{notification.title}</h4>
                          <p className="text-sm text-neutral-400 mt-1">{notification.message}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-neutral-500 hover:text-neutral-300"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => clearNotification(notification.id)}
                            className="p-1 text-neutral-500 hover:text-red-400"
                            title="Dismiss"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-neutral-600">
                        <span>{notification.ruleName}</span>
                        <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowAddRule(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Rule
            </button>
          </div>

          {rules.length === 0 ? (
            <div className="card text-center py-16">
              <AlertTriangle className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <h3 className="text-neutral-300 font-medium mb-2">No Alert Rules</h3>
              <p className="text-neutral-500 text-sm max-w-md mx-auto mb-6">
                Create alert rules to get notified when metrics exceed thresholds.
              </p>
              <button onClick={() => setShowAddRule(true)} className="btn-primary">
                Create First Rule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => {
                const MetricIcon = getMetricIcon(rule.metric);

                return (
                  <div
                    key={rule.id}
                    className={`card flex items-center gap-4 ${!rule.enabled ? 'opacity-50' : ''}`}
                  >
                    <div className="p-2 bg-neutral-800 border border-neutral-700">
                      <MetricIcon className="w-5 h-5 text-amber-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-neutral-200">{rule.name}</h4>
                        {!rule.enabled && (
                          <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5">Disabled</span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 mt-1">
                        Alert when {rule.metric} is {rule.condition} {rule.threshold} {rule.unit}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-neutral-600">
                        {rule.notifyEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> Email
                          </span>
                        )}
                        {rule.notifyInApp && (
                          <span className="flex items-center gap-1">
                            <Bell className="w-3 h-3" /> In-app
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {rule.frequency}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          rule.enabled ? 'bg-emerald-600' : 'bg-neutral-700'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          rule.enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                      <button
                        onClick={() => openEditModal(rule)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-300"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-1.5 text-neutral-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-mono text-neutral-100 uppercase tracking-wider">
                {editingRule ? 'Edit Alert Rule' : 'New Alert Rule'}
              </h3>
              <button onClick={resetForm} className="text-neutral-500 hover:text-neutral-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Rule Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input w-full"
                  placeholder="e.g., High Carbon Alert"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Metric</label>
                  <select
                    value={formMetric}
                    onChange={(e) => setFormMetric(e.target.value as AlertRule['metric'])}
                    className="input w-full"
                  >
                    <option value="carbon">Carbon (kg CO₂)</option>
                    <option value="cost">Cost (USD)</option>
                    <option value="energy">Energy (kWh)</option>
                    <option value="utilization">Utilization (%)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Condition</label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as AlertRule['condition'])}
                    className="input w-full"
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                    <option value="equals">Equals</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Threshold Value</label>
                <input
                  type="number"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(e.target.value)}
                  className="input w-full"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="label">Check Frequency</label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value as AlertRule['frequency'])}
                  className="input w-full"
                >
                  <option value="immediate">Immediate</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formInApp}
                    onChange={(e) => setFormInApp(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-neutral-300">In-app notification</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formEmail}
                    onChange={(e) => setFormEmail(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-neutral-300">Email notification</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={resetForm} className="btn-outline">
                  Cancel
                </button>
                <button 
                  onClick={editingRule ? handleUpdateRule : handleAddRule}
                  className="btn-primary flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingRule ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
