"use client";

import Image from "next/image";
import { useDrag } from "@use-gesture/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CinemaFilter, ContentKind, MovieSnapshot, SwipeActionDb } from "@/lib/types";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabaseClient";
import { recordSwipe } from "@/lib/swipes";
import { toast } from "sonner";

const labels: Record<SwipeActionDb, string> = {
  liked: "Added to your likes!",
  disliked: "Not this time",
  skipped: "Skipped",
};

const SWIPE_DIST = 64;
const SWIPE_VEL = 0.22;

function mapGestureToAction(mx: number, dx: number, v: number, last: boolean): SwipeActionDb | null {
  if (!last) return null;
  // `velocity` is a magnitude per-axis; use `direction` for sign.
  if (mx >= SWIPE_DIST || (dx > 0 && v > SWIPE_VEL)) return "liked";
  if (mx <= -SWIPE_DIST || (dx < 0 && v > SWIPE_VEL)) return "disliked";
  return null;
}

export function SwipeDeck() {
  const [movies, setMovies] = useState<MovieSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIdx, setBusyIdx] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [cinema, setCinema] = useState<CinemaFilter>("all");
  const [kind, setKind] = useState<ContentKind>("movie");

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }) => queueMicrotask(() => setUserId(data.user?.id ?? null)));
  }, []);

  const loadMore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/movies/feed?cinema=${encodeURIComponent(cinema)}&kind=${encodeURIComponent(kind)}`,
      );
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
  }, [cinema, kind]);

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
        toast.info("Rolling the next reel…");
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
    ({ movement: [mx], direction: [dx], velocity: [vx], last, dragging }) => {
      const el = cardRef.current;
      if (!el || !movie) return;
      if (dragging) {
        el.style.translate = `${mx}px 0`;
        el.style.opacity = `${1 - Math.min(Math.abs(mx) / 400, 0.18)}`;
        return;
      }
      if (!last) return;
      const choice = mapGestureToAction(mx, dx, vx, true);
      if (choice === "liked") {
        el.style.transition = "translate 0.22s ease, opacity 0.22s ease";
        el.style.translate = "min(120vw, 480px) 0";
        el.style.opacity = "0";
        void onDecision("liked").finally(() => {
          if (cardRef.current === el) {
            el.style.transition = "";
            el.style.translate = "0";
            el.style.opacity = "1";
          }
        });
        return;
      }
      if (choice === "disliked") {
        el.style.transition = "translate 0.22s ease, opacity 0.22s ease";
        el.style.translate = "max(-120vw, -480px) 0";
        el.style.opacity = "0";
        void onDecision("disliked").finally(() => {
          if (cardRef.current === el) {
            el.style.transition = "";
            el.style.translate = "0";
            el.style.opacity = "1";
          }
        });
        return;
      }
      el.style.transition = "opacity .15s ease, translate .18s ease";
      el.style.translate = "0";
      el.style.opacity = "1";
      window.setTimeout(() => {
        el.style.transition = "";
      }, 220);
    },
    {
      axis: "x",
      filterTaps: true,
      pointer: { touch: true },
      preventScroll: true,
    },
  );

  if (loading && !movies.length) {
    return (
      <div className="flex min-h-[46vh] items-center justify-center text-slate-400">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-[var(--cinema-teal)] border-t-transparent" />
          <p className="mt-5 text-[15px] text-slate-300">Cueing posters from TMDB…</p>
          <p className="mt-2 text-xs text-slate-600">This is the projector warming up.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-ticket rounded-2xl border-[rgba(180,74,92,0.35)] bg-[rgba(40,14,22,0.45)] p-8 text-center">
        <p className="font-medium text-rose-100">{error}</p>
        <p className="mt-3 text-sm text-rose-200/70">Fix your connection or API key, then try again.</p>
        <button
          type="button"
          onClick={() => void loadMore()}
          className="btn-spotlight mt-6 w-full max-w-xs px-6 py-3.5 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="panel-ticket-dashed p-10 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl tracking-[0.06em] text-white">INTERMISSION</p>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
          No more titles in this batch. Load the next wave of discoveries.
        </p>
        <button
          type="button"
          onClick={() => void loadMore()}
          className="btn-spotlight mt-8 w-full py-4 text-[16px]"
        >
          Load more films
        </button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col pb-[calc(8.5rem+env(safe-area-inset-bottom))] md:pb-10">
      <div className="mb-4 panel-ticket p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--cinema-muted-gold)] opacity-95">
            Filter by type
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as ContentKind)}
              className="field-cinema min-h-[48px] bg-[rgba(5,4,10,0.9)]"
            >
              <option value="movie">Movies</option>
              <option value="tv">TV series</option>
              <option value="anime">Anime</option>
            </select>
          </label>

        <label className="flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--cinema-muted-gold)] opacity-95">
          Filter by Region
          <select
            value={cinema}
            onChange={(e) => setCinema(e.target.value as CinemaFilter)}
            className="field-cinema min-h-[48px] bg-[rgba(5,4,10,0.9)]"
          >
            <option value="all">All</option>
            <option value="hollywood">Hollywood (US)</option>
            <option value="india">India (all languages)</option>
            <option value="bollywood">Bollywood (Hindi)</option>
            <option value="tamil">Kollywood (Tamil)</option>
            <option value="telugu">Tollywood (Telugu)</option>
            <option value="malayalam">Mollywood (Malayalam)</option>
            <option value="kannada">Sandalwood (Kannada)</option>
            <option value="bengali">Bengali cinema</option>
            <option value="korean">Korean (KR)</option>
          </select>
        </label>
        </div>
      </div>
      <div
        {...bind()}
        ref={cardRef}
        key={movie.tmdb_movie_id}
        className={cn(
          "touch-pan-y select-none overflow-hidden rounded-[1.25rem] border border-[rgba(232,200,106,0.18)]",
          "bg-gradient-to-b from-[#1a1628]/95 to-[#0e0c16]/95 shadow-[0_24px_60px_rgba(0,0,0,0.55)] will-change-transform",
        )}
      >
        <div
          aria-hidden
          className="flex h-2 w-full justify-center gap-1.5 border-b border-[rgba(232,200,106,0.08)] bg-[rgba(0,0,0,0.25)] py-1"
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-[rgba(232,200,106,0.18)]" />
          ))}
        </div>
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0a0810]">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt=""
              fill
              draggable={false}
              className="pointer-events-none object-cover"
              sizes="100vw"
              priority
              unoptimized={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-600">No poster</div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0e0c16] to-transparent" />
        </div>
        <div className="space-y-3 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-[1.75rem] leading-tight tracking-[0.04em] text-white">
            {movie.title}
          </h2>
          <p className="text-xs leading-relaxed text-[var(--cinema-muted-gold)]">
            {movie.releaseYear || "—"} · {movie.genres.join(" · ")} · {movie.languageLabel} ·{" "}
            {movie.runtimeMinutes ? `${movie.runtimeMinutes} min` : "? min"} · ★ {movie.rating}
          </p>
          <p className="text-[15px] leading-relaxed text-slate-300">{movie.overview}</p>
          <p className="text-[12px] text-slate-500">
            <span className="font-semibold text-slate-400">Director</span> {movie.director}
          </p>
          <p className="text-[12px] text-slate-500">
            <span className="font-semibold text-slate-400">Cast</span> {movie.actors.join(", ")}
          </p>
        </div>
      </div>

      <p className="mt-5 text-center text-[12px] leading-relaxed text-slate-500">
        Drag the card · <span className="text-[var(--cinema-teal)]">→ like</span> ·{" "}
        <span className="text-[var(--cinema-ruby)]">← pass</span> — or tap the aisle buttons below.
      </p>

      <div
        className={cn(
          "pointer-events-none fixed left-0 right-0 z-10 px-4",
          "bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:pointer-events-auto md:relative md:bottom-auto md:z-0 md:mt-7 md:flex md:justify-center md:pb-0",
        )}
      >
        <div className="pointer-events-auto mx-auto grid w-full max-w-md grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => void onDecision("disliked")}
            className="min-h-[52px] rounded-2xl border border-[rgba(180,74,92,0.35)] bg-[rgba(40,14,22,0.25)] py-4 text-[13px] font-bold text-rose-100 active:scale-[0.98]"
          >
            Pass
          </button>
          <button
            type="button"
            onClick={() => void onDecision("skipped")}
            className="min-h-[52px] rounded-2xl border border-[rgba(148,134,170,0.28)] bg-[rgba(12,10,20,0.6)] py-4 text-[13px] font-bold text-slate-300 active:scale-[0.98]"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => void onDecision("liked")}
            className="btn-spotlight min-h-[52px] py-4 text-[13px] active:scale-[0.98]"
          >
            Love it
          </button>
        </div>
      </div>
    </div>
  );
}
