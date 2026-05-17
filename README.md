# Bramble & Brew

> Slow coffee. Real conversations.

A portfolio demo site for a fictional third-wave coffee shop in Galway's Latin Quarter. Built to showcase modern web craft alongside a polished, production-shaped AI chatbot that small-business clients would actually pay for.

## What's interesting

- **AI barista chatbot** (Vercel AI SDK + OpenAI tool calling) embedded in the bottom-right corner. Knows the menu, beans, hours, FAQs — and can book cupping sessions or kick off Stripe Checkout for a bean order, all in conversation.
- **Stripe Checkout end-to-end** — from the beans cards *and* from chat. Hosted Stripe page collects email + shipping, our webhook verifies the signature and lands a row in `bean_orders` (idempotent by `stripe_session_id`). `/order/success` re-verifies the session server-side before rendering the thank-you.
- **Hidden `/admin` view** (password `demo123`) surfaces every conversation, booking, and order with click-to-expand transcripts and Stripe-dashboard deep links — proving the bot captures real business value, not just nice chats.
- **Hand-built warm design system** in Tailwind v4 (`@theme` config-in-CSS), Fraunces serif display + Inter body, Framer Motion interactions.
- **Single source of truth** in `src/lib/cafe-data.ts` — the marketing UI, the bot's system prompt, *and* the Stripe price lookup all read from the same file. Prices can't drift between surfaces.

## Stack

| | |
|---|---|
| Framework | Next.js 14 App Router, TypeScript strict |
| Styling | Tailwind CSS v4, custom coffee palette |
| Animation | Framer Motion |
| AI | Vercel AI SDK v6, OpenAI `gpt-4o-mini`, tool calls |
| Payments | Stripe Checkout (hosted) + webhooks, EU + UK + IE shipping |
| DB | Supabase (postgres) — conversations, bookings, orders, RLS |
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
#    OPENAI_API_KEY            (optional in dev; chatbot falls back to a scripted stub without it)
#    STRIPE_SECRET_KEY         (optional in dev; required for the beans Buy-now button)
#    STRIPE_PUBLISHABLE_KEY
#    STRIPE_WEBHOOK_SECRET     (set this from `stripe listen` — see below)
#    NEXT_PUBLIC_APP_URL=http://localhost:3000
#    ADMIN_PASSWORD=demo123    (defaults to "demo123" if unset)

pnpm dev
```

Open http://localhost:3000. The chatbot is in the bottom-right; `/admin` is gated by the `ADMIN_PASSWORD` env var (defaults to `demo123`).

## Testing Stripe locally

Stripe Checkout works without anything extra — but to receive payment webhooks (which is what writes orders into `bean_orders`), you need the Stripe CLI forwarding events into your dev server.

**1. Install the Stripe CLI** (one-time):

- **macOS:** `brew install stripe/stripe-cli/stripe`
- **Windows:** `winget install --id Stripe.StripeCLI` or `scoop install stripe`
- **Linux:** [github.com/stripe/stripe-cli/releases](https://github.com/stripe/stripe-cli/releases)

Then `stripe login` once to link your test-mode account.

**2. Forward webhooks to your dev server:**

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The first line of output is your **webhook signing secret** (starts with `whsec_...`). Copy it into `.env.local` as `STRIPE_WEBHOOK_SECRET` and restart `pnpm dev`. Without this, the webhook route correctly rejects every event with a 400 — that's the security in action.

**3. Test cards** (any future expiry, any CVC, any postcode):

| Number | Result |
|---|---|
| `4242 4242 4242 4242` | Charge succeeds → `checkout.session.completed` → row in `bean_orders` with status `paid` |
| `4000 0000 0000 9995` | Declined → `payment_intent.payment_failed` |
| `4000 0025 0000 3155` | Requires 3D Secure → tests the authentication step |

After a successful test charge, refresh `/admin` → Bean orders tab. The new order should be there, click the row for the full breakdown + a deep link into the Stripe dashboard.

## Notable files

- `src/lib/cafe-data.ts` — the cafe in one file (menu, beans, hours, FAQs)
- `src/lib/chat/system-prompt.ts` — bot persona built from cafe-data + today's date
- `src/lib/chat/tools.ts` — `book_cupping_session`, `initiate_bean_order` (zod-typed)
- `src/lib/stripe/create-bean-checkout.ts` — shared cart → Stripe Checkout factory (used by /api/checkout AND the chat tool)
- `src/app/api/chat/route.ts` — streaming chat endpoint (streamText + tool use, stub fallback when OPENAI_API_KEY is absent)
- `src/app/api/checkout/route.ts` — POST { line_items } → Stripe Checkout URL
- `src/app/api/webhooks/stripe/route.ts` — signed webhook → `bean_orders` insert
- `src/app/order/success/page.tsx` — server-verified thank-you page
- `src/app/admin/page.tsx` — captured-value dashboard with conversation transcripts, bookings, and orders

## License

Portfolio demo — feel free to take inspiration.
