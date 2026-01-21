'use client';

import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

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
  Target
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
import { AuthGuard, useCurrentUser } from '@/components/AuthGuard';

type TabType = 'overview' | 'gpu' | 'targets' | 'upload' | 'integrations' | 'compare' | 'assumptions' | 'scenarios' | 'reports' | 'team' | 'settings';

function DashboardContent() {
  const router = useRouter();
  const { user, userData } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [hasData, setHasData] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
    { id: 'integrations', label: 'Integrations', icon: <Zap className="w-4 h-4" /> },
    { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
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
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono font-medium tracking-wider">HELIOS</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/pricing" className="text-neutral-500 hover:text-neutral-200 text-xs font-mono uppercase tracking-wider transition-colors">
                Pricing
              </Link>
              <Link href="/methodology" className="text-neutral-500 hover:text-neutral-200 text-xs font-mono uppercase tracking-wider transition-colors">
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-px bg-neutral-800 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap ${
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
          <OverviewTab hasData={hasData} onUploadClick={() => setActiveTab('upload')} />
        )}
        
        {activeTab === 'upload' && (
          <DataUploader onDataLoaded={() => setHasData(true)} />
        )}
        
        {activeTab === 'assumptions' && (
          <AssumptionPanel />
        )}
        
        {activeTab === 'scenarios' && (
          <ScenariosTab hasData={hasData} />
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
      </div>
    </div>
  );
}

function OverviewTab({ hasData, onUploadClick }: { hasData: boolean; onUploadClick: () => void }) {
  if (!hasData) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-6">
          <Upload className="w-8 h-8 text-neutral-600" />
        </div>
        <h2 className="text-lg font-display font-medium text-neutral-100 mb-2">No Data Uploaded</h2>
        <p className="text-sm text-neutral-500 mb-8 max-w-md mx-auto">
          Upload your cloud billing data, data warehouse logs, or AI workload metadata to begin analysis.
        </p>
        <button onClick={onUploadClick} className="btn-primary inline-flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-px bg-neutral-800">
        <SummaryCard
          title="Total Cost"
          value="$127,453"
          change="-12.3%"
          changeType="positive"
          icon={<DollarSign className="w-4 h-4 text-amber-500" />}
          confidence={78}
        />
        <SummaryCard
          title="Energy Usage"
          value="48,291 kWh"
          change="-8.7%"
          changeType="positive"
          icon={<Zap className="w-4 h-4 text-amber-500" />}
          confidence={72}
        />
        <SummaryCard
          title="Carbon Emissions"
          value="18.4 tCO₂e"
          change="-15.2%"
          changeType="positive"
          icon={<Leaf className="w-4 h-4 text-emerald-500" />}
          confidence={68}
        />
        <SummaryCard
          title="Potential Savings"
          value="$23,100"
          subtitle="18% reduction possible"
          icon={<TrendingDown className="w-4 h-4 text-blue-500" />}
          confidence={65}
        />
      </div>

      {/* Historical Charts */}
      <HistoricalCharts />

      {/* Charts */}
      <DashboardCharts />

      {/* Hotspots */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider">Optimization Opportunities</h3>
          <ConfidenceBadge score={72} />
        </div>
        <div className="space-y-2">
          <HotspotItem
            title="Idle GPU instances in us-east-1"
            severity="high"
            savings="$8,200/month"
            description="3 p3.8xlarge instances showing <5% utilization"
          />
          <HotspotItem
            title="Snowflake warehouse oversizing"
            severity="medium"
            savings="$4,100/month"
            description="ANALYTICS_WH running at 2X-Large with 12% avg utilization"
          />
          <HotspotItem
            title="Training jobs in high-carbon region"
            severity="low"
            savings="2.1 tCO₂e/month"
            description="Consider migrating from ap-southeast-2 to eu-north-1"
          />
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

function ScenariosTab({ hasData }: { hasData: boolean }) {
  if (!hasData) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-6">
          <Activity className="w-8 h-8 text-neutral-600" />
        </div>
        <p className="text-sm text-neutral-500">Upload data first to create scenarios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono text-neutral-100 uppercase tracking-wider">Scenario Simulator</h2>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Scenario
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-neutral-800">
        <ScenarioCard
          name="Migrate to eu-north-1"
          description="Move GPU training workloads to Sweden for lower carbon intensity"
          costDelta="+$2,100"
          energyDelta="0%"
          carbonDelta="-67%"
          confidence={71}
        />
        <ScenarioCard
          name="Right-size Snowflake"
          description="Reduce ANALYTICS_WH from 2X-Large to Medium"
          costDelta="-$4,100"
          energyDelta="-60%"
          carbonDelta="-60%"
          confidence={82}
        />
      </div>
    </div>
  );
}

function ScenarioCard({
  name,
  description,
  costDelta,
  energyDelta,
  carbonDelta,
  confidence,
}: {
  name: string;
  description: string;
  costDelta: string;
  energyDelta: string;
  carbonDelta: string;
  confidence: number;
}) {
  return (
    <div className="bg-neutral-950 p-6 cursor-pointer hover:bg-neutral-900 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-neutral-100 text-sm">{name}</h3>
        <ConfidenceBadge score={confidence} size="sm" />
      </div>
      <p className="text-xs text-neutral-500 mb-4">{description}</p>
      <div className="grid grid-cols-3 gap-3 p-3 bg-neutral-900 border border-neutral-800 text-xs">
        <div className="text-center">
          <p className="text-neutral-600 mb-0.5 font-mono uppercase text-[10px]">Cost</p>
          <p className={`font-mono font-medium ${costDelta.startsWith('-') ? 'text-emerald-400' : 'text-red-400'}`}>
            {costDelta}
          </p>
        </div>
        <div className="text-center border-x border-neutral-800">
          <p className="text-neutral-600 mb-0.5 font-mono uppercase text-[10px]">Energy</p>
          <p className={`font-mono font-medium ${energyDelta.startsWith('-') ? 'text-emerald-400' : 'text-neutral-300'}`}>
            {energyDelta}
          </p>
        </div>
        <div className="text-center">
          <p className="text-neutral-600 mb-0.5 font-mono uppercase text-[10px]">Carbon</p>
          <p className={`font-mono font-medium ${carbonDelta.startsWith('-') ? 'text-emerald-400' : 'text-neutral-300'}`}>
            {carbonDelta}
          </p>
        </div>
      </div>
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
