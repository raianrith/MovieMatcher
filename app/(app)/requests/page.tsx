"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { getIncomingRequests, getOutgoingRequests, respondToRequest } from "@/lib/friends";
import { toast } from "sonner";

export default function RequestsPage() {
  const supabase = createClient();
  const [incoming, setIncoming] = useState<Array<Record<string, unknown>>>([]);
  const [outgoing, setOutgoing] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    setLoading(true);
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      const [inc, out] = await Promise.all([
        getIncomingRequests(supabase, uid),
        getOutgoingRequests(supabase, uid),
      ]);
      setIncoming(inc as Array<Record<string, unknown>>);
      setOutgoing(out as Array<Record<string, unknown>>);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- client fetch after mount */
    void load();
  }, [load]);

  const act = async (id: string, status: "accepted" | "declined" | "blocked") => {
    try {
      await respondToRequest(supabase, id, status);
      toast.success(
        status === "accepted"
          ? "You are now friends!"
          : status === "blocked"
            ? "Request blocked."
            : "Request declined.",
      );
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  };

  type ProfileLite = { username?: string; display_name?: string | null };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-bold text-white">Friend requests</h2>
        <p className="text-sm text-slate-500">Incoming need your tap · outgoing awaits their response.</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Incoming</h3>
        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : incoming.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
            No pending invites right now 🎉
          </p>
        ) : (
          <ul className="divide-y divide-slate-900 rounded-3xl border border-slate-800 bg-slate-950/60">
            {incoming.map((r) => {
              const p = r.sender as ProfileLite | undefined;
              const id = r.id as string;
              return (
                <li key={id} className="flex flex-wrap items-center gap-3 px-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{p?.display_name ?? p?.username ?? "Someone"}</p>
                    <p className="text-xs text-slate-500">@{p?.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void act(id, "accepted")}
                      className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => void act(id, "declined")}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => void act(id, "blocked")}
                      className="rounded-lg border border-rose-500/50 px-3 py-2 text-xs font-semibold text-rose-300"
                    >
                      Block
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Outgoing</h3>
        {outgoing.length === 0 ? (
          <p className="text-sm text-slate-500">You haven&apos;t sent any invitations.</p>
        ) : (
          <ul className="divide-y divide-slate-900 rounded-3xl border border-slate-800 bg-slate-950/60">
            {outgoing.map((r) => {
              const p = r.receiver as ProfileLite | undefined;
              return (
                <li key={r.id as string} className="flex items-center px-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">@{p?.username}</p>
                    <p className="text-xs capitalize text-slate-500">{r.status as string}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
