import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-neutral-foreground transition-all placeholder:text-neutral-foreground/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/50",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";

