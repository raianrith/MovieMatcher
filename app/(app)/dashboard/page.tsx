import Link from "next/link";
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

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">Logged in as</p>
        <p className="text-2xl font-bold text-white">
          {profile?.display_name ?? profile?.username ?? user.email}
        </p>
        <p className="text-sm text-cyan-400/90">@{profile?.username ?? "—"}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {(
          [
            { label: "Friends", value: friendCount ?? 0, href: "/friends", emphasize: false },
            {
              label: "Mutual matches",
              value: matchCount ?? 0,
              href: "/matches",
              emphasize: false,
            },
            {
              label: "Pending requests",
              value: pending ?? 0,
              href: "/requests",
              emphasize: (pending ?? 0) > 0,
            },
          ] as const
        ).map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`rounded-2xl border p-5 transition hover:border-cyan-500/40 ${
              c.emphasize ? "border-amber-400/50 bg-amber-500/10" : "border-slate-800 bg-slate-950/60"
            }`}
          >
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-1 text-3xl font-bold text-white">{c.value}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/swipe"
          className="rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 p-6 font-bold text-slate-950 shadow-lg shadow-cyan-500/20"
        >
          Start swiping →
        </Link>
        <Link
          href="/matches"
          className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6 font-semibold text-slate-100"
        >
          Open matches gallery →
        </Link>
      </div>
    </div>
  );
}
