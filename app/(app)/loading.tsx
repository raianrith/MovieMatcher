import { PageHeading } from "@/components/layout/PageHeading";

export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 md:max-w-3xl md:pb-12 md:pt-8 lg:max-w-5xl">
      <div className="space-y-10">
        <PageHeading
          eyebrow="Please wait"
          title="OPENING NIGHT"
          subtitle="Warming up the projector…"
        />

        <div className="panel-ticket p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--cinema-muted-gold)] opacity-95">
                Loading
              </p>
              <p className="text-[13px] text-slate-400">Pulling your lobby stats and latest matches.</p>
            </div>
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-[rgba(232,200,106,0.25)] border-t-[var(--cinema-teal)]"
              aria-label="Loading"
            />
          </div>
          <div className="mt-5 marquee-rule" />
          <div className="mt-5 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                // eslint-disable-next-line react/no-array-index-key -- skeleton
                key={i}
                className="h-[118px] rounded-2xl border border-[rgba(232,200,106,0.10)] bg-[rgba(8,6,14,0.45)]"
              >
                <div className="h-full w-full animate-pulse rounded-2xl bg-[linear-gradient(90deg,rgba(255,255,255,0.03),rgba(61,212,192,0.05),rgba(255,255,255,0.03))]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

