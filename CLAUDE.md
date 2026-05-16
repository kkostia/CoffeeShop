# Bramble & Brew

A portfolio demo: marketing site + embedded AI chatbot for a fictional Galway coffee shop. The chatbot is the differentiator — it knows the menu/beans/hours, books real cupping sessions, and takes bean orders via OpenAI tool calls, all persisted in Supabase. A hidden `/admin` panel surfaces the captured business value.

## Stack

- Next.js 14 (App Router) + TypeScript strict
- Tailwind CSS v4 (config-in-CSS via `@theme` in `globals.css`)
- shadcn-style primitives (Radix under the hood)
- Framer Motion for chat animations and scroll reveals
- Vercel AI SDK v6 (`ai`) + `@ai-sdk/openai` for streaming + tool use
- Supabase (postgres) for `conversations`, `cupping_bookings`, `bean_orders`
- Sonner toasts, Lucide icons, Vaul mobile drawer
- pnpm workspace, deployed on Vercel

## Source of truth

`src/lib/cafe-data.ts` — menu, beans, hours, FAQs. Both the UI **and** the chatbot system prompt read from this file. If the menu changes, both surfaces update together; the bot can never quote a price the menu doesn't show.

## Design system

Hand-picked coffee palette. Do NOT default to slate-50 or any shadcn stock theme.

| Token | Hex | Use |
|---|---|---|
| `background` | `#FAF7F2` | Page background — warm cream |
| `foreground` | `#2D1F14` | Body text — deep coffee brown |
| `primary` | `#6F4E37` | Buttons, focus rings, headings accents |
| `primary-foreground` | `#FAF7F2` | Text on primary |
| `accent` | `#D4A574` | Highlights, signature tags, hover glow |
| `muted` | `#EFE7DA` | Section backgrounds, hover states |
| `muted-foreground` | `#6B5848` | Secondary copy |
| `card` | `#FFFCF7` | Card surfaces, bot panel |
| `border` | `#E8DDD0` | Hairlines, dividers |

Tailwind v4 exposes these as `bg-background`, `text-foreground`, `border-border`, etc.

### Typography

- **Display (h1–h5):** Fraunces (variable serif, opsz + SOFT axes loaded). Reach for it on hero headlines, section titles, the logo.
- **Body:** Inter. Reach for it everywhere else.
- Hierarchy: `text-5xl md:text-7xl` for hero, `text-4xl md:text-5xl` for section titles, `text-base/[1.65]` for prose.

### Motion

- Easing: `var(--ease-cafe)` = `cubic-bezier(0.22, 1, 0.36, 1)`. Slightly sprung. Use this for hover states and the chat panel open.
- Section reveals: Framer Motion `whileInView` with `viewport={{ once: true, margin: "-15%" }}` and short stagger.
- Buttons: subtle `translate-y-[-1px]` on hover + the `.btn-shine` utility (diagonal highlight pass).
- Chatbot button: `.ring-pulse` utility renders two expanding rings.

### Layout principles

- Generous but intentional whitespace. Sections separated by `py-24 md:py-32`.
- Asymmetric layouts where appropriate — don't center everything.
- Bordered cards (`border border-border bg-card`) preferred over heavy shadows.
- Mobile-first; verify each section ≤ 375px before shipping.

## Project structure

```
src/
  app/
    layout.tsx          # Fraunces + Inter, Toaster, root metadata
    page.tsx            # Marketing sections composed top-to-bottom
    globals.css         # Tailwind v4 @theme + utilities + animations
    admin/page.tsx      # Hidden admin (password gate + tabs)
    api/chat/route.ts   # Chat stream endpoint (stub → real AI SDK)
  components/
    site/               # Marketing sections (nav, hero, about, menu, beans, visit, footer)
    chat/               # Floating button, panel, message bubbles
    ui/                 # Local shadcn-style primitives (button, card, tabs, input)
  lib/
    cafe-data.ts        # SINGLE SOURCE OF TRUTH for the cafe
    utils.ts            # cn() + formatEUR()
    supabase/
      client.ts         # Browser client (uses anon key)
      admin.ts          # Server-only client (service role)
    chat/
      system-prompt.ts  # Bot persona + cafe knowledge — built from cafe-data
      tools.ts          # book_cupping_session, place_bean_order
supabase/
  migrations/0001_init.sql
```

## The chatbot

Persona: warm, enthusiastic about coffee, occasional light humor, knowledgeable but never preachy. Brief — 1–3 sentences per reply. One emoji allowed (☕).

System prompt is built dynamically from `cafe-data.ts` so it can never go stale.

Tool calls:
- `book_cupping_session(name, email, date, party_size)` → inserts into `cupping_bookings`, returns confirmation
- `place_bean_order(bean_name, size_grams, name, email, address)` → inserts into `bean_orders`, returns confirmation with order id

Off-topic redirect: "I'm just the cafe's assistant, but I can tell you about our coffee or help you visit!"

## Setup

```bash
pnpm install
cp .env.example .env.local         # fill in keys
# Apply DB migration: paste supabase/migrations/0001_init.sql into Supabase SQL Editor
pnpm dev
```

## Commit cadence

One feature = one commit + push. The git history should read as a clean walk through the build (`feat: hero section`, `feat: chatbot floating button`, `feat: book_cupping_session tool`, …).

## What this project is NOT

- No customer auth — marketing site only.
- No real Stripe — "Add to bag" shows a toast.
- No fabricated reviews or testimonials.
- No stock photos — warm CSS gradients and color blocks, applied intentionally.
- No emojis in marketing UI (the bot is the exception — one ☕).
