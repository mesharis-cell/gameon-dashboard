import { useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<any>;
  interval?: number; // milliseconds
  enabled?: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  interval = 30000, // 30 seconds default
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const lastSavedData = useRef<string>(JSON.stringify(data));
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isSavingRef = useRef(false);

  const saveMutation = useMutation({
    mutationFn: onSave,
    onSuccess: () => {
      lastSavedData.current = JSON.stringify(data);
      toast.success('Auto-saved', {
        duration: 2000,
      });
    },
    onError: (error: Error) => {
      console.error('Auto-save failed:', error);
      toast.error('Auto-save failed', {
        description: error.message,
        duration: 3000,
      });
    },
  });

  const hasChanges = useCallback(() => {
    const currentData = JSON.stringify(data);
    return currentData !== lastSavedData.current;
  }, [data]);

  const save = useCallback(async () => {
    if (!enabled || isSavingRef.current || !hasChanges()) {
      return;
    }

    isSavingRef.current = true;
    try {
      await saveMutation.mutateAsync(data);
    } finally {
      isSavingRef.current = false;
    }
  }, [data, enabled, hasChanges, saveMutation]);

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save();
    }, interval);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, interval, enabled, save]);

  // Save on unmount if there are changes
  useEffect(() => {
    return () => {
      if (hasChanges() && enabled) {
        // Use synchronous save on unmount
        onSave(data).catch(console.error);
      }
    };
  }, []); // Empty deps - only run on unmount

  return {
    save,
    isSaving: saveMutation.isPending,
    hasUnsavedChanges: hasChanges(),
  };
}