"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    // Disable SW by default: the PWA shell can otherwise serve stale HTML/redirects
    // during rapid deploys, which shows the Next “This page couldn't load” overlay.
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NEXT_PUBLIC_ENABLE_SW !== "true") return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
