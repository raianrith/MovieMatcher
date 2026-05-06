"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeading } from "@/components/layout/PageHeading";
import { createClient } from "@/lib/supabaseClient";
import { createGroup, listGroups } from "@/lib/groups";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export default function GroupsPage() {
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [rows, setRows] = useState<{ id: string; name: string; owner_id: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    setMe(uid ?? null);
    if (!uid) return;
    setLoading(true);
    try {
      setRows(await listGroups(supabase));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load groups");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- client fetch after mount */
    void refresh();
  }, [refresh]);

  const mineCount = useMemo(() => rows.filter((r) => r.owner_id === me).length, [rows, me]);

  const onCreate = async () => {
    if (!me) return;
    try {
      const g = await createGroup(supabase, me, name);
      toast.success("Group created.");
      setName("");
      setRows((prev) => [g, ...prev]);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : `Could not create group (${JSON.stringify(e)})`;
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-10">
      <PageHeading
        eyebrow="Group match"
        title="CROWD PICK"
        subtitle="Create a crew, then see what the whole group swiped right on."
      />

      <section className="panel-ticket p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--cinema-muted-gold)] opacity-95">
            New group name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-cinema min-h-[48px]"
              placeholder="e.g. Friday Night Crew"
            />
          </label>
          <button type="button" onClick={() => void onCreate()} className="btn-spotlight min-h-[48px] px-5">
            Create
          </button>
        </div>
        <p className="mt-3 text-[12px] text-slate-500">You own {mineCount} group(s).</p>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-slate-300">Your groups</h2>
          <button type="button" onClick={() => void refresh()} className="text-[12px] font-semibold text-slate-500">
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-[15px] text-slate-500">Setting up the velvet rope…</p>
        ) : rows.length === 0 ? (
          <div className="panel-ticket-dashed p-10 text-center text-slate-400">No groups yet.</div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {rows.map((g) => (
              <li key={g.id} className="panel-ticket p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-[family-name:var(--font-display)] text-xl tracking-[0.04em] text-white">
                      {g.name}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {g.owner_id === me ? "You’re the director." : "You’re in the cast."}
                    </p>
                  </div>
                  <Link
                    href={`/groups/${g.id}`}
                    className={cn(
                      "shrink-0 rounded-lg border border-[rgba(232,200,106,0.18)] px-3 py-2 text-[12px] font-semibold",
                      "text-[var(--cinema-muted-gold)] hover:bg-[rgba(232,200,106,0.08)]",
                    )}
                  >
                    Open
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

