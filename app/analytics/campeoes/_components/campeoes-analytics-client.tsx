"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { PlayerChampionStat } from "@/lib/queries/champion-analytics";
import { X } from "lucide-react";
import { buttonStyles } from "@/components/ui/button-styles";

export type ChampionCardDTO = {
  key: string;
  name: string;
  icon: string | null;
  positions: string[];
};

type OverallDTO = {
  wins: number;
  games: number;
  winRate: number;
};

interface CampeoesAnalyticsClientProps {
  champions: ChampionCardDTO[];
  leaderboards: Record<string, PlayerChampionStat[]>;
  overallByKey: Record<string, OverallDTO>;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CampeoesAnalyticsClient({
  champions,
  leaderboards,
  overallByKey,
}: CampeoesAnalyticsClientProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!selectedKey) return null;
    const ch = champions.find((c) => c.key === selectedKey) ?? null;
    const board = leaderboards[selectedKey] ?? [];
    const overall = overallByKey[selectedKey];
    return ch ? { champion: ch, board, overall } : null;
  }, [selectedKey, champions, leaderboards, overallByKey]);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {champions.map((c) => {
          const overall = overallByKey[c.key];
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setSelectedKey(c.key)}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-center transition hover:border-primary/50 hover:bg-white/[0.08]"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-white/15 bg-black/30 shadow-inner">
                {c.icon ? (
                  <Image
                    src={c.icon}
                    alt={c.name}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/35">
                    {getInitials(c.name)}
                  </div>
                )}
              </div>
              <span className="line-clamp-2 text-xs font-medium leading-tight text-white/90">
                {c.name}
              </span>
              {overall && overall.games > 0 ? (
                <span className="text-[10px] tabular-nums text-primary/90">
                  {(overall.winRate * 100).toFixed(0)}% · {overall.games}P
                </span>
              ) : (
                <span className="text-[10px] text-white/35">0 jogos</span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && selectedKey && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="champion-modal-title"
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedKey(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 28, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0c1220] shadow-[0_0_60px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-start gap-4 border-b border-white/10 p-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/15">
                  {selected.champion.icon ? (
                    <Image
                      src={selected.champion.icon}
                      alt={selected.champion.name}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white/40">
                      {getInitials(selected.champion.name)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <h2
                    id="champion-modal-title"
                    className="font-display text-xl text-white"
                  >
                    {selected.champion.name}
                  </h2>
                  <p className="mt-1 text-xs text-white/45">
                    {selected.champion.positions.join(" · ")}
                  </p>
                  {selected.overall && selected.overall.games > 0 && (
                    <p className="mt-2 text-sm text-primary/90">
                      Win rate global do grupo:{" "}
                      <span className="font-semibold">
                        {(selected.overall.winRate * 100).toFixed(0)}%
                      </span>{" "}
                      · {selected.overall.games} partidas
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className={buttonStyles({
                    variant: "ghost",
                    size: "icon",
                    className: "shrink-0 rounded-full",
                  })}
                  onClick={() => setSelectedKey(null)}
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-white/45">
                  Melhores jogadores (win rate com este campeão)
                </h3>
                {selected.board.length === 0 ? (
                  <p className="text-sm text-white/50">
                    Ninguém jogou este campeão em partidas modo aleatório
                    encerradas ainda.
                  </p>
                ) : (
                  <ol className="flex flex-col gap-2">
                    {selected.board.map((row, index) => (
                      <li
                        key={row.playerId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-xs font-bold text-primary">
                            {index + 1}
                          </span>
                          <span className="truncate font-medium text-white">
                            {row.playerName}
                          </span>
                        </div>
                        <div className="shrink-0 text-right text-sm tabular-nums">
                          <span className="font-semibold text-primary">
                            {(row.winRate * 100).toFixed(0)}%
                          </span>
                          <span className="ml-2 text-white/45">
                            {row.wins}W / {row.games}P
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
