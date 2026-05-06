"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeading } from "@/components/layout/PageHeading";
import { createClient } from "@/lib/supabaseClient";
import { fetchMatchesEnriched, upsertMatchUserState } from "@/lib/matches";
import type { MatchWithFriend } from "@/lib/types";
import { toast } from "sonner";

function groupByKey(rows: MatchWithFriend[]) {
  const map = new Map<string, MatchWithFriend[]>();
  for (const r of rows) {
    const key = `${r.media_type}:${r.tmdb_movie_id}`;
    const bucket = map.get(key) ?? [];
    bucket.push(r);
    map.set(key, bucket);
  }
  return [...map.entries()];
}

export function WatchedReel() {
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [rows, setRows] = useState<MatchWithFriend[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    setMe(uid ?? null);
    if (!uid) return;
    setLoading(true);
    try {
      const all = await fetchMatchesEnriched({ supabase, userId: uid, sort: "recent" });
      setRows(all.filter((m) => m.watched));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load watched");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- client fetch after mount */
    void load();
  }, [load]);

  const grouped = useMemo(() => groupByKey(rows), [rows]);

  const setRating = async (matchId: string, rating: number | null) => {
    if (!me) return;
    try {
      await upsertMatchUserState(supabase, me, matchId, { user_rating: rating });
      toast.success(rating ? `Rated ${rating}/10` : "Rating cleared");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save rating");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="After credits"
        title="WATCHED REEL"
        subtitle="Everything you marked watched — leave your score so future movie nights hit harder."
      />

      {loading ? (
        <p className="py-10 text-center text-[15px] text-slate-500">Rolling credits…</p>
      ) : grouped.length === 0 ? (
        <div className="panel-ticket-dashed p-10 text-center text-slate-400">
          Nothing watched yet. Mark a match as watched in Double features.
        </div>
      ) : (
        <ul className="space-y-6 pb-8">
          {grouped.map(([k, bucket]) => {
            const snap = bucket[0].movie_snapshot;
            const poster = snap.posterUrl;
            return (
              <li key={k} className="panel-ticket overflow-hidden p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative mx-auto aspect-[2/3] w-full max-w-[220px] sm:max-w-[180px]">
                    {poster ? (
                      <Image src={poster} alt="" fill draggable={false} className="object-cover" sizes="220px" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[#12101f] text-slate-700">Poster</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-4 p-6">
                    <div>
                      <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-[0.04em] text-white">
                        {snap.title}
                      </h2>
                      <p className="mt-2 text-[12px] text-[var(--cinema-muted-gold)]">
                        {snap.releaseYear || "—"} · {Array.isArray(snap.genres) ? snap.genres.join(" · ") : ""}
                      </p>
                    </div>

                    <div className="space-y-3 rounded-xl border border-[rgba(148,134,170,0.12)] bg-[rgba(8,7,14,0.55)] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                        Your rating
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const val = i + 1;
                          const active = (bucket[0].user_rating ?? 0) >= val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => void setRating(bucket[0].id, val)}
                              className={`min-h-[40px] min-w-[40px] rounded-lg text-[13px] font-bold ${
                                active
                                  ? "bg-[var(--cinema-teal)] text-[#061013]"
                                  : "border border-[rgba(148,134,170,0.18)] text-slate-300"
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => void setRating(bucket[0].id, null)}
                          className="min-h-[40px] rounded-lg border border-[rgba(180,74,92,0.35)] px-3 text-[12px] font-semibold text-rose-200"
                        >
                          Clear
                        </button>
                      </div>
                      <p className="text-[12px] text-slate-500">
                        Tip: ratings save per match row (per friend). Your score won’t change theirs.
                      </p>
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

