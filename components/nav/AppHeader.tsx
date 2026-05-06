import Link from "next/link";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard", label: "Lobby" },
  { href: "/swipe", label: "Now showing" },
  { href: "/matches", label: "Double features" },
  { href: "/watched", label: "After credits" },
  { href: "/groups", label: "Group match" },
  { href: "/friends", label: "Crew" },
  { href: "/requests", label: "Invites" },
] as const;

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div className="border-b border-[rgba(232,200,106,0.12)] bg-[#0c0a12]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:gap-6">
          <Link
            href="/dashboard"
            className="shrink-0 font-[family-name:var(--font-display)] text-2xl tracking-[0.06em] text-white"
          >
            <span className="text-[var(--cinema-muted-gold)]">MOVIE</span>
            <span className="ml-1.5 text-white">MATCH</span>
          </Link>
          <nav className="hidden flex-1 flex-wrap justify-center gap-1 md:flex md:gap-0.5 lg:gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-xl px-3 py-2 text-[13px] font-medium tracking-wide text-slate-400 transition-colors",
                  "hover:bg-[var(--cinema-teal-dim)] hover:text-[var(--cinema-teal)]",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/settings"
            aria-label="Settings"
            className="ml-auto grid min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl border border-[rgba(232,200,106,0.18)] px-3 text-[var(--cinema-muted-gold)] transition-colors hover:border-[rgba(232,200,106,0.35)] hover:bg-[rgba(232,200,106,0.06)] md:px-4"
          >
            <span className="text-[18px] md:hidden" aria-hidden>
              ⚙
            </span>
            <span className="hidden text-[13px] font-semibold text-[var(--cinema-muted-gold)] md:inline">Settings</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
