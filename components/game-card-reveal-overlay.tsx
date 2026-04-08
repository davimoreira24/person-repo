"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  type CardRevealPayload,
  ROULETTE_LAND_INDEX,
} from "@/lib/match/game-card-types";
import { Button } from "@/components/ui/button";
import { ImageOff } from "lucide-react";

/** Altura de cada frame da roleta (px) — manter alinhado com `computeFinalY`. */
const ITEM_H = 96;
const VIEW_H = 280;

function computeFinalY(): number {
  return -(ROULETTE_LAND_INDEX * ITEM_H) + VIEW_H / 2 - ITEM_H / 2;
}

type GameCardRevealOverlayProps = {
  payload: CardRevealPayload;
  onContinue: () => void;
};

export function GameCardRevealOverlay({
  payload,
  onContinue,
}: GameCardRevealOverlayProps) {
  const { card, rouletteSlots } = payload;
  const [phase, setPhase] = useState<"spin" | "reveal">("spin");

  useEffect(() => {
    const t = window.setTimeout(() => setPhase("reveal"), 4800);
    return () => clearTimeout(t);
  }, []);

  const finalY = computeFinalY();

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#04070f]/95 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[120%] w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        <div className="absolute right-1/4 top-0 h-[120%] w-px bg-gradient-to-b from-transparent via-accent/25 to-transparent" />
      </div>

      <AnimatePresence mode="wait">
        {phase === "spin" ? (
          <motion.div
            key="spin"
            className="flex w-full max-w-md flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
            transition={{ duration: 0.35 }}
          >
            <p className="font-display text-xl tracking-wide text-white/90">
              Sorteando cartinha…
            </p>
            <div
              className="relative w-full overflow-hidden rounded-2xl border-2 border-white/15 bg-black/50 shadow-[0_0_60px_rgba(230,195,87,0.15)]"
              style={{ height: VIEW_H }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-black/90 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-20 h-[2px] -translate-y-1/2 bg-primary/80 shadow-[0_0_20px_rgba(230,195,87,0.9)]" />

              <motion.div
                className="will-change-transform px-2"
                initial={{ y: 0 }}
                animate={{ y: finalY }}
                transition={{
                  duration: 4.2,
                  ease: [0.12, 0.85, 0.22, 1],
                }}
              >
                {rouletteSlots.map((slot) => (
                  <div
                    key={slot.key}
                    className="box-border flex w-full shrink-0 overflow-hidden border-b border-white/10 bg-[#0a0e12]"
                    style={{ height: ITEM_H }}
                  >
                    {slot.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- URLs arbitrárias
                      <img
                        src={slot.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        draggable={false}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/[0.06] to-black/50">
                        <ImageOff
                          className="h-10 w-10 text-white/20"
                          aria-hidden
                        />
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            </div>
            <p className="text-center text-xs text-white/40">
              Só as artes passam na roleta — nome e regras vêm depois.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            className="relative flex w-full max-w-lg flex-col items-center justify-center gap-8 px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            {/* Halo atrás da carta */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[min(70vh,520px)] w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-amber-400/35 via-yellow-200/20 to-amber-600/25 blur-[48px]"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* Ondas que saem da carta */}
            <div
              className="relative flex min-h-[min(72vh,560px)] w-full max-w-[min(92vw,400px)] items-center justify-center"
              style={{ perspective: 1200 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 aspect-[3/4] w-[min(85%,340px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-primary/50"
                  initial={{ scale: 0.85, opacity: 0.55 }}
                  animate={{ scale: 1.35 + i * 0.12, opacity: 0 }}
                  transition={{
                    duration: 1.15,
                    delay: 0.08 + i * 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              ))}

              <motion.div
                className="relative z-10 w-full max-w-[min(92vw,400px)]"
                initial={{
                  scale: 0.35,
                  opacity: 0,
                  rotateX: 28,
                  rotateZ: -12,
                  y: 72,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  rotateX: 0,
                  rotateZ: 0,
                  y: 0,
                }}
                transition={{
                  type: "spring",
                  damping: 13,
                  stiffness: 220,
                  mass: 0.85,
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div
                  className="relative overflow-hidden rounded-2xl border-2 border-white/25 bg-[#0a0e12] shadow-[0_8px_0_rgba(0,0,0,0.45),0_32px_64px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {card.imageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element -- URLs arbitrárias */}
                      <img
                        src={card.imageUrl}
                        alt={card.title}
                        className="block w-full object-cover"
                        draggable={false}
                      />
                      {/* Brilho que atravessa a carta uma vez */}
                      <motion.div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        initial={{ x: "-120%", skewX: -12 }}
                        animate={{ x: "120%" }}
                        transition={{
                          duration: 1.05,
                          delay: 0.35,
                          ease: [0.22, 0.61, 0.36, 1],
                        }}
                        style={{
                          background:
                            "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.12) 45%, rgba(255,248,220,0.35) 50%, rgba(255,255,255,0.1) 55%, transparent 100%)",
                          width: "45%",
                        }}
                      />
                    </>
                  ) : (
                    <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#1a1520] via-[#0d121c] to-[#080a10] p-8">
                      <ImageOff
                        className="h-16 w-16 text-white/25"
                        aria-hidden
                      />
                      <span className="sr-only">{card.title}</span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" />
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Button
                type="button"
                className="min-w-[200px] shadow-[0_0_24px_rgba(230,195,87,0.25)]"
                onClick={onContinue}
              >
                Ir para a partida
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
