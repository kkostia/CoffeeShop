"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-full font-medium tracking-tight select-none",
    "transition-[transform,background-color,color,box-shadow,border-color] duration-300",
    "[transition-timing-function:var(--ease-cafe)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:translate-y-[1px] active:scale-[0.99]",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-primary text-primary-foreground btn-shine",
          "shadow-[0_1px_0_rgba(45,31,20,0.15),0_8px_24px_-12px_rgba(111,78,55,0.45)]",
          "hover:-translate-y-[1px] hover:shadow-[0_2px_0_rgba(45,31,20,0.18),0_14px_28px_-14px_rgba(111,78,55,0.55)]",
        ].join(" "),
        accent: [
          "bg-accent text-accent-foreground btn-shine",
          "hover:-translate-y-[1px] hover:bg-[#cfa06d]",
        ].join(" "),
        outline: [
          "bg-transparent text-foreground border border-foreground/80",
          "hover:bg-foreground hover:text-background hover:-translate-y-[1px]",
        ].join(" "),
        ghost: "text-foreground hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-[15px]",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
