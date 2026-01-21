'use client';

import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function Loader({ size = 'md', className, label }: LoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative">
        <div
          className={cn(
            'border-2 border-neutral-700 border-t-amber-500 rounded-full animate-spin',
            sizeClasses[size]
          )}
        />
        <div
          className={cn(
            'absolute inset-0 border-2 border-transparent border-t-amber-500/30 rounded-full animate-spin',
            sizeClasses[size]
          )}
          style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
        />
      </div>
      {label && (
        <span className="text-xs font-mono text-neutral-500 uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
}

export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <Loader size="lg" />
        <p className="text-sm text-neutral-500 font-mono mt-4">{label}</p>
      </div>
    </div>
  );
}

export function CardLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <Loader size="md" label="Loading" />
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-4 bg-neutral-800 rounded animate-pulse',
        className
      )}
    />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-neutral-900 border border-neutral-800 p-6 space-y-4', className)}>
      <SkeletonLine className="w-1/3 h-5" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-2/3" />
      <div className="flex gap-2 pt-2">
        <SkeletonLine className="w-20 h-8" />
        <SkeletonLine className="w-20 h-8" />
      </div>
    </div>
  );
}
