import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { openApp } from "@/lib/constants";

export default function Steps() {
  return (
    <section id="plug-and-play" className="relative py-24 overflow-hidden">
      <img
        src="/bare-poppy.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-full w-96 object-cover object-right opacity-20 [mask-image:linear-gradient(to_right,black_40%,transparent_100%)]"
      />
      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Up and running in minutes
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-lg text-muted-foreground">
          No configuration rabbit holes. Three steps and you're watching.
        </p>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 mt-14">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border rounded-3xl border bg-card">
          {[
            {
              n: "01",
              title: "Create an account",
              desc: "Sign up with email or Google. Takes less than a minute, no credit card, no commitments.",
              corners: "rounded-t-3xl md:rounded-t-none md:rounded-l-3xl",
            },
            {
              n: "02",
              title: "Add your sources",
              desc: "Paste in a TorBox API key for high-speed streaming and connect any Stremio-compatible add-ons.",
              corners: "",
            },
            {
              n: "03",
              title: "You're good to go",
              desc: "Browse trending titles, search for anything, and hit play. Stream in the browser or fire up the desktop app.",
              corners: "rounded-b-3xl md:rounded-b-none md:rounded-r-3xl",
            },
          ].map((s) => (
            <div
              key={s.n}
              className={`glow-card p-8 lg:p-10 flex flex-col ${s.corners}`}
            >
              <div className="text-[6rem] font-black tracking-tighter leading-none select-none text-white/[0.12]">
                {s.n}
              </div>
              <h3 className="mt-6 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 mt-12 flex justify-center">
        <Button
          size="lg"
          className="rounded-full h-14 px-8 text-lg shadow-lg transition-colors hover:bg-primary/90"
          onClick={openApp}
        >
          Get started now
          <ArrowRight className="ml-2 size-5 transition-transform group-hover/button:translate-x-0.5" />
        </Button>
      </div>
    </section>
  );
}
