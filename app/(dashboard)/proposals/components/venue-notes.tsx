"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import type { VenueNote } from "@/lib/types/proposals";

interface VenueNotesProps {
  proposalId: string;
  notes: VenueNote[];
  disabled?: boolean;
}

export function VenueNotes({ proposalId, notes, disabled }: VenueNotesProps) {
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");

  const addNoteMutation = useMutation({
    mutationFn: (text: string) =>
      api.post(`/api/proposals/${proposalId}/notes`, { noteText: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId] });
      setNoteText("");
      toast.success("Note added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add note");
    },
  });

  const handleAddNote = () => {
    if (!noteText.trim()) {
      toast.error("Please enter a note");
      return;
    }
    addNoteMutation.mutate(noteText);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Venue Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {!disabled && (
          <div className="space-y-2">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note about this venue..."
              className="min-h-[80px] resize-none"
              disabled={addNoteMutation.isPending}
            />
            <Button
              onClick={handleAddNote}
              disabled={addNoteMutation.isPending || !noteText.trim()}
              size="sm"
            >
              {addNoteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Note
                </>
              )}
            </Button>
          </div>
        )}

        {/* Notes List */}
        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notes yet
            </p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="flex gap-3 p-3 rounded-lg bg-muted/50 border"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {note.creator.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {note.creator.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {note.noteText}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}