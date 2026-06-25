export default function AppScreenshot() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-0">
      {/* Red glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-32 -top-32 -bottom-32 -z-0 mx-auto"
      >
        <div
          className="absolute inset-0 opacity-90 blur-[120px]"
          style={{
            background:
              "radial-gradient(58% 52% at 50% 50%, rgba(248,113,113,0.85), rgba(239,68,68,0.6) 38%, rgba(220,38,38,0.3) 60%, rgba(220,38,38,0) 75%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-70 blur-[80px]"
          style={{
            background:
              "radial-gradient(42% 38% at 50% 48%, rgba(252,165,165,0.65), rgba(239,68,68,0) 70%)",
          }}
        />
      </div>

      {/* Mockup frame */}
      <div className="relative mx-auto max-w-5xl rounded-2xl border bg-card/70 p-1 shadow-2xl shadow-black/60 backdrop-blur">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-2xl h-40 bg-gradient-to-t from-background to-transparent" />
        <img
          src="/hero.webp"
          alt="Mohn app screenshot"
          className="w-full rounded-xl border border-white/10"
        />

        {/* Mobile screenshot, overlaid bottom-right with a slight offset */}
        <div className="absolute -bottom-6 -right-3 z-20 w-[30%] max-w-[220px] rounded-2xl border bg-card/70 p-1 shadow-2xl shadow-black/60 backdrop-blur sm:-bottom-10 sm:-right-8">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t rounded-2xl from-background to-transparent" />
          <img
            src="/hero-mobile.png"
            alt="Mohn mobile app screenshot"
            className="w-full rounded-xl border border-white/10"
          />
        </div>
      </div>
    </section>
  );
}
