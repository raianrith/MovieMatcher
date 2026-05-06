"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "sonner";

/** Subscribes to new match rows involving the logged-in user. */
export function MatchToasts() {
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const client = createClient();
    let active = true;
    let removeCh: undefined | (() => void);

    void (async () => {
      const uid = (await client.auth.getUser()).data.user?.id ?? null;
      if (!uid) return;
      const { data } = await client.from("matches").select("id").or(`user_a_id.eq.${uid},user_b_id.eq.${uid}`);
      if (!active) return;
      data?.forEach((r: { id: string }) => seen.current.add(r.id));

      const channel = client
        .channel("matches-inserts")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "matches" },
          (payload) => {
            const row = payload.new as Record<string, string | undefined>;
            const id = row.id;
            if (!id || (row.user_a_id !== uid && row.user_b_id !== uid)) return;
            if (seen.current.has(id)) return;
            seen.current.add(id);
            toast.success("It's a match!", {
              description: "You both liked the same movie. Check Matches.",
              duration: 5000,
            });
          },
        )
        .subscribe();

      removeCh = () => void client.removeChannel(channel);
    })();

    return () => {
      active = false;
      removeCh?.();
    };
  }, []);

  return null;
}
