export type UserRole = "subscriber" | "admin";
export type SubPlan = "monthly" | "yearly";
export type SubStatus = "active" | "inactive" | "canceled" | "lapsed";
export type DrawMode = "random" | "algorithmic";
export type DrawStatus = "draft" | "simulated" | "published";
export type PaymentStatus = "pending" | "paid";
export type VerificationStatus = "awaiting_proof" | "submitted" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  charity_id: string | null;
  charity_percent: number;
  created_at: string;
}

export interface Charity {
  id: string;
  name: string;
  summary: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  is_featured: boolean;
  upcoming_event_name: string | null;
  upcoming_event_date: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubPlan;
  status: SubStatus;
  current_period_end: string | null;
  amount_cents: number;
}

export interface Score {
  id: string;
  user_id: string;
  score: number;
  played_on: string;
  created_at: string;
}

export interface Draw {
  id: string;
  period_label: string;
  mode: DrawMode;
  status: DrawStatus;
  total_pool_cents: number;
  pool_5_cents: number;
  pool_4_cents: number;
  pool_3_cents: number;
  jackpot_rollover_cents: number;
  winning_numbers: number[];
  published_at: string | null;
}

export interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  numbers: number[];
  match_count: number;
}

export interface Winner {
  id: string;
  draw_id: string;
  user_id: string;
  match_tier: 3 | 4 | 5;
  amount_cents: number;
  proof_url: string | null;
  verification: VerificationStatus;
  payment: PaymentStatus;
}

// Prize pool shares, per §07 of the PRD
export const POOL_SHARES: Record<5 | 4 | 3, number> = {
  5: 0.4,
  4: 0.35,
  3: 0.25,
};

export const MIN_CHARITY_PERCENT = 10;
