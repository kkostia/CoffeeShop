import Link from "next/link";
import type Stripe from "stripe";
import { ArrowLeft, Check, Coffee, Mail, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/site/navigation";
import { Footer } from "@/components/site/footer";
import { getStripe } from "@/lib/stripe/client";
import { ChatCta } from "./chat-cta";

// Don't pre-render or cache — this page is per-session and must always
// re-verify with Stripe.
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { session_id?: string };
}

export default async function OrderSuccess({ searchParams }: PageProps) {
  const sessionId = searchParams.session_id;
  if (!sessionId) return <NotFoundState />;

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "line_items.data.price.product"],
    });
  } catch (err) {
    console.error("[order/success] retrieve failed:", err);
    return <NotFoundState />;
  }

  if (session.payment_status !== "paid") {
    return <UnpaidState />;
  }

  const customerName = session.customer_details?.name ?? null;
  const firstName = customerName?.split(/\s+/)[0] ?? "friend";
  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? null;

  const shipping = extractShipping(session);
  const lineItems = session.line_items?.data ?? [];
  const subtotal = session.amount_subtotal ?? 0;
  const shippingCost = session.shipping_cost?.amount_subtotal ?? 0;
  const total = session.amount_total ?? 0;
  const currency = (session.currency ?? "eur").toUpperCase();

  return (
    <>
      <Navigation />
      <main className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, rgba(212,165,116,0.30), transparent 65%)," +
              "linear-gradient(180deg, #fbf8f3 0%, #faf7f2 60%, #f5ede0 100%)",
          }}
        />

        <div className="mx-auto w-full max-w-3xl px-6 md:px-10">
          {/* Confirmation header */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute inset-0 -z-10 animate-float-slow rounded-full bg-success/20 blur-2xl" />
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-primary-foreground shadow-[0_12px_30px_-12px_rgba(79,122,58,0.6)]">
                <Check className="h-7 w-7" strokeWidth={2.5} />
              </div>
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-primary">
              Order #{shortRef(session.id)}
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
              Thanks, {firstName}.
              <br />
              <span className="italic text-primary">Your beans are on the way.</span>
            </h1>
            {customerEmail ? (
              <p className="mt-4 text-muted-foreground">
                Confirmation sent to <span className="text-foreground">{customerEmail}</span>.
              </p>
            ) : null}
          </div>

          {/* Order summary */}
          <section className="mt-12 overflow-hidden rounded-3xl border border-border bg-card">
            <header className="flex items-center gap-2 border-b border-border bg-muted/40 px-6 py-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <Package className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
              Your order
            </header>

            <ul className="divide-y divide-border">
              {lineItems.map((li) => (
                <li key={li.id} className="flex items-start gap-4 px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-lg text-foreground">
                      {li.description ?? "Item"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {li.quantity} × {money(li.price?.unit_amount ?? 0, currency)}
                    </p>
                  </div>
                  <span className="font-display text-lg tabular-nums text-foreground">
                    {money(li.amount_subtotal ?? 0, currency)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-1.5 border-t border-border px-6 py-4 text-sm">
              <Row label="Subtotal" value={money(subtotal, currency)} />
              <Row
                label={
                  shippingCost === 0
                    ? "Shipping (free over €30)"
                    : "Shipping"
                }
                value={
                  shippingCost === 0 ? (
                    <span className="text-success">Free</span>
                  ) : (
                    money(shippingCost, currency)
                  )
                }
              />
              <Row
                label={<strong className="text-foreground">Total</strong>}
                value={
                  <strong className="font-display text-lg tabular-nums text-primary">
                    {money(total, currency)}
                  </strong>
                }
              />
            </div>
          </section>

          {/* Shipping address + what's next */}
          <section className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <Truck className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                Shipping to
              </div>
              {shipping ? (
                <address className="mt-3 not-italic text-[15px] leading-relaxed text-foreground">
                  {shipping.name ? (
                    <>
                      {shipping.name}
                      <br />
                    </>
                  ) : null}
                  {shipping.address.line1}
                  {shipping.address.line2 ? (
                    <>
                      <br />
                      {shipping.address.line2}
                    </>
                  ) : null}
                  <br />
                  {[shipping.address.city, shipping.address.postal_code]
                    .filter(Boolean)
                    .join(", ")}
                  <br />
                  {shipping.address.country}
                </address>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Address on file with the payment.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-accent/30 via-card to-card p-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary">
                <Coffee className="h-3.5 w-3.5" strokeWidth={1.75} />
                What&apos;s next
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-foreground">
                We roast on demand, so your beans will ship within{" "}
                <strong>2 business days</strong>. You&apos;ll get a tracking
                email the moment they leave the shop.
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                Watch your inbox.
              </p>
            </div>
          </section>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft />
                Back to the cafe
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Questions about your order?
            </p>
            <ChatCta />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function NotFoundState() {
  return (
    <FriendlyError
      title="We can't find that order."
      body="The link may have expired or been mistyped. If you just paid and this looks wrong, give us a shout — we'll sort it."
    />
  );
}

function UnpaidState() {
  return (
    <FriendlyError
      title="Looks like that payment didn't go through."
      body="No charge was made. Head back to the beans page and try again, or chat with Brew if you'd like a hand."
    />
  );
}

function FriendlyError({ title, body }: { title: string; body: string }) {
  return (
    <>
      <Navigation />
      <main className="grid min-h-[70vh] place-items-center px-6">
        <div className="max-w-md text-center">
          <p className="font-display text-6xl text-primary">…</p>
          <h1 className="mt-4 font-display text-3xl tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-3 text-muted-foreground">{body}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild>
              <Link href="/#beans">Back to beans</Link>
            </Button>
            <ChatCta />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function shortRef(stripeSessionId: string): string {
  // cs_test_a1abcdef… → A1ABCDEF (8 chars after cs_test_)
  return stripeSessionId
    .replace(/^cs_(test_|live_)?/, "")
    .slice(0, 8)
    .toUpperCase();
}

function extractShipping(
  session: Stripe.Checkout.Session,
): { name: string | null; address: Stripe.Address } | null {
  // Stripe API 2026 keeps shipping under collected_information; check both.
  const collected = (
    session as Stripe.Checkout.Session & {
      collected_information?: {
        shipping_details?: {
          name?: string | null;
          address?: Stripe.Address | null;
        } | null;
      };
    }
  ).collected_information?.shipping_details;
  const legacy = (
    session as Stripe.Checkout.Session & {
      shipping_details?: {
        name?: string | null;
        address?: Stripe.Address | null;
      } | null;
    }
  ).shipping_details;
  const src = collected ?? legacy;
  if (!src?.address) return null;
  return { name: src.name ?? null, address: src.address };
}
