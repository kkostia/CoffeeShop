"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ExternalLink,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  RefreshCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  session_id: string;
  started_at: string;
  last_message_at: string;
  messages: { role: string; content: string; ts?: string }[];
}

interface CuppingBooking {
  id: string;
  name: string;
  email: string;
  party_size: number;
  session_date: string;
  status: string;
  created_at: string;
}

interface OrderLineItem {
  bean_id?: string;
  bean_name: string;
  size_grams: number;
  quantity: number;
  unit_price_cents: number;
}

interface ShippingAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  state?: string | null;
  country?: string | null;
}

interface BeanOrder {
  id: string;
  stripe_session_id: string;
  stripe_payment_intent_id: string | null;
  customer_email: string;
  customer_name: string | null;
  shipping_address: ShippingAddress | null;
  line_items: OrderLineItem[];
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded" | "shipped";
  metadata: Record<string, string> | null;
  created_at: string;
  paid_at: string | null;
  updated_at: string;
}

interface AdminData {
  conversations: Conversation[];
  cuppingBookings: CuppingBooking[];
  beanOrders: BeanOrder[];
  degraded?: string;
  errors?: Record<string, string | null>;
}

const AUTH_KEY = "bramble:admin-pw:v1";

export default function AdminPage() {
  const [password, setPassword] = React.useState("");
  const [authed, setAuthed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<AdminData | null>(null);
  const [openConvo, setOpenConvo] = React.useState<Conversation | null>(null);
  const [openOrder, setOpenOrder] = React.useState<BeanOrder | null>(null);

  const fetchData = React.useCallback(async (pw: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "x-admin-password": pw },
      });
      if (res.status === 401) {
        setError("Wrong password. (Demo password is `demo123`.)");
        setAuthed(false);
        sessionStorage.removeItem(AUTH_KEY);
        return;
      }
      if (!res.ok) throw new Error("fetch failed");
      const payload = (await res.json()) as AdminData;
      setData(payload);
      setAuthed(true);
      sessionStorage.setItem(AUTH_KEY, pw);
    } catch (e) {
      console.error(e);
      setError("Couldn't load admin data. Check Supabase is configured.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-sign-in if a password is cached for this tab
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = sessionStorage.getItem(AUTH_KEY);
    if (cached) fetchData(cached);
  }, [fetchData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(password);
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setPassword("");
    setData(null);
  };

  if (!authed) {
    return (
      <main className="grid min-h-screen place-items-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo />
            <p className="mt-3 text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Admin
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-border bg-card p-8 shadow-[0_30px_80px_-30px_rgba(45,31,20,0.35)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="mt-5 font-display text-2xl tracking-tight">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Captured conversations, cupping bookings, and bean orders.
            </p>

            <label
              htmlFor="admin-password"
              className="mt-6 block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"
            >
              Password
            </label>
            <Input
              id="admin-password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2"
              placeholder="demo123"
            />
            {error ? (
              <p className="mt-3 text-xs text-foreground/80">{error}</p>
            ) : null}

            <Button type="submit" className="mt-6 w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>

            <p className="mt-5 rounded-xl border border-dashed border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Portfolio demo — the password is{" "}
              <code className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px]">
                demo123
              </code>
              . Don&apos;t put real secrets here.
            </p>
          </form>
        </div>
      </main>
    );
  }

  const totalMessages =
    data?.conversations.reduce((sum, c) => sum + (c.messages?.length ?? 0), 0) ?? 0;

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchData(sessionStorage.getItem(AUTH_KEY) ?? "")}
            disabled={loading}
          >
            <RefreshCcw className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut />
            Sign out
          </Button>
        </div>
      </header>

      {data?.degraded ? (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          Heads up — {data.degraded}. Tables will be empty until that&apos;s set.
        </div>
      ) : null}

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <Stat
          icon={MessageSquare}
          label="Conversations (7d)"
          value={data?.conversations.length ?? 0}
          sub={`${totalMessages} messages`}
        />
        <Stat
          icon={CalendarDays}
          label="Cupping bookings"
          value={data?.cuppingBookings.length ?? 0}
          sub="all-time"
        />
        <Stat
          icon={Package}
          label="Bean orders (30d)"
          value={data?.beanOrders.length ?? 0}
          sub={`${revenueEUR(data?.beanOrders ?? [])} revenue`}
        />
      </section>

      <Tabs defaultValue="convos" className="mt-10">
        <TabsList>
          <TabsTrigger value="convos">Conversations</TabsTrigger>
          <TabsTrigger value="bookings">Cupping bookings</TabsTrigger>
          <TabsTrigger value="orders">Bean orders</TabsTrigger>
        </TabsList>

        <TabsContent value="convos">
          {data?.conversations.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {data.conversations.map((c) => (
                <li key={c.id}>
                  <ConversationCard
                    convo={c}
                    onOpen={() => setOpenConvo(c)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No conversations yet"
              body="Once a visitor chats with Brew, the transcript will appear here."
            />
          )}
        </TabsContent>

        <TabsContent value="bookings">
          {data?.cuppingBookings.length ? (
            <BookingsTable rows={data.cuppingBookings} />
          ) : (
            <EmptyState
              title="No cupping bookings yet"
              body="When the chatbot books a Sunday cupping, it lands here."
            />
          )}
        </TabsContent>

        <TabsContent value="orders">
          {data?.beanOrders.length ? (
            <OrdersTable rows={data.beanOrders} onOpen={setOpenOrder} />
          ) : (
            <EmptyState
              title="No bean orders yet"
              body="When a customer completes Stripe checkout (from the beans card or the chatbot), the order lands here."
            />
          )}
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {openConvo ? (
          <ConversationModal
            convo={openConvo}
            onClose={() => setOpenConvo(null)}
          />
        ) : null}
        {openOrder ? (
          <OrderModal order={openOrder} onClose={() => setOpenOrder(null)} />
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof MessageSquare;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="flex items-start justify-between rounded-2xl border border-border bg-card p-5">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 font-display text-4xl tabular-nums text-foreground">
          {value}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

function ConversationCard({
  convo,
  onOpen,
}: {
  convo: Conversation;
  onOpen: () => void;
}) {
  const last = convo.messages?.[convo.messages.length - 1];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group block w-full rounded-2xl border border-border bg-card p-5 text-left transition-[transform,border-color,box-shadow] duration-300 [transition-timing-function:var(--ease-cafe)] hover:-translate-y-0.5 hover:border-primary/30"
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-0.5">
          {convo.messages?.length ?? 0} msgs
        </span>
        <time dateTime={convo.last_message_at}>
          {formatRelative(convo.last_message_at)}
        </time>
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-foreground">
        {last?.content ?? "Empty"}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        session {convo.session_id.slice(0, 8)}…
      </p>
    </button>
  );
}

function ConversationModal({
  convo,
  onClose,
}: {
  convo: Conversation;
  onClose: () => void;
}) {
  return (
    <motion.div
      key="convo-modal"
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative m-3 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-display text-lg">Conversation</p>
            <p className="text-xs text-muted-foreground">
              {convo.session_id} · {convo.messages?.length ?? 0} msgs ·
              started {formatRelative(convo.started_at)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
          {convo.messages?.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function BookingsTable({ rows }: { rows: CuppingBooking[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/60 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Party</Th>
            <Th>Session date</Th>
            <Th>Status</Th>
            <Th>Booked</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <Td className="font-medium">{r.name}</Td>
              <Td className="text-muted-foreground">{r.email}</Td>
              <Td>{r.party_size}</Td>
              <Td className="tabular-nums">{r.session_date}</Td>
              <Td><StatusBadge status={r.status} /></Td>
              <Td className="text-muted-foreground">{formatRelative(r.created_at)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTable({
  rows,
  onOpen,
}: {
  rows: BeanOrder[];
  onOpen: (order: BeanOrder) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/60 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <tr>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Items</Th>
            <Th>Total</Th>
            <Th>Status</Th>
            <Th>Placed</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              onClick={() => onOpen(r)}
              className="cursor-pointer border-t border-border transition-colors hover:bg-muted/40"
            >
              <Td className="font-mono text-xs text-foreground">
                #{shortRef(r.stripe_session_id)}
              </Td>
              <Td>
                <div className="font-medium">{r.customer_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {r.customer_email}
                </div>
              </Td>
              <Td className="text-muted-foreground">
                {summarizeLineItems(r.line_items)}
              </Td>
              <Td className="font-display tabular-nums text-foreground">
                {formatCents(r.total_cents, r.currency)}
              </Td>
              <Td>
                <StatusBadge status={r.status} />
              </Td>
              <Td className="text-muted-foreground">
                {formatRelative(r.created_at)}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderModal({
  order,
  onClose,
}: {
  order: BeanOrder;
  onClose: () => void;
}) {
  return (
    <motion.div
      key="order-modal"
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative m-3 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="font-display text-lg">
              Order #{shortRef(order.stripe_session_id)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {order.customer_email} ·{" "}
              {order.paid_at
                ? `paid ${formatRelative(order.paid_at)}`
                : `created ${formatRelative(order.created_at)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Line items */}
          <section>
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Line items
            </p>
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {order.line_items.map((li, i) => (
                <li
                  key={`${li.bean_id ?? li.bean_name}-${i}`}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {li.bean_name} · {li.size_grams}g
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {li.quantity} ×{" "}
                      {formatCents(li.unit_price_cents, order.currency)}
                    </p>
                  </div>
                  <span className="font-display tabular-nums text-foreground">
                    {formatCents(
                      li.unit_price_cents * li.quantity,
                      order.currency,
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-3 space-y-1 text-sm">
              <ModalRow
                label="Subtotal"
                value={formatCents(order.subtotal_cents, order.currency)}
              />
              <ModalRow
                label="Shipping"
                value={
                  order.shipping_cents === 0
                    ? "Free"
                    : formatCents(order.shipping_cents, order.currency)
                }
              />
              <ModalRow
                label={<strong className="text-foreground">Total</strong>}
                value={
                  <strong className="font-display text-base text-primary">
                    {formatCents(order.total_cents, order.currency)}
                  </strong>
                }
              />
            </dl>
          </section>

          {/* Shipping address */}
          <section>
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary" />
              Shipping address
            </p>
            {order.shipping_address ? (
              <address className="rounded-2xl border border-border bg-muted/30 px-4 py-3 not-italic text-sm leading-relaxed text-foreground">
                {order.customer_name ? (
                  <>
                    {order.customer_name}
                    <br />
                  </>
                ) : null}
                {order.shipping_address.line1}
                {order.shipping_address.line2 ? (
                  <>
                    <br />
                    {order.shipping_address.line2}
                  </>
                ) : null}
                <br />
                {[
                  order.shipping_address.city,
                  order.shipping_address.postal_code,
                ]
                  .filter(Boolean)
                  .join(", ")}
                <br />
                {order.shipping_address.country}
              </address>
            ) : (
              <p className="text-sm text-muted-foreground">
                No shipping address captured.
              </p>
            )}
          </section>

          {/* Stripe references */}
          <section>
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Stripe
            </p>
            <div className="space-y-2 text-sm">
              <StripeLinkRow
                label="Checkout Session"
                id={order.stripe_session_id}
                href={stripeDashboardUrl(order.stripe_session_id, "session")}
              />
              {order.stripe_payment_intent_id ? (
                <StripeLinkRow
                  label="Payment Intent"
                  id={order.stripe_payment_intent_id}
                  href={stripeDashboardUrl(
                    order.stripe_payment_intent_id,
                    "payment",
                  )}
                />
              ) : null}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModalRow({
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

function StripeLinkRow({
  label,
  id,
  href,
}: {
  label: string;
  id: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-muted/60"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 font-mono text-xs text-foreground">
        <span className="max-w-[280px] truncate">{id}</span>
        <ExternalLink className="h-3 w-3 shrink-0 text-primary" />
      </span>
    </a>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th scope="col" className="px-4 py-3 font-medium">{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    // bookings
    pending: "border-accent/40 bg-accent/20 text-foreground",
    confirmed: "border-success/40 bg-success/15 text-success",
    cancelled: "border-border bg-muted text-muted-foreground",
    // orders
    paid: "border-success/40 bg-success/15 text-success",
    shipped: "border-primary/30 bg-primary/10 text-primary",
    delivered: "border-success/40 bg-success/15 text-success",
    refunded: "border-border bg-muted text-muted-foreground",
    failed:
      "border-[#b65c47]/40 bg-[#b65c47]/12 text-[#7a3826]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
        styles[status] ?? styles.pending,
      )}
    >
      {status}
    </span>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <p className="font-display text-xl text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────

function formatCents(cents: number, currency = "eur"): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function summarizeLineItems(items: OrderLineItem[]): string {
  if (!items?.length) return "—";
  const head = items
    .slice(0, 2)
    .map((li) => `${li.quantity}× ${li.bean_name} ${li.size_grams}g`)
    .join(", ");
  if (items.length <= 2) return head;
  return `${head} +${items.length - 2} more`;
}

function shortRef(stripeId: string): string {
  return stripeId
    .replace(/^(cs|pi)_(test|live)_/, "")
    .slice(0, 8)
    .toUpperCase();
}

function revenueEUR(orders: BeanOrder[]): string {
  const cents = orders
    .filter((o) => o.status === "paid" || o.status === "shipped")
    .reduce((sum, o) => sum + o.total_cents, 0);
  return formatCents(cents, "eur");
}

function stripeDashboardUrl(id: string, kind: "session" | "payment"): string {
  const isTest = id.includes("_test_");
  const base = `https://dashboard.stripe.com${isTest ? "/test" : ""}`;
  return kind === "session"
    ? `${base}/payments?query=${id}` // session lookup goes through payments search
    : `${base}/payments/${id}`;
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
