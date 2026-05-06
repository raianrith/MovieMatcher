import type { MovieSnapshot, SwipeActionDb } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getSwipedTmdbIds(supabase: SupabaseClient, userId: string): Promise<number[]> {
  const { data, error } = await supabase.from("swipes").select("tmdb_movie_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r: { tmdb_movie_id: number }) => r.tmdb_movie_id);
}

export async function recordSwipe(params: {
  supabase: SupabaseClient;
  userId: string;
  action: SwipeActionDb;
  snapshot: MovieSnapshot;
}) {
  const { supabase, userId, action, snapshot } = params;
  const { error } = await supabase.from("swipes").insert({
    user_id: userId,
    tmdb_movie_id: snapshot.tmdb_movie_id,
    action,
    movie_snapshot: snapshot as unknown as Record<string, unknown>,
  });

  if (error) throw error;
}
