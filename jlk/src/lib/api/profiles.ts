import { api } from "./client";

export interface Profile {
  id: string;
  name: string;
  userId: string;
  sortOrder: number;
  createdAt: string;
}

export async function fetchProfiles(): Promise<Profile[]> {
  const res = await api.api.profiles.$get();
  if (!res.ok) {
    const body = (await res.json()) as { error: string };
    throw new Error(body.error || "Failed to fetch profiles");
  }
  return (await res.json()) as unknown as Profile[];
}

export async function createProfile(name: string): Promise<Profile> {
  const res = await api.api.profiles.$post({
    json: { name },
  });
  if (!res.ok) {
    const body = (await res.json()) as { error: string };
    throw new Error(body.error || "Failed to create profile");
  }
  return (await res.json()) as unknown as Profile;
}

export async function renameProfile(
  profileId: string,
  name: string,
): Promise<Profile> {
  const res = await api.api.profiles[":profileId"].$patch({
    param: { profileId },
    json: { name },
  });
  if (!res.ok) {
    const body = (await res.json()) as { error: string };
    throw new Error(body.error || "Failed to rename profile");
  }
  return (await res.json()) as unknown as Profile;
}

export async function deleteProfile(profileId: string): Promise<void> {
  const res = await api.api.profiles[":profileId"].$delete({
    param: { profileId },
  });
  if (!res.ok) {
    const body = (await res.json()) as { error: string };
    throw new Error(body.error || "Failed to delete profile");
  }
}

export async function reorderProfiles(profileIds: string[]): Promise<void> {
  const res = await api.api.profiles.reorder.$put({
    json: { profileIds },
  });
  if (!res.ok) {
    const body = (await res.json()) as { error: string };
    throw new Error(body.error || "Failed to reorder profiles");
  }
}
