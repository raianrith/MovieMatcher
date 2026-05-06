import { NextResponse } from "next/server";
import { discoverPopularIds, fetchMovieSnapshot } from "@/lib/tmdb";
import { getSwipedTmdbIds } from "@/lib/swipes";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CinemaFilter } from "@/lib/types";

function mapCinemaToDiscover(c: CinemaFilter | null) {
  switch (c) {
    case "hollywood":
      return { originCountry: "US" };
    case "india":
      return { originCountry: "IN" };
    case "bollywood":
      return { originCountry: "IN", originalLanguage: "hi" };
    case "tamil":
      return { originCountry: "IN", originalLanguage: "ta" };
    case "telugu":
      return { originCountry: "IN", originalLanguage: "te" };
    case "malayalam":
      return { originCountry: "IN", originalLanguage: "ml" };
    case "kannada":
      return { originCountry: "IN", originalLanguage: "kn" };
    case "bengali":
      return { originCountry: "IN", originalLanguage: "bn" };
    default:
      return {};
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const u = new URL(req.url);
    const cinema = (u.searchParams.get("cinema") as CinemaFilter | null) ?? null;

    const swiped = new Set(await getSwipedTmdbIds(supabase, user.id));
    const ids = await discoverPopularIds({
      excludeIds: swiped,
      want: 20,
      ...mapCinemaToDiscover(cinema),
    });

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
