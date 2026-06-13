import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useSettings } from "../context/SettingsContext";
import { signOut } from "../lib/authClient";
import Avatar from "@/components/Avatar";
import { cn } from "@/lib/utils";
import { AddonManager } from "@/components/Addon";
import { TorboxInfo, TorboxKeySection } from "@/components/TorboxKey";
import { ProfileManager } from "@/components/ProfileManager";

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "account" | "profiles" | "addons";

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

  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) ?? "account",
  );

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
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 pt-10 pb-16 md:pt-12">
          {/* ── Account ── */}
          {activeTab === "account" && (
            <div className="flex flex-col gap-8">
              <h1 className="text-2xl font-semibold tracking-tight">Account</h1>

              {/* user */}
              {user && (
                <div className="flex items-center gap-4">
                  <Avatar
                    name={user.name ?? "?"}
                    className="size-12 rounded-xl text-lg shrink-0"
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

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3 mb-1">
                  <img
                    src="/torbox.png"
                    alt="TorBox"
                    className="size-9 rounded-xl object-contain shrink-0"
                  />
                  <h2 className="text-xl font-semibold tracking-tight">
                    TorBox
                  </h2>
                </div>
                <TorboxInfo />
              </div>
              {/* torbox */}
              <TorboxKeySection
                torboxKey={torboxKey}
                onSave={setTorboxKey}
                onRemove={() => setTorboxKey("")}
              />

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
                <h1 className="text-2xl font-semibold tracking-tight">
                  Profiles
                </h1>
                <p className="text-sm text-muted-foreground">
                  Each profile keeps its own watch history and continue-watching
                  list.
                </p>
              </div>
              <ProfileManager />
            </div>
          )}

          {/* ── Addons ── */}
          {activeTab === "addons" && (
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Addons
                </h1>
                <p className="text-sm text-muted-foreground">
                  Stremio-compatible addons that supply torrent links when you
                  hit play.
                </p>
              </div>
              <AddonManager
                addonUrls={addonUrls}
                inactiveAddonUrls={inactiveAddonUrls}
                onAdd={addAddonUrl}
                onRemove={removeAddonUrl}
                onToggle={toggleAddonUrl}
                onReorder={reorderAddonUrls}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
