"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/dashboard", label: "Home", icon: "◇" },
  { href: "/swipe", label: "Swipe", icon: "♥" },
  { href: "/matches", label: "Matches", icon: "✦" },
  { href: "/friends", label: "Friends", icon: "◎" },
  { href: "/profile", label: "You", icon: "☆" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/90 bg-[#0b1220]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-2">
        {items.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-cyan-300" : "text-slate-500",
                )}
              >
                <span className="text-lg leading-none" aria-hidden>
                  {icon}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
