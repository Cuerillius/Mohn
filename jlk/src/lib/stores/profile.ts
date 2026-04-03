import { writable } from "svelte/store";

function createActiveProfileStore() {
  const stored =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("activeProfileId")
      : null;

  const { subscribe, set: _set } = writable<string | null>(stored);

  return {
    subscribe,
    select(id: string) {
      _set(id);
      localStorage.setItem("activeProfileId", id);
    },
    clear() {
      _set(null);
      localStorage.removeItem("activeProfileId");
    },
  };
}

export const activeProfileId = createActiveProfileStore();
