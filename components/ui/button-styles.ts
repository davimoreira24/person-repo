import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-white shadow-glow hover:bg-accent/90 active:scale-95",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-800 text-white shadow-[0_0_35px_rgba(255,0,0,0.45)] hover:from-red-700 hover:to-red-900",
        outline:
          "border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-accent/60",
        secondary:
          "bg-white/10 text-white hover:bg-white/20 active:scale-95",
        ghost: "text-white/70 hover:bg-white/10 hover:text-white",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonStylesProps = VariantProps<typeof buttonStyles>;

export { cn };

