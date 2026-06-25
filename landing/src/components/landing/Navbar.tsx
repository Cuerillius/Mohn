import { useEffect, useState } from "react";
import { ArrowRight, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import GithubIcon from "@/components/GithubIcon";
import { GITHUB, openApp } from "@/lib/constants";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        className={cn(
          "flex w-full max-w-5xl items-center justify-between gap-4 rounded-full border bg-background px-3 py-2 backdrop-blur-xl transition-shadow duration-300",
          scrolled && "shadow-lg shadow-black/50",
        )}
      >
        {/* Logo */}
        <a href="#top" className="ml-1 flex shrink-0 items-center gap-2">
          <img src="/mohn.svg" alt="Mohn" className="size-8" />
          <span className="font-bold text-lg">Mohn</span>
        </a>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="lg"
            className="hidden rounded-full h-11 px-6 text-base text-muted-foreground hover:text-foreground sm:inline-flex"
            asChild
          >
            <a href="#download">
              <Download className="mr-2 size-4" />
              Download
            </a>
          </Button>
          <Button
            size="lg"
            className="rounded-full h-11 px-6 text-base transition-colors hover:bg-primary/90"
            onClick={openApp}
          >
            Launch web app
            <ArrowRight className="ml-2 size-4 transition-transform group-hover/button:translate-x-0.5" />
          </Button>
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full ml-2 my-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
          >
            <GithubIcon className="size-8" />
          </a>
        </div>
      </nav>
    </header>
  );
}
