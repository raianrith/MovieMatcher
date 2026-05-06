import { NextResponse } from "next/server";
import { discoverPopularIds, fetchMovieSnapshot } from "@/lib/tmdb";
import { getSwipedTmdbIds } from "@/lib/swipes";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const swiped = new Set(await getSwipedTmdbIds(supabase, user.id));
    const ids = await discoverPopularIds({ excludeIds: swiped, want: 20 });

    const snapshots = await Promise.all(ids.map((id) => fetchMovieSnapshot(id)));

    return NextResponse.json({ movies: snapshots });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load movies" },
      { status: 500 },
    );
  }
}
