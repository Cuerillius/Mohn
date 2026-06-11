import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  X,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";

import { useSettings } from "../context/SettingsContext";
import { fetchTorboxPlan } from "../services/torbox";
import { apiGet, apiPost, apiDelete, apiPatch } from "../services/api";
import { type Profile } from "../context/ProfileContext";
import Avatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Constants ────────────────────────────────────────────────────────────────

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

// ── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ["TorBox", "Sources", "Profiles"];
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-background border px-3 py-2">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        return (
          <div key={label} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-full transition-all">
              <div
                className={cn(
                  "size-4 rounded-full flex items-center justify-center transition-all",
                  done
                    ? "bg-foreground"
                    : active
                      ? "bg-foreground/20 ring-1 ring-foreground/40"
                      : "bg-foreground/8",
                )}
              >
                {done ? (
                  <Check className="size-2.5 text-background" />
                ) : (
                  <span
                    className={cn(
                      "text-[9px] font-bold leading-none",
                      active ? "text-foreground" : "text-foreground/30",
                    )}
                  >
                    {idx}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  active
                    ? "text-foreground"
                    : done
                      ? "text-foreground/50"
                      : "text-foreground/25",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "w-4 h-px mx-0.5",
                  done ? "bg-foreground/30" : "bg-foreground/10",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: TorBox ────────────────────────────────────────────────────────────

function StepTorBox({ onNext }: { onNext: () => void }) {
  const { torboxKey, setTorboxKey } = useSettings();
  const [keyDraft, setKeyDraft] = useState(torboxKey);
  const [plan, setPlan] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(!!torboxKey);

  const handleVerify = async () => {
    const key = keyDraft.trim();
    if (!key) return;
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      await apiPatch("/api/settings", { torboxKey: key });
      setTorboxKey(key);
      const p = await fetchTorboxPlan();
      setPlan(p);
      setSaved(true);
    } catch {
      setError("Invalid API key. Couldn't verify with TorBox.");
      setSaved(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3 mb-1">
          <img
            src="https://torbox.app/favicon.ico"
            alt="TorBox"
            className="size-7 rounded-md"
          />
          <h2 className="text-2xl font-semibold tracking-tight">
            Connect TorBox
          </h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Mohn uses <span className="text-foreground font-medium">TorBox</span>{" "}
          to stream torrents instantly at full speed, no downloading, no waiting
          for peers. Your API key links your TorBox account so Mohn can fetch
          cached streams on your behalf.
        </p>
      </div>

      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {[
          "Pre-cached torrents start playing immediately",
          "Files are served from TorBox's servers at full speed",
          "Your key is stored securely and only used to fetch links",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check className="size-3.5 mt-0.5 shrink-0 text-foreground/40" />
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Paste your TorBox API key here..."
            value={keyDraft}
            onChange={(e) => {
              setKeyDraft(e.target.value);
              setSaved(false);
              setPlan(null);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
            className="text-sm"
          />
          <Button
            onClick={handleVerify}
            disabled={!keyDraft.trim() || loading}
            variant="secondary"
            className="shrink-0"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Verify"}
          </Button>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {error}
          </p>
        )}
        {plan !== null && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
            Verified on the{" "}
            <Badge className={cn("text-xs", PLAN_COLORS[plan])}>
              {PLAN_LABELS[plan]}
            </Badge>{" "}
            plan
          </p>
        )}
        {plan === null && <div className="flex flex-col gap-2 pt-1">
          <Button
            type="button"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            onClick={() => {
              const url =
                "https://www.torbox.app/subscription?referral=1255f72c-84de-4d54-bfb1-7860af4bb703";
              const isTauri = Boolean((window as any).__TAURI_INTERNALS__);
              if (isTauri) {
                import("@tauri-apps/plugin-opener").then(({ openUrl }) =>
                  openUrl(url),
                );
              } else {
                window.open(url, "_blank", "noopener");
              }
            }}
          >
            Purchase TorBox
          </Button>
          <button
            type="button"
            onClick={() => {
              const url = "https://www.torbox.app/settings?section=account";
              const isTauri = Boolean((window as any).__TAURI_INTERNALS__);
              if (isTauri) {
                import("@tauri-apps/plugin-opener").then(({ openUrl }) =>
                  openUrl(url),
                );
              } else {
                window.open(url, "_blank", "noopener");
              }
            }}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors self-center"
          >
            Already have an account? Get your key
          </button>
        </div>}
      </div>

      <div className="flex justify-end pt-1">
        <Button onClick={onNext} disabled={!saved} className="gap-2">
          Continue <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 2: Addon Sources ─────────────────────────────────────────────────────

interface AddonMeta {
  name: string;
  description?: string;
  logo?: string;
  version?: string;
}

function StepAddons({ onNext }: { onNext: () => void }) {
  const { addonUrls, addAddonUrl, removeAddonUrl } = useSettings();
  const [addUrl, setAddUrl] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [manifests, setManifests] = useState<Record<string, AddonMeta>>({});

  const handleAdd = async () => {
    const url = addUrl.trim().replace(/\/manifest\.json$/i, "");
    if (!url.startsWith("https://")) {
      setAddError("URL must start with https://");
      return;
    }
    setAddError("");
    setAddLoading(true);
    try {
      const res = await fetch(`${url}/manifest.json`);
      if (!res.ok) throw new Error(`Couldn't reach addon (${res.status})`);
      const manifest = (await res.json()) as {
        resources?: (string | { name: string })[];
        name?: string;
        description?: string;
        logo?: string;
        version?: string;
      };
      const hasStream = manifest.resources?.some(
        (r) => (typeof r === "string" ? r : r.name) === "stream",
      );
      if (!hasStream)
        throw new Error("Addon does not provide stream resources");
      addAddonUrl(url);
      setManifests((p) => ({
        ...p,
        [url]: {
          name: manifest.name ?? new URL(url).hostname,
          description: manifest.description,
          logo: manifest.logo,
          version: manifest.version,
        },
      }));
      setAddUrl("");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to add addon");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-tight">
          Add torrent sources
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Sources are{" "}
          <span className="text-foreground font-medium">
            Stremio-compatible addons
          </span>{" "}
          that supply torrent links when you hit play. Without at least one,
          Mohn won't find anything to stream.
        </p>
      </div>

      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {[
          "Addons index thousands of torrents via a standard API",
          "Works with any public or self-hosted Stremio addon",
          "Paste the addon's HTTPS URL and Mohn handles the rest",
        ].map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <Check className="size-3.5 mt-0.5 shrink-0 text-foreground/40" />
            {item}
          </li>
        ))}
      </ul>

      {addonUrls.length > 0 && (
        <div className="flex flex-col gap-2">
          {addonUrls.map((url) => {
            const meta = manifests[url];
            const name = meta?.name ?? new URL(url).hostname;
            return (
              <div
                key={url}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
              >
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
                  <p className="text-sm font-medium truncate">{name}</p>
                  {meta?.version && (
                    <p className="text-xs text-muted-foreground">
                      v{meta.version}
                    </p>
                  )}
                </div>
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeAddonUrl(url)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            placeholder="https://your-addon.example.com/..."
            value={addUrl}
            onChange={(e) => {
              setAddUrl(e.target.value);
              setAddError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="text-sm"
          />
          <Button
            onClick={handleAdd}
            disabled={!addUrl.trim() || addLoading}
            variant="secondary"
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
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {addError}
          </p>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <div className="flex items-center gap-3">
          {addonUrls.length === 0 && (
            <button
              onClick={onNext}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Skip for now
            </button>
          )}
          <Button
            onClick={onNext}
            disabled={addonUrls.length === 0}
            className="gap-2"
          >
            Continue <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Profiles ──────────────────────────────────────────────────────────

function StepProfiles({ onFinish }: { onFinish: () => void }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<Profile[]>("/api/profiles")
      .then(setProfiles)
      .catch(() => setError("Could not load profiles"))
      .finally(() => setFetching(false));
  }, []);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || loading) return;
    setLoading(true);
    setError("");
    try {
      const created = await apiPost<Profile>("/api/profiles", { name });
      setProfiles((p) => [...p, created]);
      setNewName("");
    } catch {
      setError("Could not create profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/profiles/${id}`);
      setProfiles((p) => p.filter((x) => x.id !== id));
    } catch {
      setError("Could not delete profile");
    }
  };

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-tight">
          Set up profiles
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Profiles let everyone keep their own watch history, continue-watching
          list, and recommendations, all under one account.
        </p>
      </div>

      {(fetching || profiles.length > 0) && (
        <div className="flex flex-wrap gap-4">
          {fetching
            ? Array.from({ length: 1 }).map((_, i) => (
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
                  <span className="text-xs text-muted-foreground max-w-[64px] text-center truncate">
                    {p.name}
                  </span>
                  {profiles.length > 1 && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="absolute -top-1 -right-1 size-5 rounded-full bg-background border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:border-destructive hover:text-destructive-foreground"
                      aria-label="Remove"
                    >
                      <Trash2 className="size-2.5" />
                    </button>
                  )}
                </div>
              ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            placeholder={
              fetching || profiles.length === 0
                ? "Your name"
                : "Add another name"
            }
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="text-sm"
          />
          <Button
            onClick={handleCreate}
            disabled={!newName.trim() || loading || profiles.length >= 10}
            variant="secondary"
            className="shrink-0 gap-1.5"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Plus className="size-4" /> Add
              </>
            )}
          </Button>
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {error}
          </p>
        )}
        <p className="text-xs text-muted-foreground/50">
          You can rename or add more profiles any time in Settings.
        </p>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          onClick={onFinish}
          disabled={fetching || profiles.length === 0}
          className="gap-2"
        >
          Finish setup <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Done ──────────────────────────────────────────────────────────────────────

function StepDone({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center py-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          You're all set
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          Mohn is ready. Pick a profile and start watching. Your history and
          progress sync automatically.
        </p>
      </div>
      <Button size="lg" onClick={onEnter} className="gap-2 mt-2">
        Start watching <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const ONBOARDING_STEP_KEY = "mohn:onboarding:step";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { setOnboardingDone } = useSettings();
  const [step, setStepState] = useState(() => {
    const saved = localStorage.getItem(ONBOARDING_STEP_KEY);
    const n = saved ? parseInt(saved, 10) : 1;
    return n >= 1 && n <= 3 ? n : 1;
  });

  const setStep = (n: number) => {
    if (n <= 3) localStorage.setItem(ONBOARDING_STEP_KEY, String(n));
    setStepState(n);
  };

  const handleFinish = () => {
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setOnboardingDone();
    setStep(4);
  };

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col items-center justify-center px-4 py-12",
        step < 4 ? "gap-8" : "gap-2",
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <img src="/mohn.svg" alt="Mohn" className="size-16" />
        {step < 4 && <StepIndicator current={step} />}
      </div>

      <div className="w-full max-w-md">
        {step === 1 && <StepTorBox onNext={() => setStep(2)} />}
        {step === 2 && <StepAddons onNext={() => setStep(3)} />}
        {step === 3 && <StepProfiles onFinish={handleFinish} />}
        {step === 4 && <StepDone onEnter={() => navigate("/profile")} />}
      </div>
    </div>
  );
}
