import type { MatchRowDb, MatchWithFriend, MatchesSort, MovieSnapshot, Profile } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type ProfileMini = Pick<Profile, "id" | "username" | "display_name">;

function friendForRow(row: MatchRowDb, userId: string): string | null {
  if (row.user_a_id === userId) return row.user_b_id;
  if (row.user_b_id === userId) return row.user_a_id;
  return null;
}

/** All matches involving the current user, joined with friend's profile + per-user flags. */
export async function fetchMatchesEnriched(params: {
  supabase: SupabaseClient;
  userId: string;
  friendFilterId?: string | null;
  titleSearch?: string;
  genre?: string | null;
  sort: MatchesSort;
}): Promise<MatchWithFriend[]> {
  const { supabase, userId, friendFilterId, titleSearch, genre, sort } = params;

  const q = supabase
    .from("matches")
    .select("id, user_a_id, user_b_id, media_type, tmdb_movie_id, movie_snapshot, created_at")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  const { data: rowsRaw, error } = await q;
  if (error) throw error;

  const rows = (rowsRaw ?? []) as MatchRowDb[];

  /** Collect friend IDs */
  const friendIds = [...new Set(rows.map((r) => friendForRow(r, userId)).filter(Boolean) as string[])];

  const { data: profiles } = friendIds.length
    ? await supabase.from("profiles").select("id, username, display_name").in("id", friendIds)
    : { data: [] as ProfileMini[] };

  const profilesById = Object.fromEntries((profiles ?? []).map((p: ProfileMini) => [p.id, p]));

  const matchIds = rows.map((r) => r.id);
  const { data: states } = matchIds.length
    ? await supabase
        .from("match_user_state")
        .select("match_id, in_watchlist, watched")
        .eq("user_id", userId)
        .in("match_id", matchIds)
    : { data: [] as { match_id: string; in_watchlist: boolean; watched: boolean }[] };

  const stateByMatch = Object.fromEntries((states ?? []).map((s) => [s.match_id, s]));

  let out: MatchWithFriend[] = rows.map((row) => {
    const fid = friendForRow(row, userId)!;
    const p = profilesById[fid];
    const msAny = row.movie_snapshot as unknown as Partial<MovieSnapshot> | null | undefined;
    // Normalize malformed legacy rows so the client UI never crashes on missing fields.
    const ms: MovieSnapshot = {
      tmdb_movie_id: typeof msAny?.tmdb_movie_id === "number" ? msAny.tmdb_movie_id : row.tmdb_movie_id,
      media_type: row.media_type,
      title: typeof msAny?.title === "string" ? msAny.title : "",
      releaseYear: typeof msAny?.releaseYear === "number" ? msAny.releaseYear : 0,
      genres: Array.isArray(msAny?.genres) ? (msAny!.genres.filter((g) => typeof g === "string") as string[]) : [],
      original_language: typeof msAny?.original_language === "string" ? msAny.original_language : undefined,
      originCountries: Array.isArray(msAny?.originCountries)
        ? (msAny!.originCountries.filter((c) => typeof c === "string") as string[])
        : [],
      languageLabel: typeof msAny?.languageLabel === "string" ? msAny.languageLabel : "",
      runtimeMinutes: typeof msAny?.runtimeMinutes === "number" ? msAny.runtimeMinutes : null,
      rating: typeof msAny?.rating === "number" ? msAny.rating : 0,
      overview: typeof msAny?.overview === "string" ? msAny.overview : "",
      director: typeof msAny?.director === "string" ? msAny.director : "",
      actors: Array.isArray(msAny?.actors) ? (msAny!.actors.filter((a) => typeof a === "string") as string[]) : [],
      posterUrl: typeof msAny?.posterUrl === "string" ? msAny.posterUrl : null,
    };
    const st = stateByMatch[row.id];

    return {
      ...row,
      movie_snapshot: ms,
      friendId: fid,
      friendUsername: p?.username ?? null,
      friendDisplayName: p?.display_name ?? null,
      in_watchlist: st?.in_watchlist ?? false,
      watched: st?.watched ?? false,
    };
  });

  if (friendFilterId) {
    out = out.filter((m) => m.friendId === friendFilterId);
  }

  if (titleSearch?.trim()) {
    const lower = titleSearch.trim().toLowerCase();
    out = out.filter((m) => (m.movie_snapshot.title ?? "").toLowerCase().includes(lower));
  }

  if (genre) {
    out = out.filter((m) =>
      (m.movie_snapshot.genres ?? []).some((g) => String(g).toLowerCase() === genre.toLowerCase()),
    );
  }

  switch (sort) {
    case "rating":
      out.sort((a, b) => b.movie_snapshot.rating - a.movie_snapshot.rating);
      break;
    case "year":
      out.sort((a, b) => b.movie_snapshot.releaseYear - a.movie_snapshot.releaseYear);
      break;
    default:
      out.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return out;
}

/** Group matches where same TMDB movie appears with multiple friends (UI can show badges). */
export function groupMatchesByMovie(rows: MatchWithFriend[]): Record<number, MatchWithFriend[]> {
  const acc: Record<number, MatchWithFriend[]> = {};
  for (const r of rows) {
    if (!acc[r.tmdb_movie_id]) acc[r.tmdb_movie_id] = [];
    acc[r.tmdb_movie_id].push(r);
  }
  return acc;
}

export async function upsertMatchUserState(
  supabase: SupabaseClient,
  userId: string,
  matchId: string,
  patch: { in_watchlist?: boolean; watched?: boolean },
) {
  const { error } = await supabase.from("match_user_state").upsert(
    {
      user_id: userId,
      match_id: matchId,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,match_id" },
  );
  if (error) throw error;
}
