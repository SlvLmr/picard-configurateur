import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-wide transition-all duration-300 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-foreground text-background hover:bg-foreground/90 hover:shadow-[0_12px_40px_-12px_rgba(17,17,19,0.45)]",
        accent:
          "bg-accent text-accent-foreground hover:bg-accent/90 hover:shadow-[0_12px_40px_-12px_rgba(178,138,70,0.45)]",
        secondary:
          "bg-muted text-foreground border border-border hover:bg-muted/70",
        ghost:
          "text-foreground/80 hover:text-foreground hover:bg-muted",
        outline:
          "border border-foreground/20 text-foreground hover:border-foreground/40 hover:bg-muted",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-14 px-8 text-base",
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
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
