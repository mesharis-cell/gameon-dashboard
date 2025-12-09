"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import type { User } from "../types";

interface DeleteUserDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function DeleteUserDialog({
  user,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteUserDialogProps) {
  // Fetch draft count when dialog opens
  const { data: draftData } = useQuery({
    queryKey: ["user-draft-count", user?.id],
    queryFn: async () => {
      const response: any = await apiClient(
        `/api/users/${user?.id}/draft-count`
      );
      return response.data;
    },
    enabled: !!user?.id,
  });

  const draftCount = draftData?.draftCount || 0;

  return (
    <AlertDialog open={!!user} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{user?.name}</strong>?
            {draftCount > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This user has {draftCount} draft
                  proposal{draftCount > 1 ? "s" : ""}.
                  {draftCount > 1 ? " They" : " It"} will be permanently deleted
                  along with the user.
                </AlertDescription>
              </Alert>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
