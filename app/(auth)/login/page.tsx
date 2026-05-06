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
      toast.success("Signed in");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-950/60 p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-white">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-500">Email + password from Supabase Auth.</p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <label className="block text-xs font-semibold uppercase text-slate-500">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-[#070b14] px-4 py-3 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold uppercase text-slate-500">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-[#070b14] px-4 py-3 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          />
        </label>
        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-2xl bg-cyan-500 py-3.5 font-bold text-slate-950 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Continue"}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-500">
        No account yet?{" "}
        <Link href="/signup" className="font-semibold text-cyan-400">
          Sign up
        </Link>
      </p>
    </div>
  );
}
