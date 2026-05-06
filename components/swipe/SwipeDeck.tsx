"use client";

import Image from "next/image";
import { useDrag } from "@use-gesture/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MovieSnapshot, SwipeActionDb } from "@/lib/types";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabaseClient";
import { recordSwipe } from "@/lib/swipes";
import { toast } from "sonner";

const labels: Record<SwipeActionDb, string> = {
  liked: "Liked!",
  disliked: "Passed",
  skipped: "Skipped",
};

function mapGestureToAction(mx: number, last: boolean): SwipeActionDb | null {
  if (!last) return null;
  if (mx >= 90) return "liked";
  if (mx <= -90) return "disliked";
  return null;
}

export function SwipeDeck() {
  const [movies, setMovies] = useState<MovieSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIdx, setBusyIdx] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }) => queueMicrotask(() => setUserId(data.user?.id ?? null)));
  }, []);

  const loadMore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/movies/feed");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load movies");
      setMovies(json.movies ?? []);
      setBusyIdx(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading feed");
      toast.error("Could not refresh movie feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- client fetch after mount */
    void loadMore();
  }, [loadMore]);

  const movie = movies[busyIdx];

  const onDecision = async (action: SwipeActionDb, snapshot?: MovieSnapshot) => {
    const snap = snapshot ?? movies[busyIdx];
    const uidLocal = userId ?? (await createClient().auth.getUser()).data.user?.id;
    if (!snap || !uidLocal) return;

    try {
      const client = createClient();
      await recordSwipe({ supabase: client, userId: uidLocal, action, snapshot: snap });
      toast.message(labels[action], { duration: 2000 });

      const nextIdx = busyIdx + 1;
      if (nextIdx >= movies.length) {
        setBusyIdx(0);
        setMovies([]);
        toast.info("Refreshing your discovery queue...");
        await loadMore();
      } else {
        setBusyIdx(nextIdx);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Swipe failed — try again.";
      toast.error(msg);
      if (String(msg).includes("duplicate") || String(msg).includes("23505")) {
        setBusyIdx((i) => i + 1);
      }
    }
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const bind = useDrag(
    ({ movement: [mx], last, dragging }) => {
      const el = cardRef.current;
      if (!el || !movie) return;
      if (dragging) {
        el.style.translate = `${mx}px 0`;
        el.style.opacity = `${1 - Math.min(Math.abs(mx) / 400, 0.15)}`;
        return;
      }
      if (!last) return;
      const choice = mapGestureToAction(mx, true);
      if (choice === "liked") void onDecision("liked");
      else if (choice === "disliked") void onDecision("disliked");
      el.style.transition = "opacity .15s ease, translate .18s ease";
      el.style.translate = "0";
      el.style.opacity = "1";
      window.setTimeout(() => {
        el.style.transition = "";
      }, 220);
    },
    { axis: "x", filterTaps: true, pointer: { touch: true } },
  );

  if (loading && !movies.length) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
          <p className="mt-4 text-sm">Loading discoveries from TMDB…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-950/30 p-6 text-center text-red-200">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => void loadMore()}
          className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-300">
        Nothing left in this wave. Refresh to pull more picks.
        <button
          type="button"
          onClick={() => void loadMore()}
          className="mt-6 w-full rounded-2xl bg-cyan-500 py-4 font-semibold text-slate-950"
        >
          Load more titles
        </button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col pb-28">
      <div
        {...bind()}
        ref={cardRef}
        key={movie.tmdb_movie_id}
        className="touch-none rounded-3xl border border-slate-800 bg-slate-950/70 shadow-xl will-change-transform"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-t-3xl bg-slate-900">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              priority
              unoptimized={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-600">No poster</div>
          )}
        </div>
        <div className="space-y-2 p-4">
          <h2 className="text-xl font-bold text-white">{movie.title}</h2>
          <p className="text-xs text-slate-400">
            {movie.releaseYear || "—"} · {movie.genres.join(", ")} · {movie.languageLabel} ·{" "}
            {movie.runtimeMinutes ? `${movie.runtimeMinutes} min` : "? min"} · ★ {movie.rating}
          </p>
          <p className="text-sm leading-relaxed text-slate-300">{movie.overview}</p>
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Director</span> {movie.director}
          </p>
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Cast</span> {movie.actors.join(", ")}
          </p>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-600">Swipe right · like · left · pass — or use buttons.</p>

      <div className={cn("pointer-events-none fixed bottom-28 left-0 right-0 z-10 md:pointer-events-auto md:relative md:bottom-auto md:z-0 md:mt-6 md:flex md:justify-center")}>
        <div className="pointer-events-auto mx-auto flex max-w-md gap-3 px-4">
          <button
            type="button"
            onClick={() => void onDecision("disliked")}
            className="flex-1 rounded-2xl border border-slate-700 py-4 text-sm font-semibold text-slate-300"
          >
            Dislike
          </button>
          <button
            type="button"
            onClick={() => void onDecision("skipped")}
            className="flex-1 rounded-2xl border border-slate-700 py-4 text-sm font-semibold text-slate-400"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => void onDecision("liked")}
            className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-500 py-4 text-sm font-bold text-slate-950 shadow-lg"
          >
            Like
          </button>
        </div>
      </div>
    </div>
  );
}
