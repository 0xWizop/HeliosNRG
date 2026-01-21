'use client';

import { useState } from 'react';
import { Info, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface ConfidenceFactor {
  factor: string;
  impact: number;
  reason: string;
}

interface ConfidenceBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  factors?: ConfidenceFactor[];
}

export function ConfidenceBadge({ score, size = 'md', showTooltip = true, factors }: ConfidenceBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);
  const level = getConfidenceLevel(score);
  const colorClasses = getColorClasses(level);
  
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <div className="relative group">
      <button 
        onClick={() => factors && setShowDetails(!showDetails)}
        className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider border ${colorClasses} ${sizeClasses[size]} ${factors ? 'cursor-pointer hover:opacity-80' : ''}`}
      >
        {score.toFixed(0)}%
        {showTooltip && <Info className="w-3 h-3 opacity-50" />}
        {factors && (showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>
      
      {showTooltip && !showDetails && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-800 text-neutral-100 text-xs border border-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          <div className="font-mono text-[10px] uppercase tracking-wider mb-0.5 text-neutral-400">Confidence: {getLevelLabel(level)}</div>
          <div className="text-neutral-300 text-[11px]">{getConfidenceDescription(level)}</div>
          {factors && <div className="text-neutral-500 text-[10px] mt-1">Click to see breakdown</div>}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800" />
        </div>
      )}

      {showDetails && factors && (
        <ConfidenceBreakdown factors={factors} score={score} level={level} onClose={() => setShowDetails(false)} />
      )}
    </div>
  );
}

function ConfidenceBreakdown({ 
  factors, 
  score, 
  level,
  onClose 
}: { 
  factors: ConfidenceFactor[]; 
  score: number; 
  level: string;
  onClose: () => void;
}) {
  const positiveFactors = factors.filter(f => f.impact > 0).sort((a, b) => b.impact - a.impact);
  const negativeFactors = factors.filter(f => f.impact < 0).sort((a, b) => a.impact - b.impact);
  const neutralFactors = factors.filter(f => f.impact === 0);

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-neutral-900 border border-neutral-700 shadow-xl z-50">
      <div className="p-3 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-neutral-400">Confidence Breakdown</div>
            <div className="text-lg font-mono font-bold text-neutral-100">{score.toFixed(0)}% <span className="text-sm font-normal text-neutral-500">({getLevelLabel(level)})</span></div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 max-h-64 overflow-y-auto space-y-3">
        {positiveFactors.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-500 mb-1.5">Strengths</div>
            {positiveFactors.map((f, i) => (
              <FactorItem key={i} factor={f} type="positive" />
            ))}
          </div>
        )}

        {negativeFactors.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-orange-500 mb-1.5">Limitations</div>
            {negativeFactors.map((f, i) => (
              <FactorItem key={i} factor={f} type="negative" />
            ))}
          </div>
        )}

        {neutralFactors.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1.5">Neutral</div>
            {neutralFactors.map((f, i) => (
              <FactorItem key={i} factor={f} type="neutral" />
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-neutral-800 bg-neutral-800/50">
        <p className="text-[10px] text-neutral-500">
          {getConfidenceDescription(level)}. Improve by adding verified data sources.
        </p>
      </div>
    </div>
  );
}

function FactorItem({ factor, type }: { factor: ConfidenceFactor; type: 'positive' | 'negative' | 'neutral' }) {
  const Icon = type === 'positive' ? CheckCircle2 : type === 'negative' ? AlertCircle : Info;
  const iconColor = type === 'positive' ? 'text-emerald-500' : type === 'negative' ? 'text-orange-500' : 'text-neutral-500';
  const impactColor = type === 'positive' ? 'text-emerald-400' : type === 'negative' ? 'text-orange-400' : 'text-neutral-400';

  return (
    <div className="flex items-start gap-2 py-1">
      <Icon className={`w-3.5 h-3.5 ${iconColor} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-300 leading-tight">{factor.reason}</p>
      </div>
      <span className={`text-xs font-mono ${impactColor} shrink-0`}>
        {factor.impact > 0 ? '+' : ''}{factor.impact}
      </span>
    </div>
  );
}

function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' | 'unverified' {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'low';
  return 'unverified';
}

function getLevelLabel(level: string): string {
  switch (level) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    case 'unverified': return 'Unverified';
    default: return '';
  }
}

function getColorClasses(level: string): string {
  switch (level) {
    case 'high':
      return 'bg-emerald-950 text-emerald-400 border-emerald-800';
    case 'medium':
      return 'bg-amber-950 text-amber-400 border-amber-800';
    case 'low':
      return 'bg-orange-950 text-orange-400 border-orange-800';
    case 'unverified':
      return 'bg-red-950 text-red-400 border-red-800';
    default:
      return 'bg-neutral-800 text-neutral-400 border-neutral-700';
  }
}

function getConfidenceDescription(level: string): string {
  switch (level) {
    case 'high':
      return 'Based on verified first-party data';
    case 'medium':
      return 'Some values use reference data';
    case 'low':
      return 'Several inputs are estimated';
    case 'unverified':
      return 'Significant data gaps exist';
    default:
      return '';
  }
}

export function ConfidenceIndicator({ score }: { score: number }) {
  const level = getConfidenceLevel(score);
  const width = `${score}%`;
  
  const barColor = {
    high: 'bg-emerald-500',
    medium: 'bg-amber-500',
    low: 'bg-orange-500',
    unverified: 'bg-red-500',
  }[level];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-neutral-500 font-mono uppercase tracking-wider text-[10px]">Confidence</span>
        <span className="font-mono font-medium text-neutral-200">{score.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-neutral-800 overflow-hidden">
        <div 
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width }}
        />
      </div>
      <p className="text-[10px] text-neutral-600 mt-1">
        {getConfidenceDescription(level)}
      </p>
    </div>
  );
}
