"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeading } from "@/components/layout/PageHeading";
import { createClient } from "@/lib/supabaseClient";
import { getFriends, removeFriendBothSides, searchProfilesByUsername, sendFriendRequest } from "@/lib/friends";
import { toast } from "sonner";

function AvatarCircle(props: { url?: string | null; label: string }) {
  const { url, label } = props;
  return (
    <div className="relative h-11 w-11 overflow-hidden rounded-full border border-[rgba(232,200,106,0.16)] bg-[rgba(8,6,14,0.55)]">
      {url ? (
        // Use <img> so user-provided avatar hosts work without Next/Image allowlisting.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-[12px] font-bold text-[var(--cinema-muted-gold)]">
          {label.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export default function FriendsPage() {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { id: string; username: string; display_name: string | null; avatar_url: string | null }[]
  >([]);
  const [friends, setFriends] = useState<
    { id: string; username: string; display_name: string | null; avatar_url: string | null }[]
  >([]);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    setSelfId(uid ?? null);
    if (!uid) return;
    setLoading(true);
    try {
      setFriends(await getFriends(supabase, uid));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- client fetch after mount */
    void refresh();
  }, [refresh]);

  const onSearch = async () => {
    if (!selfId || query.trim().length < 2) {
      toast.error("Type at least 2 characters");
      return;
    }
    try {
      const rows = await searchProfilesByUsername(supabase, query, selfId);
      setResults(rows);
      if (!rows.length) toast.info("No matching handles — try another search.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    }
  };

  const onRequest = async (username: string) => {
    if (!selfId) return;
    try {
      await sendFriendRequest(supabase, selfId, username);
      toast.success("Invite queued — they'll see it under Invites.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send request");
    }
  };

  const onRemove = async (friendId: string) => {
    if (
      !confirm(
        "Remove this friend from your crew? You can still see old matches; new overlaps won't pair until you're friends again.",
      )
    )
      return;
    try {
      await removeFriendBothSides(supabase, friendId);
      toast.success("Friend removed.");
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    }
  };

  return (
    <div className="space-y-10">
      <PageHeading
        eyebrow="Casting call"
        title="YOUR CREW"
        subtitle="Search by handle to send an invite. When you're friends, your likes line up — that's how double features unlock."
      />

      <div className="panel-ticket p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--cinema-muted-gold)]">
          Find a handle
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Starts with letters — no @ needed"
            autoCapitalize="none"
            autoCorrect="off"
            className="field-cinema min-h-[52px] flex-1"
          />
          <button
            type="button"
            onClick={() => void onSearch()}
            className="btn-spotlight min-h-[52px] shrink-0 px-8 py-4 text-[15px] sm:w-auto sm:py-3"
          >
            Search
          </button>
        </div>
        {results.length > 0 ? (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {results.map((r) => (
              <li key={r.id} className="panel-ticket flex items-center gap-4 p-4">
                <AvatarCircle url={r.avatar_url} label={r.username} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">@{r.username}</p>
                  <p className="truncate text-[13px] text-slate-500">{r.display_name ?? "—"}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void onRequest(r.username)}
                  className="min-h-[44px] rounded-xl border border-[var(--cinema-teal)]/40 px-5 text-[13px] font-bold text-[var(--cinema-teal)] active:bg-[var(--cinema-teal-dim)]"
                >
                  Invite
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Friends seated</h2>
          <Link
            href="/settings"
            className="text-[12px] font-semibold text-[var(--cinema-muted-gold)] hover:underline underline-offset-4"
          >
            Set avatar →
          </Link>
        </div>
        {loading ? (
          <p className="mt-6 text-slate-500">Rolling credits…</p>
        ) : friends.length === 0 ? (
          <p className="panel-ticket-dashed mt-4 p-8 text-center text-[15px] text-slate-400">
            No friends yet. Search above and tap <strong className="text-slate-200">Invite</strong>.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((f) => (
              <li key={f.id} className="panel-ticket p-5">
                <div className="flex items-start gap-4">
                  <AvatarCircle url={f.avatar_url} label={f.username} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">{f.display_name ?? f.username}</p>
                    <p className="mt-0.5 text-[13px] text-slate-500">@{f.username}</p>
                    <p className="mt-3 text-[12px] text-slate-400">
                      When you both hit <span className="font-semibold text-slate-200">Love it</span>, it lands in Double features.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link
                    href={`/matches?friend=${encodeURIComponent(f.id)}`}
                    className="text-[12px] font-semibold text-[var(--cinema-muted-gold)] hover:underline underline-offset-4"
                  >
                    View overlaps →
                  </Link>
                  <button
                    type="button"
                    onClick={() => void onRemove(f.id)}
                    className="min-h-[40px] rounded-xl border border-[rgba(180,74,92,0.35)] bg-[rgba(40,14,22,0.22)] px-4 text-[12px] font-semibold text-rose-200 hover:bg-[rgba(40,14,22,0.35)]"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/requests"
        className="flex min-h-[52px] items-center justify-center rounded-2xl border border-[rgba(232,200,106,0.2)] px-6 text-[15px] font-semibold text-[var(--cinema-muted-gold)] transition-colors hover:bg-[rgba(232,200,106,0.06)] active:bg-[rgba(232,200,106,0.1)]"
      >
        Open invite inbox →
      </Link>
    </div>
  );
}
