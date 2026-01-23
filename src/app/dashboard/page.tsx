'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/firebase/collections';

// Force dynamic rendering to avoid Firebase initialization during static build
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  BarChart3, 
  Settings, 
  FileText,
  TrendingDown,
  Leaf,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Plus,
  Zap,
  Activity,
  Users,
  LogOut,
  User,
  RefreshCw,
  Building2,
  Cpu,
  Target,
  Bell,
  X
} from 'lucide-react';
import { DataUploader } from '@/components/DataUploader';
import { DashboardCharts } from '@/components/DashboardCharts';
import { AssumptionPanel } from '@/components/AssumptionPanel';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { HistoricalCharts } from '@/components/HistoricalCharts';
import { WorkloadComparison } from '@/components/WorkloadComparison';
import { TeamManagement } from '@/components/TeamManagement';
import { IntegrationsPanel } from '@/components/IntegrationsPanel';
import { OrganizationSettings } from '@/components/OrganizationSettings';
import { GPUDashboard } from '@/components/GPUDashboard';
import { CarbonTargets } from '@/components/CarbonTargets';
import { AlertsNotifications } from '@/components/AlertsNotifications';
import { AuthGuard, useCurrentUser } from '@/components/AuthGuard';
import { TutorialTooltip } from '@/components/TutorialTooltip';

type TabType = 'overview' | 'gpu' | 'targets' | 'alerts' | 'integrations' | 'compare' | 'assumptions' | 'reports' | 'team' | 'settings';

