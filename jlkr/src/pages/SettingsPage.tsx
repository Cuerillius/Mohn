import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  X,
  Loader2,
  Settings as SettingsIcon,
  ExternalLink,
  Search,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useProfile, type Profile } from "../context/ProfileContext";
import { useSettings } from "../context/SettingsContext";
import { signOut } from "../lib/authClient";
import { apiGet, apiPost, apiDelete, apiPatch } from "../services/api";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

// ── Addon manifest types ────────────────────────────────────────────────────

interface AddonManifest {
  name: string;
  description?: string;
  logo?: string;
  background?: string;
  id?: string;
}

// ── Addon card ──────────────────────────────────────────────────────────────

function AddonCard({
  url,
  manifest,
  enabled,
  onToggle,
  onRemove,
}: {
  url: string;
  manifest: AddonManifest | null;
  enabled: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const name = manifest?.name ?? new URL(url).hostname;
  const description = manifest?.description ?? url;

  return (
    <div
      className={
        "flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-opacity " +
        (enabled ? "opacity-100" : "opacity-50")
      }
    >
      {/* top section */}
      <div className="flex flex-col gap-4 p-5 flex-1">
        <div className="flex items-start justify-between">
          {manifest?.logo ? (
            <img
              src={manifest.logo}
              alt={name}
              className="size-14 rounded-xl object-contain"
            />
          ) : (
            <div className="size-14 rounded-xl bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {manifest ? name.charAt(0).toUpperCase() : ""}
            </div>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemove}
            aria-label="Remove addon"
          >
            <Trash2 />
          </Button>
        </div>

        <div>
          <p className="font-semibold text-sm leading-snug">{name}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <Separator />

      {/* footer */}
      <div className="flex items-center justify-between px-4 py-3">
        <Button variant="outline" size="sm" className="gap-1.5">
          <SettingsIcon className="size-3.5" />
          Settings
        </Button>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}

// ── Filter tabs ─────────────────────────────────────────────────────────────

type AddonFilter = "all" | "active" | "inactive";

function FilterTabs({
  value,
  onChange,
}: {
  value: AddonFilter;
  onChange: (v: AddonFilter) => void;
}) {
  const tabs: { label: string; value: AddonFilter }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={
            "rounded-full px-3.5 py-1 text-sm font-medium transition-colors " +
            (value === t.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Add addon row ───────────────────────────────────────────────────────────

function AddAddonRow({ onAdd }: { onAdd: (url: string) => Promise<void> }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!url.trim()) return;
    setError("");
    setLoading(true);
    try {
      await onAdd(url.trim());
      setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add addon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          placeholder="https://addon.example.com/manifest.json"
          value={url}
          disabled={loading}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <Button
          variant="outline"
          onClick={submit}
          disabled={loading || !url.trim()}
          className="shrink-0"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Plus />}
          Add
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { setProfile } = useProfile();
  const {
    torboxKey, setTorboxKey,
    addonUrls, addAddonUrl, removeAddonUrl,
    inactiveAddonUrls, toggleAddonUrl,
  } = useSettings();

  // profiles
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);

  // addon filter / search
  const [addonFilter, setAddonFilter] = useState<AddonFilter>("all");
  const [addonSearch, setAddonSearch] = useState("");

  // manifest cache: url → manifest (fetched once per url)
  const [manifests, setManifests] = useState<Record<string, AddonManifest>>({});

  useEffect(() => {
    for (const url of addonUrls) {
      if (manifests[url]) continue;
      fetch(`${url}/manifest.json`)
        .then((r) => r.json())
        .then((m: AddonManifest) =>
          setManifests((prev) => ({ ...prev, [url]: m }))
        )
        .catch(() =>
          setManifests((prev) => ({
            ...prev,
            [url]: { name: new URL(url).hostname, description: url },
          }))
        );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addonUrls]);

  useEffect(() => {
    apiGet<Profile[]>("/api/profiles")
      .then(setProfiles)
      .catch(() => setError("Could not load profiles"))
      .finally(() => setLoadingFetch(false));
  }, []);

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


  const handleAddAddon = async (raw: string) => {
    const url = raw.replace(/\/manifest\.json$/i, "");
    if (!url.startsWith("https://"))
      throw new Error("URL must start with https://");
    const res = await fetch(`${url}/manifest.json`);
    if (!res.ok) throw new Error(`Could not reach addon (${res.status})`);
    const manifest = (await res.json()) as {
      resources?: (string | { name: string })[];
    };
    const hasStream = manifest.resources?.some(
      (r) => (typeof r === "string" ? r : r.name) === "stream",
    );
    if (!hasStream) throw new Error("Addon does not provide stream resources");
    addAddonUrl(url);
  };

  const filteredAddons = addonUrls.filter((url) => {
    const enabled = !inactiveAddonUrls.includes(url);
    if (addonFilter === "active" && !enabled) return false;
    if (addonFilter === "inactive" && enabled) return false;
    if (addonSearch) {
      const q = addonSearch.toLowerCase();
      const m = manifests[url];
      const matchesUrl = url.toLowerCase().includes(q);
      const matchesName = m?.name?.toLowerCase().includes(q) ?? false;
      const matchesDesc = m?.description?.toLowerCase().includes(q) ?? false;
      if (!matchesUrl && !matchesName && !matchesDesc) return false;
    }
    return true;
  });

  const handleSignOut = async () => {
    await signOut();
    logout();
    setProfile(null);
    navigate("/login");
  };

  return (
    <div className="min-h-dvh px-6 py-8">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header */}
        <div className="mb-10 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr]">
          {/* ── Left column: Profiles / TorBox / Account ── */}
          <div className="space-y-8">
            {/* Profiles */}
            <section className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Profiles
              </Label>

              {loadingFetch ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex h-12 animate-pulse items-center gap-3 rounded-xl border border-border bg-muted/30 px-3"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {profiles.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2"
                    >
                      <Avatar
                        name={p.name}
                        className="size-8 shrink-0 rounded-lg text-xs font-semibold text-white"
                      />
                      {editingId === p.id ? (
                        <Input
                          autoFocus
                          className="h-7 flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
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
                        <span className="flex-1 text-sm">{p.name}</span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() =>
                          editingId === p.id
                            ? setEditingId(null)
                            : startRename(p)
                        }
                        aria-label="Rename"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => deleteProfile(p.id)}
                        aria-label="Delete"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}

                  {profiles.length < 10 && (
                    <>
                      {adding ? (
                        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2">
                          <Input
                            autoFocus
                            className="h-7 flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
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
                          <Button
                            size="sm"
                            onClick={addProfile}
                            disabled={loadingAdd || !newName.trim()}
                          >
                            {loadingAdd ? (
                              <Loader2 className="animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAdding(false);
                              setNewName("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 rounded-xl"
                          onClick={() => setAdding(true)}
                        >
                          <Plus />
                          Add profile
                        </Button>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>

            <Separator />

            {/* TorBox */}
            <section className="space-y-3">
              <Label
                htmlFor="torbox-key"
                className="text-xs font-medium uppercase tracking-widest text-muted-foreground"
              >
                TorBox
              </Label>
              <Input
                id="torbox-key"
                type="password"
                placeholder="API key"
                value={torboxKey}
                onChange={(e) => setTorboxKey(e.target.value)}
              />
            </section>

            <Separator />

            {/* Account */}
            <section className="space-y-3">
              <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Account
              </Label>
              {user && (
                <div className="rounded-xl border border-border bg-muted/20 px-3 py-3 space-y-0.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              )}
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </section>
          </div>

          {/* ── Right column: Addons ── */}
          <section className="space-y-4">
            <Label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Addons
            </Label>

            {/* toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <FilterTabs value={addonFilter} onChange={setAddonFilter} />
              <div className="relative min-w-45 flex-1 max-w-xs">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  className="pl-8"
                  value={addonSearch}
                  onChange={(e) => setAddonSearch(e.target.value)}
                />
              </div>
            </div>

            {/* grid */}
            {filteredAddons.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredAddons.map((url) => (
                  <AddonCard
                    key={url}
                    url={url}
                    manifest={manifests[url] ?? null}
                    enabled={!inactiveAddonUrls.includes(url)}
                    onToggle={() => toggleAddonUrl(url)}
                    onRemove={() => removeAddonUrl(url)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                {addonUrls.length === 0
                  ? "No addons added yet"
                  : "No addons match the current filter"}
              </div>
            )}

            {/* add row */}
            <AddAddonRow onAdd={handleAddAddon} />
          </section>
        </div>
      </div>
    </div>
  );
}
