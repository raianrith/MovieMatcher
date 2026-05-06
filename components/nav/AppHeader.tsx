import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/swipe", label: "Swipe" },
  { href: "/matches", label: "Matches" },
  { href: "/friends", label: "Friends" },
  { href: "/requests", label: "Requests" },
  { href: "/profile", label: "Profile" },
] as const;

export function AppHeader({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0b1220]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight text-white">
          Movie<span className="text-cyan-400">Match</span>
        </Link>
        <nav className="hidden flex-1 flex-wrap justify-center gap-2 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-1 text-sm font-medium text-slate-300 hover:bg-white/10"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden text-sm font-medium text-slate-400 lg:block">{title ?? ""}</div>
        <Link
          href="/settings"
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300"
        >
          Settings
        </Link>
      </div>
    </header>
  );
}
