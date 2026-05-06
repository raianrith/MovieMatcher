"use client";

import { useRouter } from "next/navigation";
import { PageHeading } from "@/components/layout/PageHeading";
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
    toast.success("See you at the next show.");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md space-y-8">
      <PageHeading
        eyebrow="House lights"
        title="SETTINGS"
        subtitle="Account session only — swipe data stays in Supabase until you delete it there."
      />
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
