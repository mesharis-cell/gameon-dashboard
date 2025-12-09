'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ProposalStatusContextType {
  isSaving: boolean;
  lastSaved: Date | null;
  proposalStatus: 'draft' | 'submitted' | 'accepted' | 'rejected' | null;
  setIsSaving: (saving: boolean) => void;
  setLastSaved: (date: Date | null) => void;
  setProposalStatus: (status: 'draft' | 'submitted' | 'accepted' | 'rejected' | null) => void;
}

const ProposalStatusContext = createContext<ProposalStatusContextType | undefined>(undefined);

export function ProposalStatusProvider({ children }: { children: ReactNode }) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [proposalStatus, setProposalStatus] = useState<'draft' | 'submitted' | 'accepted' | 'rejected' | null>(null);

  return (
    <ProposalStatusContext.Provider
      value={{
        isSaving,
        lastSaved,
        proposalStatus,
        setIsSaving,
        setLastSaved,
        setProposalStatus,
      }}
    >
      {children}
    </ProposalStatusContext.Provider>
  );
}

export function useProposalStatus() {
  const context = useContext(ProposalStatusContext);
  if (context === undefined) {
    throw new Error('useProposalStatus must be used within a ProposalStatusProvider');
  }
  return context;
}