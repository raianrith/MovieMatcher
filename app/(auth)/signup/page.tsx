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
        throw new Error("Username: 3+ chars, lowercase letters, numbers, underscore only.");
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
      toast.success(data.session ? "Welcome!" : "Check your inbox to verify your email.", {
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
    <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-950/60 p-8 shadow-xl">
      <h1 className="text-2xl font-bold text-white">Create account</h1>
      <p className="mt-1 text-sm text-slate-500">
        Profiles are keyed to your Auth user · pick a unique handle.
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <label className="block text-xs font-semibold uppercase text-slate-500">
          Username (public)
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            required
            minLength={3}
            placeholder="jay_cinephile"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-[#070b14] px-4 py-3 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          />
        </label>
        <label className="block text-xs font-semibold uppercase text-slate-500">
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-[#070b14] px-4 py-3 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          />
        </label>
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-[#070b14] px-4 py-3 text-slate-100 outline-none ring-cyan-500/40 focus:ring-2"
          />
        </label>
        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-500 py-3.5 font-bold text-slate-950 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Sign up"}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-500">
        Already onboard?{" "}
        <Link href="/login" className="font-semibold text-cyan-400">
          Log in
        </Link>
      </p>
    </div>
  );
}
