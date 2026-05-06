import type { SupabaseClient } from "@supabase/supabase-js";

export async function searchProfilesByUsername(
  supabase: SupabaseClient,
  query: string,
  excludeUserId?: string,
) {
  const q = query.trim().replace(/%/g, "");
  if (q.length < 2) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .ilike("username", `%${q}%`)
    .limit(20);

  if (error) throw error;
  return (data ?? []).filter((r: { id: string }) => r.id !== excludeUserId);
}

export async function getFriends(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("friendships")
    .select("friend_id")
    .eq("user_id", userId);

  if (error) throw error;
  const ids = (data ?? []).map((r: { friend_id: string }) => r.friend_id);
  if (ids.length === 0) return [];

  const { data: profiles, error: pe } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", ids);
  if (pe) throw pe;
  return profiles ?? [];
}

export async function sendFriendRequest(supabase: SupabaseClient, senderId: string, receiverUsername: string) {
  const { data: receiver, error: re } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", receiverUsername.trim().toLowerCase())
    .maybeSingle();

  if (re) throw re;
  if (!receiver) throw new Error("User not found");

  const { error } = await supabase.from("friend_requests").insert({
    sender_id: senderId,
    receiver_id: receiver.id as string,
    status: "pending",
  });

  if (error) throw error;
}

export async function getIncomingRequests(supabase: SupabaseClient, userId: string) {
  const { data: rows, error } = await supabase
    .from("friend_requests")
    .select("id, sender_id, receiver_id, status, created_at")
    .eq("receiver_id", userId)
    .eq("status", "pending");

  if (error) throw error;

  const senderIds = [...new Set((rows ?? []).map((r: { sender_id: string }) => r.sender_id))];
  if (!senderIds.length) return [];

  const { data: profiles, error: pe } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", senderIds);
  if (pe) throw pe;

  const byId = Object.fromEntries((profiles ?? []).map((p: { id: string }) => [p.id, p]));

  return (rows ?? []).map((r: { id: string; sender_id: string; created_at: string }) => ({
    ...r,
    sender: byId[r.sender_id],
  }));
}

export async function getOutgoingRequests(supabase: SupabaseClient, userId: string) {
  const { data: rows, error } = await supabase
    .from("friend_requests")
    .select("id, sender_id, receiver_id, status, created_at")
    .eq("sender_id", userId);

  if (error) throw error;

  const receiverIds = [...new Set((rows ?? []).map((r: { receiver_id: string }) => r.receiver_id))];
  if (!receiverIds.length) return [];

  const { data: profiles, error: pe } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", receiverIds);
  if (pe) throw pe;

  const byId = Object.fromEntries((profiles ?? []).map((p: { id: string }) => [p.id, p]));

  return (rows ?? []).map((r: { id: string; receiver_id: string; status: string; created_at: string }) => ({
    ...r,
    receiver: byId[r.receiver_id],
  }));
}

export async function respondToRequest(
  supabase: SupabaseClient,
  requestId: string,
  status: "accepted" | "declined" | "blocked",
) {
  const { error } = await supabase.from("friend_requests").update({ status }).eq("id", requestId);
  if (error) throw error;
}

/** Remove both friendship rows atomically via SECURITY DEFINER RPC. */
export async function removeFriendBothSides(supabase: SupabaseClient, friendId: string) {
  const { error } = await supabase.rpc("remove_friendship_with", { p_friend: friendId });
  if (error) throw error;
}
