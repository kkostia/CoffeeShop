-- Bramble & Brew — initial schema
-- Run via Supabase Dashboard → SQL Editor.
-- Tables: conversations, cupping_bookings, bean_orders.

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
-- cupping_bookings — created via chatbot tool call
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
-- bean_orders — created via chatbot tool call
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.bean_orders (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text not null,
  address     text not null,
  bean_name   text not null,
  size_grams  integer not null check (size_grams in (250, 500, 1000)),
  price       numeric(8, 2) not null,
  status      text not null default 'pending'
              check (status in ('pending', 'shipped', 'delivered', 'cancelled')),
  created_at  timestamptz not null default now()
);

create index if not exists bean_orders_created_idx
  on public.bean_orders (created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- Row-Level Security
-- All writes/reads happen via the service-role key from server-side code,
-- so we enable RLS with no public policies. Service role bypasses RLS.
-- ──────────────────────────────────────────────────────────────────────────
alter table public.conversations     enable row level security;
alter table public.cupping_bookings  enable row level security;
alter table public.bean_orders       enable row level security;
