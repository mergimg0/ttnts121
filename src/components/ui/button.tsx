import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-black text-white hover:bg-neutral-800 focus-visible:ring-black rounded-none uppercase tracking-wider",
        secondary:
          "bg-white text-black border-2 border-black hover:bg-black hover:text-white focus-visible:ring-black rounded-none uppercase tracking-wider",
        outline:
          "border-2 border-neutral-300 text-neutral-700 hover:border-black hover:text-black rounded-none",
        ghost: "text-neutral-700 hover:bg-neutral-100 rounded-none",
        link: "text-black underline-offset-4 hover:underline",
        danger: "bg-black text-white hover:bg-neutral-800 focus-visible:ring-black rounded-none",
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
