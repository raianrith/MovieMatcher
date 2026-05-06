"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeading } from "@/components/layout/PageHeading";
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
      toast.success("Spotlight updated");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cannot save profile");
    }
  };

  if (!profile) {
    return <p className="text-center text-slate-500">Loading your marquee…</p>;
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <PageHeading
        eyebrow="Your seat"
        title="PROGRAM"
        subtitle={
          <>
            Handle <span className="text-[var(--cinema-muted-gold)]">@{profile.username}</span> is permanent. Tune your
            screen name and portrait link for friends.
          </>
        }
      />
      <form onSubmit={(e) => void save(e)} className="panel-ticket space-y-6 p-7">
        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--cinema-muted-gold)]">
          Screen name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="field-cinema mt-2 block w-full"
          />
        </label>
        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--cinema-muted-gold)]">
          Portrait URL
          <input
            type="url"
            inputMode="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
            className="field-cinema mt-2 block w-full"
          />
        </label>
        <button type="submit" className="btn-spotlight w-full py-4 text-[16px]">
          Save changes
        </button>
      </form>
    </div>
  );
}
