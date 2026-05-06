"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  IconLobby,
  IconClapper,
  IconStarBurst,
  IconUsers,
  IconSeat,
  IconReel,
  IconGroupBadge,
} from "@/components/nav/NavIcons";

const items = [
  { href: "/dashboard", label: "Lobby", Icon: IconLobby },
  { href: "/swipe", label: "Swipe", Icon: IconClapper },
  { href: "/matches", label: "Matches", Icon: IconStarBurst },
  { href: "/watched", label: "Watched", Icon: IconReel },
  { href: "/groups", label: "Groups", Icon: IconGroupBadge },
  { href: "/friends", label: "Friends", Icon: IconUsers },
  { href: "/profile", label: "You", Icon: IconSeat },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto mt-2 max-w-lg px-3">
        <ul className="grid grid-cols-6 rounded-2xl border border-[rgba(232,200,106,0.12)] bg-[#12101c]/94 p-1.5 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          {items.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold tracking-wide transition-colors",
                    active
                      ? "bg-[var(--cinema-teal-dim)] text-[var(--cinema-teal)]"
                      : "text-slate-500 active:text-slate-300",
                  )}
                >
                  <Icon className={cn("h-6 w-6", active && "text-[var(--cinema-teal)]")} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
