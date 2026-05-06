"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MatchesSort, MatchWithFriend } from "@/lib/types";
import { createClient } from "@/lib/supabaseClient";
import { getFriends } from "@/lib/friends";
import { fetchMatchesEnriched, upsertMatchUserState } from "@/lib/matches";
import { toast } from "sonner";

function groupByMovie(rows: MatchWithFriend[]) {
  const map = new Map<number, MatchWithFriend[]>();
  for (const r of rows) {
    const bucket = map.get(r.tmdb_movie_id) ?? [];
    bucket.push(r);
    map.set(r.tmdb_movie_id, bucket);
  }
  return [...map.entries()].sort(([a], [b]) => a - b);
}

export function MatchesExplorer() {
  const supabase = createClient();
  const [rows, setRows] = useState<MatchWithFriend[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [friendFilter, setFriendFilter] = useState<string>("");
  const [titleSearch, setTitleSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [sort, setSort] = useState<MatchesSort>("recent");
  const [buddyList, setBuddyList] = useState<Array<{ id: string; username: string }>>([]);

  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      const uid = (await supabase.auth.getUser()).data.user?.id;
      if (!uid || ac.signal.aborted) return;
      try {
        const buds = await getFriends(supabase, uid);
        if (ac.signal.aborted) return;
        queueMicrotask(() =>
          setBuddyList((buds ?? []).map((p: { id: string; username: string }) => ({ id: p.id, username: p.username }))),
        );
      } catch {
        /* optional */
      }
    })();
    return () => ac.abort();
  }, [supabase]);

  const load = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    setMe(uid ?? null);
    if (!uid) return;
    setLoading(true);
    try {
      const data = await fetchMatchesEnriched({
        supabase,
        userId: uid,
        friendFilterId: friendFilter || undefined,
        titleSearch,
        genre: genreFilter || undefined,
        sort,
      });
      setRows(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load matches");
    } finally {
      setLoading(false);
    }
  }, [supabase, friendFilter, titleSearch, genreFilter, sort]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- client fetch after mount */
    void load();
  }, [load]);

  const friendOptions = useMemo(() => {
    const buddies = new Map<string, string>();
    for (const b of buddyList) buddies.set(b.id, `@${b.username}`);
    for (const r of rows) buddies.set(r.friendId, r.friendUsername ? `@${r.friendUsername}` : r.friendId);
    return [...buddies.entries()];
  }, [rows, buddyList]);

  const genreOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) r.movie_snapshot.genres.forEach((g) => set.add(g));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const grouped = groupByMovie(rows);

  const toggleWatch = async (matchId: string, nextVal: boolean) => {
    if (!me) return;
    try {
      await upsertMatchUserState(supabase, me, matchId, { in_watchlist: nextVal });
      toast.success(nextVal ? "Saved to watchlist" : "Removed from watchlist");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  const toggleWatched = async (matchId: string, nextVal: boolean) => {
    if (!me) return;
    try {
      await upsertMatchUserState(supabase, me, matchId, { watched: nextVal });
      toast.success(nextVal ? "Marked watched" : "Marked unwatched");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Mutual picks</h2>
        <p className="text-sm text-slate-500">
          Every flick where you and friends both hit like — filter by teammate or genre whenever you&apos;re narrowing
          it down for movie night.
        </p>
      </div>

      <div className="grid gap-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs uppercase text-slate-500">
            Friend
            <select
              value={friendFilter}
              onChange={(e) => setFriendFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-[#070b14] px-3 py-2 text-sm capitalize text-white"
            >
              <option value="">Everyone</option>
              {friendOptions.map(([fid, label]) => (
                <option key={fid} value={fid}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase text-slate-500">
            Search title
            <input
              value={titleSearch}
              onChange={(e) => setTitleSearch(e.target.value)}
              className="rounded-xl border border-slate-700 bg-[#070b14] px-3 py-2 text-sm text-white"
              placeholder="e.g. Dune"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase text-slate-500">
            Genre
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-[#070b14] px-3 py-2 text-sm text-white"
            >
              <option value="">All</option>
              {genreOptions.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase text-slate-500">
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as MatchesSort)}
              className="rounded-xl border border-slate-700 bg-[#070b14] px-3 py-2 text-sm text-white"
            >
              <option value="recent">Recently matched</option>
              <option value="rating">TMDB rating</option>
              <option value="year">Release year</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-slate-500">Syncing overlaps…</p>
      ) : grouped.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
          Zero overlaps yet · keep crushing that swipe rail with your crew 👊
        </div>
      ) : (
        <ul className="space-y-6">
          {grouped.map(([tmdbId, bucket]) => {
            const snapshot = bucket[0].movie_snapshot;
            const poster = snapshot.posterUrl;
            return (
              <li
                key={tmdbId}
                className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative mx-auto aspect-[2/3] w-full max-w-[240px] sm:max-w-[200px]">
                    {poster ? (
                      <Image src={poster} alt="" fill className="object-cover" sizes="240px" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-900 text-slate-700">
                        Poster
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-3 p-5">
                    <div>
                      <h3 className="text-xl font-bold text-white">{snapshot.title}</h3>
                      <p className="text-xs text-slate-400">
                        {snapshot.releaseYear || "—"} · {snapshot.genres.join(", ")}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {snapshot.languageLabel} · {snapshot.runtimeMinutes ? `${snapshot.runtimeMinutes} min` : "?"}{" "}
                        · ★ {snapshot.rating}
                      </p>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">{snapshot.overview}</p>
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-400">Director</span> {snapshot.director}
                    </p>
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-400">Cast</span> {snapshot.actors.join(", ")}
                    </p>

                    <div className="space-y-4 border-t border-slate-900 pt-4">
                      <p className="text-xs font-bold uppercase text-slate-500">
                        Matches with teammates ({bucket.length})
                      </p>
                      <ul className="space-y-3">
                        {bucket.map((m) => (
                          <li key={m.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded-full bg-cyan-950/70 px-3 py-1 text-xs font-semibold text-cyan-200">
                                @{m.friendUsername ?? "?"} matched
                              </span>
                              <span className="text-xs text-slate-600">
                                {new Date(m.created_at).toLocaleDateString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => void toggleWatch(m.id, !m.in_watchlist)}
                                className={`rounded-xl px-4 py-2 text-xs font-bold ${
                                  m.in_watchlist
                                    ? "bg-amber-500 text-slate-950"
                                    : "border border-amber-500/50 text-amber-200"
                                }`}
                              >
                                {m.in_watchlist ? "★ watchlisted" : "Add to watchlist"}
                              </button>
                              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-300">
                                <input
                                  type="checkbox"
                                  checked={m.watched}
                                  onChange={(e) => void toggleWatched(m.id, e.target.checked)}
                                />
                                Watched it
                              </label>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
