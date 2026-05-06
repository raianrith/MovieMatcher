"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeading } from "@/components/layout/PageHeading";
import { createClient } from "@/lib/supabaseClient";
import { getFriends, removeFriendBothSides, searchProfilesByUsername, sendFriendRequest } from "@/lib/friends";
import { toast } from "sonner";

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
          <ul className="mt-6 divide-y divide-[rgba(148,134,170,0.12)] rounded-xl border border-[rgba(148,134,170,0.1)] bg-[rgba(5,4,10,0.45)]">
            {results.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-4 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">@{r.username}</p>
                  <p className="truncate text-[13px] text-slate-500">{r.display_name}</p>
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
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Friends seated</h2>
        {loading ? (
          <p className="mt-6 text-slate-500">Rolling credits…</p>
        ) : friends.length === 0 ? (
          <p className="panel-ticket-dashed mt-4 p-8 text-center text-[15px] text-slate-400">
            No friends yet. Search above and tap <strong className="text-slate-200">Invite</strong>.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[rgba(148,134,170,0.08)] overflow-hidden rounded-2xl border border-[rgba(232,200,106,0.12)] bg-[rgba(18,14,26,0.55)]">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center gap-4 px-4 py-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{f.display_name ?? f.username}</p>
                  <p className="text-[13px] text-slate-500">@{f.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void onRemove(f.id)}
                  className="min-h-[44px] shrink-0 text-[13px] font-semibold text-rose-300 underline-offset-2 hover:underline"
                >
                  Remove
                </button>
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
