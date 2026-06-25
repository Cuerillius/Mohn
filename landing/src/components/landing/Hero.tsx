import { ArrowRight, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GITHUB, openApp } from "@/lib/constants";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 pb-0"
    >
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-6 text-center sm:gap-12">
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
        <h1 className="relative z-10 max-w-4xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-balance text-5xl font-bold leading-[1.05] tracking-tight text-transparent drop-shadow-2xl sm:text-7xl sm:leading-[1.05]">
          The streaming app Stremio should've been
        </h1>

        {/* Description */}
        <p className="relative z-10 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
          A modern, open-source streaming client built for debrid streaming.
          Browse, discover and watch instantly. No clutter, no compromises.
        </p>

        {/* Buttons */}
        <div className="relative z-10 flex flex-wrap justify-center gap-4">
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
    </section>
  );
}
