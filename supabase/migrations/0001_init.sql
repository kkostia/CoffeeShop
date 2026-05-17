-- Bramble & Brew — initial schema (Stripe-aware bean_orders + RLS)
--
-- Safe to re-run: bean_orders is dropped + recreated so the Stripe-shaped
-- replacement applies even if the original (pre-Stripe) version was already
-- applied. conversations and cupping_bookings use IF NOT EXISTS — their
-- shape hasn't changed.
--
-- Paste into Supabase Dashboard → SQL Editor → Run.

create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────────────────────
-- conversations
-- One row per browser session. Updated in place as messages stream in.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id               uuid primary key default uuid_generate_v4(),
  session_id       text not null unique,
  started_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now(),
  messages         jsonb not null default '[]'::jsonb
);

create index if not exists conversations_last_message_at_idx
  on public.conversations (last_message_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- cupping_bookings — created via chatbot tool call (service role insert)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.cupping_bookings (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  email         text not null,
  party_size    integer not null check (party_size > 0 and party_size <= 10),
  session_date  date not null,
  status        text not null default 'pending'
                check (status in ('pending', 'confirmed', 'cancelled')),
  created_at    timestamptz not null default now()
);

create index if not exists cupping_bookings_created_idx
  on public.cupping_bookings (created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- bean_orders — written by the Stripe webhook on checkout.session.completed.
-- Stripe is the source of truth; this table is a read-optimized mirror.
-- ──────────────────────────────────────────────────────────────────────────
drop table if exists public.bean_orders cascade;

create table public.bean_orders (
  id                        uuid primary key default uuid_generate_v4(),

  -- Stripe linkage
  stripe_session_id         text not null unique,            -- idempotency anchor
  stripe_payment_intent_id  text,

  -- Customer
  customer_email            text not null,
  customer_name             text,
  shipping_address          jsonb,                            -- Stripe address shape

  -- Cart snapshot (denormalized so the row stands on its own)
  -- Each entry: { "bean_name", "size_grams", "quantity", "unit_price_cents" }
  line_items                jsonb not null default '[]'::jsonb,

  -- Money (always in cents to avoid float pain)
  subtotal_cents            integer not null,
  shipping_cents            integer not null default 0,
  total_cents               integer not null,
  currency                  text not null default 'eur',

  -- Lifecycle
  status                    text not null default 'pending'
                            check (status in ('pending','paid','failed','refunded','shipped')),
  metadata                  jsonb not null default '{}'::jsonb,
  created_at                timestamptz not null default now(),
  paid_at                   timestamptz,
  updated_at                timestamptz not null default now()
);

create index if not exists bean_orders_created_idx
  on public.bean_orders (created_at desc);
create index if not exists bean_orders_status_idx
  on public.bean_orders (status);
create index if not exists bean_orders_email_idx
  on public.bean_orders (customer_email);

-- Auto-bump updated_at on every row change.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists bean_orders_set_updated_at on public.bean_orders;
create trigger bean_orders_set_updated_at
  before update on public.bean_orders
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- Row-Level Security
--
-- Service role bypasses RLS, so every server-side write (chat API, webhook,
-- admin reads) is unaffected by the policies below. The anon policies are
-- defense-in-depth in case writes ever move client-side.
-- ──────────────────────────────────────────────────────────────────────────

-- conversations -----------------------------------------------------------
alter table public.conversations enable row level security;

drop policy if exists conversations_anon_insert on public.conversations;
create policy conversations_anon_insert
  on public.conversations for insert
  to anon
  with check (true);

-- Anon may only update a row whose session_id matches an x-session-id
-- header on the request. Supabase exposes request headers via
-- current_setting('request.headers', true)::jsonb.
drop policy if exists conversations_anon_update_own on public.conversations;
create policy conversations_anon_update_own
  on public.conversations for update
  to anon
  using (
    session_id = coalesce(
      current_setting('request.headers', true)::jsonb ->> 'x-session-id',
      ''
    )
  )
  with check (
    session_id = coalesce(
      current_setting('request.headers', true)::jsonb ->> 'x-session-id',
      ''
    )
  );

-- (intentionally no anon SELECT — transcripts are admin-only)

-- cupping_bookings --------------------------------------------------------
alter table public.cupping_bookings enable row level security;

drop policy if exists cupping_bookings_anon_insert on public.cupping_bookings;
create policy cupping_bookings_anon_insert
  on public.cupping_bookings for insert
  to anon
  with check (true);

-- (no anon SELECT/UPDATE/DELETE — admin reads via service role)

-- bean_orders -------------------------------------------------------------
-- Service role only. Webhook writes, admin reads. No anon access at all
-- (RLS enabled + zero policies for the anon role = full deny).
alter table public.bean_orders enable row level security;
