import { BottomNav } from "@/components/nav/BottomNav";
import { AppHeader } from "@/components/nav/AppHeader";
import { MatchToasts } from "@/components/providers/MatchToasts";
import { RegisterSW } from "@/components/RegisterSW";
import { AuthGate } from "@/components/auth/AuthGate";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col text-slate-100">
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 md:max-w-3xl md:pb-12 md:pt-8 lg:max-w-5xl">
        <AuthGate>{children}</AuthGate>
      </main>
      <BottomNav />
      <MatchToasts />
      <RegisterSW />
    </div>
  );
}
