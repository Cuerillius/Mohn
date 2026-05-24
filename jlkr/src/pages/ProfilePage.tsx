import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProfile, type Profile } from "../context/ProfileContext";
import { useSettings } from "../context/SettingsContext";
import { signOut } from "../lib/authClient";
import { apiGet, apiPost, apiDelete, apiPatch } from "../services/api";

function ProfileAvatar({ name, size = 80 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="rounded-2xl bg-[#333] border-[0.5px] border-[#444] flex items-center justify-center text-[22px] font-medium text-[#aaa]"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { setProfile } = useProfile();
  const { torboxKey, setTorboxKey, addonUrls, addAddonUrl, removeAddonUrl } =
    useSettings();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"picker" | "settings">("picker");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newAddonUrl, setNewAddonUrl] = useState("");
  const [addonUrlError, setAddonUrlError] = useState("");
  const [addonAdding, setAddonAdding] = useState(false);

  useEffect(() => {
    apiGet<Profile[]>("/api/profiles")
      .then(setProfiles)
      .catch(() => setError("Could not load profiles"))
      .finally(() => setLoadingFetch(false));
  }, []);

  const selectProfile = (p: Profile) => {
    setProfile(p);
    navigate("/");
  };

  const addProfile = async () => {
    if (!newName.trim() || loadingAdd) return;
    setLoadingAdd(true);
    try {
      const created = await apiPost<Profile>("/api/profiles", {
        name: newName.trim(),
      });
      setProfiles((prev) => [...prev, created]);
      setAdding(false);
      setNewName("");
    } catch {
      setError("Could not create profile");
    } finally {
      setLoadingAdd(false);
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      await apiDelete(`/api/profiles/${id}`);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Could not delete profile");
    }
  };

  const startRename = (p: Profile) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const saveRename = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    try {
      const updated = await apiPatch<Profile>(`/api/profiles/${id}`, {
        name: trimmed,
      });
      setProfiles((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch {
      setError("Could not rename profile");
    } finally {
      setEditingId(null);
    }
  };

  const handleAddAddonUrl = async () => {
    const raw = newAddonUrl.trim().replace(/\/manifest\.json$/i, "");
    if (!raw.startsWith("https://")) {
      setAddonUrlError("URL must start with https://");
      return;
    }
    setAddonUrlError("");
    setAddonAdding(true);
    try {
      const res = await fetch(`${raw}/manifest.json`);
      if (!res.ok) throw new Error(`Could not reach addon (${res.status})`);
      const manifest = (await res.json()) as {
        resources?: (string | { name: string })[];
      };
      const hasStream = manifest.resources?.some(
        (r) => (typeof r === "string" ? r : r.name) === "stream",
      );
      if (!hasStream) {
        setAddonUrlError("This addon does not provide stream resources");
        return;
      }
      addAddonUrl(raw);
      setNewAddonUrl("");
    } catch (e) {
      setAddonUrlError(
        e instanceof Error ? e.message : "Failed to verify addon",
      );
    } finally {
      setAddonAdding(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    logout();
    navigate("/login");
  };

  if (loadingFetch) {
    return <div className="min-h-screen bg-[#0f0f0f]" />;
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen py-20 px-8 ">
      {/* Settings / Back button — top right */}
      <button
        className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center text-[#555] hover:text-white hover:bg-white/[0.08] transition-colors"
        onClick={() => {
          setView(view === "settings" ? "picker" : "settings");
          setError("");
          setEditingId(null);
        }}
        aria-label={view === "settings" ? "Back" : "Settings"}
      >
        {view === "settings" ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        )}
      </button>

      {error && (
        <p className="absolute top-6 left-1/2 -translate-x-1/2 text-[12px] text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {view === "picker" ? (
        <>
          <h1 className="text-[22px] font-normal text-white tracking-[0.01em] mb-10">
            Who's watching?
          </h1>

          <div className="flex gap-5 flex-wrap justify-center mb-12">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="group flex flex-col items-center gap-3 cursor-pointer transition-opacity duration-150 hover:opacity-75"
                onClick={() => selectProfile(p)}
              >
                <ProfileAvatar name={p.name} />
                <div className="text-xs text-[#aaa] font-normal">{p.name}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="w-full max-w-xs">
          <h1 className="text-[22px] font-normal text-white tracking-[0.01em] mb-8 text-center">
            Settings
          </h1>

          <p className="text-[11px] text-[#555] uppercase tracking-[0.1em] mb-3">
            Profiles
          </p>
          <div className="flex flex-col gap-2 mb-8">
            {profiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 bg-[#252525] rounded-xl px-3 py-2 border-[0.5px] border-[#333]"
              >
                <ProfileAvatar name={p.name} size={36} />
                {editingId === p.id ? (
                  <input
                    autoFocus
                    className="flex-1 bg-transparent border-none text-sm text-white outline-none"
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
                  <span className="flex-1 text-sm text-[#ccc]">{p.name}</span>
                )}
                <button
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#555] hover:text-white hover:bg-white/[0.08] transition-colors"
                  onClick={() =>
                    editingId === p.id ? setEditingId(null) : startRename(p)
                  }
                  aria-label="Rename"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#555] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  onClick={() => deleteProfile(p.id)}
                  aria-label="Delete"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {profiles.length < 10 && (
            <div className="mb-6">
              {adding ? (
                <div className="flex items-center gap-2 bg-[#252525] rounded-xl px-3 py-2 border-[0.5px] border-[#3a3a3a]">
                  <input
                    autoFocus
                    className="flex-1 bg-transparent border-none text-sm text-white outline-none placeholder:text-[#555]"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addProfile();
                      if (e.key === "Escape") {
                        setAdding(false);
                        setNewName("");
                      }
                    }}
                    placeholder="Profile name"
                    maxLength={20}
                  />
                  <button
                    className="text-xs text-white bg-transparent border-none cursor-pointer px-1"
                    onClick={addProfile}
                    disabled={loadingAdd}
                  >
                    {loadingAdd ? "…" : "Add"}
                  </button>
                  <button
                    className="text-xs text-[#555] bg-transparent border-none cursor-pointer px-1"
                    onClick={() => {
                      setAdding(false);
                      setNewName("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="w-full flex items-center gap-3 bg-[#252525] hover:bg-[#2e2e2e] rounded-xl px-3 py-2.5 border-[0.5px] border-[#333] text-[#555] hover:text-[#aaa] transition-colors cursor-pointer"
                  onClick={() => setAdding(true)}
                >
                  <span className="text-lg leading-none">+</span>
                  <span className="text-sm">Add profile</span>
                </button>
              )}
            </div>
          )}

          <div className="border-t border-[#2a2a2a] pt-6 mb-6">
            <p className="text-[11px] text-[#555] uppercase tracking-[0.1em] mb-3">
              TorBox
            </p>
            <div className="bg-[#252525] rounded-xl px-3 py-2 border-[0.5px] border-[#333]">
              <input
                type="password"
                placeholder="API key"
                value={torboxKey}
                onChange={(e) => setTorboxKey(e.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#555]"
              />
            </div>
          </div>

          <div className="mb-6">
            <p className="text-[11px] text-[#555] uppercase tracking-[0.1em] mb-3">
              Addons
            </p>
            {addonUrls.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {addonUrls.map((url) => (
                  <div
                    key={url}
                    className="flex items-center gap-2 bg-[#252525] rounded-xl px-3 py-2 border-[0.5px] border-[#333]"
                  >
                    <span className="flex-1 text-[12px] text-[#aaa] truncate">
                      {url}
                    </span>
                    <button
                      onClick={() => removeAddonUrl(url)}
                      className="w-6 h-6 rounded flex items-center justify-center text-[#555] hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                      aria-label="Remove addon"
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://addon.example.com"
                value={newAddonUrl}
                disabled={addonAdding}
                onChange={(e) => {
                  setNewAddonUrl(e.target.value);
                  setAddonUrlError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddAddonUrl();
                }}
                className="flex-1 bg-[#252525] border-[0.5px] border-[#333] rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-[#555] min-w-0 disabled:opacity-50"
              />
              <button
                onClick={handleAddAddonUrl}
                disabled={addonAdding || !newAddonUrl.trim()}
                className="text-[12px] text-[#aaa] bg-[#252525] border-[0.5px] border-[#333] rounded-xl px-3 py-2 hover:bg-[#2e2e2e] cursor-pointer transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {addonAdding ? (
                  <svg
                    className="animate-spin"
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                ) : (
                  "Add"
                )}
              </button>
            </div>
            {addonUrlError && (
              <p className="text-[11px] text-red-400 mt-2">{addonUrlError}</p>
            )}
          </div>

          <div className="border-t border-[#2a2a2a] pt-6">
            <button
              onClick={handleSignOut}
              className="w-full text-[13px] text-red-400 bg-red-400/[0.07] hover:bg-red-400/[0.13] border border-red-400/20 rounded-xl py-2.5 cursor-pointer transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
