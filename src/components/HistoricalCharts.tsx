'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { TrendingUp, TrendingDown, Calendar, RefreshCw, Database } from 'lucide-react';

interface DataPoint {
  date: string;
  cost: number;
  energy: number;
  carbon: number;
}

interface HistoricalChartsProps {
  data?: DataPoint[];
  isLoading?: boolean;
}

type TimeRange = '7d' | '30d' | '90d';
type MetricType = 'cost' | 'energy' | 'carbon';

export function HistoricalCharts({ data, isLoading: externalLoading = false }: HistoricalChartsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [activeMetric, setActiveMetric] = useState<MetricType>('cost');
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);

  // Get current user's team
  useEffect(() => {
    if (!auth) return;
    
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const teamId = userData.currentTeamId || userData.teamIds?.[0];
          setCurrentTeamId(teamId);
        }
      } else {
        setIsLoading(false);
      }
    });
    
    return () => unsubAuth();
  }, []);

  // Subscribe to metrics from Firebase
  useEffect(() => {
    if (data) {
      setChartData(data);
      setIsLoading(false);
      return;
    }

    if (!currentTeamId) {
      // No team yet - show empty state instead of loading forever
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const q = query(
      collection(db, COLLECTIONS.METRICS),
      where('teamId', '==', currentTeamId),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Group metrics by date
      const dailyData: Record<string, { cost: number; energy: number; carbon: number; count: number }> = {};
      
      snapshot.docs.forEach(doc => {
        const d = doc.data();
        const date = d.timestamp?.toDate?.()?.toISOString?.()?.split('T')[0] || new Date().toISOString().split('T')[0];
        
        if (!dailyData[date]) {
          dailyData[date] = { cost: 0, energy: 0, carbon: 0, count: 0 };
        }
        dailyData[date].cost += d.cost || 0;
        dailyData[date].energy += d.energyKwh || 0;
        dailyData[date].carbon += d.carbonKg || 0;
        dailyData[date].count += 1;
      });

      const processedData: DataPoint[] = Object.entries(dailyData)
        .map(([date, values]) => ({
          date,
          cost: Math.round(values.cost * 100) / 100,
          energy: Math.round(values.energy * 100) / 100,
          carbon: Math.round(values.carbon * 100) / 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setChartData(processedData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [timeRange, data, currentTeamId]);

  const metrics: { key: MetricType; label: string; unit: string; color: string }[] = [
    { key: 'cost', label: 'Cost', unit: '$', color: 'amber' },
    { key: 'energy', label: 'Energy', unit: 'kWh', color: 'blue' },
    { key: 'carbon', label: 'Carbon', unit: 'kg CO₂', color: 'emerald' },
  ];

  // Calculate stats
  const currentTotal = chartData.reduce((sum, d) => sum + d[activeMetric], 0);
  const avgDaily = currentTotal / chartData.length || 0;
  const maxValue = Math.max(...chartData.map(d => d[activeMetric]));
  const minValue = Math.min(...chartData.map(d => d[activeMetric]));
  
  // Calculate trend (compare last 7 days to previous 7 days)
  const recentDays = chartData.slice(-7);
  const previousDays = chartData.slice(-14, -7);
  const recentAvg = recentDays.reduce((sum, d) => sum + d[activeMetric], 0) / recentDays.length || 0;
  const previousAvg = previousDays.reduce((sum, d) => sum + d[activeMetric], 0) / previousDays.length || 1;
  const trendPercent = ((recentAvg - previousAvg) / previousAvg) * 100;

  const formatValue = (value: number) => {
    const metric = metrics.find(m => m.key === activeMetric);
    if (metric?.key === 'cost') return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${metric?.unit || ''}`;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-mono text-neutral-100 uppercase tracking-wider">Historical Trends</h3>
          <p className="text-xs text-neutral-500 mt-1">Track your metrics over time</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center gap-px bg-neutral-800">
            {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                  timeRange === range
                    ? 'bg-amber-600 text-neutral-950'
                    : 'bg-neutral-900 text-neutral-500 hover:text-neutral-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="p-2 text-neutral-500 hover:text-neutral-200 transition-colors">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metric tabs */}
      <div className="flex items-center gap-px mb-6 bg-neutral-800">
        {metrics.map((metric) => (
          <button
            key={metric.key}
            onClick={() => setActiveMetric(metric.key)}
            className={`flex-1 px-4 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
              activeMetric === metric.key
                ? `bg-${metric.color}-600 text-neutral-950`
                : 'bg-neutral-900 text-neutral-500 hover:text-neutral-200'
            }`}
            style={activeMetric === metric.key ? {
              backgroundColor: metric.color === 'amber' ? '#d97706' : 
                             metric.color === 'blue' ? '#2563eb' : '#059669'
            } : {}}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-px bg-neutral-800 mb-6">
        <div className="bg-neutral-900 p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Total</p>
          <p className="text-lg font-mono text-neutral-100">{formatValue(currentTotal)}</p>
        </div>
        <div className="bg-neutral-900 p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Daily Avg</p>
          <p className="text-lg font-mono text-neutral-100">{formatValue(avgDaily)}</p>
        </div>
        <div className="bg-neutral-900 p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Peak</p>
          <p className="text-lg font-mono text-neutral-100">{formatValue(maxValue)}</p>
        </div>
        <div className="bg-neutral-900 p-4">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Trend</p>
          <div className="flex items-center gap-1">
            {trendPercent < 0 ? (
              <TrendingDown className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingUp className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-lg font-mono ${trendPercent < 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {Math.abs(trendPercent).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="relative h-64 bg-neutral-900 border border-neutral-800 p-4">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-neutral-600 animate-spin" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Database className="w-10 h-10 text-neutral-700 mb-3" />
            <p className="text-neutral-400 mb-1">No historical data yet</p>
            <p className="text-xs text-neutral-600">Data will appear as metrics are collected</p>
          </div>
        ) : (
          <>
            {/* Y-axis labels */}
            <div className="absolute left-2 top-4 bottom-4 flex flex-col justify-between text-[10px] font-mono text-neutral-600">
              <span>{formatValue(maxValue)}</span>
              <span>{formatValue((maxValue + minValue) / 2)}</span>
              <span>{formatValue(minValue)}</span>
            </div>

            {/* Chart bars */}
            <div className="ml-16 h-full flex items-end gap-px">
              {chartData.map((point, index) => {
                const value = point[activeMetric];
                const height = maxValue > 0 ? ((value - minValue) / (maxValue - minValue)) * 100 : 0;
                const barColor = activeMetric === 'cost' ? 'bg-amber-500' : 
                               activeMetric === 'energy' ? 'bg-blue-500' : 'bg-emerald-500';
                
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col justify-end group relative"
                  >
                    <div
                      className={`${barColor} opacity-80 hover:opacity-100 transition-opacity min-h-[2px]`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-800 border border-neutral-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <p className="font-mono text-neutral-400">{point.date}</p>
                      <p className="font-mono text-neutral-100">{formatValue(value)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="ml-16 mt-2 flex justify-between text-[10px] font-mono text-neutral-600">
              <span>{chartData[0]?.date}</span>
              <span>{chartData[Math.floor(chartData.length / 2)]?.date}</span>
              <span>{chartData[chartData.length - 1]?.date}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
