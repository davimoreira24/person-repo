"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { MatchTeamPlayer, MatchWithTeams } from "@/lib/queries/players";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const cardVariants = {
  hidden: (direction: "top" | "bottom") => ({
    opacity: 0,
    y: direction === "top" ? -40 : 40,
  }),
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

type RoleKey = "top" | "jungle" | "mid" | "adc" | "sup";

const ROLE_ORDER: RoleKey[] = ["top", "jungle", "mid", "adc", "sup"];

const ROLE_INFO: Record<
  RoleKey,
  {
    label: string;
    icon: string;
  }
> = {
  top: { label: "Topo", icon: "/top.png" },
  jungle: { label: "Selva", icon: "/jungle.png" },
  mid: { label: "Meio", icon: "/mid.png" },
  adc: { label: "Atirador", icon: "/adc.png" },
  sup: { label: "Suporte", icon: "/sup.png" },
};

interface LolPlayerCardProps {
  player: MatchTeamPlayer;
  team: 1 | 2;
  index: number;
}

function LolPlayerCard({ player, team, index }: LolPlayerCardProps) {
  const isBlueSide = team === 1;
  const sideGradient = isBlueSide
    ? "from-[#1C2D5A] via-[#27427C] to-[#19233F]"
    : "from-[#4B1E2B] via-[#7D2F3C] to-[#30151E]";
  const borderColor = player.isWinner
    ? "border-[#E6C357]"
    : isBlueSide
    ? "border-[#4F72FF]/80"
    : "border-[#FF655A]/80";
  const glowColor = player.isWinner
    ? "shadow-[0_0_35px_rgba(230,195,87,0.6)]"
    : isBlueSide
    ? "shadow-[0_0_25px_rgba(79,114,255,0.55)]"
    : "shadow-[0_0_25px_rgba(255,101,90,0.55)]";
  const role = ROLE_ORDER[index] ?? null;
  const roleInfo = role ? ROLE_INFO[role] : null;

  return (
    <motion.div
      layout
      custom={isBlueSide ? "top" : "bottom"}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      transition={{ delay: index * 0.06 }}
      className={`group relative flex h-[280px] w-[168px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border-2 bg-gradient-to-b ${sideGradient} ${borderColor} ${glowColor} transition-transform duration-300 hover:-translate-y-1`}
    >
      <div className="relative flex-1 overflow-hidden">
        {player.isMvp && (
          <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full border border-yellow-300/60 bg-yellow-300/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-yellow-100 shadow-[0_0_12px_rgba(230,195,87,0.55)]">
            MVP
          </div>
        )}
        {player.isDud && (
          <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full border border-red-400/50 bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-red-100 shadow-[0_0_12px_rgba(255,80,80,0.45)]">
            Pior
          </div>
        )}
        {roleInfo && (
          <div className="absolute right-3 top-3 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-white/70 backdrop-blur-sm">
            <Image
              src={roleInfo.icon}
              alt={roleInfo.label}
              width={18}
              height={18}
              className="h-[18px] w-[18px] object-contain"
            />
            <span className="hidden sm:inline">{roleInfo.label}</span>
          </div>
        )}
        {player.photoUrl ? (
          <Image
            src={player.photoUrl}
            alt={player.name}
            fill
            priority
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-black/60 via-black/30 to-black/60 text-4xl font-bold text-white/40">
            {getInitials(player.name)}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/60 via-black/10 to-transparent opacity-70" />
      </div>

      <div className="relative z-10 flex flex-col gap-2 border-t border-white/10 bg-black/80 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm tracking-wide text-white drop-shadow-md">
            {player.name}
          </span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/60">
            {isBlueSide ? "Blue" : "Red"}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-white/70">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-[0.35em] text-white/40">
              PDLs
            </span>
            <span className="text-xs font-semibold text-white">
              {player.score}
            </span>
          </div>
          <span className="text-xs font-semibold text-white">100%</span>
        </div>
      </div>
    </motion.div>
  );
}

interface TeamDisplayProps {
  match: MatchWithTeams;
}

export function TeamDisplay({ match }: TeamDisplayProps) {
  return (
    <div className="relative flex flex-col gap-8 rounded-3xl border border-white/10 bg-gradient-to-b from-[#04070F]/95 via-[#060A13]/92 to-[#090E18]/95 p-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs uppercase tracking-[0.45em] text-white/50">
          Campos da Justiça
        </span>
        <h2 className="font-display text-4xl text-white drop-shadow-[0_0_35px_rgba(79,114,255,0.35)]">
          Summoner&apos;s Rift
        </h2>
        {match.winnerTeam && (
          <div className="mt-1 flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-300/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-yellow-100">
            Time {match.winnerTeam} vitorioso
          </div>
        )}
      </header>

      <div className="relative flex flex-col gap-12">
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2">
          {match.teams[1].map((player, index) => (
            <LolPlayerCard
              key={`team1-${player.playerId}`}
              player={player}
              team={1}
              index={index}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-[0.35em] text-white/40" />
          <span className="font-display text-5xl text-white drop-shadow-[0_0_40px_rgba(255,245,206,0.55)]">
            VS
          </span>
          <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>

        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2">
          {match.teams[2].map((player, index) => (
            <LolPlayerCard
              key={`team2-${player.playerId}`}
              player={player}
              team={2}
              index={index}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-white/10 pt-4 text-xs text-white/40">
        <span>PDLs exibem a pontuação acumulada de cada invocador.</span>
        {match.completedAt && (
          <span>
            Partida encerrada em{" "}
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(match.completedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
