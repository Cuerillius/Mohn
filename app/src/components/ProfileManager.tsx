import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, Loader2, AlertCircle } from "lucide-react";

import { type Profile } from "../context/ProfileContext";
import { apiGet, apiPost, apiDelete, apiPatch } from "../services/api";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { keys } from "@/lib/queryKeys";

interface ProfileManagerProps {
  simple?: boolean;
}

export function ProfileManager({ simple }: ProfileManagerProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [mutationError, setMutationError] = useState("");

  const {
    data: profiles = [],
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: keys.profiles(),
    queryFn: () => apiGet<Profile[]>("/api/profiles"),
  });

  const addMutation = useMutation({
    mutationFn: (name: string) => apiPost<Profile>("/api/profiles", { name }),
    onSuccess: () => {
      setNewName("");
      queryClient.invalidateQueries({ queryKey: keys.profiles() });
    },
    onError: () => setMutationError("Could not create profile"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/profiles/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: keys.profiles() }),
    onError: () => setMutationError("Could not delete profile"),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiPatch<Profile>(`/api/profiles/${id}`, { name }),
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: keys.profiles() });
    },
    onError: () => setMutationError("Could not rename profile"),
  });

  const addProfile = () => {
    const name = newName.trim();
    if (!name || addMutation.isPending) return;
    setMutationError("");
    addMutation.mutate(name);
  };

  const startRename = (p: Profile) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const saveRename = (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    setMutationError("");
    renameMutation.mutate({ id, name: trimmed });
  };

  const error = fetchError ? "Could not load profiles" : mutationError;

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}

      {(isLoading || profiles.length > 0) && (
        <div className="flex flex-wrap gap-4">
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="size-16 rounded-2xl bg-muted animate-pulse" />
                  <div className="h-2.5 w-12 rounded bg-muted animate-pulse" />
                </div>
              ))
            : profiles.map((p) => (
                <div
                  key={p.id}
                  className="group relative flex flex-col items-center gap-2"
                >
                  <Avatar
                    name={p.name}
                    className="size-16 rounded-2xl text-xl ring-2 ring-transparent group-hover:ring-border transition-all"
                  />
                  {!simple && editingId === p.id ? (
                    <input
                      autoFocus
                      className="w-16 bg-transparent text-xs text-center text-foreground outline-none border-b border-border"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(p.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={() => saveRename(p.id)}
                      maxLength={20}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground max-w-[64px] text-center truncate">
                      {p.name}
                    </span>
                  )}
                  <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!simple && (
                      <button
                        onClick={() => startRename(p)}
                        className="size-5 rounded-full bg-background border flex items-center justify-center hover:bg-accent transition-colors"
                        aria-label="Rename"
                      >
                        <Pencil className="size-2.5 text-muted-foreground" />
                      </button>
                    )}
                    {profiles.length > 1 && (
                      <button
                        onClick={() => deleteMutation.mutate(p.id)}
                        className="size-5 rounded-full bg-background border flex items-center justify-center hover:bg-destructive hover:border-destructive transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-2.5 text-muted-foreground hover:text-destructive-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder={
            isLoading || profiles.length === 0
              ? "Your name"
              : "Add another name"
          }
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addProfile()}
          className="text-sm"
        />
        <Button
          onClick={addProfile}
          disabled={
            !newName.trim() || addMutation.isPending || profiles.length >= 10
          }
          variant="secondary"
          className="shrink-0 gap-1.5"
        >
          {addMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Plus className="size-4" /> Add
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
