"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeading } from "@/components/layout/PageHeading";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "sonner";

function isLikelyUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [me, setMe] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const uid = (await supabase.auth.getUser()).data.user?.id ?? null;
      setMe(uid);
      if (!uid) return;
      const { data, error } = await supabase.from("profiles").select("avatar_url").eq("id", uid).maybeSingle();
      if (error) return;
      setAvatarUrl(typeof data?.avatar_url === "string" ? data.avatar_url : "");
    })();
  }, [supabase]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("See you at the next show.");
    router.push("/login");
    router.refresh();
  };

  const saveAvatar = async () => {
    if (!me) return;
    setSaving(true);
    try {
      const next = avatarUrl.trim();
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: next || null })
        .eq("id", me);
      if (error) throw error;
      toast.success("Avatar updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save avatar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-8">
      <PageHeading
        eyebrow="House lights"
        title="SETTINGS"
        subtitle="Set your avatar and manage your session."
      />

      <section className="panel-ticket p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--cinema-muted-gold)]">
          Your avatar
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border border-[rgba(232,200,106,0.18)] bg-[rgba(8,6,14,0.55)]">
            {avatarUrl.trim() && isLikelyUrl(avatarUrl.trim()) ? (
              // Use <img> to avoid Next/Image remote host allowlist issues for user-provided URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl.trim()}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-[14px] font-bold text-[var(--cinema-muted-gold)]">
                MM
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Image URL</span>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="field-cinema min-h-[48px] font-medium normal-case tracking-normal"
                placeholder="https://…"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </label>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void saveAvatar()}
            disabled={saving || !me}
            className="btn-spotlight min-h-[48px] flex-1 px-5 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save avatar"}
          </button>
          <button
            type="button"
            onClick={() => setAvatarUrl("")}
            className="min-h-[48px] rounded-2xl border border-[rgba(148,134,170,0.28)] bg-[rgba(12,10,20,0.6)] px-5 text-[13px] font-bold text-slate-300 active:scale-[0.98]"
          >
            Clear
          </button>
        </div>
        <p className="mt-3 text-[12px] text-slate-500">
          Tip: paste a direct image URL starting with <span className="font-semibold text-slate-300">https://</span>.
        </p>
      </section>

      <button
        type="button"
        onClick={() => void signOut()}
        className="btn-ruby-outline w-full py-4 text-[16px] transition-colors hover:bg-[rgba(180,74,92,0.12)] active:scale-[0.99]"
      >
        Leave theatre — log out
      </button>
    </div>
  );
}
