import Link from "next/link";
import { signUpAction } from "@/app/(auth)/actions";

export default async function SignupPage(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = (await props.searchParams) ?? {};
  const error = typeof searchParams.error === "string" ? searchParams.error : undefined;
  return (
    <div className="panel-ticket relative w-full max-w-sm overflow-hidden p-8 sm:p-9">
      <div
        aria-hidden
        className="pointer-events-none absolute right-6 top-4 h-8 w-[1px] bg-[repeating-linear-gradient(transparent_0_3px,rgba(232,200,106,0.25)_3px_6px)] opacity-70"
      />
      <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-[0.05em] text-white">JOIN</h1>
      <p className="mt-3 text-[15px] text-slate-400">Choose a public handle friends can search for.</p>
      {error ? (
        <p className="mt-6 rounded-xl border border-[rgba(180,74,92,0.3)] bg-[rgba(40,14,22,0.35)] px-4 py-3 text-[13px] text-rose-100">
          {error}
        </p>
      ) : null}
      <form action={signUpAction} className="mt-8 space-y-5">
        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--cinema-muted-gold)] opacity-95">
          Handle <span className="font-normal text-slate-500">(public)</span>
          <input
            required
            minLength={3}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="e.g. reel_addict"
            name="username"
            className="field-cinema mt-2 block w-full"
          />
        </label>
        <label className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--cinema-muted-gold)] opacity-95">
          Screen name
          <input
            placeholder="How your crew sees you"
            name="displayName"
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
            name="email"
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
            name="password"
            className="field-cinema mt-2 block w-full"
          />
        </label>
        <button
          type="submit"
          className="btn-spotlight w-full px-6 py-4 text-[16px]"
        >
          Start swiping
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
