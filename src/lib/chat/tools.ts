import { tool } from "ai";
import { z } from "zod";
import { beans, cafe } from "@/lib/cafe-data";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createBeanCheckout } from "./checkout-stub";

// Build the bean-name enum from cafe-data so the model can only pick a real
// bean we actually sell. cast is safe — beans is non-empty by construction.
const beanNames = beans.map((b) => b.name) as [string, ...string[]];

export const chatTools = {
  book_cupping_session: tool({
    description: [
      `Book a Sunday cupping session at ${cafe.name}.`,
      `Sessions run Sundays at 10:00 for ~75 minutes, €${cafe.cuppingPrice} per person,`,
      `four coffees side-by-side. Use this ONLY after collecting the name, email,`,
      `party size, and preferred Sunday from the user — confirm details back before calling.`,
    ].join(" "),
    inputSchema: z.object({
      name: z
        .string()
        .min(2)
        .max(60)
        .describe("Customer's full name as they want it on the booking"),
      email: z
        .string()
        .email()
        .describe("Email address for the confirmation"),
      party_size: z
        .number()
        .int()
        .min(1)
        .max(6)
        .describe("Number of people attending, 1–6"),
      session_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .describe(
          "Preferred Sunday in ISO format YYYY-MM-DD. Must be a future Sunday.",
        ),
    }),
    execute: async ({ name, email, party_size, session_date }) => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return {
          success: false as const,
          error:
            "Bookings are temporarily offline — database not configured.",
        };
      }
      try {
        const supabase = supabaseAdmin();
        const { data, error } = await supabase
          .from("cupping_bookings")
          .insert({
            name,
            email,
            party_size,
            session_date,
            status: "confirmed",
          })
          .select("id")
          .single();
        if (error) throw error;
        return {
          success: true as const,
          booking_id: data.id as string,
          summary: `${name}, party of ${party_size}, ${session_date} at 10:00`,
          confirmation_email: email,
        };
      } catch (err) {
        console.error("[tool:book_cupping_session] insert failed:", err);
        return {
          success: false as const,
          error: `Booking failed. Please try again or call us at ${cafe.phone}.`,
        };
      }
    },
  }),

  initiate_bean_order: tool({
    description: [
      `Create a Stripe Checkout link for a bean order shipped within Ireland and the EU.`,
      `Use this ONLY after the user has chosen a specific bean and bag size.`,
      `Returns a checkout URL — share it as a clickable link and tell the user`,
      `their order is confirmed once payment completes.`,
    ].join(" "),
    inputSchema: z.object({
      bean_name: z
        .enum(beanNames)
        .describe(
          "Exact name of one of the beans we currently sell. Must match the bean list verbatim.",
        ),
      size_grams: z
        .union([z.literal(250), z.literal(500), z.literal(1000)])
        .describe("Bag size in grams. Allowed: 250, 500, or 1000."),
      quantity: z
        .number()
        .int()
        .min(1)
        .max(6)
        .default(1)
        .describe("How many bags. Default 1."),
    }),
    execute: async ({ bean_name, size_grams, quantity }) => {
      const bean = beans.find((b) => b.name === bean_name);
      if (!bean) {
        return {
          success: false as const,
          error: `We don't currently roast a "${bean_name}". Try one of: ${beans.map((b) => b.name).join(", ")}.`,
        };
      }
      const size = bean.sizes.find((s) => s.grams === size_grams);
      if (!size) {
        return {
          success: false as const,
          error: `${bean.name} doesn't come in ${size_grams}g. Sizes: ${bean.sizes.map((s) => `${s.grams}g`).join(", ")}.`,
        };
      }
      try {
        const { url, session_id } = await createBeanCheckout({
          bean_name,
          size_grams,
          quantity,
          unit_price_cents: Math.round(size.price * 100),
        });
        return {
          success: true as const,
          checkout_url: url,
          checkout_session_id: session_id,
          line_item: `${quantity} × ${bean.name} ${size_grams}g`,
          subtotal_eur: (size.price * quantity).toFixed(2),
        };
      } catch (err) {
        console.error("[tool:initiate_bean_order] checkout failed:", err);
        return {
          success: false as const,
          error: "We couldn't create a checkout link just now. Please try again.",
        };
      }
    },
  }),
};

export type ChatTools = typeof chatTools;
