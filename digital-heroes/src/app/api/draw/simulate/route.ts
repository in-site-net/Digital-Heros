import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { drawRandomNumbers, drawWeightedNumbers, countMatches, splitPrizePool } from "@/lib/draw-engine";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return { supabase, ok: profile?.role === "admin", user };
}

export async function POST(req: NextRequest) {
  const { supabase, ok, user } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { periodLabel, mode } = (await req.json()) as { periodLabel: string; mode: "random" | "algorithmic" };

  // Active subscribers = entrants this period.
  const { data: activeSubs } = await supabase.from("subscriptions").select("user_id, amount_cents").eq("status", "active");
  const entrants = activeSubs ?? [];
  const totalPoolCents = entrants.reduce((sum, s) => sum + s.amount_cents, 0);

  // Prior jackpot rollover, if any.
  const { data: lastDraw } = await supabase
    .from("draws")
    .select("jackpot_rollover_cents")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const jackpotRolloverCents = lastDraw?.jackpot_rollover_cents ?? 0;

  let winningNumbers: number[];
  if (mode === "algorithmic") {
    const { data: recentScores } = await supabase.from("scores").select("score");
    const freq = new Map<number, number>();
    (recentScores ?? []).forEach((s) => freq.set(s.score, (freq.get(s.score) ?? 0) + 1));
    winningNumbers = drawWeightedNumbers(freq);
  } else {
    winningNumbers = drawRandomNumbers();
  }

  // Assign each entrant a random ticket and compute matches.
  const entries = entrants.map((e) => {
    const numbers = drawRandomNumbers();
    return { user_id: e.user_id, numbers, match_count: countMatches(numbers, winningNumbers) };
  });

  const winnerCountByTier = { 5: 0, 4: 0, 3: 0 } as Record<3 | 4 | 5, number>;
  entries.forEach((e) => {
    if (e.match_count >= 3) winnerCountByTier[e.match_count as 3 | 4 | 5]++;
  });

  const split = splitPrizePool({ totalPoolCents, jackpotRolloverCents, winnerCountByTier });

  return NextResponse.json({
    periodLabel,
    mode,
    totalPoolCents,
    jackpotRolloverCents,
    winningNumbers,
    entrantCount: entrants.length,
    winnerCountByTier,
    ...split,
  });
}
