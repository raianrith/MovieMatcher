import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Movie Match",
    short_name: "Match",
    description: "Swipe movies with friends — mutual likes become your shared watchlist.",
    background_color: "#0c0a12",
    theme_color: "#0c0a12",
    display: "standalone",
    orientation: "portrait-primary",
    start_url: "/",
    lang: "en",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
