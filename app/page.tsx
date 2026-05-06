import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-[#0b1220] to-[#070b14] px-6 pb-24 pt-16 text-center">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/90">Swipe together</p>
      <h1 className="mb-6 max-w-md text-4xl font-bold tracking-tight text-white md:text-5xl">
        Movie Match — find overlaps with friends
      </h1>
      <p className="mb-10 max-w-md text-pretty text-slate-400">
        Sign up, add friends, swipe real titles from TMDB, and browse every mutual like in one place.
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/signup"
          className="rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-500 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-cyan-500/25"
        >
          Create account
        </Link>
        <Link
          href="/login"
          className="rounded-2xl border border-slate-700 py-4 text-lg font-semibold text-slate-100"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
