"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import type { Profile } from "@/lib/types";
import { toast } from "sonner";

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const load = useCallback(async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data) {
      toast.error("Profile missing");
      return;
    }
    const p = data as Profile;
    setProfile(p);
    setDisplayName(p.display_name ?? "");
    setAvatarUrl(p.avatar_url ?? "");
  }, [supabase]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- client fetch after mount */
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || profile.username,
          avatar_url: avatarUrl.trim() || null,
        })
        .eq("id", profile.id);
      if (error) throw error;
      toast.success("Saved profile ✓");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cannot save profile");
    }
  };

  if (!profile) {
    return <p className="text-slate-500">Working on your dossier…</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Public profile</h2>
        <p className="text-sm text-slate-500">
          @{profile.username} is fixed · tune how pals see your name / avatar badge.
        </p>
      </div>
      <form onSubmit={(e) => void save(e)} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <label className="block text-xs uppercase text-slate-500">
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-[#070b14] px-4 py-3 text-white outline-none ring-cyan-500/35 focus:ring-2"
          />
        </label>
        <label className="block text-xs uppercase text-slate-500">
          Avatar URL
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="mt-2 w-full rounded-xl border border-slate-700 bg-[#070b14] px-4 py-3 text-white outline-none ring-cyan-500/35 focus:ring-2"
          />
        </label>
        <button type="submit" className="w-full rounded-2xl bg-cyan-500 py-4 font-bold text-slate-950">
          Save
        </button>
      </form>
    </div>
  );
}
