import { ArrowRight, Download, Globe, Monitor } from "lucide-react";

import { RELEASES, openApp } from "@/lib/constants";

export default function DownloadCTA() {
  return (
    <section id="download" className="mx-auto max-w-6xl px-6 pb-28 py-24">
      <div className="relative rounded-3xl border bg-card px-8 py-20 text-center overflow-hidden">
        {/* Poppy images */}
        <img
          src="/poppy-left.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -left-2 bottom-0 h-full w-80 object-cover object-right opacity-30 [mask-image:linear-gradient(to_right,black_60%,transparent_100%)]"
        />
        <img
          src="/poppy-right.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-2 bottom-0 h-full w-80 object-cover object-left opacity-30 [mask-image:linear-gradient(to_left,black_60%,transparent_100%)]"
        />
        <img src="/mohn.svg" alt="Mohn" className="mx-auto size-14" />
        <h2 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Ready to start watching?
        </h2>
        <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground">
          Download the desktop app or jump straight into the browser. Same
          account, same everything.
        </p>

        {/* Download buttons */}
        <div className="mx-auto mt-12 flex flex-wrap justify-center gap-4">
          {[
            {
              label: "Windows",
              href: RELEASES,
              icon: (
                <Monitor className="size-6 text-muted-foreground transition-colors group-hover:text-foreground" />
              ),
              dl: true,
              disabled: false,
            },
            {
              label: "Web",
              href: null,
              icon: (
                <Globe className="size-6 text-muted-foreground transition-colors group-hover:text-foreground" />
              ),
              dl: false,
              disabled: false,
            },
          ].map(({ label, href, icon, dl, disabled }) =>
            href ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="glow-card group flex items-center gap-4 rounded-2xl border bg-muted/20 px-6 py-5 sm:px-8 sm:py-6 font-semibold hover:border-foreground/30 hover:bg-muted/40"
              >
                {icon}
                <span className="text-lg">{label}</span>
                {dl && (
                  <Download className="ml-4 size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                )}
              </a>
            ) : disabled ? (
              <div
                key={label}
                className="flex items-center gap-4 rounded-2xl border border-dashed bg-muted/10 px-6 py-5 sm:px-8 sm:py-6 font-semibold opacity-50 cursor-not-allowed"
              >
                {icon}
                <span className="text-lg">{label}</span>
              </div>
            ) : (
              <button
                key={label}
                onClick={openApp}
                className="glow-card group flex items-center gap-4 rounded-2xl border bg-muted/20 px-6 py-5 sm:px-8 sm:py-6 font-semibold hover:border-foreground/30 hover:bg-muted/40"
              >
                {icon}
                <span className="text-lg">{label}</span>
                <ArrowRight className="ml-4 size-5 text-muted-foreground transition-colors group-hover:text-foreground" />
              </button>
            ),
          )}
        </div>

        <p className="mt-8 text-sm text-muted-foreground/60">
          all releases on{" "}
          <a
            href={RELEASES}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 transition-colors hover:text-muted-foreground"
          >
            GitHub
          </a>
        </p>
      </div>
    </section>
  );
}
