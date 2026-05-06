/** Swipe payload stored in Postgres + snapshots in JSON */
export type SwipeActionDb = "liked" | "disliked" | "skipped";

export type CinemaFilter = "all" | "hollywood" | "india" | "bollywood";

/** Normalized TMDB-derived payload stored in JSONB */
export interface MovieSnapshot {
  tmdb_movie_id: number;
  title: string;
  releaseYear: number;
  genres: string[];
  original_language?: string;
  /** ISO-3166-1 country codes (e.g. ["US"], ["IN"]) */
  originCountries?: string[];
  languageLabel: string;
  runtimeMinutes: number | null;
  rating: number;
  overview: string;
  director: string;
  actors: string[];
  posterUrl: string | null;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type FriendRequestStatus = "pending" | "accepted" | "declined" | "blocked";

export interface FriendRequestRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface MatchRowDb {
  id: string;
  user_a_id: string;
  user_b_id: string;
  tmdb_movie_id: number;
  movie_snapshot: MovieSnapshot;
  created_at: string;
}

/** Match enriched for UI with friend identity + user's flags */
export interface MatchWithFriend extends MatchRowDb {
  friendId: string;
  friendUsername: string | null;
  friendDisplayName: string | null;
  in_watchlist: boolean;
  watched: boolean;
}

export type MatchesSort = "recent" | "rating" | "year";
