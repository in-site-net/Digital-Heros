# Digital Heroes

A subscription-based golf performance + charity draw platform, built against the
Digital Heroes PRD (Level 1), March 2026.

## Stack
- **Next.js 14** (App Router, TypeScript) — frontend + API routes
- **Supabase** — Postgres database, Auth, Row Level Security, Storage (winner proof uploads)
- **Stripe** — subscription billing (Checkout + webhooks)
- **Tailwind CSS** — styling

## Where each PRD section lives

| PRD section | Implementation |
|---|---|
| §03 User roles | `profiles.role` enum + RLS `is_admin()` helper; `admin/layout.tsx` guards admin routes |
| §04 Subscription & payment | `app/subscribe`, `api/stripe/checkout`, `api/stripe/webhook`, `subscriptions` table |
| §05 Score management | `dashboard/ScorePanel.tsx`, `scores` table + `trg_score_rolling_window` trigger (keeps only latest 5) |
| §06/§07 Draw & prize pool | `lib/draw-engine.ts`, `api/draw/simulate`, `api/draw/run`, `admin/draws` |
| §08 Charity system | `charities` table, `app/charities`, `dashboard/CharityPanel.tsx`, `admin/charities` |
| §09 Winner verification | `winners` table, `dashboard/WinningsPanel.tsx` (upload), `admin/winners` (approve/reject/pay) |
| §10 User dashboard | `app/dashboard/page.tsx` |
| §11 Admin dashboard | `app/admin/*` (users, draws, charities, winners, reports) |
| §12 UI/UX | Custom design system — ink/brass/leaf palette, Fraunces + Manrope type, no golf clichés |

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase + Stripe keys.
3. In the Supabase SQL editor, run `supabase/schema.sql` once against a fresh project.
4. `npm run dev` → http://localhost:3000

## Notes & assumptions made to resolve PRD ambiguity

- **Draw ticket numbers**: the PRD doesn't specify a number range, so entrants
  are assigned 5 unique numbers from a 1–49 pool each draw (standard lottery
  convention), and "algorithmic" mode weights the draw's own winning numbers
  by how often those score values appear across all logged scores.
- **Prize pool base**: "a fixed portion of each subscription" is read as the
  full active-subscriber revenue for the period feeding the pool; adjust the
  percentage taken before it hits the pool in `api/draw/simulate` if the
  business wants a different base.
- **Currency**: displayed in INR (₹) since the assignment is issued by an
  India-based company; swap in `lib/stripe.ts` if needed.
- **Admin bootstrapping**: the first admin must be promoted manually (see
  deployment guide) since there's no self-serve "become admin" flow.
