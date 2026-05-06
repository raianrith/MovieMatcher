import { NextResponse } from "next/server";
import { fetchWatchProviders } from "@/lib/tmdb-watch";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, ctx: Ctx) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await ctx.params;
    const tmdbId = parseInt(id, 10);
    if (!Number.isFinite(tmdbId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const u = new URL(req.url);
    const region = (u.searchParams.get("region") ?? "US").toUpperCase().slice(0, 2);

    const data = await fetchWatchProviders(tmdbId, region);
    return NextResponse.json({ region, ...data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}

