"use client";

import { Clock, Mail, MapPin, MessageCircleHeart, Phone } from "lucide-react";
import { Eyebrow, Section, SectionReveal } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { cafe } from "@/lib/cafe-data";
import { openChat } from "@/lib/chat/bus";

const MAP_SRC = `https://maps.google.com/maps?q=${encodeURIComponent(
  cafe.address.street + ", " + cafe.address.city + ", " + cafe.address.country,
)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

export function Visit() {
  return (
    <Section id="visit">
      <SectionReveal>
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <Eyebrow>Visit</Eyebrow>
            <h2 className="mt-5 max-w-2xl font-display text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
              Find us on Quay Street.
              <br />
              <span className="italic text-primary">Stay a while.</span>
            </h2>
          </div>
          <p className="md:col-span-5 text-muted-foreground">
            Walk-ins always welcome — no reservations needed for the cafe.
            Cupping sessions are on Sundays and fill up quickly; book via the
            chatbot at the bottom of the page.
          </p>
        </div>
      </SectionReveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-12">
        <SectionReveal delay={0.05} className="lg:col-span-5">
          <div className="grid h-full grid-rows-[auto_auto_auto_1fr] gap-4">
            <InfoCard
              icon={MapPin}
              label="Address"
              value={
                <>
                  {cafe.address.street}
                  <br />
                  {cafe.address.city}, {cafe.address.postcode}
                  <br />
                  {cafe.address.country}
                </>
              }
            />
            <InfoCard
              icon={Clock}
              label="Hours"
              value={
                <ul className="space-y-1.5">
                  {cafe.hours.map((h) => (
                    <li key={h.label} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{h.label}</span>
                      <span className="tabular-nums">{h.time}</span>
                    </li>
                  ))}
                </ul>
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <InfoCard
                compact
                icon={Phone}
                label="Phone"
                value={
                  <a
                    href={`tel:${cafe.phone.replace(/\s/g, "")}`}
                    className="hover:text-primary"
                  >
                    {cafe.phone}
                  </a>
                }
              />
              <InfoCard
                compact
                icon={Mail}
                label="Email"
                value={
                  <a
                    href={`mailto:${cafe.email}`}
                    className="hover:text-primary"
                  >
                    {cafe.email}
                  </a>
                }
              />
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-accent/40 via-card to-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <MessageCircleHeart className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-xl text-foreground">
                    Sunday cupping
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Four coffees, side by side. €{cafe.cuppingPrice} ·
                    ~75&nbsp;min · 10:00am.
                  </p>
                </div>
              </div>
              <Button
                className="mt-5 w-full"
                onClick={() =>
                  openChat("I'd like to book a cupping session")
                }
              >
                Book a cupping session
              </Button>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.1} className="lg:col-span-7">
          <div className="group relative h-full min-h-[420px] overflow-hidden rounded-3xl border border-border bg-card">
            <iframe
              title={`Map to ${cafe.name}`}
              src={MAP_SRC}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 h-full w-full grayscale-[35%] saturate-[0.9] transition duration-700 group-hover:grayscale-0 group-hover:saturate-100"
            />
            {/* Floating address pill */}
            <div className="pointer-events-none absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-card/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-[0_8px_24px_-12px_rgba(45,31,20,0.35)] backdrop-blur">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {cafe.address.street}, {cafe.address.city}
            </div>
          </div>
        </SectionReveal>
      </div>
    </Section>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  compact = false,
}: {
  icon: typeof Phone;
  label: string;
  value: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card ${
        compact ? "p-5" : "p-6"
      }`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
        {label}
      </div>
      <div className="mt-3 text-[15px] leading-relaxed text-foreground">
        {value}
      </div>
    </div>
  );
}
