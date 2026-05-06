import type { SVGProps } from "react";

/** Inline SVG icons — avoids extra deps, sized for bottom nav tap targets */

export function IconLobby(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path d="M4 21V10l8-7 8 7v11" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21v-6h6v6M9 10h.01M15 10h.01" strokeLinecap="round" />
    </svg>
  );
}

export function IconTickets(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path
        d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
        strokeLinejoin="round"
      />
      <path d="M8 11v6M15 11v6" strokeDasharray="2 3" strokeLinecap="round" />
    </svg>
  );
}

export function IconClapper(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path d="m3 17 14-10 4 6-13 11H3v-7Z" strokeLinejoin="round" />
      <path d="m14 3 7 6" strokeLinecap="round" />
      <circle cx={8.5} cy={17.5} r={1.25} fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <circle cx={9} cy={8} r={3.25} />
      <path d="M3 21v-1.5c0-2.5 2-4 6-4s6 1.5 6 4V21M16 7.5h.05M21 21v-1.75c0-1.85-1.35-3-3.3-3" strokeLinecap="round" />
    </svg>
  );
}

export function IconStarBurst(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path
        d="M12 2.5 14.2 9h6.55l-5.35 4 2.05 6.5L12 16.9 6.55 19.5l2.05-6.5L3.25 9H9.8L12 2.5Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconSeat(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden {...props}>
      <path d="M8 6a4 4 0 0 1 8 0v3H8V6Z" strokeLinejoin="round" />
      <path d="M5 10h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8Z" strokeLinejoin="round" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </svg>
  );
}
