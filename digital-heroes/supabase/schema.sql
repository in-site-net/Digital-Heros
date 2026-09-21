-- ============================================================================
-- DIGITAL HEROES — Supabase schema
-- Run this in the Supabase SQL editor on a fresh project.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PROFILES  (§03 User roles, extends Supabase auth.users)
-- ---------------------------------------------------------------------------
create type user_role as enum ('subscriber', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'subscriber',
  charity_id uuid,  -- FK added after charities table exists, below
  charity_percent numeric(5,2) not null default 10.00 check (charity_percent >= 10.00 and charity_percent <= 100.00),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CHARITIES  (§08 Charity system)
-- ---------------------------------------------------------------------------
create table charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  summary text not null,
  description text,
  image_url text,
  category text,
  is_featured boolean not null default false,
  upcoming_event_name text,
  upcoming_event_date date,
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_charity_id_fkey foreign key (charity_id) references charities(id) on delete set null;

-- ---------------------------------------------------------------------------
-- SUBSCRIPTIONS  (§04 Subscription & payment)
-- ---------------------------------------------------------------------------
create type sub_plan as enum ('monthly', 'yearly');
create type sub_status as enum ('active', 'inactive', 'canceled', 'lapsed');

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  plan sub_plan not null,
  status sub_status not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  amount_cents integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on subscriptions (user_id);

-- ---------------------------------------------------------------------------
-- SCORES  (§05 Score management — rolling window of 5, Stableford 1-45)
-- ---------------------------------------------------------------------------
create table scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  score integer not null check (score >= 1 and score <= 45),
  played_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, played_on)  -- only one score entry per date
);
create index on scores (user_id, played_on desc);

-- Enforce "only the latest 5 scores are retained": a trigger deletes the
-- oldest row for a user whenever a 6th is inserted.
create or replace function enforce_score_rolling_window()
returns trigger as $$
begin
  delete from scores
  where id in (
    select id from scores
    where user_id = new.user_id
    order by played_on desc, created_at desc
    offset 5
  );
  return new;
end;
$$ language plpgsql;

create trigger trg_score_rolling_window
after insert on scores
for each row execute function enforce_score_rolling_window();

-- ---------------------------------------------------------------------------
-- DRAWS  (§06 Draw & reward system, §07 Prize pool logic)
-- ---------------------------------------------------------------------------
create type draw_mode as enum ('random', 'algorithmic');
create type draw_status as enum ('draft', 'simulated', 'published');

