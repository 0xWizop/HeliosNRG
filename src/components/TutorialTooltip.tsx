'use client';

import { useState, useEffect, useRef } from 'react';
import { X, HelpCircle, Lightbulb } from 'lucide-react';
import { useTutorial } from '@/contexts/TutorialContext';

interface TutorialTooltipProps {
  id: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  showIcon?: boolean;
  delay?: number;
}

export function TutorialTooltip({
  id,
  title,
  content,
  position = 'top',
  children,
  showIcon = true,
  delay = 500,
}: TutorialTooltipProps) {
  const { tutorialsEnabled, dismissedTooltips, dismissTooltip } = useTutorial();
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isDismissed = dismissedTooltips.has(id);
  const shouldShow = tutorialsEnabled && !isDismissed && isVisible;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (!tutorialsEnabled || isDismissed) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      setHasBeenShown(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (hasBeenShown) {
      setIsVisible(false);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissTooltip(id);
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-amber-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-amber-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-amber-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-amber-800',
  };

  return (
    <div
      className="relative inline-flex items-center gap-1"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {showIcon && tutorialsEnabled && !isDismissed && (
        <HelpCircle className="w-3.5 h-3.5 text-amber-500/60 hover:text-amber-500 cursor-help transition-colors" />
      )}

      {shouldShow && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionClasses[position]} w-64 animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="bg-neutral-900 border border-amber-800/50 shadow-xl shadow-amber-500/10">
            <div className="flex items-start justify-between gap-2 p-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-sm font-medium text-neutral-100">{title}</span>
              </div>
              <button
                onClick={handleDismiss}
                className="p-0.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                aria-label="Dismiss tooltip"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3">
              <p className="text-xs text-neutral-400 leading-relaxed">{content}</p>
            </div>
            <div className="px-3 pb-2">
              <button
                onClick={handleDismiss}
                className="text-xs text-amber-500/70 hover:text-amber-500 transition-colors"
              >
                Got it, don't show again
              </button>
            </div>
          </div>
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}

export function TutorialSpotlight({
  id,
  title,
  content,
  step,
  totalSteps,
  onNext,
  onSkip,
  children,
}: {
  id: string;
  title: string;
  content: string;
  step: number;
  totalSteps: number;
  onNext?: () => void;
  onSkip?: () => void;
  children: React.ReactNode;
}) {
  const { tutorialsEnabled, dismissedTooltips, dismissTooltip } = useTutorial();
  const isDismissed = dismissedTooltips.has(id);

  if (!tutorialsEnabled || isDismissed) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="ring-2 ring-amber-500/50 ring-offset-2 ring-offset-neutral-950 rounded">
        {children}
      </div>
      
      <div className="absolute top-full left-0 mt-3 w-72 z-50">
        <div className="bg-neutral-900 border border-amber-800/50 shadow-xl">
          <div className="flex items-center justify-between p-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-neutral-100">{title}</span>
            </div>
            <span className="text-xs text-neutral-500 font-mono">
              {step}/{totalSteps}
            </span>
          </div>
          <div className="p-3">
            <p className="text-xs text-neutral-400 leading-relaxed">{content}</p>
          </div>
          <div className="flex items-center justify-between p-3 border-t border-neutral-800">
            <button
              onClick={() => {
                dismissTooltip(id);
                onSkip?.();
              }}
              className="text-xs text-neutral-500 hover:text-neutral-300"
            >
              Skip tutorial
            </button>
            <button
              onClick={() => {
                dismissTooltip(id);
                onNext?.();
              }}
              className="px-3 py-1.5 bg-amber-600 text-neutral-950 text-xs font-medium hover:bg-amber-500 transition-colors"
            >
              {step === totalSteps ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
