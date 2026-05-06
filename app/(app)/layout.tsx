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
    <div className="flex min-h-dvh flex-col text-slate-100">
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 md:max-w-3xl md:pb-12 md:pt-8 lg:max-w-5xl">
        {children}
      </main>
      <BottomNav />
      <MatchToasts initialSession={session} />
      <RegisterSW />
    </div>
  );
}
