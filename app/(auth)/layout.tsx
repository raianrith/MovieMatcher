export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <p className="mb-6 font-[family-name:var(--font-display)] text-sm tracking-[0.45em] text-[var(--cinema-muted-gold)] opacity-90">
        NOW SHOWING
      </p>
      {children}
    </div>
  );
}
