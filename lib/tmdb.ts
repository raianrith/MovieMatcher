/**
 * TMDB helpers — SERVER ONLY (`TMDB_API_KEY` must not leak to client).
 */

import type { MovieSnapshot } from "@/lib/types";

const TMDB_BASE = "https://api.themoviedb.org/3";

function key(): string {
  const k = process.env.TMDB_API_KEY;
  if (!k) throw new Error("TMDB_API_KEY is not set");
  return k;
}

export async function tmdbGet(path: string, params?: Record<string, string>) {
  const u = new URL(`${TMDB_BASE}${path}`);
  u.searchParams.set("api_key", key());
  if (params) {
    Object.entries(params).forEach(([a, v]) => u.searchParams.set(a, v));
  }
  const res = await fetch(u.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
  return res.json() as Promise<unknown>;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbMovieDetail {
  id: number;
  title: string;
  overview: string;
  runtime: number | null;
  vote_average: number;
  genres: { name: string }[];
  poster_path: string | null;
  release_date?: string;
  original_language?: string;
  spoken_languages?: { english_name?: string; name?: string }[];
  credits?: {
    crew: { job: string; name: string }[];
    cast: { name: string }[];
  };
}

export function posterUrl(path: string | null): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w780${path}`;
}

export async function fetchMovieSnapshot(tmdbId: number): Promise<MovieSnapshot> {
  const data = (await tmdbGet(`/movie/${tmdbId}`, {
    append_to_response: "credits",
  })) as TmdbMovieDetail;

  const directors = data.credits?.crew?.filter((c) => c.job === "Director").map((c) => c.name) ?? [];
  const director = directors[0] ?? "Unknown";
  const actors = data.credits?.cast?.slice(0, 6).map((c) => c.name) ?? [];
  const year = data.release_date ? parseInt(data.release_date.slice(0, 4), 10) : 0;

  const languageLabel =
    data.spoken_languages?.find((l) => l.english_name)?.english_name ??
    data.spoken_languages?.[0]?.name ??
    (data.original_language?.toUpperCase() ?? "");

  const snapshot: MovieSnapshot = {
    tmdb_movie_id: data.id,
    title: data.title,
    releaseYear: Number.isFinite(year) ? year : 0,
    genres: data.genres?.map((g) => g.name) ?? [],
    original_language: data.original_language,
    languageLabel,
    runtimeMinutes: data.runtime,
    rating: Number(data.vote_average.toFixed(1)),
    overview: data.overview,
    director,
    actors,
    posterUrl: posterUrl(data.poster_path),
  };

  return snapshot;
}

interface DiscoverResult {
  id: number;
}

interface DiscoverPayload {
  results: DiscoverResult[];
  total_pages: number;
  page: number;
}

/** Page through discover until budget met or exhausted. */
export async function discoverPopularIds(opts: {
  excludeIds: Set<number>;
  want: number;
  maxPages?: number;
  startPage?: number;
}): Promise<number[]> {
  const out: number[] = [];
  const maxPages = opts.maxPages ?? 8;
  let page = opts.startPage ?? 1;

  for (; page <= maxPages && out.length < opts.want; page++) {
    const data = (await tmdbGet("/discover/movie", {
      page: String(page),
      sort_by: "popularity.desc",
      vote_count_gte: "80",
      include_adult: "false",
    })) as DiscoverPayload;

    for (const r of data.results) {
      if (opts.excludeIds.has(r.id)) continue;
      if (!out.includes(r.id)) out.push(r.id);
      if (out.length >= opts.want) break;
    }
    if ((data.page ?? 1) >= (data.total_pages ?? 1)) break;
  }

  return out.slice(0, opts.want);
}