function DashboardContent() {
  const router = useRouter();
  const { user, userData } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [hasData, setHasData] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [dataCheckComplete, setDataCheckComplete] = useState(false);
  
  // Get team ID from user data
  const teamId = userData?.currentTeamId || userData?.teamIds?.[0] || null;

  // Timeout fallback - if check takes too long, assume no data
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!dataCheckComplete) {
        setDataCheckComplete(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeout);
  }, [dataCheckComplete]);

  // Check if team has data on mount
  useEffect(() => {
    // If no teamId yet, mark check as complete after a brief delay
    // (userData might still be loading)
    if (!teamId) {
      const timer = setTimeout(() => {
        setDataCheckComplete(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    const checkForData = async () => {
      try {
        const workloadsQuery = query(
          collection(db, COLLECTIONS.WORKLOADS),
          where('teamId', '==', teamId),
          limit(1)
        );
        const snap = await getDocs(workloadsQuery);
        setHasData(!snap.empty);
      } catch (error) {
        console.error('Error checking for data:', error);
        setHasData(false);
      } finally {
        setDataCheckComplete(true);
      }
    };
    
    checkForData();
  }, [teamId]);

  const handleLogout = async () => {
    try {
      await signOut(auth!);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'gpu', label: 'GPU Fleet', icon: <Cpu className="w-4 h-4" /> },
    { id: 'targets', label: 'Targets', icon: <Target className="w-4 h-4" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Zap className="w-4 h-4" /> },
    { id: 'compare', label: 'Compare', icon: <Activity className="w-4 h-4" /> },
    { id: 'assumptions', label: 'Assumptions', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800 sticky top-0 z-10 bg-neutral-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono font-medium tracking-wider">HELIOS</span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Upload Data Button - Plus icon only */}
              <button
                onClick={() => setShowUploader(true)}
                className="w-7 h-7 bg-amber-600 hover:bg-amber-500 text-neutral-950 transition-colors flex items-center justify-center"
                title="Upload Data"
              >
                <Plus className="w-4 h-4" />
              </button>
              
              <Link href="/pricing" className="hidden sm:block text-neutral-500 hover:text-neutral-200 text-xs font-mono uppercase tracking-wider transition-colors">
                Pricing
              </Link>
              <Link href="/methodology" className="hidden sm:block text-neutral-500 hover:text-neutral-200 text-xs font-mono uppercase tracking-wider transition-colors">
                Docs
              </Link>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  <div className="w-7 h-7 bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-mono hidden sm:block">
                    {userData?.displayName || user?.email?.split('@')[0] || 'User'}
                  </span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 border border-neutral-800 shadow-xl z-50">
                    <div className="p-3 border-b border-neutral-800">
                      <p className="text-xs text-neutral-500 font-mono">Signed in as</p>
                      <p className="text-sm text-neutral-200 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-px bg-neutral-800 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-600 text-neutral-950'
                  : 'bg-neutral-900 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab 
            hasData={hasData} 
            showUploader={showUploader}
            onUploadClick={() => setShowUploader(true)} 
            onDataLoaded={() => {
              setHasData(true);
              setShowUploader(false);
            }}
            teamId={teamId}
            dataCheckComplete={dataCheckComplete}
          />
        )}
        
        {activeTab === 'assumptions' && (
          <AssumptionPanel />
        )}
        

        {activeTab === 'alerts' && (
          <AlertsNotifications />
        )}
        
        {activeTab === 'reports' && (
          <ReportsTab hasData={hasData} />
        )}
        
        {activeTab === 'integrations' && (
          <IntegrationsPanel />
        )}
        
        {activeTab === 'compare' && (
          <WorkloadComparison />
        )}
        
        {activeTab === 'gpu' && (
          <GPUDashboard />
        )}

        {activeTab === 'targets' && (
          <CarbonTargets />
        )}

        {activeTab === 'team' && (
          <TeamManagement />
        )}

        {activeTab === 'settings' && (
          <OrganizationSettings />
        )}

        {/* Global Upload Modal */}
        {showUploader && (
          <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
            <div className="bg-neutral-900 border border-neutral-800 w-full max-w-lg sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-800">
                <h2 className="text-sm sm:text-lg font-mono text-neutral-100 uppercase tracking-wider">Upload Data</h2>
                <button 
                  onClick={() => setShowUploader(false)}
                  className="text-neutral-500 hover:text-neutral-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3 sm:p-6 overflow-y-auto">
                <DataUploader 
                  onDataLoaded={() => {
                    setHasData(true);
                    setShowUploader(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DashboardMetrics {
  totalCost: number;
  totalEnergy: number;
  totalCarbon: number;
  avgConfidence: number;
  workloadCount: number;
  topWorkloads: Array<{ name: string; provider: string; region: string; cost: number; energy: number; carbon: number; utilization: number }>;
}

function OverviewTab({ hasData, showUploader, onUploadClick, onDataLoaded, teamId, dataCheckComplete }: { 
  hasData: boolean; 
  showUploader: boolean;
  onUploadClick: () => void;
  onDataLoaded: () => void;
  teamId: string | null;
  dataCheckComplete: boolean;
}) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Fetch real metrics from Firestore
  useEffect(() => {
    if (!teamId) {
      setFetchAttempted(true);
      return;
    }
    if (!hasData) {
      setFetchAttempted(true);
      return;
    }

    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        // Fetch workloads
        const workloadsQuery = query(
          collection(db, COLLECTIONS.WORKLOADS),
          where('teamId', '==', teamId),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const workloadsSnap = await getDocs(workloadsQuery);
        
        let totalCost = 0;
        let totalEnergy = 0;
        let totalCarbon = 0;
        let totalConfidence = 0;
        const workloads: DashboardMetrics['topWorkloads'] = [];

        workloadsSnap.docs.forEach(doc => {
          const d = doc.data();
          const cost = d.cost || d.totalCost || 0;
          const energy = d.totalEnergy || d.energyKwh || 0;
          const carbon = d.totalCarbon || d.carbonKg || 0;
          
          totalCost += cost;
          totalEnergy += energy;
          totalCarbon += carbon;
          totalConfidence += d.confidence || 70;

          workloads.push({
            name: d.name || 'Unknown',
            provider: d.provider || 'Unknown',
            region: d.region || 'unknown',
            cost,
            energy,
            carbon,
            utilization: d.avgCpuUtilization || 0,
          });
        });

        const count = workloadsSnap.docs.length;
        
        // Also fetch from metrics collection for aggregated data
        const metricsQuery = query(
          collection(db, COLLECTIONS.METRICS),
          where('teamId', '==', teamId),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const metricsSnap = await getDocs(metricsQuery);
        
        metricsSnap.docs.forEach(doc => {
          const d = doc.data();
          if (d.cost) totalCost += d.cost;
          if (d.energyKwh) totalEnergy += d.energyKwh;
          if (d.carbonKg) totalCarbon += d.carbonKg;
        });

        setMetrics({
          totalCost,
          totalEnergy,
          totalCarbon,
          avgConfidence: count > 0 ? Math.round(totalConfidence / count) : 70,
          workloadCount: count,
          topWorkloads: workloads.sort((a, b) => b.cost - a.cost).slice(0, 10),
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
        // Set empty metrics on error so we don't infinite load
        setMetrics({
          totalCost: 0,
          totalEnergy: 0,
          totalCarbon: 0,
          avgConfidence: 0,
          workloadCount: 0,
          topWorkloads: [],
        });
      } finally {
        setIsLoading(false);
        setFetchAttempted(true);
      }
    };

    fetchMetrics();
  }, [teamId, hasData]);

  // Show loading only while initial data check is in progress
  if (!dataCheckComplete) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!hasData && !showUploader) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-6">
          <Upload className="w-8 h-8 text-neutral-600" />
        </div>
        <h2 className="text-lg font-display font-medium text-neutral-100 mb-2">No Data Uploaded</h2>
        <p className="text-sm text-neutral-500 mb-8 max-w-md mx-auto">
          Upload your cloud billing data, data warehouse logs, or AI workload metadata to begin analysis.
        </p>
        <TutorialTooltip
          id="upload-data-cta"
          title="Get Started"
          content="Upload CSV files from AWS, GCP, Azure, Snowflake, or Databricks. Helios will auto-detect the format and map columns for you."
          position="bottom"
          showIcon={false}
        >
          <button onClick={onUploadClick} className="btn-primary inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Data
          </button>
        </TutorialTooltip>
      </div>
    );
  }

  if (showUploader) {
    return <DataUploader onDataLoaded={onDataLoaded} />;
  }

  // Show loading state only while actively loading, not indefinitely
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  // If we tried to fetch but got no metrics, show empty state
  if (fetchAttempted && !metrics) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-6">
          <Upload className="w-8 h-8 text-neutral-600" />
        </div>
        <h2 className="text-lg font-display font-medium text-neutral-100 mb-2">No Data Found</h2>
        <p className="text-sm text-neutral-500 mb-8 max-w-md mx-auto">
          Upload your cloud billing data to see metrics and insights.
        </p>
        <button onClick={onUploadClick} className="btn-primary inline-flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Data
        </button>
      </div>
    );
  }

  // Still waiting for initial fetch
  if (!metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  // Calculate potential savings (estimate 15-20% of cost)
  const potentialSavings = metrics.totalCost * 0.18;

  return (
    <div className="space-y-6">
      {/* Summary Cards - Using REAL data */}
      <div className="grid md:grid-cols-4 gap-px bg-neutral-800">
        <SummaryCard
          title="Total Cost"
          value={`$${metrics.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtitle={`${metrics.workloadCount} workloads`}
          icon={<DollarSign className="w-4 h-4 text-amber-500" />}
          confidence={metrics.avgConfidence}
        />
        <SummaryCard
          title="Energy Usage"
          value={`${metrics.totalEnergy.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`}
          icon={<Zap className="w-4 h-4 text-amber-500" />}
          confidence={metrics.avgConfidence}
        />
        <SummaryCard
          title="Carbon Emissions"
          value={`${(metrics.totalCarbon / 1000).toFixed(2)} tCO₂e`}
          icon={<Leaf className="w-4 h-4 text-emerald-500" />}
          confidence={metrics.avgConfidence}
        />
        <SummaryCard
          title="Potential Savings"
          value={`$${potentialSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtitle="~18% reduction possible"
          icon={<TrendingDown className="w-4 h-4 text-blue-500" />}
          confidence={Math.round(metrics.avgConfidence * 0.9)}
        />
      </div>

      {/* Historical Charts */}
      <HistoricalCharts />

      {/* Charts - pass real data */}
      <DashboardCharts workloads={metrics.topWorkloads} />

      {/* Hotspots - generate from real data */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider">Optimization Opportunities</h3>
          <TutorialTooltip
            id="confidence-score"
            title="Confidence Score"
            content="This score (0-100%) indicates data quality. Higher scores mean calculations use verified data; lower scores rely on estimates. Click to see what affects confidence."
            position="left"
          >
            <ConfidenceBadge score={metrics.avgConfidence} />
          </TutorialTooltip>
        </div>
        <div className="space-y-2">
          {metrics.topWorkloads.filter(w => w.utilization < 30 && w.utilization > 0).slice(0, 3).map((w, i) => (
            <HotspotItem
              key={i}
              title={`Low utilization: ${w.name}`}
              severity={w.utilization < 10 ? 'high' : w.utilization < 20 ? 'medium' : 'low'}
              savings={`$${Math.round(w.cost * 0.5).toLocaleString()}/month`}
              description={`${w.provider} ${w.region} - ${w.utilization}% avg CPU utilization`}
            />
          ))}
          {metrics.topWorkloads.filter(w => w.utilization < 30 && w.utilization > 0).length === 0 && (
            <p className="text-neutral-500 text-sm py-4 text-center">
              No optimization opportunities detected yet. Upload more data for insights.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ 
  title, 
  value, 
  change, 
  changeType, 
  subtitle,
  icon, 
  confidence 
}: { 
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  subtitle?: string;
  icon: React.ReactNode;
  confidence: number;
}) {
  return (
    <div className="bg-neutral-950 p-6 group hover:bg-neutral-900 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-neutral-900 border border-neutral-800 flex items-center justify-center">
          {icon}
        </div>
        <ConfidenceBadge score={confidence} size="sm" />
      </div>
      <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-mono font-medium text-neutral-100">{value}</p>
      {change && (
        <p className={`text-xs font-mono mt-2 ${changeType === 'positive' ? 'text-emerald-500' : 'text-red-500'}`}>
          {change} vs last period
        </p>
      )}
      {subtitle && (
        <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function HotspotItem({ 
  title, 
  severity, 
  savings, 
  description 
}: { 
  title: string;
  severity: 'high' | 'medium' | 'low';
  savings: string;
  description: string;
}) {
  const severityColors = {
    high: 'bg-red-950 text-red-400 border-red-800',
    medium: 'bg-amber-950 text-amber-400 border-amber-800',
    low: 'bg-blue-950 text-blue-400 border-blue-800',
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-neutral-900 hover:bg-neutral-800 transition-colors cursor-pointer border border-neutral-800">
      <AlertCircle className={`w-4 h-4 mt-0.5 ${
        severity === 'high' ? 'text-red-500' : 
        severity === 'medium' ? 'text-amber-500' : 'text-blue-500'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-medium text-neutral-200">{title}</h4>
          <span className={`badge ${severityColors[severity]}`}>{severity}</span>
        </div>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm text-emerald-500">{savings}</p>
        <p className="text-xs text-neutral-600">potential</p>
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-600" />
    </div>
  );
}

function ReportsTab({ hasData }: { hasData: boolean }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  const { userData } = useCurrentUser();

  const generateReport = async (reportType: string) => {
    setIsGenerating(true);
    setSelectedReport(reportType);
    
    try {
      // Import Firebase functions
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      const { COLLECTIONS } = await import('@/lib/firebase/collections');
      
      const teamId = userData?.currentTeamId || userData?.teamIds?.[0];
      if (!teamId) {
        console.error('No team ID');
        return;
      }

      // Fetch workloads
      const workloadsQuery = query(
        collection(db, COLLECTIONS.WORKLOADS),
        where('teamId', '==', teamId)
      );
      const workloadsSnap = await getDocs(workloadsQuery);
      const workloads = workloadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch metrics
      const metricsQuery = query(
        collection(db, COLLECTIONS.METRICS),
        where('teamId', '==', teamId)
      );
      const metricsSnap = await getDocs(metricsQuery);
      const metrics = metricsSnap.docs.map(doc => doc.data());

      // Calculate totals
      const totalEnergy = workloads.reduce((sum: number, w: any) => sum + (w.totalEnergy || 0), 0);
      const totalCarbon = workloads.reduce((sum: number, w: any) => sum + (w.totalCarbon || 0), 0);
      const totalCost = metrics.reduce((sum: number, m: any) => sum + (m.cost || 0), 0);
      const avgConfidence = workloads.length > 0 
        ? workloads.reduce((sum: number, w: any) => sum + (w.confidence || 0), 0) / workloads.length 
        : 0;

      // Group by provider
      const byProvider: Record<string, { count: number; energy: number; carbon: number }> = {};
      workloads.forEach((w: any) => {
        const provider = w.provider || 'Unknown';
        if (!byProvider[provider]) byProvider[provider] = { count: 0, energy: 0, carbon: 0 };
        byProvider[provider].count++;
        byProvider[provider].energy += w.totalEnergy || 0;
        byProvider[provider].carbon += w.totalCarbon || 0;
      });

      // Group by region
      const byRegion: Record<string, { count: number; energy: number; carbon: number }> = {};
      workloads.forEach((w: any) => {
        const region = w.region || 'unknown';
        if (!byRegion[region]) byRegion[region] = { count: 0, energy: 0, carbon: 0 };
        byRegion[region].count++;
        byRegion[region].energy += w.totalEnergy || 0;
        byRegion[region].carbon += w.totalCarbon || 0;
      });

      const report = {
        generatedAt: new Date().toISOString(),
        reportType,
        summary: {
          totalWorkloads: workloads.length,
          totalEnergy: Math.round(totalEnergy * 100) / 100,
          totalCarbon: Math.round(totalCarbon * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          avgConfidence: Math.round(avgConfidence),
        },
        byProvider,
        byRegion,
        workloads: workloads.slice(0, 20), // First 20 for preview
        assumptions: {
          pue: 1.58,
          carbonIntensity: '436 gCO2/kWh (US average)',
          methodology: 'Cloud Carbon Footprint methodology',
        },
      };

      setGeneratedReport(report);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (format: 'csv' | 'json') => {
    if (!generatedReport) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(generatedReport, null, 2);
      filename = `helios-report-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    } else {
      // CSV format
      const rows = [
        ['Helios Energy Report', generatedReport.generatedAt],
        [],
        ['Summary'],
        ['Total Workloads', generatedReport.summary.totalWorkloads],
        ['Total Energy (kWh)', generatedReport.summary.totalEnergy],
        ['Total Carbon (kg CO2)', generatedReport.summary.totalCarbon],
        ['Avg Confidence', `${generatedReport.summary.avgConfidence}%`],
        [],
        ['By Provider', 'Count', 'Energy (kWh)', 'Carbon (kg)'],
        ...Object.entries(generatedReport.byProvider).map(([provider, data]: [string, any]) => 
          [provider, data.count, data.energy.toFixed(2), data.carbon.toFixed(2)]
        ),
        [],
        ['By Region', 'Count', 'Energy (kWh)', 'Carbon (kg)'],
        ...Object.entries(generatedReport.byRegion).map(([region, data]: [string, any]) => 
          [region, data.count, data.energy.toFixed(2), data.carbon.toFixed(2)]
        ),
      ];
      content = rows.map(row => row.join(',')).join('\n');
      filename = `helios-report-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDFReport = async () => {
    if (!generatedReport) return;

    try {
      const { generatePDFReport, downloadPDF } = await import('@/lib/reports/pdf-generator');
      
      const pdfData = {
        teamName: userData?.displayName || 'Team Report',
        generatedAt: generatedReport.generatedAt,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        },
        summary: {
          totalWorkloads: generatedReport.summary.totalWorkloads,
          totalEnergyKwh: generatedReport.summary.totalEnergy,
          totalCarbonKg: generatedReport.summary.totalCarbon,
          totalCostUsd: generatedReport.summary.totalCost || 0,
          avgUtilization: 0,
        },
        workloads: generatedReport.workloads.map((w: any) => ({
          name: w.name || 'Workload',
          provider: w.provider || 'Unknown',
          region: w.region || 'unknown',
          instanceType: w.instanceType || 'unknown',
          energyKwh: w.totalEnergy || 0,
          carbonKg: w.totalCarbon || 0,
          costUsd: w.cost || 0,
          utilization: w.avgCpuUtilization || 0,
        })),
      };

      const pdfBlob = await generatePDFReport(pdfData);
      downloadPDF(pdfBlob, `helios-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (!hasData) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-6">
          <FileText className="w-8 h-8 text-neutral-600" />
        </div>
        <p className="text-sm text-neutral-500">Upload data first to generate reports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono text-neutral-100 uppercase tracking-wider">Executive Reports</h2>
        <button 
          onClick={() => generateReport('executive')}
          disabled={isGenerating}
          className="btn-primary flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate Report
            </>
          )}
        </button>
      </div>

      {/* Generated Report Preview */}
      {generatedReport && (
        <div className="card border-emerald-900/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-950 border border-emerald-800 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-mono text-neutral-100 uppercase">Report Generated</h3>
                <p className="text-xs text-neutral-500">{new Date(generatedReport.generatedAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={downloadPDFReport} className="btn-primary text-xs">
                Download PDF
              </button>
              <button onClick={() => downloadReport('csv')} className="btn-outline text-xs">
                Download CSV
              </button>
              <button onClick={() => downloadReport('json')} className="btn-outline text-xs">
                Download JSON
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-neutral-900 p-3 border border-neutral-800">
              <p className="text-xs text-neutral-500 uppercase">Workloads</p>
              <p className="text-lg font-mono text-neutral-100">{generatedReport.summary.totalWorkloads}</p>
            </div>
            <div className="bg-neutral-900 p-3 border border-neutral-800">
              <p className="text-xs text-neutral-500 uppercase">Energy</p>
              <p className="text-lg font-mono text-blue-400">{generatedReport.summary.totalEnergy} kWh</p>
            </div>
            <div className="bg-neutral-900 p-3 border border-neutral-800">
              <p className="text-xs text-neutral-500 uppercase">Carbon</p>
              <p className="text-lg font-mono text-emerald-400">{generatedReport.summary.totalCarbon} kg</p>
            </div>
            <div className="bg-neutral-900 p-3 border border-neutral-800">
              <p className="text-xs text-neutral-500 uppercase">Confidence</p>
              <p className="text-lg font-mono text-amber-400">{generatedReport.summary.avgConfidence}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-mono text-neutral-500 uppercase mb-2">By Provider</h4>
              <div className="space-y-1">
                {Object.entries(generatedReport.byProvider).map(([provider, data]: [string, any]) => (
                  <div key={provider} className="flex justify-between text-sm bg-neutral-900/50 p-2">
                    <span className="text-neutral-300">{provider}</span>
                    <span className="text-neutral-500">{data.count} workloads</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-mono text-neutral-500 uppercase mb-2">By Region</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {Object.entries(generatedReport.byRegion).slice(0, 5).map(([region, data]: [string, any]) => (
                  <div key={region} className="flex justify-between text-sm bg-neutral-900/50 p-2">
                    <span className="text-neutral-300">{region}</span>
                    <span className="text-neutral-500">{data.count} workloads</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-4">Available Report Types</h3>
        <div className="space-y-2">
          <ReportType
            name="Executive Summary"
            description="High-level overview of costs, energy, and carbon with key recommendations"
            formats={['PDF', 'CSV']}
            onGenerate={() => generateReport('executive')}
            isGenerating={isGenerating && selectedReport === 'executive'}
          />
          <ReportType
            name="Detailed Analysis"
            description="Comprehensive breakdown by workload, region, and resource type"
            formats={['PDF', 'CSV', 'JSON']}
            onGenerate={() => generateReport('detailed')}
            isGenerating={isGenerating && selectedReport === 'detailed'}
          />
          <ReportType
            name="Scenario Comparison"
            description="Side-by-side comparison of optimization scenarios"
            formats={['PDF']}
            onGenerate={() => generateReport('comparison')}
            isGenerating={isGenerating && selectedReport === 'comparison'}
          />
        </div>
      </div>

      <div className="card bg-neutral-900/50">
        <h3 className="font-medium text-neutral-200 mb-1 text-sm">Methodology Appendix</h3>
        <p className="text-xs text-neutral-500 mb-3">
          All reports include a methodology appendix documenting calculation methods, 
          data sources, assumptions, and confidence scores.
        </p>
        <Link href="/methodology" className="text-amber-500 hover:text-amber-400 text-xs font-mono uppercase tracking-wider inline-flex items-center gap-1">
          View Docs <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

function ReportType({
  name,
  description,
  formats,
  onGenerate,
  isGenerating,
}: {
  name: string;
  description: string;
  formats: string[];
  onGenerate?: () => void;
  isGenerating?: boolean;
}) {
  return (
    <div 
      onClick={onGenerate}
      className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors cursor-pointer"
    >
      <div>
        <h4 className="font-medium text-neutral-200 text-sm">{name}</h4>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {isGenerating ? (
          <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
        ) : (
          formats.map((format) => (
            <span key={format} className="badge bg-neutral-800 text-neutral-400 border border-neutral-700">
              {format}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

// Main export with AuthGuard
export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
