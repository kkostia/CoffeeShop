"use client";

import { Eyebrow, Section, SectionReveal } from "@/components/ui/section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { menu, type MenuItem } from "@/lib/cafe-data";
import { formatEUR } from "@/lib/utils";

const TABS = [
  { value: "espresso", label: "Espresso", items: menu.espresso },
  { value: "filter", label: "Filter", items: menu.filter },
  { value: "other", label: "Other", items: menu.other },
];

export function Menu() {
  return (
    <Section id="menu">
      <SectionReveal>
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Menu</Eyebrow>
            <h2 className="mt-5 max-w-2xl font-display text-4xl leading-[1.05] tracking-tight text-foreground md:text-5xl">
              Brewed slow. Priced fair.
            </h2>
          </div>
          <p className="max-w-sm text-muted-foreground">
            Prices include VAT. All milk drinks can be made with oat, soy, or
            coconut at no upcharge.
          </p>
        </div>
      </SectionReveal>

      <SectionReveal delay={0.1}>
        <Tabs defaultValue="espresso" className="mt-12">
          <TabsList className="mb-2">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <ul className="grid gap-x-12 gap-y-8 md:grid-cols-2">
                {tab.items.map((item) => (
                  <MenuRow key={item.name} item={item} />
                ))}
              </ul>
            </TabsContent>
          ))}
        </Tabs>
      </SectionReveal>
    </Section>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <li className="group">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-xl tracking-tight text-foreground">
          {item.name}
        </span>
        {item.signature ? (
          <Badge variant="accent" className="translate-y-[-2px]">
            Signature
          </Badge>
        ) : null}
        <span
          aria-hidden
          className="mx-1 grow border-b border-dashed border-border/80 transition-colors duration-300 group-hover:border-primary/50"
        />
        <span className="font-display text-lg tabular-nums text-primary">
          {formatEUR(item.price)}
        </span>
      </div>
      {item.description ? (
        <p className="mt-1.5 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
      ) : null}
    </li>
  );
}
