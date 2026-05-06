import { redirect } from "next/navigation";
import { BottomNav } from "@/components/nav/BottomNav";
import { AppHeader } from "@/components/nav/AppHeader";
import { MatchToasts } from "@/components/providers/MatchToasts";
import { RegisterSW } from "@/components/RegisterSW";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  return (
    <div className="min-h-dvh bg-[#070b14] text-slate-100">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-4 md:pb-8">{children}</main>
      <BottomNav />
      <MatchToasts initialSession={session} />
      <RegisterSW />
    </div>
  );
}
