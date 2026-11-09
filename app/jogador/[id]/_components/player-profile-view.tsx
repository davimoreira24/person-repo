"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { buttonStyles } from "@/components/ui/button-styles";
import { PlayerRiotStats } from "@/components/player-riot-stats";
import type { PlayerProfile } from "@/lib/queries/player-profile";
import {
  getPlayerRiotIdLabel,
  getPlayerSoloRankLabel,
} from "@/lib/riot/display";
import { ProfileBackground } from "./profile-background";
import { ProfileRiotActions } from "./profile-riot-actions";
import {
  ArrowLeft,
  Crown,
  Frown,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Theme = {
  eyebrow: string;
  accent: string;
  border: string;
  glow: string;
  badge: string;
  panel: string;
};

function themeForRank(position: number): Theme {
  if (position === 1) {
    return {
      eyebrow: "Lenda da Person",
      accent: "text-[#FFD700]",
      border: "border-[#FFD700]/50",
      glow: "shadow-[0_0_90px_rgba(255,215,0,0.4)]",
      badge: "border-[#FFD700]/55 bg-[#FFD700]/15 text-[#FFD700]",
      panel: "border-[#FFD700]/25 bg-black/50 backdrop-blur-xl",
    };
  }
  if (position === 2) {
    return {
      eyebrow: "Elite da mesa",
      accent: "text-[#D7DCE8]",
      border: "border-[#C0C6D8]/45",
      glow: "shadow-[0_0_70px_rgba(192,198,216,0.3)]",
      badge: "border-[#C0C6D8]/45 bg-white/10 text-[#D7DCE8]",
      panel: "border-white/15 bg-black/55 backdrop-blur-xl",
    };
  }
  if (position === 3) {
    return {
      eyebrow: "Pódio de bronze",
      accent: "text-[#E0A57A]",
      border: "border-[#D19063]/45",
      glow: "shadow-[0_0_65px_rgba(209,144,99,0.32)]",
      badge: "border-[#D19063]/50 bg-[#D19063]/15 text-[#E0A57A]",
      panel: "border-[#D19063]/20 bg-black/55 backdrop-blur-xl",
    };
  }
  return {
    eyebrow: `Summoner #${position}`,
    accent: "text-primary",
    border: "border-primary/30",
    glow: "shadow-[0_0_50px_rgba(79,114,255,0.22)]",
    badge: "border-primary/35 bg-primary/10 text-primary",
    panel: "border-white/10 bg-black/55 backdrop-blur-xl",
  };
}

type PlayerProfileViewProps = {
  profile: PlayerProfile;
};

export function PlayerProfileView({ profile }: PlayerProfileViewProps) {
  const { player, rankPosition, totalPlayers, careerStats } = profile;
  const theme = themeForRank(rankPosition);
  const isChampion = rankPosition === 1;
  const riotId = getPlayerRiotIdLabel(player);
  const soloRank = getPlayerSoloRankLabel(player);
  const games = careerStats.wins + careerStats.losses;
  const personWr =
    games > 0
      ? Math.round((careerStats.wins / games) * 1000) / 10
      : null;

  return (
    <div className="relative isolate min-h-dvh overflow-x-hidden bg-[#05070f]">
      <ProfileBackground playerId={player.id} rankPosition={rankPosition} />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-28 pt-28">
        <Link
          href="/ranking"
          className={buttonStyles({
            variant: "ghost",
            className: "w-fit gap-2 bg-black/40 backdrop-blur",
          })}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao ranking
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className={`relative overflow-hidden rounded-[2rem] border ${theme.border} ${theme.glow} ${theme.panel} p-6 sm:p-10`}
        >
          {isChampion ? (
            <motion.div
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFD700] to-transparent"
              animate={{ opacity: [0.25, 1, 0.25], scaleX: [0.85, 1, 0.85] }}
              transition={{ duration: 2.6, repeat: Infinity }}
            />
          ) : null}

          <div className="flex flex-col items-center gap-7 text-center">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.35em] ${theme.badge}`}
            >
              {rankPosition <= 3 ? (
                <Trophy className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {theme.eyebrow}
            </span>

            <div className="relative">
              {isChampion ? (
                <motion.div
                  className="absolute -top-7 left-1/2 z-10 -translate-x-1/2 sm:-top-8"
                  animate={{ y: [0, -4, 0], rotate: [-6, -2, -6] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  aria-hidden
                >
                  <Crown
                    className="h-10 w-10 drop-shadow-[0_0_12px_rgba(255,215,0,0.85)] sm:h-12 sm:w-12"
                    fill="#FFD700"
                    stroke="#B8860B"
                    strokeWidth={1.25}
                  />
                </motion.div>
              ) : null}

              <div
                className={`relative h-44 w-44 overflow-hidden rounded-full border-4 sm:h-52 sm:w-52 ${theme.border} ${isChampion ? "ring-4 ring-[#FFD700]/30" : ""}`}
              >
                {player.photoUrl ? (
                  <Image
                    src={player.photoUrl}
                    alt={player.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/5 text-5xl font-bold text-white/30">
                    {getInitials(player.name)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h1
                className={`font-display text-5xl tracking-tight text-white sm:text-6xl ${
                  isChampion
                    ? "bg-gradient-to-b from-[#FFF4C2] via-[#FFD700] to-[#B8860B] bg-clip-text text-transparent"
                    : ""
                }`}
              >
                {player.name}
              </h1>
              {riotId ? (
                <p className="text-sm text-white/60">{riotId}</p>
              ) : (
                <p className="text-sm text-white/35">Riot ID não vinculado</p>
              )}
              {soloRank ? (
                <p className={`text-sm font-medium ${theme.accent}`}>{soloRank}</p>
              ) : null}
            </div>

            <div className="grid w-full max-w-xl grid-cols-3 gap-3 sm:gap-4">
              <HeroMetric label="PDL" value={String(player.score)} accent={theme.accent} />
              <HeroMetric
                label="Ranking"
                value={`#${rankPosition}`}
                hint={`de ${totalPlayers}`}
                accent="text-white"
              />
              <HeroMetric
                label="Partidas"
                value={String(games)}
                hint={personWr != null ? `${personWr}% WR` : undefined}
                accent={theme.accent}
              />
            </div>

            <ProfileRiotActions
              playerId={player.id}
              hasRiotId={Boolean(riotId)}
            />
          </div>
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className={`rounded-[1.75rem] border p-5 sm:p-6 ${theme.panel}`}
          >
            <h2 className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-white/45">
              Temporada Person
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <StatTile
                icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
                label="Vitórias"
                value={String(careerStats.wins)}
                tone="bg-emerald-500/10"
              />
              <StatTile
                icon={<TrendingDown className="h-4 w-4 text-red-400" />}
                label="Derrotas"
                value={String(careerStats.losses)}
                tone="bg-red-500/10"
              />
              <StatTile
                icon={<Star className="h-4 w-4 text-primary" />}
                label="MVPs"
                value={String(careerStats.mvpCount)}
                tone="bg-primary/10"
              />
              <StatTile
                icon={<Frown className="h-4 w-4 text-red-400/90" />}
                label="Pior da partida"
                value={String(careerStats.dudCount)}
                tone="bg-red-950/40"
              />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className={`rounded-[1.75rem] border p-4 sm:p-5 ${theme.panel}`}
          >
            <PlayerRiotStats player={player} />
          </motion.section>
        </div>
      </div>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-4 backdrop-blur">
      <p className="text-[10px] uppercase tracking-[0.28em] text-white/40">
        {label}
      </p>
      <p className={`mt-1 font-display text-3xl sm:text-4xl ${accent}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-white/40">{hint}</p> : null}
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${tone}`}>
      {icon}
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-white/45">
          {label}
        </p>
        <p className="text-lg font-bold tabular-nums text-white">{value}</p>
      </div>
    </div>
  );
}
