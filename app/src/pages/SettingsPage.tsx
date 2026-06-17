import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, LogOut, Trash2, Mail, ExternalLink } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { useSettings } from "../context/SettingsContext";
import { signOut } from "../lib/authClient";
import { useAuthActions } from "@/hooks/useAuthActions";
import Avatar from "@/components/Avatar";
import { cn } from "@/lib/utils";
import { AddonManager } from "@/components/Addon";
import { TorboxInfo, TorboxKeySection } from "@/components/TorboxKey";
import { ProfileManager } from "@/components/ProfileManager";

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "account" | "profiles" | "addons" | "about";

const TABS: { id: Tab; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "profiles", label: "Profiles" },
  { id: "addons", label: "Addons" },
  { id: "about", label: "About" },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { setProfile } = useProfile();
  const {
    torboxKeySet,
    setTorboxKey,
    addonUrls,
    addAddonUrl,
    removeAddonUrl,
    reorderAddonUrls,
    inactiveAddonUrls,
    toggleAddonUrl,
  } = useSettings();

  const { handleDeleteAccount, isDeleting } = useAuthActions();

  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) ?? "account",
  );

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");

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
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
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
                torboxKeySet={torboxKeySet}
                onSave={setTorboxKey}
                onRemove={() => setTorboxKey("")}
              />

              <div className="border-t border-border/50" />

              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Danger zone
                </p>
                <button
                  onClick={() => {
                    setDeleteConfirmInput("");
                    setShowDeleteDialog(true);
                  }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors self-start"
                >
                  <Trash2 size={14} />
                  Delete account
                </button>
              </div>
            </div>
          )}

          {/* ── Delete account dialog ── */}
          {showDeleteDialog && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowDeleteDialog(false);
              }}
            >
              <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-sm flex flex-col gap-5 shadow-xl">
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-lg font-semibold">Delete account</h2>
                  <p className="text-sm text-muted-foreground">
                    This permanently deletes your account, all profiles, watch
                    history, and settings. This action cannot be undone.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm text-muted-foreground">
                    Type your email to confirm:{" "}
                    <span className="text-foreground font-medium">
                      {user?.email}
                    </span>
                  </label>
                  <input
                    type="email"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder={user?.email ?? ""}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-destructive/50"
                    autoComplete="off"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={isDeleting}
                    className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={
                      isDeleting || deleteConfirmInput !== user?.email
                    }
                    className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? "Deleting…" : "Delete my account"}
                  </button>
                </div>
              </div>
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

          {/* ── About ── */}
          {activeTab === "about" && (
            <div className="flex flex-col gap-8">
              <h1 className="text-2xl font-semibold tracking-tight">About</h1>

              {/* App info */}
              <div className="flex items-center gap-4">
                <img
                  src="/mohn.svg"
                  alt="Mohn"
                  className="size-12 rounded-xl shrink-0"
                />
                <div>
                  <p className="font-semibold">Mohn</p>
                  <p className="text-sm text-muted-foreground">Version {__APP_VERSION__}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href="https://github.com/Cuerillius/Mohn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5 shrink-0" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.021C22 6.484 17.522 2 12 2z" />
                  </svg>
                  Source code on GitHub
                  <ExternalLink size={12} />
                </a>
                <p className="text-xs text-muted-foreground">
                  Released under the{" "}
                  <a
                    href="https://github.com/Cuerillius/Mohn/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground transition-colors"
                  >
                    MIT License
                  </a>
                  .
                </p>
              </div>

              <div className="border-t border-border/50" />

              {/* TMDB attribution — required by the TMDB API terms of use */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Data &amp; Metadata
                </p>
                <div className="flex items-start gap-4">
                  <a
                    href="https://www.themoviedb.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 mt-0.5"
                    aria-label="The Movie Database"
                  >
                    <img
                      src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg"
                      alt="TMDB"
                      className="h-10 w-auto"
                    />
                  </a>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Movie and TV metadata, posters, and artwork are provided by{" "}
                    <a
                      href="https://www.themoviedb.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline"
                    >
                      TMDB (The Movie Database)
                    </a>
                    . This product uses the TMDB API but is not endorsed or
                    certified by TMDB.
                  </p>
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Legal links */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Legal
                </p>
                <div className="flex flex-col gap-2">
                  <a
                    href={`${import.meta.env.VITE_LANDING_URL}/privacy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
                  >
                    <ExternalLink size={13} />
                    Privacy Policy
                  </a>
                  <a
                    href={`${import.meta.env.VITE_LANDING_URL}/terms`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
                  >
                    <ExternalLink size={13} />
                    Terms of Service
                  </a>
                </div>
              </div>

              <div className="border-t border-border/50" />

              {/* Contact */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact
                </p>
                <a
                  href="mailto:contact@mohn.app"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
                >
                  <Mail size={14} />
                  contact@mohn.app
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
