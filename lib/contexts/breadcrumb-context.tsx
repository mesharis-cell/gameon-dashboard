'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface BreadcrumbContextType {
  customBreadcrumbs: Record<string, string>;
  setCustomBreadcrumb: (path: string, label: string) => void;
  clearCustomBreadcrumb: (path: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<Record<string, string>>({});

  const setCustomBreadcrumb = useCallback((path: string, label: string) => {
    setCustomBreadcrumbs(prev => ({ ...prev, [path]: label }));
  }, []);

  const clearCustomBreadcrumb = useCallback((path: string) => {
    setCustomBreadcrumbs(prev => {
      const newBreadcrumbs = { ...prev };
      delete newBreadcrumbs[path];
      return newBreadcrumbs;
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ customBreadcrumbs, setCustomBreadcrumb, clearCustomBreadcrumb }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
}