// Phase B stub. Phase C.4 replaces this with a real Stripe Checkout Session
// — the tool wiring stays identical so swapping providers doesn't ripple.

export interface BeanCheckoutInput {
  bean_name: string;
  size_grams: number;
  quantity: number;
  unit_price_cents: number;
}

export interface BeanCheckoutResult {
  url: string;
  session_id: string;
}

export async function createBeanCheckout(
  opts: BeanCheckoutInput,
): Promise<BeanCheckoutResult> {
  const session_id = `stub_cs_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  void opts;
  // The /order/success page recognizes ?stub=1 and renders a friendly
  // "Stripe coming online soon" message instead of trying to look up
  // a real Checkout Session.
  return {
    url: `/order/success?session_id=${session_id}&stub=1`,
    session_id,
  };
}
