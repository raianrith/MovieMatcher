 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabaseClient";

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
  const [handle, setHandle] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid) return;
      const { data } = await supabase.from("profiles").select("username, avatar_url").eq("id", uid).maybeSingle();
      if (data?.username) setHandle(`@${data.username}`);
      if (typeof data?.avatar_url === "string") setAvatarUrl(data.avatar_url);
    })();
  }, []);

  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-[rgba(232,200,106,0.12)] bg-[#0c0a12]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:gap-6">
          <Link
            href="/dashboard"
            className="shrink-0 font-[family-name:var(--font-display)] text-2xl tracking-[0.06em] text-white"
          >
            <span className="text-[var(--cinema-muted-gold)]">MOVIE</span>
            <span className="ml-1.5 text-white">MATCH</span>
          </Link>

          {/* Profile chip (show on mobile + desktop) */}
          <div className="ml-auto flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border border-[rgba(232,200,106,0.16)] bg-[rgba(8,6,14,0.55)]">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-[10px] font-bold text-[var(--cinema-muted-gold)]">
                  MM
                </div>
              )}
            </div>
            <p className="max-w-[42vw] truncate text-[13px] font-semibold text-slate-300 md:max-w-none">
              {handle ?? "—"}
            </p>
          </div>

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
            className={cn(
              "grid min-h-[44px] min-w-[44px] shrink-0 place-items-center rounded-xl",
              "border border-[rgba(232,200,106,0.18)] px-3 text-[var(--cinema-muted-gold)] transition-colors",
              "hover:border-[rgba(232,200,106,0.35)] hover:bg-[rgba(232,200,106,0.06)]",
            )}
          >
            <span className="text-[18px]" aria-hidden>
              ⚙
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
