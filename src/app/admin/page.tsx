"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Lock,
  LogOut,
  MessageSquare,
  Package,
  RefreshCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEUR } from "@/lib/utils";

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

interface BeanOrder {
  id: string;
  name: string;
  email: string;
  address: string;
  bean_name: string;
  size_grams: number;
  price: number;
  status: string;
  created_at: string;
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
          label="Bean orders"
          value={data?.beanOrders.length ?? 0}
          sub="all-time"
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
            <OrdersTable rows={data.beanOrders} />
          ) : (
            <EmptyState
              title="No bean orders yet"
              body="When the chatbot takes a bean delivery, it lands here."
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

function OrdersTable({ rows }: { rows: BeanOrder[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/60 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <tr>
            <Th>Customer</Th>
            <Th>Bean</Th>
            <Th>Size</Th>
            <Th>Price</Th>
            <Th>Status</Th>
            <Th>Placed</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border">
              <Td>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.email}</div>
              </Td>
              <Td>{r.bean_name}</Td>
              <Td>{r.size_grams}g</Td>
              <Td className="tabular-nums">{formatEUR(r.price)}</Td>
              <Td><StatusBadge status={r.status} /></Td>
              <Td className="text-muted-foreground">{formatRelative(r.created_at)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
    pending: "border-accent/40 bg-accent/20 text-foreground",
    confirmed: "border-success/40 bg-success/15 text-success",
    shipped: "border-primary/30 bg-primary/10 text-primary",
    delivered: "border-success/40 bg-success/15 text-success",
    cancelled: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
        styles[status] ?? styles.pending
      }`}
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
