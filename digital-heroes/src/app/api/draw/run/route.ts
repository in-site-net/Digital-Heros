import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { drawRandomNumbers, countMatches, splitPrizePool } from "@/lib/draw-engine";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const, user: null };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, ok: profile?.role === "admin", user };
}

export async function POST(req: NextRequest) {
  const { supabase, ok, user } = await requireAdmin();
  if (!ok || !user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { periodLabel, mode, winningNumbers, totalPoolCents, jackpotRolloverCents } = (await req.json()) as {
    periodLabel: string;
    mode: "random" | "algorithmic";
    winningNumbers: number[];
    totalPoolCents: number;
    jackpotRolloverCents: number;
  };

  const { data: activeSubs } = await supabase.from("subscriptions").select("user_id").eq("status", "active");
  const entrants = activeSubs ?? [];

  const entries = entrants.map((e) => {
    const numbers = drawRandomNumbers();
    return { user_id: e.user_id, numbers, match_count: countMatches(numbers, winningNumbers) };
  });

  const winnerCountByTier = { 5: 0, 4: 0, 3: 0 } as Record<3 | 4 | 5, number>;
  entries.forEach((e) => {
    if (e.match_count >= 3) winnerCountByTier[e.match_count as 3 | 4 | 5]++;
  });
  const split = splitPrizePool({ totalPoolCents, jackpotRolloverCents, winnerCountByTier });

  const { data: draw, error: drawError } = await supabase
    .from("draws")
    .insert({
      period_label: periodLabel,
      mode,
      status: "published",
      total_pool_cents: totalPoolCents,
      pool_5_cents: split.tierPoolCents[5],
      pool_4_cents: split.tierPoolCents[4],
      pool_3_cents: split.tierPoolCents[3],
      jackpot_rollover_cents: split.newJackpotRolloverCents,
      winning_numbers: winningNumbers,
      run_by: user.id,
      simulated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (drawError || !draw) {
    return NextResponse.json({ error: drawError?.message ?? "Failed to create draw" }, { status: 500 });
  }

  if (entries.length > 0) {
    await supabase.from("draw_entries").insert(
      entries.map((e) => ({ draw_id: draw.id, user_id: e.user_id, numbers: e.numbers, match_count: e.match_count }))
    );
  }

  const winnerRows = entries
    .filter((e) => e.match_count >= 3)
    .map((e) => ({
      draw_id: draw.id,
      user_id: e.user_id,
      match_tier: e.match_count,
      amount_cents: split.perWinnerCents[e.match_count as 3 | 4 | 5],
      verification: "awaiting_proof" as const,
      payment: "pending" as const,
    }));

  if (winnerRows.length > 0) {
    await supabase.from("winners").insert(winnerRows);
  }

  return NextResponse.json({ draw, winnerCount: winnerRows.length });
}
