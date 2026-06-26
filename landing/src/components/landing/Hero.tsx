import { ArrowRight, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GITHUB, openApp } from "@/lib/constants";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col items-center overflow-x-clip px-6 pb-24 pt-32 sm:pb-32 sm:pt-36"
    >
      {/* Copy */}
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 text-center sm:gap-7">
        {/* Badge */}
        <a
          href={GITHUB}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 text-sm font-medium backdrop-blur transition-colors hover:bg-muted"
        >
          <span className="text-muted-foreground">Open source</span>
          <span className="flex items-center gap-1 text-foreground">
            Star on GitHub
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </a>

        {/* Title */}
        <h1 className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-balance text-5xl font-bold leading-[1.05] tracking-tight text-transparent drop-shadow-2xl sm:text-7xl sm:leading-[1.05]">
          The streaming app Stremio should've been
        </h1>

        {/* Description */}
        <p className="max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
          A modern, open-source streaming client built for debrid streaming.
          Browse, discover and watch instantly. No clutter, no compromises.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            className="rounded-full h-14 px-8 text-lg shadow-lg transition-colors hover:bg-primary/90"
            onClick={openApp}
          >
            Launch web app
            <ArrowRight className="ml-2 size-5 transition-transform group-hover/button:translate-x-0.5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-full h-14 px-8 text-lg"
            asChild
          >
            <a href="#download">
              <Download className="mr-2 size-5" />
              Download
            </a>
          </Button>
        </div>
      </div>

      {/* App screenshot */}
      <div className="relative z-10 mx-auto mt-14 w-full max-w-5xl sm:mt-20">
        {/* Red glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-32 -top-40 bottom-0 -z-0 mx-auto"
        >
          <div
            className="absolute inset-0 opacity-90 blur-[120px]"
            style={{
              background:
                "radial-gradient(58% 52% at 50% 45%, rgba(248,113,113,0.85), rgba(239,68,68,0.6) 38%, rgba(220,38,38,0.3) 60%, rgba(220,38,38,0) 75%)",
            }}
          />
        </div>

        {/* Mockup frame */}
        <div className="relative rounded-2xl border bg-card/70 p-1 shadow-2xl shadow-black/60 backdrop-blur">
          <img
            src="/hero.webp"
            alt="Mohn app screenshot"
            className="w-full rounded-xl border border-white/10"
          />

          {/* Mobile screenshot, overlaid bottom-right */}
          <div className="absolute -bottom-6 -right-3 z-20 w-[28%] max-w-[200px] rounded-2xl border bg-card/70 p-1 shadow-2xl shadow-black/60 backdrop-blur sm:-bottom-10 sm:-right-8">
            <img
              src="/hero-mobile.webp"
              alt="Mohn mobile app screenshot"
              className="w-full rounded-xl border border-white/10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
