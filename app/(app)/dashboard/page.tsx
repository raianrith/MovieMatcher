import Link from "next/link";
import { PageHeading } from "@/components/layout/PageHeading";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const [{ count: matchCount }, { count: friendCount }, { count: pending }] = await Promise.all([
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`),
    supabase.from("friendships").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("friend_requests")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("status", "pending"),
  ]);

  const greet = profile?.display_name ?? profile?.username ?? user.email?.split("@")[0] ?? "Movie fan";

  return (
    <div className="space-y-10">
      <PageHeading
        eyebrow="Tonight's feature"
        title="YOUR LOBBY"
        subtitle={`Welcome back, ${greet}. Swipe fresh picks, grow your crew, and open Double features when you're ready for movie night.`}
      />

      <section aria-label="Quick stats" className="grid grid-cols-3 gap-3">
        {[
          { label: "Crew", sub: "friends", value: friendCount ?? 0, href: "/friends", pulse: false },
          {
            label: "Matches",
            sub: "both liked",
            value: matchCount ?? 0,
            href: "/matches",
            pulse: false,
          },
          {
            label: "Invites",
            sub: "waiting",
            value: pending ?? 0,
            href: "/requests",
            pulse: (pending ?? 0) > 0,
          },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`panel-ticket flex min-h-[118px] flex-col justify-between p-4 transition-transform active:scale-[0.98] ${c.pulse ? "ring-2 ring-[rgba(232,200,106,0.45)] ring-offset-2 ring-offset-[var(--cinema-black)]" : ""}`}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--cinema-muted-gold)]">
              {c.label}
            </span>
            <span className="font-[family-name:var(--font-display)] text-[clamp(1.75rem,7vw,2.25rem)] leading-none text-white tabular-nums tracking-wide">
              {c.value}
            </span>
            <span className="text-[11px] text-slate-500">{c.sub}</span>
          </Link>
        ))}
      </section>

      <div className="grid gap-4">
        <Link href="/swipe" className="btn-spotlight flex min-h-[64px] flex-col items-start justify-center gap-1 px-8 py-5 text-left active:scale-[0.99] md:flex-row md:items-center md:justify-between">
          <span className="text-lg md:text-xl">Swipe the marquee</span>
          <span className="text-[13px] opacity-90 md:text-sm">Trailers from TMDB · right = love</span>
        </Link>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/matches"
            className="panel-ticket flex min-h-[72px] flex-col justify-center px-7 py-5 transition-colors hover:border-[rgba(232,200,106,0.26)]"
          >
            <span className="font-semibold text-white">Open double features</span>
            <span className="mt-1 text-[13px] text-slate-400">Every mutual like in one theatre list</span>
          </Link>
          <Link
            href="/friends"
            className="panel-ticket flex min-h-[72px] flex-col justify-center px-7 py-5 transition-colors hover:border-[rgba(232,200,106,0.26)]"
          >
            <span className="font-semibold text-white">Build your crew</span>
            <span className="mt-1 text-[13px] text-slate-400">Search handles · send invites</span>
          </Link>
        </div>
      </div>

      <section className="panel-ticket p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--cinema-muted-gold)] opacity-95">
          Download the app
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-[0.04em] text-white">
          INSTALL MOVIEMATCH
        </h2>
        <p className="mt-2 text-[13px] text-slate-400">
          MovieMatch is a web app you can install on your phone like a native app (no App Store needed).
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[rgba(148,134,170,0.12)] bg-[rgba(8,6,14,0.55)] p-4">
            <p className="text-[12px] font-semibold text-slate-200">iPhone (iOS)</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-[13px] text-slate-400">
              <li>Open MovieMatch in Safari</li>
              <li>Tap Share</li>
              <li>Tap “Add to Home Screen”</li>
              <li>Tap Add</li>
            </ol>
          </div>
          <div className="rounded-xl border border-[rgba(148,134,170,0.12)] bg-[rgba(8,6,14,0.55)] p-4">
            <p className="text-[12px] font-semibold text-slate-200">Android</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-[13px] text-slate-400">
              <li>Open MovieMatch in Chrome</li>
              <li>Tap the ⋮ menu</li>
              <li>Tap “Install app”</li>
            </ol>
          </div>
          <div className="rounded-xl border border-[rgba(148,134,170,0.12)] bg-[rgba(8,6,14,0.55)] p-4">
            <p className="text-[12px] font-semibold text-slate-200">Desktop</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-[13px] text-slate-400">
              <li>Open MovieMatch in Chrome / Edge</li>
              <li>Click the install icon in the address bar</li>
              <li>Confirm Install</li>
            </ol>
          </div>
        </div>

        <details className="mt-4 rounded-xl border border-[rgba(232,200,106,0.12)] bg-[rgba(12,10,18,0.45)] px-4 py-3">
          <summary className="cursor-pointer text-[13px] font-semibold text-slate-200">
            Don’t see “Install”?
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-slate-400">
            <li>Make sure you’re on the live HTTPS site (not localhost).</li>
            <li>On iPhone, it must be Safari (not Chrome).</li>
            <li>
              If it still doesn’t show up, clear site data once and reload.
            </li>
          </ul>
        </details>
      </section>

      {profile ? (
        <p className="rounded-xl border border-[rgba(148,134,170,0.12)] bg-[rgba(8,6,14,0.55)] px-5 py-4 text-center text-[13px] text-slate-400">
          Logged in as{" "}
          <span className="font-medium text-slate-200">@{profile.username}</span>
        </p>
      ) : null}
    </div>
  );
}
