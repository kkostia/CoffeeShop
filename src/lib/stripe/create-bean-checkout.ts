import "server-only";
import { appUrl, getStripe } from "./client";
import { beans } from "@/lib/cafe-data";

// Shared bean-checkout builder used by both /api/checkout (POST from the
// beans cards) and the initiate_bean_order chatbot tool. Keeps shipping
// rules, price source-of-truth, and metadata shape in one place.

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

export interface BeanCartLine {
  bean_id: string;
  size_grams: 250 | 500 | 1000;
  quantity: number;
}

export interface BeanCheckoutSummary {
  url: string;
  session_id: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
}

export class CheckoutInputError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function createBeanCheckout(opts: {
  line_items: BeanCartLine[];
  source: "beans-card" | "chat-tool";
}): Promise<BeanCheckoutSummary> {
  if (opts.line_items.length === 0) {
    throw new CheckoutInputError("Cart is empty.");
  }

  // Resolve each line against cafe-data. Never trust prices from the caller.
  const resolved = opts.line_items.map((item) => {
    const bean = beans.find((b) => b.id === item.bean_id);
    if (!bean) {
      throw new CheckoutInputError(`Unknown bean: ${item.bean_id}`);
    }
    const size = bean.sizes.find((s) => s.grams === item.size_grams);
    if (!size) {
      throw new CheckoutInputError(
        `${bean.name} doesn't come in ${item.size_grams}g.`,
      );
    }
    return {
      bean,
      size,
      quantity: item.quantity,
      unit_amount: Math.round(size.price * 100),
    };
  });

  const subtotalCents = resolved.reduce(
    (sum, li) => sum + li.unit_amount * li.quantity,
    0,
  );
  const shippingCents =
    subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;

  const stripeLineItems = resolved.map((li) => ({
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

  const shippingOption = {
    shipping_rate_data: {
      type: "fixed_amount" as const,
      display_name:
        shippingCents === 0
          ? "Free shipping (orders over €30)"
          : "Standard shipping",
      fixed_amount: { amount: shippingCents, currency: "eur" },
      delivery_estimate: {
        minimum: { unit: "business_day" as const, value: 2 },
        maximum: { unit: "business_day" as const, value: 5 },
      },
    },
  };

  const lineItemsJson = JSON.stringify(
    resolved.map((li) => ({
      bean_id: li.bean.id,
      bean_name: li.bean.name,
      size_grams: li.size.grams,
      quantity: li.quantity,
      unit_price_cents: li.unit_amount,
    })),
  );

  const totalCents = subtotalCents + shippingCents;
  const base = appUrl();

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    currency: "eur",
    line_items: stripeLineItems,
    shipping_address_collection: { allowed_countries: [...ALLOWED_COUNTRIES] },
    shipping_options: [shippingOption],
    phone_number_collection: { enabled: false },
    success_url: `${base}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/#beans`,
    metadata: {
      source: opts.source,
      subtotal_cents: String(subtotalCents),
      shipping_cents: String(shippingCents),
      total_cents: String(totalCents),
      line_items_json: lineItemsJson,
    },
    payment_intent_data: {
      metadata: {
        source: opts.source,
        line_items_json: lineItemsJson,
      },
    },
  });

  if (!session.url) {
    throw new Error("Stripe returned a session without a redirect URL.");
  }

  return {
    url: session.url,
    session_id: session.id,
    subtotal_cents: subtotalCents,
    shipping_cents: shippingCents,
    total_cents: totalCents,
  };
}
