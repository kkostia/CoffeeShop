import "server-only";
import Stripe from "stripe";

// Server-only Stripe singleton.
// Pinned to the SDK's expected API version (rather than the account default)
// so behavior is reproducible across environments. Bump when upgrading the
// stripe package — TypeScript will tell you if it goes out of sync.

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set — Stripe operations are unavailable.",
    );
  }
  _stripe = new Stripe(key, {
    // Pin to the SDK's expected version. The literal matches the package's
    // ApiVersion constant; TS narrows it to LatestApiVersion at the call site.
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
    appInfo: {
      name: "Bramble & Brew",
      url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    },
  });
  return _stripe;
}

export function appUrl(): string {
  // Treat empty string the same as unset — Vercel creates the env var as ""
  // when you leave the value blank, which would otherwise short-circuit the
  // ?? fallback and produce a relative success_url that Stripe rejects.
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  return fromEnv || "http://localhost:3000";
}
