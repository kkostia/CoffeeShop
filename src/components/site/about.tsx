"use client";

import { motion } from "framer-motion";
import { Flame, MapPin, Mountain } from "lucide-react";
import { Eyebrow, Section, SectionReveal } from "@/components/ui/section";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Mountain,
    title: "Single origin",
    body: "Beans traceable to a single farm or co-op. We share the story on every bag — country, region, varietal, altitude, process.",
  },
  {
    icon: Flame,
    title: "House roasted",
    body: "Our 5kg drum sits behind the bar. We roast small batches every week so the coffee you drink today was roasted within seven days.",
  },
  {
    icon: MapPin,
    title: "Galway local",
    body: "Pastries from Aniar Bakery, milk from a dairy in Athenry, oat milk from Ballygowan. Quay Street is home.",
  },
];

export function About() {
  return (
    <Section id="about" className="bg-muted/30">
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionReveal>
            <Eyebrow>Our story</Eyebrow>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
              Coffee, made for the
              <br />
              <span className="italic text-primary">people who drink it</span>.
            </h2>
          </SectionReveal>
        </div>

        <div className="lg:col-span-7 lg:pt-3">
          <SectionReveal delay={0.1}>
            <div className="space-y-6 text-lg leading-relaxed text-foreground/85">
              <p>
                Bramble &amp; Brew opened in 2022 because Galway deserved a
                cafe that took coffee as seriously as the city takes its trad
                sessions. We started with a small bar, a single roaster, and a
                stubborn belief that you should know where your morning cup
                comes from.
              </p>
              <p>
                Four years on, we still roast every bean on-site, every week.
                We weigh shots to the tenth of a gram and pull pour-overs to
                order. We&apos;ll happily talk about extraction yields if
                you&apos;d like — but we&apos;d rather just make you something
                you love and let you get on with your day.
              </p>
              <p className="text-muted-foreground">
                On Sundays we open a little later and host a cupping session.
                Four coffees, side by side, no jargon required. Anyone&apos;s
                welcome.
              </p>
            </div>
          </SectionReveal>
        </div>
      </div>

      <div className="mt-20 grid gap-5 md:grid-cols-3 md:gap-6">
        {features.map((feature, i) => (
          <SectionReveal key={feature.title} delay={i * 0.08}>
            <FeatureCard {...feature} />
          </SectionReveal>
        ))}
      </div>
    </Section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Mountain;
  title: string;
  body: string;
}) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-7",
        "transition-colors duration-300 hover:border-primary/30",
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl",
            "bg-primary/5 text-primary",
            "transition-[background-color,color] duration-300 group-hover:bg-primary group-hover:text-primary-foreground",
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <span className="font-display text-sm text-muted-foreground/70">
          {String(features.findIndex((f) => f.title === title) + 1).padStart(2, "0")}
        </span>
      </div>

      <h3 className="mt-6 font-display text-2xl tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        {body}
      </p>

      <div
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 h-px",
          "bg-gradient-to-r from-transparent via-primary/40 to-transparent",
          "scale-x-0 origin-left transition-transform duration-700 [transition-timing-function:var(--ease-cafe)] group-hover:scale-x-100",
        )}
      />
    </motion.article>
  );
}
