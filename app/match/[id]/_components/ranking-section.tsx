"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { buttonStyles } from "@/components/ui/button";
import type { Player } from "@/lib/db/schema";

interface RankingSectionProps {
  matchId: number;
  ranking: Player[];
  mvpId: number | null;
  dudId: number | null;
}

const podiumHighlights: Array<"gold" | "silver" | "bronze" | null> = [
  "gold",
  "silver",
  "bronze",
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];

const borderMap: Record<string, string> = {
  gold: "from-[#F8E08E] via-[#E6C357] to-[#B48A26]",
  silver: "from-[#DDE4F2] via-[#BFC6D9] to-[#9098AB]",
  bronze: "from-[#F0B989] via-[#D19063] to-[#9C5A33]",
};

export function RankingSection({ matchId, ranking, mvpId, dudId }: RankingSectionProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <header className="mb-4 flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.35em] text-white/50">
          Ranking atualizado
        </span>
        <h2 className="font-display text-2xl text-white">Top 10 jogadores</h2>
        <p className="text-sm text-white/60">
          PDLs após a partida #{matchId}
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {ranking.map((player, index) => (
          <div
            key={player.id}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 transition-all hover:border-accent/60"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-primary">#{index + 1}</span>
              <div className="flex flex-col">
                <span className="font-medium text-white">{player.name}</span>
                <span className="text-xs text-white/50">{player.score} PDLs</span>
                <div className="flex gap-2 text-[10px] uppercase tracking-[0.3em]">
                  {player.id === mvpId && <span className="text-primary">MVP</span>}
                  {player.id === dudId && <span className="text-red-400">Pior</span>}
                </div>
              </div>
            </div>
            <button
              type="button"
              className={buttonStyles({ variant: "ghost", size: "sm" })}
              onClick={() => setSelectedPlayer(player)}
            >
              Ver jogador
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-gradient-to-b from-[#0B0F1A]/95 via-[#10172A]/90 to-[#05070D]/95 p-6 shadow-[0_0_70px_rgba(14,22,39,0.75)]"
            >
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/10 p-2 text-white/60 transition hover:border-white/40 hover:text-white/90"
                aria-label="Fechar"
              >
                ✕
              </button>

              <div className="flex flex-col items-center gap-6">
                <div
                  className={`relative flex w-64 max-w-full flex-col items-center rounded-[36px] border border-white/10 bg-gradient-to-b ${borderMap[podiumHighlights[ranking.findIndex((p) => p.id === selectedPlayer.id)] ?? ""] ?? "from-[#1B1F2D] via-[#111523] to-[#090B14]"} px-8 pb-8 pt-10 text-center shadow-[0_15px_45px_rgba(8,12,21,0.55)]`}
                >
                  <div className="absolute -top-5 flex gap-2 text-sm font-semibold uppercase tracking-[0.4em] text-white/80">
                    {selectedPlayer.id === mvpId && <span className="text-primary">MVP</span>}
                    {selectedPlayer.id === dudId && <span className="text-red-300">Pior</span>}
                  </div>
                  <span className="absolute left-6 top-6 text-4xl font-black text-white">
                    {selectedPlayer.score}
                  </span>
                  <div className="relative h-36 w-36 overflow-hidden rounded-full border-4 border-white/10 shadow-[0_0_25px_rgba(255,255,255,0.25)]">
                    {selectedPlayer.photoUrl ? (
                      <Image
                        src={selectedPlayer.photoUrl}
                        alt={selectedPlayer.name}
                        fill
                        sizes="144px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-black/40 text-3xl font-bold text-white/40">
                        {selectedPlayer.name
                          .split(" ")
                          .map((word) => word[0])
                          .join("")
                          .slice(0, 3)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="mt-6 text-lg font-semibold uppercase tracking-[0.35em] text-white">
                    {selectedPlayer.name}
                  </span>
                  <span className="text-xs uppercase tracking-[0.4em] text-white/50">
                    PDLs
                  </span>
                </div>

                <div className="flex w-full justify-end">
                  <button
                    type="button"
                    className={buttonStyles({ variant: "ghost" })}
                    onClick={() => setSelectedPlayer(null)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
