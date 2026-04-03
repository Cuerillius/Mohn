import {
  createQuery,
  createMutation,
  useQueryClient,
} from "@tanstack/svelte-query";
import * as profilesApi from "$lib/api/profiles";

export const profileKeys = {
  all: ["profiles"] as const,
};

export function useProfiles() {
  return createQuery(() => ({
    queryKey: profileKeys.all,
    queryFn: profilesApi.fetchProfiles,
  }));
}

export function useCreateProfile() {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: (name: string) => profilesApi.createProfile(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  }));
}

export function useRenameProfile() {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: ({ profileId, name }: { profileId: string; name: string }) =>
      profilesApi.renameProfile(profileId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  }));
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: (profileId: string) => profilesApi.deleteProfile(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  }));
}

export function useReorderProfiles() {
  const queryClient = useQueryClient();
  return createMutation(() => ({
    mutationFn: (profileIds: string[]) =>
      profilesApi.reorderProfiles(profileIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  }));
}
