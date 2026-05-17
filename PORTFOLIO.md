# Bramble & Brew — client brief

> **Live demo:** https://coffee-shop-three-coral.vercel.app
> **Source:** https://github.com/kkostia/CoffeeShop
> **Admin:** https://coffee-shop-three-coral.vercel.app/admin · password `demo123`

Stripe is in **test mode** — pay with `4242 4242 4242 4242`, any future expiry, any CVC. Every order lands in `/admin` via signed webhook.

A single-page marketing site for a fictional Galway coffee shop, paired with an embedded AI assistant that takes real cupping bookings and real Stripe payments — end to end, persisted to a real database, surfaced on a real admin dashboard.

It's the pitch deck for "AI that pays for itself," in working form.

---

## The business pitch

Most small-business websites do one job: tell visitors where you are and when you're open. Then they sit there.

Bramble & Brew adds one capability on top of a well-crafted marketing site: an AI assistant that **books cupping sessions** and **takes bean orders via Stripe** without the owner lifting a finger. Every conversation, booking, and order is captured and shown on a `/admin` dashboard so the owner can see captured revenue at a glance.

That's the conversation with a café, gym, dentist, hair salon, photographer: *"Same beautiful website you'd pay anyone for — but the assistant makes you money while you sleep."*

---

## What this demonstrates technically

### 1. End-to-end OpenAI tool use (function calling)

`gpt-4o-mini` with the Vercel AI SDK v6. Two tools, strictly typed with Zod input schemas:

- `book_cupping_session(name, email, party_size, session_date)` → row in `cupping_bookings`
- `initiate_bean_order(bean_name, size_grams, quantity)` → real Stripe Checkout session

The model collects details conversationally, confirms before invoking the tool (except for orders, where Stripe handles email/shipping), then speaks the result back naturally. `stopWhen: stepCountIs(5)` lets a tool roundtrip + follow-up text happen in one streaming response.

Today's date is anchored into the system prompt at request time so the model resolves "next Sunday" correctly despite its 2024-ish knowledge cutoff.

### 2. Stripe Checkout integration with proper webhook handling

- `/api/checkout` — Zod-validated cart, **server-trusted prices** (looked up from `cafe-data.ts`, never read from the client). EU + UK shipping address collection. Free shipping over €30, otherwise €4.95 flat — server-decided, not customer-picked. Metadata packed with line-item JSON for the webhook to read back without re-fetching.
- `/api/webhooks/stripe` — HMAC signature verified with `stripe.webhooks.constructEvent` over the raw request body. Idempotent insert into `bean_orders` (`stripe_session_id` UNIQUE; pre-checked to avoid noisy retries). Handles `checkout.session.completed` and `payment_intent.payment_failed`. Returns 500 on transient DB failures so Stripe retries with backoff.
- `/order/success` — server component that **re-verifies the session with Stripe** before rendering. Refuses to render unless `payment_status === "paid"`.
- One factory (`src/lib/stripe/create-bean-checkout.ts`) builds the Checkout session from both the **beans card** and the **chatbot tool** — shipping rules, prices, and metadata shape live in exactly one file.

### 3. Real database with row-level security

Supabase Postgres, three tables, all RLS-enabled:

- `conversations` (transcripts, jsonb messages) — anon can `INSERT`; `UPDATE` only when `session_id` matches an `x-session-id` request header (uses `current_setting('request.headers', true)::jsonb`).
- `cupping_bookings` — anon `INSERT` allowed, no `SELECT`.
- `bean_orders` — service-role only. RLS enabled with zero anon policies = full deny.

Cents-based money math (no floats), auto-bumping `updated_at` trigger, JSONB shipping address + line items so each row stands on its own.

### 4. Streaming AI responses with proper error handling

`streamText` from the AI SDK with `result.textStream` piped through a manual `ReadableStream` — catches provider errors (`insufficient_quota`, `invalid_api_key`, rate limit) mid-stream and surfaces them as a friendly sentence in the chat bubble instead of an empty response. The error message strings are tuned per error class.

### 5. Production-quality UI/UX, no off-the-shelf shadcn

- Hand-picked coffee palette in Tailwind v4 `@theme` block (`#FAF7F2` cream, `#6F4E37` saddle brown, `#D4A574` warm tan) — defined once, used everywhere.
- Fraunces (variable serif, `opsz` axis) for display, Inter for body.
- Custom utilities: `.btn-shine` (diagonal hover pass), `.ring-pulse` (double-ring chat button pulse), `.bg-noise` (inline-SVG noise overlay).
- Framer Motion scroll reveals with a shared easing token (`--ease-cafe: cubic-bezier(0.22, 1, 0.36, 1)`).
- Mobile chat is a full-screen takeover; desktop is a floating panel. Same component.

