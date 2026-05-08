"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, ChevronRight, Crown, Skull, Swords, Users } from "lucide-react";
import type { MatchHistoryEntry } from "@/lib/queries/players";
import { buttonStyles } from "@/components/ui/button-styles";

function formatMatchWhen(d: Date | null) {
  if (!d) return "Data não registrada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

interface MatchHistoryListProps {
  entries: MatchHistoryEntry[];
}

export function MatchHistoryList({ entries }: MatchHistoryListProps) {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-14 text-center">
        <Swords className="h-14 w-14 text-white/15" />
        <p className="max-w-md text-lg text-white/50">
          Ainda não há partidas encerradas. Complete uma partida para ver o
          histórico aqui.
        </p>
        <Link
          href="/players"
          className={buttonStyles({ variant: "default", className: "mt-2" })}
        >
          Ir ao lobby
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      {entries.map((m) => {
        const winnerLabel = m.winnerTeam === 1 ? "Time 1" : "Time 2";
        return (
          <motion.article
            key={m.id}
            variants={item}
            className="group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-5 transition-colors hover:border-accent/40"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3 text-sm text-white/55">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-white/35" />
                    {formatMatchWhen(m.completedAt)}
                  </span>
                  <span className="rounded-full border border-primary/35 bg-primary/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
                    {winnerLabel} venceu
                  </span>
                  {m.gameMode === "draft" && (
                    <span className="rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Draft
                    </span>
                  )}
                  {m.championsRandom && (
                    <span className="rounded-full border border-accent/40 bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                      Aleatório
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {m.mvpName ? (
                    <span className="inline-flex items-center gap-1.5 text-primary">
                      <Crown className="h-4 w-4 shrink-0" />
                      MVP: {m.mvpName}
                    </span>
                  ) : null}
                  {m.dudName ? (
                    <span className="inline-flex items-center gap-1.5 text-red-300/90">
                      <Skull className="h-4 w-4 shrink-0" />
                      Pior: {m.dudName}
                    </span>
                  ) : null}
                </div>
              </div>
              <Link
                href={`/match/${m.id}`}
                className={buttonStyles({
                  variant: "ghost",
                  size: "sm",
                  className:
                    "shrink-0 gap-1 text-white/60 hover:text-white group-hover:text-accent",
                })}
              >
                Ver partida
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 md:grid-cols-2">
              <TeamBlock
                label="Time 1"
                names={m.team1Names}
                highlight={m.winnerTeam === 1}
              />
              <TeamBlock
                label="Time 2"
                names={m.team2Names}
                highlight={m.winnerTeam === 2}
              />
            </div>
          </motion.article>
        );
      })}
    </motion.div>
  );
}

function TeamBlock({
  label,
  names,
  highlight,
}: {
  label: string;
  names: string[];
  highlight: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        highlight
          ? "border-primary/40 bg-primary/[0.07]"
          : "border-white/10 bg-black/20"
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
        <Users className="h-3.5 w-3.5" />
        {label}
        {highlight ? (
          <span className="text-[10px] font-bold text-primary">●</span>
        ) : null}
      </div>
      <ul className="flex flex-col gap-1.5 text-sm text-white/85">
        {names.map((name, i) => (
          <li key={`${label}-${i}-${name}`}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
