"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const u = username.trim().toLowerCase();
      if (u.length < 3 || !/^[a-z0-9_]+$/.test(u)) {
        throw new Error("Handle: 3+ characters, lowercase letters, numbers, or _ only.");
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
          data: {
            username: u,
            display_name: displayName.trim() || u,
          },
        },
      });
      if (error) throw error;
      toast.success(data.session ? "You're in — lights down!" : "Check your email to verify your ticket.", {
        duration: 4500,
      });
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-ticket relative w-full max-w-sm overflow-hidden p-8 sm:p-9">
      <div
        aria-hidden
        className="pointer-events-none absolute right-6 top-4 h-8 w-[1px] bg-[repeating-linear-gradient(transparent_0_3px,rgba(232,200,106,0.25)_3px_6px)] opacity-70"
      />
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-[0.05em] text-white">JOIN</h1>
      <p className="mt-3 text-[15px] text-slate-400">Choose a public handle friends can search for.</p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-5">
        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--cinema-muted-gold)] opacity-95">
          Handle <span className="font-normal text-slate-500">(public)</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
            minLength={3}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="e.g. reel_addict"
            className="field-cinema mt-2 block w-full"
          />
        </label>
        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--cinema-muted-gold)] opacity-95">
          Screen name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How your crew sees you"
            className="field-cinema mt-2 block w-full"
          />
        </label>
        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--cinema-muted-gold)] opacity-95">
          Email
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-cinema mt-2 block w-full"
          />
        </label>
        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--cinema-muted-gold)] opacity-95">
          Password <span className="font-normal text-slate-500">(8+ characters)</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field-cinema mt-2 block w-full"
          />
        </label>
        <button
          disabled={loading}
          type="submit"
          className="btn-spotlight w-full px-6 py-4 text-[16px] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? "Saving your seat…" : "Start swiping"}
        </button>
      </form>
      <p className="mt-10 text-center text-[15px] text-slate-500">
        Have a pass?{" "}
        <Link href="/login" className="font-semibold text-[var(--cinema-teal)] underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
