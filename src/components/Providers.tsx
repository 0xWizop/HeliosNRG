'use client';

import { TutorialProvider } from '@/contexts/TutorialContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TutorialProvider>
      {children}
    </TutorialProvider>
  );
}
