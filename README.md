# Bramble & Brew

> Slow coffee. Real conversations.

A portfolio demo site for a fictional third-wave coffee shop in Galway's Latin Quarter. Built to showcase modern web craft alongside a polished, production-shaped AI chatbot that small-business clients would actually pay for.

## What's interesting

- **AI barista chatbot** (Vercel AI SDK + OpenAI tool calling) embedded in the bottom-right corner. Knows the menu, beans, hours, FAQs — and can book cupping sessions and take bean orders end-to-end, persisting both to Supabase.
- **Hidden `/admin` view** (password `demo123`) surfaces every conversation, booking, and order — proving the bot captures real business value, not just nice chats.
- **Hand-built warm design system** in Tailwind v4 (`@theme` config-in-CSS), Fraunces serif display + Inter body, Framer Motion interactions.
- **Single source of truth** in `src/lib/cafe-data.ts` — the marketing UI and the bot's system prompt both read from the same file, so the bot can never quote a stale price.

## Stack

| | |
|---|---|
| Framework | Next.js 14 App Router, TypeScript strict |
| Styling | Tailwind CSS v4, custom coffee palette |
| Animation | Framer Motion |
| AI | Vercel AI SDK v6, OpenAI `gpt-4o-mini`, tool calls |
| DB | Supabase (postgres) — conversations, bookings, orders |
| UI | Radix primitives, Lucide icons, Sonner, Vaul |
| Hosting | Vercel |

## Setup

```bash
pnpm install

# 1. Supabase: Dashboard → SQL Editor → paste supabase/migrations/0001_init.sql
# 2. Copy env template and fill keys
cp .env.example .env.local
#    NEXT_PUBLIC_SUPABASE_URL
#    NEXT_PUBLIC_SUPABASE_ANON_KEY
#    SUPABASE_SERVICE_ROLE_KEY
#    OPENAI_API_KEY   (optional; chatbot falls back to a scripted stub without it)

pnpm dev
```

Open http://localhost:3000. The chatbot is in the bottom-right; `/admin` is gated by `demo123`.

## Notable files

- `src/lib/cafe-data.ts` — the cafe in one file
- `src/lib/chat/system-prompt.ts` — bot persona built from the data above
- `src/lib/chat/tools.ts` — `book_cupping_session`, `place_bean_order`
- `src/app/api/chat/route.ts` — streaming chat endpoint
- `src/components/chat/` — floating button + panel + bubbles
- `src/app/admin/page.tsx` — the captured-value dashboard

## License

Portfolio demo — feel free to take inspiration.
