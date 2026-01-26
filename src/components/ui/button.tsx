import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary - Navy (main CTA)
        primary:
          "bg-navy text-white hover:bg-navy-deep focus-visible:ring-navy rounded-lg uppercase tracking-wider shadow-sm hover:shadow-md",
        // Secondary - White with navy border (light backgrounds)
        secondary:
          "bg-white text-navy border-2 border-navy/20 hover:border-navy hover:bg-navy/5 focus-visible:ring-navy rounded-lg uppercase tracking-wider",
        // Sky - Accent blue (highlight actions)
        sky:
          "bg-sky text-white hover:bg-sky-muted focus-visible:ring-sky rounded-lg uppercase tracking-wider shadow-sm hover:shadow-md",
        // Outline - Subtle border (tertiary actions)
        outline:
          "border-2 border-neutral-200 text-foreground-muted hover:border-neutral-400 hover:text-foreground bg-transparent rounded-lg",
        // Ghost - No background (inline actions)
        ghost:
          "text-foreground-muted hover:bg-neutral-100 hover:text-foreground rounded-lg",
        // Link - Underline style
        link:
          "text-navy underline-offset-4 hover:underline",
        // Dark - For use on dark backgrounds (CTA section, footer)
        dark:
          "border-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:border-white/40 focus-visible:ring-white rounded-lg uppercase tracking-wider",
        // Danger - Destructive actions
        danger:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 rounded-lg",
      },
      size: {
        sm: "h-10 px-5 text-xs",
        md: "h-12 px-8 text-sm",
        lg: "h-14 px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
