import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageHeadingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  className?: string;
};

/** Shared page title strip — marquee display + readable subtitle for mobile shells */
export function PageHeading({ eyebrow, title, subtitle, className }: PageHeadingProps) {
  return (
    <header className={cn("space-y-2 pb-6", className)}>
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--cinema-muted-gold)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-[family-name:var(--font-display)] text-[2.125rem] font-normal leading-none tracking-[0.04em] text-white sm:text-4xl md:text-[2.625rem]">
        {title}
      </h1>
      {subtitle != null ? (
        <p className="max-w-lg text-[15px] leading-relaxed text-slate-400">{subtitle}</p>
      ) : null}
    </header>
  );
}
