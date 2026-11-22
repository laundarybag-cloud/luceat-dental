"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-field font-medium transition-all duration-150 ease-[var(--ease-out-soft)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-forest-800 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-forest-700",
        secondary:
          "bg-white text-ink border border-line shadow-card hover:bg-canvas hover:border-line-strong",
        ghost: "text-ink-soft hover:bg-forest-50 hover:text-forest-800",
        subtle: "bg-forest-50 text-forest-700 hover:bg-forest-100",
        gold: "bg-gold-300 text-forest-900 hover:bg-gold-400",
        danger:
          "bg-white text-status-cancelled border border-line hover:bg-status-cancelled-bg hover:border-status-cancelled/30",
      },
      size: {
        sm: "h-8 px-3 text-small [&_svg]:size-3.5",
        md: "h-9 px-3.5 text-small [&_svg]:size-4",
        lg: "h-10 px-4 text-body [&_svg]:size-4",
        icon: "size-9 [&_svg]:size-4",
        "icon-sm": "size-8 [&_svg]:size-3.5",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
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
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
