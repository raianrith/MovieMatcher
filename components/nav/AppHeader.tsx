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
    <header className="pt-[env(safe-area-inset-top)]">
      <div className="border-b border-[rgba(232,200,106,0.10)] bg-[#0c0a12]/70 backdrop-blur-xl">
        {/* Reserve space on the right so content doesn't sit under the fixed gear button. */}
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 pr-[calc(4rem+env(safe-area-inset-right))] md:gap-6 md:pr-4">
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
        </div>
      </div>

      <Link
        href="/settings"
        aria-label="Settings"
        className={cn(
          "fixed right-4 z-50 grid min-h-[46px] min-w-[46px] place-items-center rounded-2xl",
          "top-[calc(env(safe-area-inset-top)+0.75rem)]",
          "border border-[rgba(232,200,106,0.18)] bg-[#0c0a12]/70 text-[var(--cinema-muted-gold)] backdrop-blur-xl",
          "shadow-[0_10px_30px_rgba(0,0,0,0.55)] hover:border-[rgba(232,200,106,0.35)] hover:bg-[rgba(232,200,106,0.06)]",
        )}
      >
        <span className="text-[18px]" aria-hidden>
          ⚙
        </span>
      </Link>
    </header>
  );
}
