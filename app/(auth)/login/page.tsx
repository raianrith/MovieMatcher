"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
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
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-[0.05em] text-white">SIGN IN</h1>
      <p className="mt-3 text-[15px] text-slate-400">Same email &amp; password you used at the door.</p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-5">
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
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
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
          {loading ? "Opening curtain…" : "Enter lobby"}
        </button>
      </form>
      <p className="mt-10 text-center text-[15px] text-slate-500">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-[var(--cinema-teal)] underline-offset-4 hover:underline">
          Create a free ticket
        </Link>
      </p>
    </div>
  );
}
