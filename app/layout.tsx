import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Outfit } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Movie Match — shared picks with friends",
  description: "Swipe movies with your crew · mutual likes become your watch-together queue.",
};

export const viewport: Viewport = {
  themeColor: "#0c0a12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${outfit.variable}`}>
      <body className="cinema-backdrop font-[family-name:var(--font-sans)] antialiased text-slate-100">
        <div className="relative z-[1] min-h-dvh">
          {children}
          <Toaster
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "backdrop-blur-md border border-white/10 bg-[#17131f]/95 text-slate-100",
              title: "font-semibold text-white",
              description: "text-slate-400",
            },
          }}
          position="top-center"
          />
        </div>
      </body>
    </html>
  );
}
