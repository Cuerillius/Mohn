import {
  Puzzle,
  RefreshCw,
  Check,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Captions,
  AudioLines,
  Hd,
  Film,
  Maximize,
  Sparkles,
  ArrowLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import Avatar from "@/components/Avatar";

function FeatureCard({
  icon: Icon,
  title,
  desc,
  className,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  className?: string;
}) {
  return (
    <div className={cn("glow-card rounded-2xl border bg-card p-6", className)}>
      <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg border bg-muted text-foreground/60">
        <Icon className="size-5" />
      </div>
      <p className="font-semibold text-lg">{title}</p>
      <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
        {desc}
      </p>
    </div>
  );
}

/** Profile picker mock */
function ProfileMock() {
  const profiles = ["Anna", "Koby", "Cole"];
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-background py-10 gap-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Who's watching?
      </h1>
      <div className="flex flex-wrap items-start justify-center gap-6">
        {profiles.map((name) => (
          <div
            key={name}
            className="group flex flex-col items-center gap-3 cursor-pointer outline-none"
          >
            <Avatar
              name={name}
              className="flex size-16 items-center justify-center rounded-xl text-xl transition-all duration-150 ring-2 ring-transparent group-hover:ring-foreground"
            />
            <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              {name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Video player mock — playing state, controls subtly visible */
function PlayerMock() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border bg-muted/30">
      <div className="relative aspect-video select-none">
        {/* Simulated video content */}
        <div className="absolute inset-0 bg-muted/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top bar: back button */}
        <div
          className="absolute inset-x-0 top-0 px-3 pt-2.5 pb-6"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
          }}
        >
          <div className="inline-flex p-1 rounded-full bg-black/50 backdrop-blur-sm text-white">
            <ArrowLeft size={10} />
          </div>
        </div>

        {/* Center controls */}
        <div className="absolute inset-0 flex items-center justify-center gap-4 text-white opacity-70">
          <div className="relative flex items-center justify-center p-1">
            <RotateCcw className="size-4" />
            <span className="absolute text-[5px] font-bold">10</span>
          </div>
          <div className="rounded-full p-1 text-white drop-shadow-lg">
            <Pause fill="white" className="size-5" />
          </div>
          <div className="relative flex items-center justify-center p-1">
            <RotateCw className="size-4" />
            <span className="absolute text-[5px] font-bold">10</span>
          </div>
        </div>

        {/* Bottom controls — low opacity, "playing" state */}
        <div
          className="absolute inset-x-0 bottom-0 px-3 pb-2 pt-6 opacity-70"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
          }}
        >
          {/* Seekbar */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[6px] text-white/50 tabular-nums shrink-0">
              00:23:41
            </span>
            <div className="relative flex-1 flex items-center h-2">
              <div className="relative h-0.5 w-full overflow-hidden rounded-full bg-white/20">
                <div className="absolute h-full w-[52%] rounded-full bg-white/25" />
                <div className="absolute h-full w-[38%] rounded-full bg-white/80" />
              </div>
              <div
                className="absolute size-1.5 rounded-full bg-white/80 shadow"
                style={{ left: "38%", transform: "translateX(-50%)" }}
              />
            </div>
            <span className="text-[6px] text-white/50 tabular-nums shrink-0">
              01:49:02
            </span>
          </div>

          {/* Control row */}
          <div className="flex items-center justify-between text-white/70">
            <div className="flex items-center gap-1.5">
              <Volume2 className="size-2.5" />
              <div className="relative flex items-center h-2 w-8">
                <div className="relative h-px w-full overflow-hidden rounded-full bg-white/20">
                  <div className="absolute h-full w-[70%] rounded-full bg-white/70" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {[Captions, AudioLines, Hd, Film, Maximize].map((Icon, i) => (
                <Icon key={i} className="size-2.5" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="mx-auto mt-24 max-w-6xl px-6 py-24">
      <div className="text-center">
        <h2 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          What Mohn has to offer
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
          Everything you'd want in a streaming client, nothing you don't.
        </p>
      </div>

      {/* ── Profiles spotlight ── */}
      <div className="glow-card mt-8 grid grid-cols-1 items-center gap-6 rounded-3xl border bg-card p-8 lg:grid-cols-2 lg:gap-12 lg:p-12">
        <div className="order-2 lg:order-1">
          <ProfileMock />
        </div>
        <div className="order-1 lg:order-2">
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-bold tracking-tight">
              Multiple profiles, one account
            </h3>
          </div>
          <p className="mt-4 text-lg text-muted-foreground">
            Everyone in the house gets their own profile, with separate watch
            history, continue-watching list and recommendations. Switch
            profiles in one click, no passwords needed.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Independent history and watchlists",
              "Switch profiles in one click, no password needed",
              "Each profile picks up exactly where you left off",
            ].map((t) => (
              <li
                key={t}
                className="flex items-center gap-3 text-base text-muted-foreground"
              >
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full border bg-muted">
                  <Check className="size-3 text-foreground" />
                </div>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── TorBox + web player spotlight ── */}
      <div className="glow-card relative mt-8 grid grid-cols-1 items-center gap-6 overflow-hidden rounded-3xl border bg-card p-8 lg:grid-cols-2 lg:gap-12 lg:p-12">
        {/* Green glow */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-[80px]" />
        <div className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-emerald-400/5 blur-[40px]" />

        <div className="relative flex flex-col">
          <div className="mb-5 flex items-center gap-3">
            <img
              src="torbox.webp"
              alt="TorBox"
              className="size-8 rounded-lg object-contain"
            />
            <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
              Powered by TorBox
            </span>
          </div>
          <h3 className="text-3xl font-bold tracking-tight">
            Cached streams. Zero wait.
          </h3>
          <p className="mt-4 text-lg text-muted-foreground">
            Link your TorBox account to stream from your personal Debrid cloud
            cache at full speed, directly in the browser or via the desktop
            app.
          </p>
          <p className="mt-5 text-base text-muted-foreground/60">
            Bring your own{" "}
            <a
              href="https://torbox.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400/70 font-medium hover:underline hover:text-emerald-400"
            >
              TorBox Api Key
            </a>{" "}
            to securely deliver your streams without buffering.
          </p>
        </div>
        <div className="relative">
          <PlayerMock />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <FeatureCard
          icon={Sparkles}
          title="Tailored for you"
          desc="Your homepage adapts to what you actually watch, with recommendations that get sharper over time."
        />
        <FeatureCard
          icon={Puzzle}
          title="Stremio add-on support"
          desc="Works with any public or self-hosted Stremio add-on. Bring your own sources."
        />
        <FeatureCard
          icon={RefreshCw}
          title="Synced everywhere"
          desc="History, watchlists and settings follow you across every device, instantly."
        />
      </div>
    </section>
  );
}
