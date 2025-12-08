"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { Player } from "@/lib/db/schema";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";

interface RankingListProps {
  players: Player[];
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

interface PlayerCardModalProps {
  player: Player;
  position: number;
  onClose: () => void;
}

function PlayerCardModal({ player, position, onClose }: PlayerCardModalProps) {
  const styles = getRankStyles(position);
  const isTopThree = position <= 3;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 40 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className={`relative flex h-[500px] w-[340px] flex-col items-center overflow-hidden rounded-3xl border-2 bg-gradient-to-br from-neutral via-neutral/95 to-black/90 p-6 ${styles.border} ${styles.glow}`}
      >
        {/* Rank Badge */}
        <div className={`absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full border px-4 py-2 backdrop-blur-sm ${styles.border} ${isTopThree ? 'bg-black/60' : 'bg-white/10'}`}>
          {getRankIcon(position)}
          <span className={`text-2xl font-bold ${styles.text}`}>#{position}</span>
        </div>

        {/* Player Photo */}
        <div className="relative mt-16 h-56 w-56 overflow-hidden rounded-full border-4 shadow-2xl" style={{ borderColor: isTopThree ? styles.border.split('-')[1]?.split('/')[0] : 'rgba(255,255,255,0.2)' }}>
          {player.photoUrl ? (
            <Image
              src={player.photoUrl}
              alt={player.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-white/10 to-white/5 text-6xl font-bold text-white/30">
              {getInitials(player.name)}
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white">
            {player.name}
          </h2>

          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">
              Pontuação
            </span>
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${styles.text}`} />
              <span className={`text-4xl font-bold ${isTopThree ? styles.text : 'text-white'}`}>
                {player.score}
              </span>
              <span className="text-xl text-white/50">PDLs</span>
            </div>
          </div>
        </div>

        {/* Close hint */}
        <div className="absolute bottom-6 text-xs text-white/40">
          Clique fora para fechar
        </div>
      </motion.div>
    </motion.div>
  );
}

export function RankingList({ players }: RankingListProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<{ player: Player; position: number } | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30, scale: 0.95 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <>
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
            <motion.div
              key={player.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, x: 8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPlayer({ player, position })}
              className={`group relative flex cursor-pointer items-center gap-6 overflow-hidden rounded-2xl border bg-gradient-to-r p-6 transition-all hover:border-accent/60 ${styles.border} ${styles.gradient} ${styles.glow}`}
            >
              {/* Position Badge */}
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border backdrop-blur-sm transition-transform group-hover:scale-110 ${styles.border} ${isTopThree ? 'bg-black/60' : 'bg-white/10'}`}>
                {getRankIcon(position) || (
                  <span className={`text-2xl font-bold ${styles.text}`}>
                    {position}
                  </span>
                )}
              </div>

              {/* Player Photo */}
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

              {/* Player Info */}
              <div className="flex flex-1 items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-2xl font-bold tracking-tight text-white">
                    {player.name}
                  </h3>
                  <span className="text-sm text-white/50">
                    Clique para ver detalhes
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold ${isTopThree ? styles.text : 'text-white'}`}>
                      {player.score}
                    </span>
                    <span className="text-sm text-white/50">PDLs</span>
                  </div>
                  {isTopThree && (
                    <span className={`text-xs font-semibold uppercase tracking-wider ${styles.text}`}>
                      Top {position}
                    </span>
                  )}
                </div>
              </div>

              {/* Hover Arrow */}
              <div className="absolute right-6 opacity-0 transition-opacity group-hover:opacity-100">
                <svg
                  className="h-6 w-6 text-white/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </motion.div>
          );
        })}

        {players.length === 0 && (
          <motion.div
            variants={itemVariants}
            className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-12 text-center"
          >
            <Trophy className="h-16 w-16 text-white/20" />
            <p className="text-lg text-white/50">
              Nenhum jogador cadastrado ainda.
            </p>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedPlayer && (
          <PlayerCardModal
            player={selectedPlayer.player}
            position={selectedPlayer.position}
            onClose={() => setSelectedPlayer(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

