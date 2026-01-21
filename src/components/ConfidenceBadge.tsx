'use client';

import { Info } from 'lucide-react';

interface ConfidenceBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function ConfidenceBadge({ score, size = 'md', showTooltip = true }: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(score);
  const colorClasses = getColorClasses(level);
  
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <div className="relative group">
      <span className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider border ${colorClasses} ${sizeClasses[size]}`}>
        {score.toFixed(0)}%
        {showTooltip && <Info className="w-3 h-3 opacity-50" />}
      </span>
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-800 text-neutral-100 text-xs border border-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          <div className="font-mono text-[10px] uppercase tracking-wider mb-0.5 text-neutral-400">Confidence: {getLevelLabel(level)}</div>
          <div className="text-neutral-300 text-[11px]">{getConfidenceDescription(level)}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800" />
        </div>
      )}
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
