import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const DEFAULT_PASSWORD = "demo123";

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function POST(req: NextRequest) {
  const supplied = req.headers.get("x-admin-password") ?? "";
  const expected = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  if (!timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      conversations: [],
      cuppingBookings: [],
      beanOrders: [],
      degraded: "supabase service role key not configured",
    });
  }

  const supabase = supabaseAdmin();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [convosRes, bookingsRes, ordersRes] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, session_id, started_at, last_message_at, messages")
      .gte("last_message_at", sevenDaysAgo)
      .order("last_message_at", { ascending: false })
      .limit(100),
    supabase
      .from("cupping_bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("bean_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({
    conversations: convosRes.data ?? [],
    cuppingBookings: bookingsRes.data ?? [],
    beanOrders: ordersRes.data ?? [],
    errors: {
      conversations: convosRes.error?.message ?? null,
      cuppingBookings: bookingsRes.error?.message ?? null,
      beanOrders: ordersRes.error?.message ?? null,
    },
  });
}
