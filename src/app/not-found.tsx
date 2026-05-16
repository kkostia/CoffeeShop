import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-6">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 20%, rgba(212,165,116,0.3), transparent 65%)," +
            "linear-gradient(180deg, #fbf8f3 0%, #faf7f2 100%)",
        }}
      />
      <div className="text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="mt-12 font-display text-7xl tracking-tight text-primary md:text-8xl">
          404
        </p>
        <h1 className="mt-4 font-display text-3xl tracking-tight text-foreground md:text-4xl">
          We&apos;ve checked behind the espresso machine.
        </h1>
        <p className="mt-3 text-muted-foreground">
          The page you&apos;re after isn&apos;t here — maybe it spilled.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild>
            <Link href="/">Back to the cafe</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
