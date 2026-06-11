import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  LogOut,
  ExternalLink,
  Settings2,
  CheckCircle2,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useAuth } from "../context/AuthContext";
import { useProfile, type Profile } from "../context/ProfileContext";
import { useSettings } from "../context/SettingsContext";
import { signOut } from "../lib/authClient";
import { fetchTorboxPlan } from "../services/torbox";
import { apiGet, apiPost, apiDelete, apiPatch } from "../services/api";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const isTauri = Boolean((window as any).__TAURI_INTERNALS__);

function openExternal(url: string) {
  if (isTauri) {
    import("@tauri-apps/plugin-opener").then(({ openUrl }) => openUrl(url));
  } else {
    window.open(url, "_blank", "noopener");
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "account" | "profiles" | "addons";

interface AddonManifest {
  name: string;
  description?: string;
  logo?: string;
  version?: string;
  behaviorHints?: { configurable?: boolean };
}

// ── Sortable addon row ────────────────────────────────────────────────────────

function SortableAddonRow({
  url,
  meta,
  enabled,
  onToggle,
  onRemove,
}: {
  url: string;
  meta: AddonManifest | null;
  enabled: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });
  const name = meta?.name ?? new URL(url).hostname;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-3 rounded-lg border px-3 py-2.5 bg-background transition-opacity",
        !enabled && "opacity-50",
        isDragging && "shadow-lg opacity-80 z-10",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>

      {meta?.logo ? (
        <img
          src={meta.logo}
          alt={name}
          className="size-7 rounded-md object-contain shrink-0"
        />
      ) : (
        <div className="size-7 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5">
          <p className="text-sm font-medium truncate">{name}</p>
          {meta?.version && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              v{meta.version}
            </span>
          )}
        </div>
        {meta?.description && (
          <p className="text-xs text-muted-foreground truncate">
            {meta.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {meta?.behaviorHints?.configurable && (
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
            onClick={() => openExternal(`${url}/configure`)}
          >
            <Settings2 className="size-3.5" />
            Configure
            <ExternalLink className="size-3 opacity-50" />
          </button>
        )}
        <CheckCircle2 className="size-4 text-emerald-500" />
        <Switch checked={enabled} onCheckedChange={onToggle} />
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
          onClick={onRemove}
          aria-label="Remove"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

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

const TABS: { id: Tab; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "profiles", label: "Profiles" },
  { id: "addons", label: "Addons" },
];

// ── Main page ─────────────────────────────────────────────────────────────────

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
    reorderAddonUrls,
    inactiveAddonUrls,
    toggleAddonUrl,
  } = useSettings();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = addonUrls.indexOf(active.id as string);
      const newIndex = addonUrls.indexOf(over.id as string);
      reorderAddonUrls(arrayMove(addonUrls, oldIndex, newIndex));
    }
  };

  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) ?? "account",
  );

  // profiles
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);

  // torbox
  const [torboxPlan, setTorboxPlan] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");

  // addons
  const [manifests, setManifests] = useState<Record<string, AddonManifest>>({});
  const [addUrl, setAddUrl] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

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

  useEffect(() => {
    apiGet<Profile[]>("/api/profiles")
      .then(setProfiles)
      .catch(() => setProfileError("Could not load profiles"))
      .finally(() => setLoadingProfiles(false));
  }, []);

  useEffect(() => {
    if (!torboxKey) return;
    setLoadingPlan(true);
    fetchTorboxPlan()
      .then(setTorboxPlan)
      .catch(() => setTorboxPlan(null))
      .finally(() => setLoadingPlan(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addProfile = async () => {
    if (!newName.trim() || loadingAdd) return;
    setLoadingAdd(true);
    try {
      const created = await apiPost<Profile>("/api/profiles", {
        name: newName.trim(),
      });
      setProfiles((prev) => [...prev, created]);
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
    <div className="h-dvh bg-background flex overflow-hidden">
      {/* sidebar */}
      <aside className="hidden md:flex w-52 shrink-0 flex-col border-r border-border px-3 pt-6 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center size-9 rounded-full bg-background border hover:bg-accent transition-colors mb-8 self-start"
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <nav className="flex flex-col gap-0.5">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                activeTab === id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* mobile top nav */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 flex items-center gap-1 border-b border-border bg-background px-4 pt-4 pb-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center size-8 rounded-full border hover:bg-accent transition-colors mr-2"
          aria-label="Back"
        >
          <ArrowLeft size={14} />
        </button>
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* main content */}
      <main className="flex-1 overflow-y-auto px-8 pt-8 pb-16 md:pt-10">
        <div className="max-w-md">
          {/* ── Account ── */}
          {activeTab === "account" && (
            <div className="flex flex-col gap-8">
              {/* user */}
              {user && (
                <div className="flex items-center gap-4">
                  <Avatar
                    name={user.name ?? "?"}
                    className="size-12 rounded-2xl text-lg shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t border-border/50" />

              {/* torbox */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/torbox.png"
                    alt="TorBox"
                    className="size-9 rounded-xl object-contain shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">TorBox</p>
                      {loadingPlan && (
                        <Skeleton className="h-4 w-14 rounded-full" />
                      )}
                      {!loadingPlan && torboxKey && torboxPlan !== null && (
                        <Badge
                          className={cn(
                            "text-[10px] px-2 h-5 rounded-full border-0 font-medium",
                            PLAN_COLORS[torboxPlan],
                          )}
                        >
                          {PLAN_LABELS[torboxPlan]}
                        </Badge>
                      )}
                      {!loadingPlan && torboxKey && torboxPlan !== null && (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      )}
                      {!loadingPlan && torboxKey && torboxPlan === null && (
                        <AlertCircle size={14} className="text-destructive" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {torboxKey ? "API key saved" : "No API key set"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Paste your TorBox API key here..."
                      value={torboxKey ? "placeholder-encrypted" : keyDraft}
                      readOnly={!!torboxKey}
                      onChange={(e) =>
                        !torboxKey && setKeyDraft(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !torboxKey) handleSaveKey();
                      }}
                      className={cn(
                        "text-sm",
                        torboxKey &&
                          "text-muted-foreground cursor-default select-none",
                      )}
                      autoComplete="off"
                    />
                    {torboxKey ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTorboxKey("");
                          setKeyDraft("");
                          setTorboxPlan(null);
                        }}
                        className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        disabled={!keyDraft.trim() || loadingPlan}
                        onClick={handleSaveKey}
                      >
                        {loadingPlan ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Save"
                        )}
                      </Button>
                    )}
                  </div>
                  {!torboxKey && (
                    <div className="flex flex-col gap-2 pt-1">
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                        onClick={() =>
                          openExternal(
                            "https://www.torbox.app/subscription?referral=1255f72c-84de-4d54-bfb1-7860af4bb703",
                          )
                        }
                      >
                        Purchase TorBox
                      </Button>
                      <button
                        type="button"
                        onClick={() =>
                          openExternal(
                            "https://www.torbox.app/settings?section=account",
                          )
                        }
                        className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors self-center"
                      >
                        Already have an account? Get your key
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border/50" />

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors self-start"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}

          {/* ── Profiles ── */}
          {activeTab === "profiles" && (
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Profiles
                </h2>
                <p className="text-sm text-muted-foreground">
                  Each profile keeps its own watch history and continue-watching
                  list.
                </p>
              </div>

              {profileError && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {profileError}
                </p>
              )}

              {/* avatar grid */}
              {(loadingProfiles || profiles.length > 0) && (
                <div className="flex flex-wrap gap-4">
                  {loadingProfiles
                    ? Array.from({ length: 2 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-2"
                        >
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
                          {editingId === p.id ? (
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
                            <button
                              onClick={() => startRename(p)}
                              className="size-5 rounded-full bg-background border flex items-center justify-center hover:bg-accent transition-colors"
                              aria-label="Rename"
                            >
                              <Pencil className="size-2.5 text-muted-foreground" />
                            </button>
                            {profiles.length > 1 && (
                              <button
                                onClick={() => deleteProfile(p.id)}
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

              {/* add */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      profiles.length === 0 ? "Your name" : "Add another name"
                    }
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addProfile()}
                    className="text-sm"
                  />
                  <Button
                    onClick={addProfile}
                    disabled={
                      !newName.trim() || loadingAdd || profiles.length >= 10
                    }
                    variant="secondary"
                    className="shrink-0 gap-1.5"
                  >
                    {loadingAdd ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="size-4" /> Add
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Addons ── */}
          {activeTab === "addons" && (
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Addons
                </h2>
                <p className="text-sm text-muted-foreground">
                  Stremio-compatible addons that supply torrent links when you
                  hit play.
                </p>
              </div>

              {addonUrls.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={addonUrls}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2">
                      {addonUrls.map((url) => (
                        <SortableAddonRow
                          key={url}
                          url={url}
                          meta={manifests[url] ?? null}
                          enabled={!inactiveAddonUrls.includes(url)}
                          onToggle={() => toggleAddonUrl(url)}
                          onRemove={() => removeAddonUrl(url)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://your-addon.example.com/..."
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
                    variant="secondary"
                    onClick={handleAddAddon}
                    disabled={addLoading || !addUrl.trim()}
                    className="shrink-0 gap-1.5"
                  >
                    {addLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="size-4" /> Add
                      </>
                    )}
                  </Button>
                </div>
                {addError && (
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {addError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
