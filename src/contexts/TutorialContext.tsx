'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TutorialContextType {
  tutorialsEnabled: boolean;
  setTutorialsEnabled: (enabled: boolean) => void;
  dismissedTooltips: Set<string>;
  dismissTooltip: (id: string) => void;
  resetTooltips: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const STORAGE_KEY = 'helios_tutorials_enabled';
const DISMISSED_KEY = 'helios_dismissed_tooltips';

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [tutorialsEnabled, setTutorialsEnabledState] = useState(true);
  const [dismissedTooltips, setDismissedTooltips] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setTutorialsEnabledState(stored === 'true');
    }
    
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      try {
        setDismissedTooltips(new Set(JSON.parse(dismissed)));
      } catch {
        setDismissedTooltips(new Set());
      }
    }
    
    setIsHydrated(true);
  }, []);

  const setTutorialsEnabled = (enabled: boolean) => {
    setTutorialsEnabledState(enabled);
    localStorage.setItem(STORAGE_KEY, String(enabled));
  };

  const dismissTooltip = (id: string) => {
    const updated = new Set(dismissedTooltips);
    updated.add(id);
    setDismissedTooltips(updated);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(updated)));
  };

  const resetTooltips = () => {
    setDismissedTooltips(new Set());
    localStorage.removeItem(DISMISSED_KEY);
  };

  if (!isHydrated) {
    return <>{children}</>;
  }

  return (
    <TutorialContext.Provider
      value={{
        tutorialsEnabled,
        setTutorialsEnabled,
        dismissedTooltips,
        dismissTooltip,
        resetTooltips,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
