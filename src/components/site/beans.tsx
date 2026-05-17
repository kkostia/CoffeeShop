"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, ShoppingBag } from "lucide-react";
import { Eyebrow, Section, SectionReveal } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { beans, type Bean } from "@/lib/cafe-data";
import { cn, formatEUR } from "@/lib/utils";

export function Beans() {
  return (
    <Section id="beans" className="bg-muted/40">
      <SectionReveal>
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Take it home</Eyebrow>
            <h2 className="mt-5 max-w-2xl font-display text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
              Beans we&apos;re proud of, roasted this week.
            </h2>
          </div>
          <p className="max-w-sm text-muted-foreground">
            All bags are roasted in small batches and shipped within seven days.
            Whole bean or ground to order — pick at checkout.
          </p>
        </div>
      </SectionReveal>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {beans.map((bean, i) => (
          <SectionReveal key={bean.id} delay={i * 0.08}>
            <BeanCard bean={bean} />
          </SectionReveal>
        ))}
      </div>
    </Section>
  );
}

function BeanCard({ bean }: { bean: Bean }) {
  const [selectedSize, setSelectedSize] = React.useState(bean.sizes[1]!);
  const [busy, setBusy] = React.useState(false);

  const handleBuy = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line_items: [
            {
              bean_id: bean.id,
              size_grams: selectedSize.grams,
              quantity: 1,
            },
          ],
        }),
      });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? `checkout: ${res.status}`);
      }
      // Hand off to Stripe-hosted Checkout. We don't reset `busy` —
      // the navigation away unmounts the component.
      window.location.assign(data.url);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't open checkout", {
        description:
          "Something went wrong on our side — try again, or grab a bag in the shop.",
      });
      setBusy(false);
    }
  };

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card",
        "transition-[box-shadow,border-color] duration-500",
        "hover:border-primary/30 hover:shadow-[0_20px_40px_-30px_rgba(45,31,20,0.45)]",
      )}
    >
      {/* Decorative gradient header — stands in for a product photo */}
      <div
        aria-hidden
        className="relative h-40 overflow-hidden"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #d4a574 0%, #b88555 35%, #6f4e37 80%)",
        }}
      >
        <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 flex items-end p-5">
          <span className="font-display text-xs uppercase tracking-[0.2em] text-primary-foreground/80">
            {bean.process} · {bean.altitude}
          </span>
        </div>
        <div className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
          In stock
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm text-muted-foreground">{bean.origin}</p>
        <h3 className="mt-1 font-display text-2xl tracking-tight text-foreground">
          {bean.name}
        </h3>

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {bean.tastingNotes.map((note) => (
            <li
              key={note}
              className="rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-xs text-foreground/80"
            >
              {note}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {bean.description}
        </p>

        <div className="mt-auto pt-6">
          <div role="radiogroup" aria-label="Bag size" className="grid grid-cols-3 gap-1.5 rounded-full bg-muted p-1">
            {bean.sizes.map((size) => {
              const active = size.grams === selectedSize.grams;
              return (
                <button
                  key={size.grams}
                  role="radio"
                  aria-checked={active}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-300",
                    "[transition-timing-function:var(--ease-cafe)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-card text-foreground shadow-[0_2px_8px_-4px_rgba(45,31,20,0.3)]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {size.grams >= 1000 ? `${size.grams / 1000}kg` : `${size.grams}g`}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="font-display text-2xl tabular-nums text-primary">
              {formatEUR(selectedSize.price)}
            </span>
            <Button
              size="sm"
              onClick={handleBuy}
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ShoppingBag />
              )}
              {busy ? "Opening…" : "Buy now"}
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
