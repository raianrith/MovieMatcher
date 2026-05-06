 "use server";
 
 import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createActionSupabaseClient } from "@/lib/supabase/server";
 
async function originFromHeaders(): Promise<string> {
  const h = await headers();
   const host = h.get("x-forwarded-host") ?? h.get("host");
   const proto = h.get("x-forwarded-proto") ?? "https";
   if (!host) return "http://localhost:3000";
   return `${proto}://${host}`;
 }
 
 export async function signInAction(formData: FormData) {
   const email = String(formData.get("email") ?? "").trim();
   const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
 
   if (!email || !password) redirect(`/login?error=${encodeURIComponent("Enter email + password.")}`);
 
  const supabase = await createActionSupabaseClient();
   const { error } = await supabase.auth.signInWithPassword({ email, password });
   if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
 
  if (next && next.startsWith("/")) redirect(next);
  redirect("/dashboard");
 }
 
 export async function signUpAction(formData: FormData) {
   const email = String(formData.get("email") ?? "").trim();
   const password = String(formData.get("password") ?? "");
   const usernameRaw = String(formData.get("username") ?? "");
   const displayName = String(formData.get("displayName") ?? "").trim();
 
   const username = usernameRaw.trim().toLowerCase();
   if (username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
     redirect(
       `/signup?error=${encodeURIComponent(
         "Handle: 3+ characters, lowercase letters, numbers, or _ only.",
       )}`,
     );
   }
 
  const supabase = await createActionSupabaseClient();
  const origin = await originFromHeaders();
 
   const { data, error } = await supabase.auth.signUp({
     email,
     password,
     options: {
       emailRedirectTo: `${origin}/dashboard`,
       data: {
         username,
         display_name: displayName || username,
       },
     },
   });
 
   if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
 
   // If email confirmation is enabled, session may be null.
   if (!data.session) redirect(`/login?notice=${encodeURIComponent("Check your email to verify your ticket.")}`);
 
   redirect("/dashboard");
 }
