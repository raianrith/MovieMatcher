import { NextResponse } from "next/server";
import { fetchMovieSnapshot } from "@/lib/tmdb";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface Ctx {
  params: Promise<{ id: string }>;
}

/** Single-movie hydrate (authenticated) — avoids exposing TMDB key to client. */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const tmdbId = parseInt(id, 10);
    if (!Number.isFinite(tmdbId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const snapshot = await fetchMovieSnapshot(tmdbId);
    return NextResponse.json({ movie: snapshot });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
