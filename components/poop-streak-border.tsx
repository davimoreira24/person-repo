"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PoopStreakBorderProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/**
 * Borda “fedida” / cocô — só CSS, tom marrom-verde enjoativo e brilho pulsante.
 * Combinado com o texto no card: humor de flame, sem biblioteca externa.
 */
export function PoopStreakBorder({
  children,
  className,
  style,
}: PoopStreakBorderProps) {
  return (
    <div
      className={cn(
        "relative isolate h-full w-full overflow-visible rounded-2xl",
        className,
      )}
      style={style}
    >
      {/* Anel exterior: gradiente lamacento + sombra tóxica */}
      <div
        className="pointer-events-none absolute -inset-[3px] rounded-[18px] bg-gradient-to-br from-[#5c4033] via-[#3d2818] to-[#1a120c] opacity-95 shadow-[0_0_22px_rgba(61,40,22,0.95),0_0_40px_rgba(45,62,20,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] animate-poop-gross"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -inset-[2px] rounded-[17px] border border-dashed border-[#6b8f3a]/35 opacity-80 animate-poop-wobble"
        aria-hidden
      />
      <div className="relative z-[1] h-full w-full overflow-hidden rounded-2xl ring-2 ring-[#4a3020]/90 ring-offset-0 ring-offset-transparent">
        {children}
      </div>
    </div>
  );
}
