"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeading } from "@/components/layout/PageHeading";
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

const selectClass = "field-cinema block w-full min-h-[48px] py-2.5 text-[15px] text-slate-100 bg-[rgba(5,4,10,0.9)]";

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  try {
    // `timeStyle` is not valid for `toLocaleDateString` — use `toLocaleString`.
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return d.toISOString();
  }
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
    for (const r of rows) {
      const genres = Array.isArray(r.movie_snapshot?.genres) ? r.movie_snapshot.genres : [];
      for (const g of genres) {
        if (typeof g === "string") set.add(g);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const grouped = groupByMovie(rows);

  const toggleWatch = async (matchId: string, nextVal: boolean) => {
    if (!me) return;
    try {
      await upsertMatchUserState(supabase, me, matchId, { in_watchlist: nextVal });
      toast.success(nextVal ? "Pinned to queue" : "Removed from queue");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  const toggleWatched = async (matchId: string, nextVal: boolean) => {
    if (!me) return;
    try {
      await upsertMatchUserState(supabase, me, matchId, { watched: nextVal });
      toast.success(nextVal ? "Marked as watched" : "Back on the list");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  const filterGrid = (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--cinema-muted-gold)] opacity-95">
        Co-star
        <select value={friendFilter} onChange={(e) => setFriendFilter(e.target.value)} className={selectClass}>
          <option value="">Whole crew</option>
          {friendOptions.map(([fid, label]) => (
            <option key={fid} value={fid}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--cinema-muted-gold)] opacity-95">
        Title search
        <input
          value={titleSearch}
          onChange={(e) => setTitleSearch(e.target.value)}
          className="field-cinema min-h-[48px]"
          placeholder="e.g. Dune"
          enterKeyHint="search"
        />
      </label>
      <label className="flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--cinema-muted-gold)] opacity-95">
        Genre lens
        <select value={genreFilter} onChange={(e) => setGenreFilter(e.target.value)} className={selectClass}>
          <option value="">All genres</option>
          {genreOptions.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--cinema-muted-gold)] opacity-95">
        Sort cues
        <select value={sort} onChange={(e) => setSort(e.target.value as MatchesSort)} className={selectClass}>
          <option value="recent">Newest match</option>
          <option value="rating">TMDB score</option>
          <option value="year">Release year</option>
        </select>
      </label>
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Shared spotlight"
        title="DOUBLE FEATURES"
        subtitle="Every film where you and a friend both swiped love. Filter to plan date night, then track what you’ve actually watched."
      />

      <details className="panel-ticket group p-5 md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-white [&::-webkit-details-marker]:hidden">
          <span>Refine the queue</span>
          <span className="text-[var(--cinema-muted-gold)] transition group-open:rotate-180">▼</span>
        </summary>
        <div className="mt-5 border-t border-[rgba(232,200,106,0.08)] pt-5">{filterGrid}</div>
      </details>

      <div className="panel-ticket hidden p-6 md:block">{filterGrid}</div>

      {loading ? (
        <p className="py-10 text-center text-[15px] text-slate-500">Sweeping aisle…</p>
      ) : grouped.length === 0 ? (
        <div className="panel-ticket-dashed p-10 text-center">
          <p className="font-[family-name:var(--font-display)] text-xl tracking-[0.08em] text-white">HOUSE LIGHTS UP</p>
          <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-slate-400">
            No shared likes yet — keep swiping with friends; when you match on a movie, it premieres here.
          </p>
        </div>
      ) : (
        <ul className="space-y-8 pb-8">
          {grouped.map(([tmdbId, bucket]) => {
            const snapshot = bucket[0].movie_snapshot;
            const poster = snapshot.posterUrl;
            return (
              <li
                key={tmdbId}
                className="overflow-hidden rounded-[1.25rem] border border-[rgba(232,200,106,0.14)] bg-gradient-to-b from-[#1c1828]/92 to-[#0e0c16]/94 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative mx-auto aspect-[2/3] w-full max-w-[min(260px,calc(100vw-8rem))] shrink-0 sm:max-w-[220px] sm:self-stretch">
                    {poster ? (
                      <Image
                        src={poster}
                        alt=""
                        fill
                        draggable={false}
                        className="object-cover sm:rounded-l-xl"
                        sizes="(max-width: 640px) 85vw, 220px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[#12101f] text-slate-700">Poster</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-4 p-5 sm:py-6 sm:pl-8">
                    <div>
                      <h2 className="font-[family-name:var(--font-display)] text-2xl leading-tight tracking-[0.04em] text-white sm:text-[1.75rem]">
                        {snapshot.title}
                      </h2>
                      <p className="mt-2 text-[12px] text-[var(--cinema-muted-gold)]">
                        {snapshot.releaseYear || "—"} ·{" "}
                        {Array.isArray(snapshot.genres) ? snapshot.genres.join(" · ") : ""}
                      </p>
                      <p className="mt-2 text-[12px] text-slate-500">
                        {snapshot.languageLabel} · {snapshot.runtimeMinutes ? `${snapshot.runtimeMinutes} min` : "?"}{" "}
                        · ★ {snapshot.rating}
                      </p>
                    </div>
                    <p className="text-[15px] leading-relaxed text-slate-300">{snapshot.overview}</p>
                    <p className="text-[12px] text-slate-500">
                      <span className="font-semibold text-slate-400">Director</span> {snapshot.director}
                    </p>
                    <p className="text-[12px] text-slate-500">
                      <span className="font-semibold text-slate-400">Cast</span>{" "}
                      {Array.isArray(snapshot.actors) ? snapshot.actors.join(", ") : ""}
                    </p>

                    <div className="space-y-4 border-t border-[rgba(148,134,170,0.12)] pt-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Matches on this film ({bucket.length})
                      </p>
                      <ul className="space-y-3">
                        {bucket.map((m) => (
                          <li
                            key={m.id}
                            className="rounded-xl border border-[rgba(148,134,170,0.12)] bg-[rgba(8,7,14,0.55)] p-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-[var(--cinema-teal-dim)] px-3 py-1.5 text-[12px] font-bold text-[var(--cinema-teal)]">
                                @{m.friendUsername ?? "?"}
                              </span>
                              <span className="text-[12px] text-slate-600">
                                {formatDateTime(m.created_at)}
                              </span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={() => void toggleWatch(m.id, !m.in_watchlist)}
                                className={`min-h-[44px] rounded-xl px-5 text-[12px] font-bold ${
                                  m.in_watchlist
                                    ? "bg-[var(--cinema-muted-gold)] text-[#0a0810]"
                                    : "border border-[rgba(232,200,106,0.35)] text-[var(--cinema-muted-gold)]"
                                }`}
                              >
                                {m.in_watchlist ? "In watch queue" : "Queue for later"}
                              </button>
                              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-[13px] font-semibold text-slate-300">
                                <input
                                  type="checkbox"
                                  className="h-5 w-5 rounded border-slate-600 accent-[var(--cinema-teal)]"
                                  checked={m.watched}
                                  onChange={(e) => void toggleWatched(m.id, e.target.checked)}
                                />
                                Watched together
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
