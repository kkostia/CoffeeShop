"use client";

import { motion } from "framer-motion";
import { ArrowRight, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/section";
import { cafe } from "@/lib/cafe-data";
import { openChat } from "@/lib/chat/bus";

const headlineWords = ["Slow", "coffee.", "Real", "conversations."];

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32"
    >
      {/* Warm gradient + ambient blobs (CSS only — no images) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(80% 60% at 18% 20%, rgba(212,165,116,0.32), transparent 65%)," +
            "radial-gradient(70% 50% at 95% 0%, rgba(111,78,55,0.18), transparent 60%)," +
            "linear-gradient(180deg, #fbf8f3 0%, #faf7f2 60%, #f5ede0 100%)",
        }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-noise opacity-[0.18]" />

      {/* Decorative floating mug-rim arc, top right */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute -right-32 top-24 hidden h-[520px] w-[520px] rounded-full border border-primary/10 md:block"
        style={{
          background:
            "conic-gradient(from 90deg at 50% 50%, rgba(212,165,116,0.12), rgba(111,78,55,0.06), rgba(212,165,116,0.12))",
        }}
      >
        <div className="absolute inset-10 rounded-full border border-primary/15 animate-float-slow" />
        <div className="absolute inset-24 rounded-full border border-primary/10" />
      </motion.div>

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-6 md:px-10 lg:grid-cols-12">
        {/* Copy */}
        <div className="lg:col-span-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Eyebrow>
              Galway · Latin Quarter · Since {cafe.opened}
            </Eyebrow>
          </motion.div>

          <h1 className="mt-6 text-balance font-display text-[clamp(3rem,8vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.025em] text-foreground">
            {headlineWords.map((word, i) => {
              const accent = word === "conversations.";
              return (
                <motion.span
                  key={`${word}-${i}`}
                  initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
                  transition={{
                    duration: 0.7,
                    delay: 0.15 + i * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="mr-3 inline-block"
                >
                  {accent ? (
                    <em className="not-italic text-primary">
                      <span className="italic">{word}</span>
                    </em>
                  ) : (
                    word
                  )}
                </motion.span>
              );
            })}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            A small specialty coffee shop on Quay Street, roasting single-origin
            beans on-site and serving them slow — the way coffee was meant to
            be.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.62, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg" variant="primary">
              <a href="#visit">
                <MapPin />
                Find us
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => openChat()}
              className="group"
            >
              <MessageSquare />
              Chat with us
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground"
          >
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
              Open now · {cafe.hours[0]!.time}
            </span>
            <span>{cafe.address.street}</span>
            <span>{cafe.phone}</span>
          </motion.div>
        </div>

        {/* Side card — what's on bar */}
        <motion.aside
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative lg:col-span-4"
        >
          <div className="sticky top-32">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card/80 p-6 backdrop-blur-md shadow-[0_24px_60px_-30px_rgba(45,31,20,0.45)]">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span>On the bar today</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  Live
                </span>
              </div>

              <ul className="mt-5 space-y-4">
                <li>
                  <p className="font-display text-xl text-foreground">
                    Ethiopia Yirgacheffe
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    V60 · Bergamot, jasmine, white peach
                  </p>
                </li>
                <li className="border-t border-border/80 pt-4">
                  <p className="font-display text-xl text-foreground">
                    Colombia Huila
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Espresso · Red apple, toffee, cocoa nib
                  </p>
                </li>
                <li className="border-t border-border/80 pt-4">
                  <p className="font-display text-xl text-foreground">
                    Brazil Cerrado
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    AeroPress · Hazelnut, milk chocolate, brown sugar
                  </p>
                </li>
              </ul>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
                <span className="text-muted-foreground">Roasted on-site</span>
                <a
                  href="#beans"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline underline-offset-4"
                >
                  Take some home
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
