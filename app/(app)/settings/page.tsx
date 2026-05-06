"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed out cleanly");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h2 className="text-xl font-bold text-white">Settings</h2>
      <p className="text-sm text-slate-500">
        Session control lives here — nothing flashy, just logout when you borrow someone&apos;s phone.
      </p>
      <button
        type="button"
        onClick={() => void signOut()}
        className="w-full rounded-2xl border border-rose-500/50 py-4 font-bold text-rose-300 hover:bg-rose-950/30"
      >
        Log out
      </button>
    </div>
  );
}
