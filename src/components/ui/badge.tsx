import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default: "bg-neutral-100 text-neutral-900",
        secondary: "bg-neutral-200 text-neutral-700",
        warning: "bg-neutral-800 text-white",
        danger: "bg-black text-white",
        success: "bg-black text-white",
        info: "bg-neutral-100 text-neutral-800 border border-neutral-300",
        outline: "border border-black text-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
