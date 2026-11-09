"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Player } from "@/lib/db/schema";
import type { PlayerCareerStats } from "@/lib/queries/players";
import { playerProfilePath } from "@/lib/match/routes";
import {
  getPlayerRiotIdLabel,
  getPlayerSoloRankLabel,
} from "@/lib/riot/display";
import { Trophy, Medal, Award } from "lucide-react";

export type RankingListPlayer = Player & { careerStats: PlayerCareerStats };

interface RankingListProps {
  players: RankingListPlayer[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getRankIcon(position: number) {
  switch (position) {
    case 1:
      return <Trophy className="h-6 w-6 text-[#FFD700]" />;
    case 2:
      return <Medal className="h-6 w-6 text-[#C0C0C0]" />;
    case 3:
      return <Award className="h-6 w-6 text-[#CD7F32]" />;
    default:
      return null;
  }
}

function getRankStyles(position: number) {
  switch (position) {
    case 1:
      return {
        border: "border-[#FFD700]/80",
        glow: "shadow-[0_0_40px_rgba(255,215,0,0.5)]",
        gradient: "from-[#FFD700]/20 via-[#FFA500]/10 to-transparent",
        text: "text-[#FFD700]",
      };
    case 2:
      return {
        border: "border-[#C0C0C0]/80",
        glow: "shadow-[0_0_35px_rgba(192,192,192,0.4)]",
        gradient: "from-[#C0C0C0]/15 via-[#A8A8A8]/10 to-transparent",
        text: "text-[#C0C0C0]",
      };
    case 3:
      return {
        border: "border-[#CD7F32]/80",
        glow: "shadow-[0_0_30px_rgba(205,127,50,0.4)]",
        gradient: "from-[#CD7F32]/15 via-[#B8860B]/10 to-transparent",
        text: "text-[#CD7F32]",
      };
    default:
      return {
        border: "border-white/10",
        glow: "",
        gradient: "from-white/5 to-transparent",
        text: "text-white/60",
      };
  }
}

export function RankingList({ players }: RankingListProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-4"
    >
      {players.map((player, index) => {
        const position = index + 1;
        const styles = getRankStyles(position);
        const isTopThree = position <= 3;

        return (
          <motion.div key={player.id} variants={itemVariants}>
            <Link
              href={playerProfilePath(player.id)}
              className={`group relative flex items-center gap-6 overflow-hidden rounded-2xl border bg-gradient-to-r p-6 transition-all hover:border-accent/60 hover:scale-[1.01] ${styles.border} ${styles.gradient} ${styles.glow}`}
            >
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border backdrop-blur-sm transition-transform group-hover:scale-110 ${styles.border} ${isTopThree ? "bg-black/60" : "bg-white/10"}`}
              >
                {getRankIcon(position) || (
                  <span className={`text-2xl font-bold ${styles.text}`}>
                    {position}
                  </span>
                )}
              </div>

              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white/20 shadow-lg transition-transform group-hover:scale-110">
                {player.photoUrl ? (
                  <Image
                    src={player.photoUrl}
                    alt={player.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/5 text-xl font-bold text-white/30">
                    {getInitials(player.name)}
                  </div>
                )}
              </div>

              <div className="flex flex-1 items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-white">
                    {player.name}
                  </h3>
                  {getPlayerSoloRankLabel(player) ? (
                    <span className="text-xs text-primary/90">
                      {getPlayerSoloRankLabel(player)}
                    </span>
                  ) : getPlayerRiotIdLabel(player) ? (
                    <span className="truncate text-xs text-white/45">
                      {getPlayerRiotIdLabel(player)}
                    </span>
                  ) : (
                    <span className="text-sm text-white/50">
                      Ver perfil completo
                    </span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-4xl font-bold ${isTopThree ? styles.text : "text-white"}`}
                    >
                      {player.score}
                    </span>
                    <span className="text-sm text-white/50">PDLs</span>
                  </div>
                  {isTopThree ? (
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${styles.text}`}
                    >
                      Top {position}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}

      {players.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-12 text-center"
        >
          <Trophy className="h-16 w-16 text-white/20" />
          <p className="text-lg text-white/50">
            Nenhum jogador cadastrado ainda.
          </p>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
