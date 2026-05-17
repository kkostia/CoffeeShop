import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

// NOTE: Stripe's signature verification uses Node crypto — never switch
// this route to the Edge runtime. Don't add middleware that consumes the
// body before us, either (`request.text()` must see the raw bytes Stripe
// signed).
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error(
      "[webhook] STRIPE_WEBHOOK_SECRET is not set — rejecting all events.",
    );
    return new NextResponse("Webhook not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  // Raw body — Stripe's HMAC is computed over the exact bytes sent.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      default:
        // Quietly accept everything else so we don't fight the dashboard's
        // "send all events" default during testing.
        break;
    }
  } catch (err) {
    console.error(`[webhook] handler error for ${event.type}:`, err);
    // 500 → Stripe will retry with exponential backoff. That's what we want
    // for transient DB hiccups; the idempotency check in
    // handleCheckoutCompleted guards against double-inserts on retry.
    return new NextResponse("Handler error", { status: 500 });
  }

  return NextResponse.json({ received: true, id: event.id });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "[webhook] checkout.session.completed: Supabase service role missing — order not recorded.",
    );
    return;
  }

  const supabase = supabaseAdmin();

  // Idempotency: stripe_session_id is UNIQUE in the DB, but pre-checking
  // avoids the noisy constraint-violation in the logs when Stripe retries.
  const { data: existing } = await supabase
    .from("bean_orders")
    .select("id, status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (existing) {
    console.log(
      `[webhook] checkout.session.completed: ${session.id} already recorded as ${existing.status}, skipping.`,
    );
    return;
  }

  // Parse the cart snapshot we packed into metadata at checkout creation.
  let lineItems: unknown[] = [];
  const rawLineItems = session.metadata?.line_items_json;
  if (typeof rawLineItems === "string") {
    try {
      const parsed = JSON.parse(rawLineItems);
      if (Array.isArray(parsed)) lineItems = parsed;
    } catch (err) {
      console.warn(
        `[webhook] failed to parse line_items_json for ${session.id}:`,
        err,
      );
    }
  }

  // Stripe API 2026 keeps shipping under collected_information; fall back
  // to the legacy field for older accounts/test data.
  const collectedShipping = (
    session as Stripe.Checkout.Session & {
      collected_information?: {
        shipping_details?: {
          name?: string | null;
          address?: Stripe.Address | null;
        } | null;
      };
    }
  ).collected_information?.shipping_details;
  const legacyShipping = (
    session as Stripe.Checkout.Session & {
      shipping_details?: {
        name?: string | null;
        address?: Stripe.Address | null;
      } | null;
    }
  ).shipping_details;
  const shipping = collectedShipping ?? legacyShipping ?? null;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  const { error } = await supabase.from("bean_orders").insert({
    stripe_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    customer_email:
      session.customer_details?.email ??
      session.customer_email ??
      "unknown@unknown",
    customer_name:
      session.customer_details?.name ?? shipping?.name ?? null,
    shipping_address: shipping?.address ?? null,
    line_items: lineItems,
    subtotal_cents: session.amount_subtotal ?? 0,
    shipping_cents: session.shipping_cost?.amount_subtotal ?? 0,
    total_cents: session.amount_total ?? 0,
    currency: session.currency ?? "eur",
    status: "paid",
    paid_at: new Date().toISOString(),
    metadata: session.metadata ?? {},
  });

  if (error) throw error;

  console.log(`[webhook] order recorded for session ${session.id}`);
}

async function handlePaymentFailed(intent: Stripe.PaymentIntent) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const supabase = supabaseAdmin();

  const { data: existing } = await supabase
    .from("bean_orders")
    .select("id")
    .eq("stripe_payment_intent_id", intent.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("bean_orders")
      .update({ status: "failed" })
      .eq("id", existing.id);
    if (error) throw error;
    console.log(`[webhook] order ${existing.id} marked failed (${intent.id})`);
  } else {
    // No matching row — failed before a session ever completed. Nothing to
    // update. Logged so it's visible if it ever spikes.
    console.warn(
      `[webhook] payment_intent.payment_failed for unknown PI ${intent.id}`,
    );
  }
}
