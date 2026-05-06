import { tmdbGet } from "@/lib/tmdb";

export type WatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
};

export type WatchProvidersResponse = {
  link: string | null;
  flatrate: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
};

type TmdbWatchProvidersPayload = {
  results?: Record<
    string,
    {
      link?: string;
      flatrate?: WatchProvider[];
      rent?: WatchProvider[];
      buy?: WatchProvider[];
    }
  >;
};

export async function fetchWatchProviders(tmdbId: number, region: string): Promise<WatchProvidersResponse> {
  const payload = (await tmdbGet(`/movie/${tmdbId}/watch/providers`)) as TmdbWatchProvidersPayload;
  const r = payload.results?.[region];
  return {
    link: r?.link ?? null,
    flatrate: Array.isArray(r?.flatrate) ? r!.flatrate : [],
    rent: Array.isArray(r?.rent) ? r!.rent : [],
    buy: Array.isArray(r?.buy) ? r!.buy : [],
  };
}

export function providerLogoUrl(path: string | null): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w92${path}`;
}

