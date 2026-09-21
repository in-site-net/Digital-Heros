import { POOL_SHARES } from "./types";

const NUMBER_POOL_SIZE = 49; // draw 5 numbers from 1-49, like a standard lottery
const NUMBERS_DRAWN = 5;

/** Draw N unique numbers uniformly at random from 1..poolSize. */
export function drawRandomNumbers(
  poolSize = NUMBER_POOL_SIZE,
  count = NUMBERS_DRAWN
): number[] {
  const pool = Array.from({ length: poolSize }, (_, i) => i + 1);
  const result: number[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result.sort((a, b) => a - b);
}

/**
 * "Algorithmic" mode: weight number selection by each entrant's recent
 * score frequency, so numbers tied to a player's more common Stableford
 * scores are slightly more likely to appear. This keeps the draw feeling
 * connected to actual play rather than being pure chance.
 */
export function drawWeightedNumbers(
  scoreFrequency: Map<number, number>,
  poolSize = NUMBER_POOL_SIZE,
  count = NUMBERS_DRAWN
): number[] {
  const weights = new Map<number, number>();
  for (let n = 1; n <= poolSize; n++) {
    // Base weight of 1 for every number, plus a bump for numbers that map
    // (via modulo) onto commonly-entered scores, so the influence is
    // present but doesn't make the draw predictable or gameable.
    const bucket = ((n - 1) % 45) + 1;
    const bump = scoreFrequency.get(bucket) ?? 0;
    weights.set(n, 1 + bump);
  }

  const result: number[] = [];
  const remaining = new Map(weights);
  for (let i = 0; i < count && remaining.size > 0; i++) {
    const total = Array.from(remaining.values()).reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let chosen = -1;
    for (const [num, w] of remaining) {
      r -= w;
      if (r <= 0) {
        chosen = num;
        break;
      }
    }
    if (chosen === -1) chosen = Array.from(remaining.keys())[0];
    result.push(chosen);
    remaining.delete(chosen);
  }
  return result.sort((a, b) => a - b);
}

/** Count how many of a player's numbers match the winning numbers. */
export function countMatches(playerNumbers: number[], winningNumbers: number[]): number {
  const winSet = new Set(winningNumbers);
  return playerNumbers.filter((n) => winSet.has(n)).length;
}

export interface PoolSplitInput {
  totalPoolCents: number;
  jackpotRolloverCents: number;
  winnerCountByTier: Record<3 | 4 | 5, number>;
}

export interface PoolSplitResult {
  tierPoolCents: Record<3 | 4 | 5, number>;
  perWinnerCents: Record<3 | 4 | 5, number>;
  newJackpotRolloverCents: number;
}

/**
 * §07 Prize pool logic:
 *  - 5-match: 40% of pool, rolls over (jackpot) if unclaimed
 *  - 4-match: 35% of pool, no rollover
 *  - 3-match: 25% of pool, no rollover
 *  - Ties within a tier split that tier's pool equally.
 */
export function splitPrizePool({
  totalPoolCents,
  jackpotRolloverCents,
  winnerCountByTier,
}: PoolSplitInput): PoolSplitResult {
  const pool5 = Math.round(totalPoolCents * POOL_SHARES[5]) + jackpotRolloverCents;
  const pool4 = Math.round(totalPoolCents * POOL_SHARES[4]);
  const pool3 = Math.round(totalPoolCents * POOL_SHARES[3]);

  const tierPoolCents = { 5: pool5, 4: pool4, 3: pool3 };
  const perWinnerCents = { 5: 0, 4: 0, 3: 0 } as Record<3 | 4 | 5, number>;
  let newJackpotRolloverCents = 0;

  ([5, 4, 3] as const).forEach((tier) => {
    const winners = winnerCountByTier[tier] || 0;
    if (winners > 0) {
      perWinnerCents[tier] = Math.floor(tierPoolCents[tier] / winners);
    } else if (tier === 5) {
      // Unclaimed jackpot rolls forward to next month.
      newJackpotRolloverCents = tierPoolCents[5];
    }
    // Unclaimed 4- or 3-match pools are not rolled over per the PRD (only
    // the 5-match jackpot rolls over) — they simply aren't paid out.
  });

  return { tierPoolCents, perWinnerCents, newJackpotRolloverCents };
}
