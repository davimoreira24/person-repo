import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "default" | "sm" | "lg" | "icon";

const baseClasses =
  "inline-flex items-center justify-center rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-primary via-primary to-accent text-neutral-foreground shadow-glow hover:shadow-[0_0_50px_rgba(230,195,87,0.55)] focus-visible:ring-primary/80",
  secondary:
    "bg-secondary/60 text-neutral-foreground border border-secondary/50 hover:bg-secondary/80 focus-visible:ring-accent/70",
  ghost:
    "bg-transparent text-neutral-foreground hover:bg-white/5 border border-transparent focus-visible:ring-accent/70",
  outline:
    "bg-transparent text-neutral-foreground border border-white/20 hover:border-accent focus-visible:ring-accent/70",
};

const sizeClasses: Record<Size, string> = {
  default: "px-5 py-2.5 text-sm",
  sm: "px-4 py-2 text-xs",
  lg: "px-7 py-3 text-base",
  icon: "h-11 w-11",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "default", asChild, ...props },
    ref,
  ) => {
    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className,
    );

    if (asChild && React.isValidElement(props.children)) {
      return React.cloneElement(props.children, {
        className: cn(classes, props.children.props.className),
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {props.children}
      </button>
    );
  },
);

Button.displayName = "Button";

export function buttonStyles({
  variant = "primary",
  size = "default",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

