import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const dm = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Movie Match",
  description: "Swipe with friends · mutual likes become shared matches",
};

export const viewport: Viewport = {
  themeColor: "#070b14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dm.variable}>
      <body className="bg-[#070b14] antialiased font-[family-name:var(--font-sans)] text-slate-100">
        {children}
        <Toaster theme="dark" richColors closeButton />
      </body>
    </html>
  );
}
