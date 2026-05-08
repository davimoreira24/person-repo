"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-12 px-6 pb-24 pt-32 text-center md:pt-40">
      <motion.div
        className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.45em] text-white/70 shadow-[0_0_24px_rgba(13,25,45,0.65)]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        Person dos crias
      </motion.div>

      <motion.h1
        className="font-display text-4xl leading-tight text-white drop-shadow-[0_0_40px_rgba(42,148,244,0.35)] md:text-6xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.7, ease: "easeOut" }}
      >
        Monte partidas lendárias com equilíbrio, estilo e estatísticas em tempo
        real.
      </motion.h1>

      <div className="flex max-w-xl flex-col items-center gap-6">
        <p className="text-xs uppercase tracking-[0.35em] text-white/45">
          Escolha o modo de jogo
        </p>
        <div className="flex w-full flex-col flex-wrap items-stretch justify-center gap-4 sm:flex-row sm:items-start">
          <motion.div
            className="flex flex-1 flex-col sm:min-w-[10.5rem]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          >
            <Button asChild className="w-full">
              <Link href="/players">Modo clássico</Link>
            </Button>
          </motion.div>
          <motion.div
            className="flex flex-1 flex-col sm:min-w-[10.5rem]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.32, duration: 0.5, ease: "easeOut" }}
          >
            <Button variant="outline" asChild className="w-full">
              <Link href="/players?mode=draft">Modo Draft</Link>
            </Button>
          </motion.div>
        </div>
        <p className="text-[11px] leading-relaxed text-white/40">
          Campeões aleatórios viraram uma <span className="text-white/65">regra</span> dentro de cada
          modo (em <span className="text-white/65">Condições</span> da lobby), e podem combinar com
          clássico ou draft.
        </p>

        <div className="flex w-full flex-col flex-wrap items-center justify-center gap-4 border-t border-white/10 pt-6 md:flex-row">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.38, duration: 0.5, ease: "easeOut" }}
          >
            <Button variant="outline" asChild>
              <Link href="/ranking">Ver Ranking</Link>
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.42, duration: 0.5, ease: "easeOut" }}
          >
            <Button variant="outline" asChild>
              <Link href="/historico">Histórico</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
