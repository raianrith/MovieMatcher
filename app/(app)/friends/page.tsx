"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
      toast.error("Type at least 2 letters");
      return;
    }
    try {
      const rows = await searchProfilesByUsername(supabase, query, selfId);
      setResults(rows);
      if (!rows.length) toast.info("No handles matched — try another search.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    }
  };

  const onRequest = async (username: string) => {
    if (!selfId) return;
    try {
      await sendFriendRequest(supabase, selfId, username);
      toast.success("Friend request sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send request");
    }
  };

  const onRemove = async (friendId: string) => {
    if (!confirm("Remove this friend? Your shared match history stays, but pairing future likes stops."))
      return;
    try {
      await removeFriendBothSides(supabase, friendId);
      toast.success("Friend removed · links cleared");
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Remove failed");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Friends</h2>
        <p className="text-sm text-slate-500">
          Discover people via handle · pairing unlocks overlapping likes.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Search by username</p>
        <div className="mt-3 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="@handle · no spaces"
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-[#070b14] px-4 py-3 text-slate-100 outline-none ring-cyan-500/35 focus:ring-2"
          />
          <button
            type="button"
            onClick={() => void onSearch()}
            className="shrink-0 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950"
          >
            Search
          </button>
        </div>
        {results.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-800">
            {results.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">@{r.username}</p>
                  <p className="truncate text-xs text-slate-500">{r.display_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void onRequest(r.username)}
                  className="rounded-lg border border-cyan-400/40 px-3 py-2 text-xs font-semibold text-cyan-300"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your friends</h3>
        {loading ? (
          <p className="mt-4 text-slate-500">Loading…</p>
        ) : friends.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
            No friends yet. Send a few requests from search!
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-900 rounded-3xl border border-slate-800 bg-slate-950/60">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center gap-4 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{f.display_name ?? f.username}</p>
                  <p className="text-xs text-slate-500">@{f.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void onRemove(f.id)}
                  className="text-xs font-semibold text-rose-400"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/requests" className="block text-center text-sm font-semibold text-cyan-400">
        Open friend requests →
      </Link>
    </div>
  );
}
