import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  X,
  Loader2,
  User,
  UsersRound,
  Puzzle,
  LogOut,
  ExternalLink,
  Settings2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useProfile, type Profile } from "../context/ProfileContext";
import { useSettings } from "../context/SettingsContext";
import { signOut } from "../lib/authClient";
import { fetchTorboxPlan } from "../services/torbox";
import { openUrl } from "@tauri-apps/plugin-opener";
import { apiGet, apiPost, apiDelete, apiPatch } from "../services/api";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────

type Tab = "account" | "profiles" | "addons";

interface AddonManifest {
  name: string;
  description?: string;
  logo?: string;
  version?: string;
  behaviorHints?: {
    configurable?: boolean;
    configurationRequired?: boolean;
  };
}

// ── TorBox plan helpers ─────────────────────────────────────────────────────

const PLAN_LABELS: Record<number, string> = {
  0: "Free",
  1: "Essential",
  2: "Pro",
  3: "Standard",
};

const PLAN_COLORS: Record<number, string> = {
  0: "bg-white/[0.06] text-white/50",
  1: "bg-blue-500/15 text-blue-400",
  2: "bg-amber-500/15 text-amber-400",
  3: "bg-purple-500/15 text-purple-400",
};

// ── Sidebar nav ─────────────────────────────────────────────────────────────

