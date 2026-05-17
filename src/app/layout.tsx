import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ChatLauncher } from "@/components/chat/chat-launcher";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Derived from NEXT_PUBLIC_APP_URL when set (Vercel + prod) so canonical /
// Open Graph URLs match the deployed domain. Falls back to a sensible
// placeholder for local builds where the env var isn't set.
const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://bramble-and-brew.vercel.app";

export const metadata: Metadata = {
  title: "Bramble & Brew — Slow coffee. Real conversations. | Galway",
  description:
    "Third-wave specialty coffee in Galway's Latin Quarter. Single-origin pour overs, house-roasted beans, and weekend cupping sessions.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Bramble & Brew — Galway specialty coffee",
    description:
      "Slow coffee, house-roasted beans, and a cozy reading nook on Quay Street.",
    type: "website",
    locale: "en_IE",
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <ChatLauncher />
        <Toaster
          position="bottom-left"
          toastOptions={{
            style: {
              background: "var(--color-card)",
              color: "var(--color-foreground)",
              border: "1px solid var(--color-border)",
              fontFamily: "var(--font-inter)",
            },
          }}
        />
      </body>
    </html>
  );
}
