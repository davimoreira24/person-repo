"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";
import {
  getSeasonCountdownParts,
  SEASON_END_LABEL,
  type SeasonCountdownParts,
} from "@/lib/season-countdown";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

type SeasonCountdownProps = {
  variant?: "hero" | "banner";
};

/**
 * Contagem só após mount: `Date.now()` no SSR vs cliente gerava HTML
 * diferente e quebrava a hidratação.
 */
export function SeasonCountdown({ variant = "hero" }: SeasonCountdownProps) {
  const [mounted, setMounted] = useState(false);
  const [parts, setParts] = useState<SeasonCountdownParts | null>(null);

  useEffect(() => {
    setMounted(true);
    const tick = () => setParts(getSeasonCountdownParts());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (variant === "banner") {
    return (
      <div
        className="relative z-20 border-b border-primary/25 bg-[#0a0e16]/90 backdrop-blur-md"
        role="status"
        aria-live="polite"
        aria-busy={!mounted}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium uppercase tracking-[0.2em] text-primary/90">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Fim da Person
          </span>
          {!mounted || !parts ? (
            <span className="font-mono text-sm tabular-nums text-white/50">
              ···
            </span>
          ) : parts.ended ? (
            <span className="text-white/70">A season chegou ao fim.</span>
          ) : (
            <>
              <span className="font-mono text-sm tabular-nums text-white/90">
                {parts.days}d {pad2(parts.hours)}h {pad2(parts.minutes)}m{" "}
                {pad2(parts.seconds)}s
              </span>
              <span className="text-white/40">· {SEASON_END_LABEL}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-lg"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative overflow-hidden rounded-3xl border border-primary/35 bg-gradient-to-br from-primary/[0.12] via-[#0a1018]/90 to-[#060a12]/95 p-5 shadow-[0_0_48px_rgba(230,195,87,0.12)] sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Contagem regressiva
          </div>

          <div>
            <h2 className="font-display text-xl tracking-wide text-white sm:text-2xl">
              Fim da Person
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-white/45">
              {SEASON_END_LABEL}
            </p>
          </div>

          {!mounted || !parts ? (
            <div
              className="grid w-full grid-cols-4 gap-2 sm:gap-3"
              aria-hidden
            >
              {["Dias", "Horas", "Min", "Seg"].map((label) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-black/35 px-2 py-3 sm:px-3"
                >
                  <span className="font-display text-2xl tabular-nums text-white/25 sm:text-3xl">
                    ··
                  </span>
                  <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/40">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          ) : parts.ended ? (
            <p className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-white/70">
              A season encerrou. Bora fechar o ranking e partir pro reset?
            </p>
          ) : (
            <div
              className="grid w-full grid-cols-4 gap-2 sm:gap-3"
              aria-label="Tempo restante até o fim da season"
            >
              <CountdownUnit label="Dias" value={parts.days} pad={false} />
              <CountdownUnit label="Horas" value={parts.hours} />
              <CountdownUnit label="Min" value={parts.minutes} />
              <CountdownUnit label="Seg" value={parts.seconds} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CountdownUnit({
  label,
  value,
  pad = true,
}: {
  label: string;
  value: number;
  pad?: boolean;
}) {
  const display = pad ? pad2(value) : String(value);

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-black/35 px-2 py-3 sm:px-3">
      <motion.span
        key={display}
        className="font-display text-2xl tabular-nums tracking-wide text-primary sm:text-3xl"
        initial={{ opacity: 0.85, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {display}
      </motion.span>
      <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/40">
        {label}
      </span>
    </div>
  );
}
