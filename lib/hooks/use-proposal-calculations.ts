import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

interface ProposalValues {
  activationValue: number;
  tradeDealValue: number;
  focValue: number;
  creditNoteValue: number;
  boosterValue: number;
  totalValue: number;
}

interface ProposalData {
  activationValue: string;
  tradeDealValue: string;
  focValue: string;
  creditNoteValue: string;
  boosterValue: string;
  totalValue: string;
}

/**
 * Hook for real-time proposal value calculations
 * 
 * Fetches proposal values and provides them in a typed format.
 * Automatically refetches when proposal data changes via React Query invalidation.
 * 
 * @param proposalId - The ID of the proposal to fetch values for
 * @param enabled - Whether to enable the query (default: true)
 * @returns Object containing values, loading state, and error state
 */
export function useProposalCalculations(proposalId: string, enabled = true) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['proposal', proposalId],
    queryFn: () => apiClient<ProposalData>(`/api/proposals/${proposalId}`),
    enabled,
    // Refetch on window focus to ensure values are up-to-date
    refetchOnWindowFocus: true,
    // Keep previous data while refetching for smooth UX
    placeholderData: (previousData) => previousData,
  });

  // Parse string values to numbers
  const values: ProposalValues = {
    activationValue: parseFloat(data?.activationValue || '0'),
    tradeDealValue: parseFloat(data?.tradeDealValue || '0'),
    focValue: parseFloat(data?.focValue || '0'),
    creditNoteValue: parseFloat(data?.creditNoteValue || '0'),
    boosterValue: parseFloat(data?.boosterValue || '0'),
    totalValue: parseFloat(data?.totalValue || '0'),
  };

  return {
    values,
    isCalculating: isLoading,
    error,
    refresh: refetch,
  };
}