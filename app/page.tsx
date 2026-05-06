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
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 pb-16 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-md text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.38em] text-[var(--cinema-muted-gold)]">
          The social movie queue
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[clamp(2.75rem,12vw,4.25rem)] leading-[0.95] tracking-[0.04em] text-white">
          SHARE THE REELS
        </h1>
        <p className="marquee-rule mx-auto mt-8 max-w-xs" aria-hidden />
        <p className="mx-auto mt-8 max-w-sm text-[15px] leading-relaxed text-slate-400">
          Pick films with friends, swipe trailers into your story, and see every movie you<strong className="text-slate-200"> both </strong>
          liked—your shortlist for real movie nights.
        </p>
      </div>

      <div className="mt-12 flex w-full max-w-sm flex-col gap-4">
        <Link href="/signup" className="btn-spotlight flex items-center justify-center px-8 py-4 text-lg">
          Grab your ticket — sign up
        </Link>
        <Link
          href="/login"
          className="rounded-2xl border border-[rgba(232,200,106,0.22)] px-8 py-4 text-center text-[17px] font-semibold text-[var(--cinema-muted-gold)] backdrop-blur-sm transition-colors hover:bg-[rgba(232,200,106,0.06)] active:bg-[rgba(232,200,106,0.1)]"
        >
          Already have an account?
        </Link>
      </div>

      <p className="mt-14 max-w-xs text-center text-xs leading-relaxed text-slate-600">
        Powered by TMDB titles · your picks stay private until you match with friends.
      </p>
    </div>
  );
}
