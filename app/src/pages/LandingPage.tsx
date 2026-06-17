import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Download,
  Puzzle,
  RefreshCw,
  Globe,
  Monitor,
  Check,
  Play,
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
  type LucideProps,
} from "lucide-react";

function GithubIcon(props: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...(props as React.SVGProps<SVGSVGElement>)}
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.021C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Avatar from "@/components/Avatar";

/* ─────────────────────────────────────────────────────────────────── */
/*  Constants                                                          */
/* ─────────────────────────────────────────────────────────────────── */

const GITHUB = "https://github.com/Cuerillius/Mohn";
const RELEASES = `${GITHUB}/releases/latest`;

/* ─────────────────────────────────────────────────────────────────── */
/*  Small atoms                                                        */
/* ─────────────────────────────────────────────────────────────────── */

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
    <div
      className={cn(
        "group rounded-2xl border bg-card p-6 transition-colors hover:bg-muted/40",
        className,
      )}
    >
      <div className="mb-4 inline-flex size-9 items-center justify-center rounded-lg border bg-muted text-foreground/60 transition-colors group-hover:text-foreground">
        <Icon className="size-4" />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {desc}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/*  Mock graphics (pure CSS)                                           */
/* ─────────────────────────────────────────────────────────────────── */

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
          <div key={name} className="group flex flex-col items-center gap-3 cursor-pointer outline-none">
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
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)" }}
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
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)" }}
        >
          {/* Seekbar */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[6px] text-white/50 tabular-nums shrink-0">00:23:41</span>
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
            <span className="text-[6px] text-white/50 tabular-nums shrink-0">01:49:02</span>
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

/* ─────────────────────────────────────────────────────────────────── */
/*  Page                                                               */
/* ─────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openApp = () => navigate("/login");

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <nav
          className={cn(
            "flex w-full max-w-5xl items-center justify-between gap-4 rounded-full border bg-background px-3 py-2 backdrop-blur-xl transition-shadow duration-300",
            scrolled && "shadow-lg shadow-black/50",
          )}
        >
          {/* Logo */}
          <a href="#top" className="ml-1 flex shrink-0 items-center gap-2">
            <img src="/mohn.svg" alt="Mohn" className="size-7" />
            <span className="font-bold">Mohn</span>
          </a>

          {/* Actions */}
          <div className="flex items-center gap-1">
           
            <Button
              variant="ghost"
              size="default"
              className="hidden rounded-full text-muted-foreground hover:text-foreground sm:inline-flex"
              asChild
            >
              <a href="#download">
                <Download className="size-3.5" />
                Download
              </a>
            </Button>
            <Button size="default" className="rounded-full" onClick={openApp}>
              Launch web app
              <ArrowRight className="size-3.5" />
            </Button>
              <a
              href={GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full ml-3 my-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
            >
                          <GithubIcon className="size-7" />
            </a>

          </div>
        </nav>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section
        id="top"
        className="relative overflow-hidden px-6 pb-0 pt-36 sm:pt-44"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center sm:gap-12">
          {/* Badge */}
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-sm backdrop-blur transition-colors hover:bg-muted"
          >
            <span className="text-muted-foreground">Open source</span>
            <span className="flex items-center gap-1 text-foreground">
              Star on GitHub
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>

          {/* Title */}
          <h1 className="relative z-10 max-w-4xl bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-balance text-5xl font-bold leading-[1.05] tracking-tight text-transparent drop-shadow-2xl sm:text-7xl sm:leading-[1.05]">
            The streaming app Stremio should've been
          </h1>

          {/* Description */}
          <p className="relative z-10 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            A modern, open-source streaming client built for debrid streaming.
            Browse, discover and watch instantly. No clutter, no compromises.
          </p>

          {/* Buttons */}
          <div className="relative z-10 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="rounded-full px-6" onClick={openApp}>
              Launch web app
              <ArrowRight className="size-4" />
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-6" asChild>
              <a href="#download">
                <Download className="size-4" />
                Download
              </a>
            </Button>
          </div>

          {/* Mockup + glow */}
          <div className="relative mt-4 w-full pt-8">
            {/* Glow behind the top of the mockup */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 -z-0 mx-auto h-[420px] max-w-4xl rounded-full opacity-50 blur-[100px]"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(16,185,129,0.5), rgba(16,185,129,0) 80%)",
              }}
            />

            {/* Mockup frame */}
            <div className="relative mx-auto max-w-5xl rounded-2xl border bg-card/70 p-2 shadow-2xl shadow-black/60 backdrop-blur">
              <img
                src="/hero.png"
                alt="Mohn app screenshot"
                className="w-full rounded-xl border border-white/10"
              />
            </div>

            {/* Fade bottom into next section */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-background to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            What Mohn has to offer
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Everything you'd want in a streaming client, nothing you don't.
          </p>
        </div>

        {/* Feature grid */}
       

        {/* ── Profiles spotlight ── */}
        <div className="mt-6 grid grid-cols-1 items-center gap-6 rounded-3xl border bg-card p-8 lg:grid-cols-2 lg:gap-12">
          <div className="order-2 lg:order-1">
            <ProfileMock />
          </div>
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold tracking-tight">
              Multiple profiles, one account
            </h3>
            </div>
            <p className="mt-3 text-muted-foreground">
              Everyone in the house gets their own profile, with separate watch
              history, continue-watching list and recommendations. Switch
              profiles in one click, no passwords needed.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Independent history and watchlists",
                "Switch profiles in one click, no password needed",
                "Each profile picks up exactly where you left off",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex size-4 shrink-0 items-center justify-center rounded-full border bg-muted">
                    <Check className="size-2.5 text-foreground" />
                  </div>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── TorBox + web player spotlight ── */}
        <div className="relative mt-6 grid grid-cols-1 items-center gap-6 overflow-hidden rounded-3xl border bg-card p-8 lg:grid-cols-2 lg:gap-12">
          {/* Green glow */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-[80px]" />
          <div className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-emerald-400/5 blur-[40px]" />

          <div className="relative flex flex-col">
            <div className="mb-5 flex items-center gap-3">
              <img
                src="torbox.png"
                alt="TorBox"
                className="size-8 rounded-lg object-contain"
              />
              <span className="text-sm font-medium text-emerald-400">Powered by TorBox</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight">
              Cached streams. Zero wait.
            </h3>
            <p className="mt-3 text-muted-foreground">
Link your TorBox account to stream from your personal Debrid cloud cache at full speed, directly in the browser or via the desktop app.
            </p>
            <p className="mt-4 text-sm text-muted-foreground/60">
              Bring your own <a href="https://torbox.app" target="_blank" rel="noopener noreferrer" className="text-emerald-400/50 hover:underline">TorBox Api Key</a> to securely deliver your streams without buffering.
            </p>
          </div>
          <div className="relative">
            <PlayerMock />
          </div>
        </div>

       <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-3">
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

      {/* ── Plug & Play ─────────────────────────────────────────────── */}
      <section id="plug-and-play" className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Up and running in minutes
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-muted-foreground">
            No configuration rabbit holes. Three steps and you're watching.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border rounded-2xl border bg-card overflow-hidden">
          {[
            {
              n: "01",
              title: "Create an account",
              desc: "Sign up with email or Google. Takes less than a minute, no credit card, no commitments.",
            },
            {
              n: "02",
              title: "Add your sources",
              desc: "Paste in a TorBox API key for high-speed streaming and connect any Stremio-compatible add-ons.",
            },
            {
              n: "03",
              title: "You're good to go",
              desc: "Browse trending titles, search for anything, and hit play. Stream in the browser or fire up the desktop app.",
            },
          ].map((s) => (
            <div key={s.n} className="p-8 flex flex-col">
              <div className="text-8xl font-black tracking-tighter leading-none select-none text-white/[0.08]">{s.n}</div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Button size="lg" className="rounded-full px-6" onClick={openApp}>
            Get started now
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* ── Download + CTA ──────────────────────────────────────────── */}
      <section id="download" className="mx-auto max-w-6xl px-6 pb-28 py-24">
        <div className="rounded-3xl border bg-card px-8 py-16 text-center">
          <img src="/mohn.svg" alt="Mohn" className="mx-auto size-12" />
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Ready to start watching?
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-muted-foreground">
            Download the desktop app or jump straight into the browser. Same account, same everything.
          </p>

          {/* Download buttons */}
          <div className="mx-auto mt-10 flex flex-wrap justify-center gap-3">
            {[
              { label: "Windows", href: RELEASES, icon: <Monitor className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />, dl: true, disabled: false },
              { label: "Linux (coming soon)", href: null, icon: <Monitor className="size-5 text-muted-foreground/40" />, dl: false, disabled: true },
              { label: "Web",     href: null,     icon: <Globe className="size-5 text-muted-foreground transition-colors group-hover:text-foreground" />,   dl: false, disabled: false },
            ].map(({ label, href, icon, dl, disabled }) =>
              href ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-2xl border bg-muted/20 px-5 py-4 font-medium transition-colors hover:border-foreground/20 hover:bg-muted/40"
                >
                  {icon}
                  <span className="text-sm">{label}</span>
                  {dl && <Download className="ml-auto size-4 text-muted-foreground transition-colors group-hover:text-foreground" />}
                </a>
              ) : disabled ? (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-dashed bg-muted/10 px-5 py-4 font-medium opacity-50 cursor-not-allowed"
                >
                  {icon}
                  <span className="text-sm">{label}</span>
                </div>
              ) : (
                <button
                  key={label}
                  onClick={openApp}
                  className="group flex items-center gap-3 rounded-2xl border bg-muted/20 px-5 py-4 font-medium transition-colors hover:border-foreground/20 hover:bg-muted/40"
                >
                  {icon}
                  <span className="text-sm">{label}</span>
                  <ArrowRight className="ml-auto size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                </button>
              )
            )}
          </div>

          <p className="mt-5 text-xs text-muted-foreground/50">
            all releases on{" "}
            <a
              href={RELEASES}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-muted-foreground"
            >
              GitHub
            </a>
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <img src="/mohn.svg" alt="Mohn" className="size-5" />
            <span className="font-semibold text-foreground">Mohn</span>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} Mohn</p>
          <div className="flex items-center gap-5 text-xs">
            <a href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href={GITHUB} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <GithubIcon className="size-3.5" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
