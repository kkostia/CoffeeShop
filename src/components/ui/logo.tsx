import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-2xl leading-none tracking-tight text-foreground",
        className,
      )}
    >
      Bramble <span className="text-accent">&amp;</span> Brew
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground",
        "font-display text-base font-semibold",
        className,
      )}
    >
      b&amp;b
    </span>
  );
}