create table draws (
  id uuid primary key default gen_random_uuid(),
  period_label text not null,          -- e.g. '2026-09'
  mode draw_mode not null default 'random',
  status draw_status not null default 'draft',
  total_pool_cents integer not null default 0,
  pool_5_cents integer not null default 0,   -- 40% share
  pool_4_cents integer not null default 0,   -- 35% share
  pool_3_cents integer not null default 0,   -- 25% share
  jackpot_rollover_cents integer not null default 0,
  winning_numbers int[] not null default '{}',
  run_by uuid references profiles(id),
  simulated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references draws(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  numbers int[] not null,
  match_count integer not null default 0, -- computed at draw time
  created_at timestamptz not null default now(),
  unique (draw_id, user_id)
);

-- ---------------------------------------------------------------------------
-- WINNERS  (§09 Winner verification)
-- ---------------------------------------------------------------------------
create type payment_status as enum ('pending', 'paid');
create type verification_status as enum ('awaiting_proof', 'submitted', 'approved', 'rejected');

create table winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references draws(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  match_tier integer not null check (match_tier in (3,4,5)),
  amount_cents integer not null,
  proof_url text,
  verification verification_status not null default 'awaiting_proof',
  payment payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- DONATIONS  (§08.1 independent donation, not tied to gameplay)
-- ---------------------------------------------------------------------------
create table donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  charity_id uuid not null references charities(id),
  amount_cents integer not null,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table profiles enable row level security;
alter table charities enable row level security;
alter table subscriptions enable row level security;
alter table scores enable row level security;
alter table draws enable row level security;
alter table draw_entries enable row level security;
alter table winners enable row level security;
alter table donations enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- PROFILES: users read/update their own row; admins read/update all.
create policy "profiles_select_own_or_admin" on profiles
  for select using (auth.uid() = id or is_admin());
create policy "profiles_update_own_or_admin" on profiles
  for update using (auth.uid() = id or is_admin());
create policy "profiles_insert_self" on profiles
  for insert with check (auth.uid() = id);

-- CHARITIES: public read; admin write.
create policy "charities_public_read" on charities for select using (true);
create policy "charities_admin_write" on charities for insert with check (is_admin());
create policy "charities_admin_update" on charities for update using (is_admin());
create policy "charities_admin_delete" on charities for delete using (is_admin());

-- SUBSCRIPTIONS: user reads own; admin reads/writes all; writes otherwise via service role only.
create policy "subs_select_own_or_admin" on subscriptions
  for select using (auth.uid() = user_id or is_admin());
create policy "subs_admin_write" on subscriptions for insert with check (is_admin());
create policy "subs_admin_update" on subscriptions for update using (is_admin());

-- SCORES: user manages own; admin can read/edit all (§11 admin can edit golf scores).
create policy "scores_select_own_or_admin" on scores
  for select using (auth.uid() = user_id or is_admin());
create policy "scores_insert_own" on scores
  for insert with check (auth.uid() = user_id or is_admin());
create policy "scores_update_own_or_admin" on scores
  for update using (auth.uid() = user_id or is_admin());
create policy "scores_delete_own_or_admin" on scores
  for delete using (auth.uid() = user_id or is_admin());

-- DRAWS: subscribers can read published draws; admin full control.
create policy "draws_select_published_or_admin" on draws
  for select using (status = 'published' or is_admin());
create policy "draws_admin_write" on draws for insert with check (is_admin());
create policy "draws_admin_update" on draws for update using (is_admin());

-- DRAW ENTRIES: user reads own; admin reads all.
create policy "entries_select_own_or_admin" on draw_entries
  for select using (auth.uid() = user_id or is_admin());
create policy "entries_admin_write" on draw_entries for insert with check (is_admin());

-- WINNERS: user reads own; admin full control.
create policy "winners_select_own_or_admin" on winners
  for select using (auth.uid() = user_id or is_admin());
create policy "winners_update_own_proof" on winners
  for update using (auth.uid() = user_id or is_admin());
create policy "winners_admin_insert" on winners for insert with check (is_admin());

-- DONATIONS: user reads own; admin reads all; anyone (incl. anonymous via service role) can insert.
create policy "donations_select_own_or_admin" on donations
  for select using (auth.uid() = user_id or is_admin());
create policy "donations_insert_own" on donations
  for insert with check (auth.uid() = user_id or auth.uid() is null);

-- ============================================================================
-- SEED DATA (a few sample charities so the directory isn't empty on first run)
-- ============================================================================
insert into charities (name, summary, description, category, is_featured, upcoming_event_name, upcoming_event_date)
values
  ('Fairway Futures', 'Junior golf scholarships for underserved communities.', 'Fairway Futures funds coaching, equipment and course access for young players who could not otherwise afford them.', 'Youth & Education', true, 'Scholarship Golf Day', current_date + interval '30 days'),
  ('Green Relief Fund', 'Emergency relief for families facing medical hardship.', 'Green Relief Fund covers urgent medical and living costs for families referred by partner hospitals.', 'Health', false, null, null),
  ('Clean Waters Trust', 'Protecting local rivers and wetlands around golf courses.', 'Clean Waters Trust runs habitat restoration projects on and around municipal courses.', 'Environment', false, 'Riverbank Cleanup', current_date + interval '14 days');

-- ============================================================================
-- STORAGE — bucket for winner proof screenshots (§09 Winner verification)
-- Run this after the tables above exist. Safe to re-run.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('winner-proofs', 'winner-proofs', true)
on conflict (id) do nothing;

-- Any authenticated user can upload a proof file (they can only link it to
-- their own winner row from the app layer, enforced by the `winners` RLS
-- policy above — storage itself just needs to allow the write).
create policy "winner_proofs_authenticated_upload" on storage.objects
  for insert with check (bucket_id = 'winner-proofs' and auth.role() = 'authenticated');

-- Public read so admins and the uploader can view via the stored public URL.
create policy "winner_proofs_public_read" on storage.objects
  for select using (bucket_id = 'winner-proofs');

