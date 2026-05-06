import type { SupabaseClient } from "@supabase/supabase-js";

export interface FriendGroup {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface FriendGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
}

export async function listGroups(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("friend_groups")
    .select("id, owner_id, name, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FriendGroup[];
}

export async function createGroup(supabase: SupabaseClient, ownerId: string, name: string) {
  const n = name.trim();
  if (!n) throw new Error("Enter a group name");
  // Use SECURITY DEFINER RPC to avoid INSERT RLS edge cases.
  const { data, error } = await supabase.rpc("create_friend_group", { p_name: n });
  if (error) throw error;
  return data as FriendGroup;
}

export async function listGroupMembers(supabase: SupabaseClient, groupId: string) {
  const { data, error } = await supabase
    .from("friend_group_members")
    .select("id, group_id, user_id, created_at")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as FriendGroupMember[];
}

export async function addMember(supabase: SupabaseClient, groupId: string, userId: string) {
  const { error } = await supabase.from("friend_group_members").insert({ group_id: groupId, user_id: userId });
  if (error) throw error;
}

export async function removeMember(supabase: SupabaseClient, groupId: string, userId: string) {
  const { error } = await supabase.from("friend_group_members").delete().eq("group_id", groupId).eq("user_id", userId);
  if (error) throw error;
}

export interface GroupOverlapRow {
  tmdb_movie_id: number;
  media_type: "movie" | "tv";
  movie_snapshot: Record<string, unknown> | null;
  liked_by_count: number;
}

export async function groupOverlaps(supabase: SupabaseClient, groupId: string, mediaType: "movie" | "tv") {
  const { data, error } = await supabase.rpc("group_overlaps", { p_group_id: groupId, p_media_type: mediaType });
  if (error) throw error;
  return (data ?? []) as GroupOverlapRow[];
}

