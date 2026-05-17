import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { appUrl, getStripe } from "@/lib/stripe/client";
import { beans } from "@/lib/cafe-data";

export const runtime = "nodejs";

// ─── Public input shape ──────────────────────────────────────────────────
// POST /api/checkout
// { line_items: [{ bean_id, size_grams, quantity }] }
const LineItemSchema = z.object({
  bean_id: z.enum(beans.map((b) => b.id) as [string, ...string[]]),
  size_grams: z.union([z.literal(250), z.literal(500), z.literal(1000)]),
  quantity: z.number().int().min(1).max(6).default(1),
});

const CheckoutInput = z.object({
  line_items: z.array(LineItemSchema).min(1).max(10),
});

// ─── Shipping rules ──────────────────────────────────────────────────────
// Free over €30 (3000 cents), otherwise €4.95 (495 cents). EU + UK + IE.
const FREE_SHIPPING_THRESHOLD_CENTS = 3000;
const FLAT_SHIPPING_CENTS = 495;
const ALLOWED_COUNTRIES = [
  "IE",
  "GB",
  "DE",
  "FR",
  "NL",
  "ES",
  "IT",
  "BE",
  "PT",
] as const;

export async function POST(req: NextRequest) {
  // Parse + validate
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CheckoutInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Look up each item against cafe-data — never trust client-supplied prices.
  const lineItems = parsed.data.line_items.map((item) => {
    const bean = beans.find((b) => b.id === item.bean_id)!;
    const size = bean.sizes.find((s) => s.grams === item.size_grams);
    if (!size) {
      throw new HttpError(
        400,
        `${bean.name} doesn't come in ${item.size_grams}g.`,
      );
    }
    return {
      bean,
      size,
      quantity: item.quantity,
      unit_amount: Math.round(size.price * 100), // cents
    };
  });

  const subtotalCents = lineItems.reduce(
    (sum, li) => sum + li.unit_amount * li.quantity,
    0,
  );
  const shippingCents =
    subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;

  // Build Stripe payload — let TS infer types from the create() call signature.
  const stripeLineItems = lineItems.map((li) => ({
    quantity: li.quantity,
    price_data: {
      currency: "eur",
      unit_amount: li.unit_amount,
      product_data: {
        name: `${li.bean.name} · ${li.size.grams}g`,
        description: `${li.bean.origin} · ${li.bean.process} · ${li.bean.tastingNotes.join(", ")}`,
        metadata: {
          bean_id: li.bean.id,
          size_grams: String(li.size.grams),
        },
      },
    },
  }));

  // Single server-decided shipping option. We don't let the customer pick.
  const shippingOption = {
    shipping_rate_data: {
      type: "fixed_amount" as const,
      display_name:
        shippingCents === 0
          ? "Free shipping (orders over €30)"
          : "Standard shipping",
      fixed_amount: {
        amount: shippingCents,
        currency: "eur",
      },
      delivery_estimate: {
        minimum: { unit: "business_day" as const, value: 2 },
        maximum: { unit: "business_day" as const, value: 5 },
      },
    },
  };

  // Metadata for the webhook to reconstruct the cart without re-fetching the session.
  // Stripe limits each metadata value to 500 chars — our carts are tiny, but keep an eye on it.
  const lineItemsJson = JSON.stringify(
    lineItems.map((li) => ({
      bean_id: li.bean.id,
      bean_name: li.bean.name,
      size_grams: li.size.grams,
      quantity: li.quantity,
      unit_price_cents: li.unit_amount,
    })),
  );

  const base = appUrl();

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      currency: "eur",
      line_items: stripeLineItems,
      shipping_address_collection: {
        allowed_countries: [...ALLOWED_COUNTRIES],
      },
      shipping_options: [shippingOption],
      phone_number_collection: { enabled: false },
      success_url: `${base}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/#beans`,
      metadata: {
        source: "bramble-and-brew",
        subtotal_cents: String(subtotalCents),
        shipping_cents: String(shippingCents),
        total_cents: String(subtotalCents + shippingCents),
        line_items_json: lineItemsJson,
      },
      payment_intent_data: {
        metadata: {
          source: "bramble-and-brew",
          line_items_json: lineItemsJson,
        },
      },
    });

    return NextResponse.json({
      url: session.url,
      session_id: session.id,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[checkout] stripe error:", err);
    const message =
      err instanceof Error ? err.message : "Stripe checkout failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
