import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

const variants: Record<Variant, string> = {
  /** Une seule action principale par zone. Laiton : la couleur de l'action. */
  primary: "bg-cta text-cta-text font-semibold hover:bg-cta-hover",
  secondary: "border border-line-strong bg-surface text-text hover:bg-sunken",
  ghost: "text-text-2 hover:bg-sunken hover:text-text",
  danger: "border border-line-strong bg-surface text-danger hover:bg-danger-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

const iconSizes: Record<Size, string> = { sm: "size-8", md: "size-10" };

export type ButtonStyleProps = { variant?: Variant; size?: Size; iconOnly?: boolean };

export function buttonClasses({ variant = "secondary", size = "md", iconOnly }: ButtonStyleProps = {}) {
  return cn(base, variants[variant], iconOnly ? iconSizes[size] : sizes[size]);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, iconOnly, className, type = "button", ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn(buttonClasses({ variant, size, iconOnly }), className)} {...props} />;
});

type ButtonLinkProps = React.ComponentProps<typeof Link> & ButtonStyleProps;

export function ButtonLink({ variant, size, iconOnly, className, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonClasses({ variant, size, iconOnly }), className)} {...props} />;
}
