"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeading } from "@/components/layout/PageHeading";
import { createClient } from "@/lib/supabaseClient";
import { getFriends } from "@/lib/friends";
import { addMember, groupOverlaps, listGroupMembers, removeMember } from "@/lib/groups";
import type { MovieSnapshot } from "@/lib/types";
import { toast } from "sonner";

function asSnapshot(v: unknown): MovieSnapshot | null {
  if (!v || typeof v !== "object") return null;
  return v as MovieSnapshot;
}

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const groupId = params.id;
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [friends, setFriends] = useState<{ id: string; username: string; display_name: string | null }[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, { username: string; display_name: string | null }>>(
    {},
  );
  const [addId, setAddId] = useState("");
  const [kind, setKind] = useState<"movie" | "tv">("movie");
  const [loading, setLoading] = useState(true);
  const [overlaps, setOverlaps] = useState<
    { tmdb_movie_id: number; media_type: "movie" | "tv"; movie_snapshot: Record<string, unknown> | null }[]
  >([]);

  const refresh = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    setMe(uid ?? null);
    if (!uid) return;
    setLoading(true);
    try {
      const members = await listGroupMembers(supabase, groupId);
      const mids = members.map((m) => m.user_id);
      setMemberIds(mids);

      if (mids.length) {
        const { data: ps, error: pe } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", mids);
        if (pe) throw pe;
        setMemberProfiles(
          Object.fromEntries((ps ?? []).map((p: { id: string; username: string; display_name: string | null }) => [
            p.id,
            { username: p.username, display_name: p.display_name },
          ])),
        );
      } else {
        setMemberProfiles({});
      }

      setFriends((await getFriends(supabase, uid)).map((f) => ({ id: f.id, username: f.username, display_name: f.display_name })));
      const rows = await groupOverlaps(supabase, groupId, kind);
      setOverlaps(rows.map((r) => ({ tmdb_movie_id: r.tmdb_movie_id, media_type: r.media_type, movie_snapshot: r.movie_snapshot })));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load group");
    } finally {
      setLoading(false);
    }
  }, [supabase, groupId, kind]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- client fetch after mount */
    void refresh();
  }, [refresh]);

  const friendOptions = useMemo(
    () => friends.filter((f) => !memberIds.includes(f.id)),
    [friends, memberIds],
  );

  const onAdd = async () => {
    if (!addId) return;
    try {
      await addMember(supabase, groupId, addId);
      toast.success("Added to group.");
      setAddId("");
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add member");
    }
  };

  const onRemove = async (uid: string) => {
    try {
      await removeMember(supabase, groupId, uid);
      toast.success("Removed.");
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove member");
    }
  };

  return (
    <div className="space-y-10">
      <PageHeading
        eyebrow="Group match"
        title="EVERYONE LIKED"
        subtitle="Intersection of likes across the whole group."
      />

      <section className="panel-ticket p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--cinema-muted-gold)] opacity-95">
            Content type
            <select value={kind} onChange={(e) => setKind(e.target.value as "movie" | "tv")} className="field-cinema min-h-[48px]">
              <option value="movie">Movies</option>
              <option value="tv">TV series</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--cinema-muted-gold)] opacity-95">
            Add a friend
            <select value={addId} onChange={(e) => setAddId(e.target.value)} className="field-cinema min-h-[48px]">
              <option value="">Select…</option>
              {friendOptions.map((f) => (
                <option key={f.id} value={f.id}>
                  @{f.username}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => void onAdd()} className="btn-spotlight min-h-[48px] self-end px-5">
            Add
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {memberIds.map((uid) => (
            <button
              key={uid}
              type="button"
              onClick={() => void onRemove(uid)}
              disabled={uid === me}
              className="rounded-full border border-[rgba(232,200,106,0.14)] bg-[rgba(8,7,14,0.55)] px-3 py-1.5 text-[12px] font-semibold text-slate-300 disabled:opacity-40"
              title={uid === me ? "You can’t remove yourself" : "Remove from group"}
            >
              {uid === me ? "You" : memberProfiles[uid]?.username ? `@${memberProfiles[uid]!.username}` : uid.slice(0, 8)} ×
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <p className="py-10 text-center text-[15px] text-slate-500">Running the numbers…</p>
      ) : overlaps.length === 0 ? (
        <div className="panel-ticket-dashed p-10 text-center text-slate-400">
          No full-group overlaps yet. Add more members or keep swiping.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {overlaps.map((r) => {
            const snap = asSnapshot(r.movie_snapshot);
            const poster = snap?.posterUrl ?? null;
            return (
              <li key={`${r.media_type}:${r.tmdb_movie_id}`} className="panel-ticket overflow-hidden p-0">
                <div className="relative aspect-[2/3] w-full">
                  {poster ? (
                    <Image src={poster} alt="" fill draggable={false} className="object-cover" sizes="33vw" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#12101f] text-slate-700">Poster</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 font-semibold text-slate-200">{snap?.title ?? `TMDB #${r.tmdb_movie_id}`}</p>
                  <p className="mt-1 text-[12px] text-slate-500">{r.media_type === "tv" ? "TV" : "Movie"}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

