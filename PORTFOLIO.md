# Bramble & Brew — portfolio brief

A single-page marketing site for a fictional Galway coffee shop, paired with a polished embedded AI assistant that handles real bookings and orders. Built end-to-end as a demo of what a small-business client can buy: a beautiful website *and* a chatbot that captures business value, not just clicks.

---

## The business problem this solves

Most small-business websites are static brochures: hours, menu, phone number. They convert visitors into "people who know where you are." That's it.

Bramble & Brew adds one thing on top of a beautifully crafted marketing site — an AI assistant that:

- Knows the entire menu, beans, hours, and FAQs by heart (no stale answers).
- Books cupping sessions and takes bean orders end-to-end via OpenAI tool calls.
- Persists every conversation, booking, and order to a Supabase database.
- Surfaces all of it on a hidden `/admin` dashboard so the owner sees the captured revenue.

That's the pitch to a real-world café, dentist, gym, hair salon: *"Same website, but the chatbot makes you money while you sleep."*

---

## Technical highlights to talk about in client calls

### 1. Single source of truth keeps the bot honest

`src/lib/cafe-data.ts` is the only place the menu, beans, and hours are defined. Both the on-page UI **and** the chatbot's system prompt are generated from it. When the price of a flat white changes, both surfaces change with one edit. The bot can never quote a price the menu doesn't show.

### 2. Streaming chat over a tiny custom protocol

The chat panel reads `/api/chat` as a `ReadableStream<Uint8Array>` of plain text chunks. No SDK lock-in on the client. When `OPENAI_API_KEY` is set the route swaps the stub for `streamText` from the Vercel AI SDK + tool calls — the wire format doesn't change, so the client stays put.

### 3. Tool calls as the demo's centerpiece

`book_cupping_session` and `place_bean_order` are OpenAI function calls. The model collects the required fields conversationally, confirms back, then invokes the tool. The tool handler inserts into Supabase (`cupping_bookings`, `bean_orders`) and returns a confirmation the model speaks back to the user. End result: a real row in the database without a single form.

### 4. CTAs everywhere open the chatbot — with prefill

A small custom event bus (`lib/chat/bus.ts`) lets the "Chat with us" hero CTA and the "Book a cupping session" Visit CTA call `openChat("I'd like to book a cupping session")`. The launcher subscribes, opens, and pre-fills the input. No prop drilling, no global store, no React Context.

### 5. The admin view proves business value

`/admin` (password-gated, demo password `demo123`) shows:
- Conversations from the last 7 days, click-to-expand into a full transcript modal
- All-time cupping bookings table
- All-time bean orders table

When you walk a prospective client through this page, the conversation lands differently. "Here's where the money shows up" sells better than "here's the chat widget."

### 6. Custom warm design system, no off-the-shelf shadcn defaults

Tailwind v4 `@theme` block with hand-picked coffee tones (`#FAF7F2` cream, `#6F4E37` saddle brown, `#D4A574` warm tan). Fraunces serif for display headlines, Inter for body. Custom `.btn-shine`, `.ring-pulse`, `.bg-noise` utilities. Section reveals on scroll with Framer Motion `whileInView`. Doesn't look like every other AI-generated site.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | SSR-ready, route handlers for the chat API, App Router file conventions |
| Language | TypeScript strict | catch the silly stuff at build time |
| Styling | Tailwind v4 (`@theme` in CSS) | config-in-CSS, no `tailwind.config.ts` to maintain |
| Animation | Framer Motion | scroll reveals + chat panel transitions |
| AI | Vercel AI SDK v6 + OpenAI `gpt-4o-mini` | cheap, fast, plenty for this — tool calls work great |
| DB | Supabase (postgres) | row-level security, free tier, easy to demo |
| UI atoms | Radix primitives + custom | accessibility for free, look custom |
| Icons | Lucide React | clean, tree-shakable |
| Toasts | Sonner | one-line installs, gorgeous out of the box |
| Hosting | Vercel | zero-config Next.js, edge functions free |

---

## What's intentionally NOT in this build

- **No customer auth.** This is a marketing site, not a SaaS — the chatbot keeps its identity per browser via a `session_id` in localStorage.
- **No real Stripe.** "Add to bag" is a visual delight (toast confirmation) — real checkout is scope-creep for a portfolio piece.
- **No fabricated testimonials or reviews.** Can't ethically invent customers.
- **No stock photography.** Every visual is CSS — warm gradients, dotted menu lines, gradient bean-bag headers. Makes it clear nothing is borrowed.

---

## Commit history reads as the build

The git log walks through the build feature by feature — `chore: scaffold` → `feat(ui)` → `feat(nav)` → `feat(hero)` → `feat(about)` → `feat(menu)` → `feat(beans)` → `feat(visit)` → `feat(footer)` → `feat(chat)` → `feat(admin)`. Recruiter-friendly.
