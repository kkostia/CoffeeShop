"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cafe } from "@/lib/cafe-data";

export function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Drop us a real email and we'll add you to the list.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("You're on the list ☕", {
        description: "Expect a quiet monthly note about new beans and Sunday cuppings.",
      });
      setEmail("");
      setSubmitting(false);
    }, 600);
  };

  return (
    <footer
      id="contact"
      className="relative overflow-hidden bg-foreground text-background"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 mix-blend-soft-light"
        style={{
          background:
            "radial-gradient(60% 50% at 80% 0%, rgba(212,165,116,0.4), transparent 65%)," +
            "radial-gradient(50% 40% at 0% 100%, rgba(212,165,116,0.25), transparent 65%)",
        }}
      />
      <div aria-hidden className="absolute inset-0 bg-noise opacity-[0.08]" />

      <div className="relative mx-auto w-full max-w-7xl px-6 py-20 md:px-10 md:py-24">
        <div className="grid gap-12 md:grid-cols-12">
          {/* Brand + newsletter */}
          <div className="md:col-span-6">
            <p className="font-display text-3xl tracking-tight">
              Bramble <span className="text-accent">&amp;</span> Brew
            </p>
            <p className="mt-4 max-w-md text-background/70">
              {cafe.tagline} A specialty coffee shop in Galway&apos;s Latin
              Quarter, roasting our own beans since {cafe.opened}.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 max-w-md">
              <label
                htmlFor="newsletter-email"
                className="text-xs font-medium uppercase tracking-[0.18em] text-background/60"
              >
                Quiet monthly newsletter
              </label>
              <div className="mt-3 flex gap-2">
                <Input
                  id="newsletter-email"
                  type="email"
                  required
                  placeholder="you@somewhere.ie"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 border-background/20 bg-background/10 text-background placeholder:text-background/50 focus-visible:border-accent focus-visible:ring-accent/30"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  aria-label="Subscribe"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform duration-300 [transition-timing-function:var(--ease-cafe)] hover:scale-[1.04] active:scale-[0.97] disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-background/50">
                One email a month, unsubscribe anytime. We hate inbox noise too.
              </p>
            </form>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-background/60">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5 text-background/80">
              {[
                { href: "#about", label: "Our story" },
                { href: "#menu", label: "Menu" },
                { href: "#beans", label: "Beans" },
                { href: "#visit", label: "Visit" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-block transition-colors duration-200 hover:text-accent"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Visit + socials */}
          <div className="md:col-span-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-background/60">
              Drop in
            </p>
            <address className="mt-4 not-italic leading-relaxed text-background/80">
              {cafe.address.street}
              <br />
              {cafe.address.city}, {cafe.address.postcode}
              <br />
              <a
                href={`tel:${cafe.phone.replace(/\s/g, "")}`}
                className="hover:text-accent"
              >
                {cafe.phone}
              </a>
            </address>

            <div className="mt-6 flex gap-2">
              <SocialLink
                href={cafe.socials.instagram}
                label="Instagram"
                Icon={InstagramIcon}
              />
              <SocialLink
                href={cafe.socials.twitter}
                label="Twitter"
                Icon={TwitterIcon}
              />
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-3 border-t border-background/10 pt-8 text-sm text-background/55 md:flex-row md:items-center">
          <p>© {year} Bramble &amp; Brew. Made with care in Galway.</p>
          <p>VAT IE1234567W · Reg. in Ireland</p>
        </div>
      </div>
    </footer>
  );
}

type IconComponent = (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;

function SocialLink({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: IconComponent;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-background/20 text-background/80 transition-[transform,background-color,color,border-color] duration-300 [transition-timing-function:var(--ease-cafe)] hover:-translate-y-0.5 hover:border-accent hover:text-accent"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17.4" cy="6.6" r="0.7" fill="currentColor" />
    </svg>
  );
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  // X / Twitter glyph
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}
