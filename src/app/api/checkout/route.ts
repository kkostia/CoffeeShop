import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  CheckoutInputError,
  createBeanCheckout,
} from "@/lib/stripe/create-bean-checkout";
import { beans } from "@/lib/cafe-data";

export const runtime = "nodejs";

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

export async function POST(req: NextRequest) {
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

  try {
    const result = await createBeanCheckout({
      line_items: parsed.data.line_items,
      source: "beans-card",
    });
    return NextResponse.json({
      url: result.url,
      session_id: result.session_id,
    });
  } catch (err) {
    if (err instanceof CheckoutInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[checkout] stripe error:", err);
    const message =
      err instanceof Error ? err.message : "Stripe checkout failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
