export function HalBootSequence() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-6 hal-opener-fade">
      <div className="w-full max-w-md text-center">
        <div className="relative mx-auto h-56 w-56 mb-8">
          <div className="absolute inset-0 rounded-full border border-hal-border hal-orbit" />
          <div className="absolute inset-5 rounded-full border border-hal-primary/50 hal-orbit-reverse" />
          <div className="absolute inset-10 rounded-full border border-hal-accent/35 hal-orbit" />
          <div className="absolute inset-[42%] rounded-full bg-hal-primary/70 blur-md hal-beacon" />
          <div className="absolute inset-[46%] rounded-full bg-hal-primary shadow-hal-glow-soft" />
          <div className="absolute left-1/2 top-1/2 h-20 w-[1px] -translate-x-1/2 -translate-y-1/2 bg-hal-line/80" />
          <div className="absolute left-1/2 top-1/2 h-[1px] w-20 -translate-x-1/2 -translate-y-1/2 bg-hal-line/80" />
        </div>

        <div className="mb-3">
          <div className="font-display tracking-[0.35em] text-2xl">H.A.L. COMPASS</div>
          <div className="mt-2 text-[11px] text-hal-muted tracking-[0.25em]">
            HIGH ACCURACY LOGIC COMPASS
          </div>
        </div>

        <div className="relative h-2.5 rounded-full border border-hal-border overflow-hidden bg-hal-bg-2">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-hal-primary/30 rounded-full" />
          <div className="absolute inset-y-0 left-0 w-1/4 bg-hal-accent/60 blur-[1px] hal-progress-sweep" />
        </div>

        <div className="mt-3 text-[10px] text-hal-muted tracking-[0.2em] uppercase hal-mono">
          Initializing intelligence stack...
        </div>
      </div>
    </div>
  );
}