const NAV: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "account", label: "Account", Icon: User },
  { id: "profiles", label: "Profiles", Icon: UsersRound },
  { id: "addons", label: "Addons", Icon: Puzzle },
];

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
  const configurable = manifest?.behaviorHints?.configurable;

  return (
    <Card
      className={cn(
        "group flex flex-col overflow-hidden border-border/60 transition-all",
        !enabled && "opacity-45 grayscale-[30%]",
      )}
    >
      <CardContent className="flex flex-col gap-0 p-0 flex-1">
        {/* body */}
        <div className="flex gap-3 p-4 pb-3">
          {/* logo */}
          <div className="shrink-0 mt-0.5">
            {manifest?.logo ? (
              <img
                src={manifest.logo}
                alt={name}
                className="size-11 rounded-xl object-contain"
              />
            ) : (
              <div className="size-11 rounded-xl bg-muted flex items-center justify-center text-base font-bold text-muted-foreground">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* text */}
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-baseline gap-1.5">
              <p className="text-sm font-semibold leading-tight truncate">
                {name}
              </p>
              {manifest?.version && (
                <span className="text-[10px] text-muted-foreground shrink-0 leading-tight">
                  v{manifest.version}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mt-0.5">
              {description}
            </p>
          </div>

          {/* remove */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 -mt-1 -mr-1 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
            onClick={onRemove}
            aria-label="Remove"
          >
            <X />
          </Button>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 mt-auto">
          {configurable ? (
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => openUrl(`${url}/configure`)}
            >
              <Settings2 className="size-3.5" />
              Configure
              <ExternalLink className="size-3 opacity-50" />
            </button>
          ) : (
            <span />
          )}
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { setProfile } = useProfile();
  const {
    torboxKey,
    setTorboxKey,
    addonUrls,
    addAddonUrl,
    removeAddonUrl,
    inactiveAddonUrls,
    toggleAddonUrl,
  } = useSettings();

  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) ?? "account",
  );

  // profiles
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);

  // torbox plan
  const [torboxPlan, setTorboxPlan] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  // addons
  const [manifests, setManifests] = useState<Record<string, AddonManifest>>({});
  const [addUrl, setAddUrl] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // fetch manifests
  useEffect(() => {
    for (const url of addonUrls) {
      if (manifests[url]) continue;
      fetch(`${url}/manifest.json`)
        .then((r) => r.json())
        .then((m: AddonManifest) => setManifests((p) => ({ ...p, [url]: m })))
        .catch(() =>
          setManifests((p) => ({
            ...p,
            [url]: { name: new URL(url).hostname, description: url },
          })),
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addonUrls]);

  // fetch profiles
  useEffect(() => {
    apiGet<Profile[]>("/api/profiles")
      .then(setProfiles)
      .catch(() => setProfileError("Could not load profiles"))
      .finally(() => setLoadingProfiles(false));
  }, []);

  // fetch plan on mount only if a key is already saved
  useEffect(() => {
    if (!torboxKey) return;
    setLoadingPlan(true);
    fetchTorboxPlan()
      .then(setTorboxPlan)
      .catch(() => setTorboxPlan(null))
      .finally(() => setLoadingPlan(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // profile actions
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
      setProfileError("Could not create profile");
    } finally {
      setLoadingAdd(false);
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      await apiDelete(`/api/profiles/${id}`);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setProfileError("Could not delete profile");
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
      setProfileError("Could not rename profile");
    } finally {
      setEditingId(null);
    }
  };

  // addon actions
  const handleAddAddon = async () => {
    const url = addUrl.trim().replace(/\/manifest\.json$/i, "");
    if (!url.startsWith("https://")) {
      setAddError("URL must start with https://");
      return;
    }
    setAddError("");
    setAddLoading(true);
    try {
      const res = await fetch(`${url}/manifest.json`);
      if (!res.ok) throw new Error(`Could not reach addon (${res.status})`);
      const manifest = (await res.json()) as {
        resources?: (string | { name: string })[];
      };
      const hasStream = manifest.resources?.some(
        (r) => (typeof r === "string" ? r : r.name) === "stream",
      );
      if (!hasStream)
        throw new Error("Addon does not provide stream resources");
      addAddonUrl(url);
      setAddUrl("");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to add addon");
    } finally {
      setAddLoading(false);
    }
  };

  const handleSaveKey = async () => {
    const key = keyDraft.trim();
    if (!key) return;
    setLoadingPlan(true);
    setTorboxPlan(null);
    try {
      await apiPatch("/api/settings", { torboxKey: key });
      setTorboxKey(key);
      const plan = await fetchTorboxPlan();
      setTorboxPlan(plan);
    } catch {
      setTorboxPlan(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    logout();
    setProfile(null);
    navigate("/login");
  };

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-6 left-8 z-50 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
        aria-label="Back"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Mobile top nav */}
      <div className="md:hidden flex items-center gap-1 border-b border-border px-4 pt-14 pb-0 shrink-0">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border pt-6 pb-8 px-3">
          <nav className="flex flex-col gap-0.5 mt-10">
            {NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                  activeTab === id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                <Icon
                  size={15}
                  className={
                    activeTab === id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Content: account + profiles (scrollable) ── */}
        {activeTab !== "addons" && (
          <main className="flex-1 overflow-y-auto px-5 md:px-10 pt-5 md:pt-6 pb-16">
            <div className="max-w-2xl mx-auto space-y-8">
              {/* ══ Account tab ══ */}
              {activeTab === "account" && (
                <div className="space-y-6">
                  {/* ── User card ── */}
                  {user && (
                    <Card>
                      <CardContent className="p-0">
                        <div className="flex items-center gap-4 px-5 py-4">
                          <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleSignOut}
                            className="shrink-0 gap-2"
                          >
                            <LogOut size={14} />
                            Sign out
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* ── TorBox card ── */}
                  <Card>
                    <CardContent className="p-0">
                      {/* header */}
                      <div className="flex items-center gap-4 px-5 py-4 border-b border-border/60">
                        <img
                          src="/torbox.png"
                          alt="TorBox"
                          className="size-10 rounded-xl shrink-0 object-contain"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">TorBox</p>
                            {loadingPlan && (
                              <Skeleton className="h-5 w-16 rounded-full" />
                            )}
                            {!loadingPlan &&
                              torboxKey &&
                              torboxPlan !== null && (
                                <Badge
                                  className={cn(
                                    "text-[10px] px-2 h-5 rounded-full border-0 font-medium",
                                    PLAN_COLORS[torboxPlan],
                                  )}
                                >
                                  {PLAN_LABELS[torboxPlan] ?? "Unknown"}
                                </Badge>
                              )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Cloud torrent streaming — cache once, play instantly
                          </p>
                        </div>
                        {torboxKey && torboxPlan !== null && !loadingPlan && (
                          <CheckCircle2
                            size={16}
                            className="text-green-500 shrink-0"
                          />
                        )}
                        {torboxKey && torboxPlan === null && !loadingPlan && (
                          <AlertCircle
                            size={16}
                            className="text-destructive shrink-0"
                          />
                        )}
                      </div>

                      {/* description */}
                      <div className="px-5 py-4 border-b border-border/60">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          TorBox is a cloud-based torrent service that
                          pre-caches torrents on their servers. Instead of
                          downloading the torrents, Mohn fetches a direct stream
                          link from TorBox — giving you instant, buffer-free
                          playback without seeding or waiting.
                        </p>
                      </div>

                      {/* API key row */}
                      <div className="px-5 py-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          API Key
                        </p>
                        {torboxKey ? (
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-muted-foreground">
                              {"•".repeat(24)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setTorboxKey("");
                                setKeyDraft("");
                                setTorboxPlan(null);
                              }}
                              className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex gap-2">
                              <Input
                                type="password"
                                placeholder="Paste your TorBox API key…"
                                value={keyDraft}
                                onChange={(e) => setKeyDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveKey();
                                }}
                                className="text-sm flex-1"
                                autoComplete="off"
                              />
                              <Button
                                size="sm"
                                disabled={!keyDraft.trim() || loadingPlan}
                                onClick={handleSaveKey}
                              >
                                Save
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground/60 mt-2">
                              Get your key at{" "}
                              <a
                                href="https://torbox.app"
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-2 hover:text-foreground transition-colors"
                              >
                                torbox.app
                              </a>
                            </p>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ══ Profiles tab ══ */}
              {activeTab === "profiles" && (
                <>
                  <div>
                    <h2 className="text-xl font-semibold">Profiles</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add and manage viewing profiles.
                    </p>
                  </div>

                  {profileError && (
                    <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-xs text-destructive">
                      {profileError}
                    </div>
                  )}

                  <section className="space-y-2">
                    {loadingProfiles ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-[60px] w-full rounded-2xl"
                        />
                      ))
                    ) : (
                      <>
                        {profiles.map((p) => (
                          <Card key={p.id} className="border-border/60">
                            <CardContent className="p-0">
                              <div className="flex items-center gap-4 px-3">
                                <Avatar
                                  name={p.name}
                                  className="size-9 shrink-0 rounded-lg text-sm font-semibold"
                                />
                                {editingId === p.id ? (
                                  <input
                                    autoFocus
                                    className="flex-1 bg-transparent text-sm text-foreground outline-none"
                                    value={editName}
                                    onChange={(e) =>
                                      setEditName(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveRename(p.id);
                                      if (e.key === "Escape")
                                        setEditingId(null);
                                    }}
                                    onBlur={() => saveRename(p.id)}
                                    maxLength={20}
                                  />
                                ) : (
                                  <span className="flex-1 text-sm">
                                    {p.name}
                                  </span>
                                )}
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() =>
                                      editingId === p.id
                                        ? setEditingId(null)
                                        : startRename(p)
                                    }
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <Pencil size={13} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => deleteProfile(p.id)}
                                    disabled={profiles.length <= 1}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 size={13} />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}

                        {profiles.length < 10 &&
                          (adding ? (
                            <Card className="border-border/60">
                              <CardContent className="p-0">
                                <div className="flex items-center gap-3 px-3">
                                  <div className="size-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                                    <Plus
                                      size={15}
                                      className="text-muted-foreground"
                                    />
                                  </div>
                                  <input
                                    autoFocus
                                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
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
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      onClick={addProfile}
                                      disabled={loadingAdd || !newName.trim()}
                                    >
                                      {loadingAdd ? (
                                        <Loader2
                                          size={13}
                                          className="animate-spin"
                                        />
                                      ) : (
                                        "Add"
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={() => {
                                        setAdding(false);
                                        setNewName("");
                                      }}
                                      className="text-muted-foreground"
                                    >
                                      <X size={13} />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <button
                              onClick={() => setAdding(true)}
                              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
                            >
                              <Plus size={15} />
                              <span className="text-sm">Add profile</span>
                            </button>
                          ))}
                      </>
                    )}
                  </section>
                </>
              )}
            </div>
          </main>
        )}

        {/* ── Content: addons (fixed toolbar + scrollable grid + fixed add row) ── */}
        {activeTab === "addons" && (
          <main className="flex-1 min-w-0 flex flex-col overflow-hidden px-5 md:px-10 pt-5 md:pt-6 pb-0">
            <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 min-h-0 gap-4">
              {/* header */}
              <div className="shrink-0">
                <h2 className="text-xl font-semibold">Addons</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect Stremio-compatible addons to provide stream sources.
                </p>
              </div>

              {/* scrollable grid */}
              <ScrollArea className="flex-1 min-h-0 -mx-1">
                <div className="px-1 pb-2">
                  {addonUrls.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {addonUrls.map((url) => (
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
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-sm text-muted-foreground">
                      No addons added yet
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* add row — pinned */}
              <div className="shrink-0 space-y-2 pb-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://addon.example.com/manifest.json"
                    value={addUrl}
                    disabled={addLoading}
                    onChange={(e) => {
                      setAddUrl(e.target.value);
                      setAddError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddAddon();
                    }}
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={handleAddAddon}
                    disabled={addLoading || !addUrl.trim()}
                    className="shrink-0"
                  >
                    {addLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Plus />
                    )}
                    Add
                  </Button>
                </div>
                {addError && (
                  <p className="text-xs text-destructive px-1">{addError}</p>
                )}
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