### 6. Admin dashboard with click-to-expand detail

`/admin` (password gate, timing-safe equality check, `sessionStorage`-cached auth) shows:

- **Conversations** (last 7 days) — click any card for the full transcript in a modal.
- **Cupping bookings** — table with status badges.
- **Bean orders** (last 30 days) — table with revenue summary at the top; row click opens an `OrderModal` with full line items, shipping address, and **deep links into the Stripe dashboard** for both the Checkout Session and the Payment Intent (auto-detects test vs live from the ID prefix).

---

## Adaptation timeline (rebrand to a different business)

| Change | Files touched | Time |
|---|---|---|
| Cafe → dentist / salon / gym | `src/lib/cafe-data.ts` (one file) — menu/services, hours, FAQs, location | 30 min |
| Palette + fonts | `src/app/globals.css` `@theme` block + `layout.tsx` `next/font` imports | 30 min |
| Tools (booking / order) → new domain (appointments, classes, products) | `src/lib/chat/tools.ts` zod schemas + execute bodies; matching DB tables in `supabase/migrations/` | 2–4 hrs |
| Section copy + section structure | `src/components/site/*` — hero, about, menu, beans, visit | 2–4 hrs |
| Redeploy on Vercel | env vars + Stripe webhook URL update | 30 min |

**Realistic delivery for a new client: 1–2 days from briefing call to live demo URL.**

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | Route handlers for chat/checkout/webhook, server components for /order/success, static rendering for /admin shell |
| Language | TypeScript strict | Zod schemas + Stripe typed events catch the silly stuff at build time |
| Styling | Tailwind v4 config-in-CSS | No `tailwind.config.ts` to maintain — theme lives in `globals.css` |
| AI | Vercel AI SDK v6 + `gpt-4o-mini` | Cheap, fast, plenty for this — tool calls work great |
| Payments | Stripe Checkout (hosted) + webhooks | PCI scope minimization; Stripe owns the card form |
| DB | Supabase (postgres) | RLS for free, generous free tier, easy to demo |
| Animation | Framer Motion | Scroll reveals, AnimatePresence for the chat panel |
| Atoms | Radix primitives, Lucide icons, Sonner, Vaul | Accessibility for free, look custom |
| Hosting | Vercel | Zero-config Next.js, signed webhook URLs work over Edge Network |

---

## Code organization highlights

```
src/
  app/
    api/
      chat/          # streamText + tools + Supabase persistence
      checkout/      # Zod-validated cart → Stripe URL
      webhooks/stripe/   # HMAC-verified, idempotent
      admin/data/    # password-gated, scoped queries
    admin/page.tsx   # transcripts + bookings + orders dashboard
    order/success/   # server-verified thank-you
  components/
    site/            # nav / hero / about / menu / beans / visit / footer
    chat/            # launcher / panel / bubbles / typing indicator
    ui/              # button / card / badge / input / tabs / section / logo
  lib/
    cafe-data.ts     # SINGLE SOURCE OF TRUTH
    chat/            # bus, storage, system-prompt, responder (stub), tools, types
    stripe/          # client (singleton), create-bean-checkout (shared factory)
    supabase/        # browser client + service-role admin
supabase/
  migrations/0001_init.sql
```

---

## What's intentionally NOT in this build

- **No customer auth.** The chatbot keeps identity per browser via a `session_id` in localStorage.
- **No fabricated testimonials or reviews.** Can't ethically invent customers.
- **No stock photography.** Warm gradients, dotted menu lines, gradient bean-bag headers — every visual is CSS so nothing looks borrowed.

---

## Commit history reads as the build

`feat(db)` → `feat(ui)` → `feat(nav)` → `feat(hero)` → `feat(about)` → `feat(menu)` → `feat(beans)` → `feat(visit)` → `feat(footer)` → `feat(chat)` → `feat(admin)` → `fix(chat): error visibility + date anchor` → `feat(stripe)` → `feat(beans): purchasable` → `feat(chat): wire bean order tool to Stripe` → `feat(stripe): webhook` → `feat(orders): success page + admin orders tab` → `docs: stripe local testing`.

Walks straight through the build. Recruiter-friendly.
