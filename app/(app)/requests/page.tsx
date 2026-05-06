"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeading } from "@/components/layout/PageHeading";
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
          ? "They’re on your crew!"
          : status === "blocked"
            ? "Invite blocked."
            : "Invitation torn up.",
      );
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    }
  };

  type ProfileLite = { username?: string; display_name?: string | null };

  return (
    <div className="space-y-14">
      <PageHeading
        eyebrow="The inbox"
        title="INVITES"
        subtitle="Accept to share double features · decline frees your list · block hides them from contacting you."
      />

      <section className="space-y-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Rolling in</h2>
        {loading ? (
          <p className="text-slate-500">Checking the mail slot…</p>
        ) : incoming.length === 0 ? (
          <div className="panel-ticket-dashed p-10 text-center text-[15px] text-slate-400">
            No invites right now — your aisle is calm.
          </div>
        ) : (
          <ul className="divide-y divide-[rgba(148,134,170,0.08)] overflow-hidden rounded-2xl border border-[rgba(232,200,106,0.12)] bg-[rgba(18,14,26,0.55)]">
            {incoming.map((r) => {
              const p = r.sender as ProfileLite | undefined;
              const id = r.id as string;
              return (
                <li key={id} className="gap-4 p-5">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{p?.display_name ?? p?.username ?? "Someone"}</p>
                    <p className="text-[13px] text-slate-500">@{p?.username}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void act(id, "accepted")}
                      className="btn-spotlight min-h-[44px] flex-1 px-5 py-3 text-[13px] sm:flex-none sm:py-3"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => void act(id, "declined")}
                      className="min-h-[44px] rounded-xl border border-[rgba(148,134,170,0.28)] px-5 py-3 text-[13px] font-bold text-slate-200"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => void act(id, "blocked")}
                      className="min-h-[44px] rounded-xl border border-[rgba(180,74,92,0.35)] px-4 py-3 text-[13px] font-bold text-rose-200"
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

      <section className="space-y-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Awaiting encore</h2>
        {outgoing.length === 0 ? (
          <p className="text-[15px] text-slate-500">No pending invites you&apos;ve sent.</p>
        ) : (
          <ul className="divide-y divide-[rgba(148,134,170,0.08)] overflow-hidden rounded-2xl border border-[rgba(148,134,170,0.14)] bg-[rgba(10,9,14,0.6)]">
            {outgoing.map((r) => {
              const p = r.receiver as ProfileLite | undefined;
              return (
                <li key={r.id as string} className="flex items-center px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">@{p?.username}</p>
                    <p className="text-[12px] capitalize text-slate-500">{r.status as string}</p>
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
