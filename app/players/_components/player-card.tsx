"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Player } from "@/lib/db/schema";
import { playerProfilePath } from "@/lib/match/routes";
import { getPlayerRiotIdLabel } from "@/lib/riot/display";
import { UserRound } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  disabled?: boolean;
  onToggle: (playerId: number) => void;
  onEditScore: (player: Player) => void;
  variant?: "grid" | "modal";
  highlight?: "gold" | "silver" | "bronze" | null;
}

export function PlayerCard({
  player,
  isSelected,
  disabled,
  onToggle,
  onEditScore,
  variant = "grid",
  highlight = null,
}: PlayerCardProps) {
  const riotId = getPlayerRiotIdLabel(player);

  const highlightClasses =
    highlight === "gold"
      ? "border-[#E6C357] shadow-[0_0_35px_rgba(230,195,87,0.6)]"
      : highlight === "silver"
        ? "border-[#C0C6D8] shadow-[0_0_30px_rgba(192,198,216,0.45)]"
        : highlight === "bronze"
          ? "border-[#D19063] shadow-[0_0_28px_rgba(209,144,99,0.45)]"
          : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "flex min-w-[260px] flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 transition-all hover:border-accent/60 hover:shadow-glow sm:min-w-[300px]",
        variant === "modal" && "min-w-0 sm:min-w-0 bg-black/30",
        isSelected && "border-accent/80 bg-accent/10 shadow-glow",
        highlightClasses,
      )}
    >
      <div className="flex items-center gap-4">
        <Avatar src={player.photoUrl ?? undefined} alt={player.name} size="md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="break-words font-semibold uppercase tracking-wide text-white/80">
            {player.name}
          </span>
          {riotId ? (
            <span className="truncate text-[11px] text-white/40">{riotId}</span>
          ) : null}
          <span className="text-xs text-white/50">
            PDL:{" "}
            <button
              type="button"
              onClick={() => onEditScore(player)}
              className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] uppercase tracking-wide text-primary hover:border-primary hover:text-primary/90"
            >
              {player.score}
            </button>
          </span>
        </div>
        <button
          type="button"
          disabled={disabled && !isSelected}
          onClick={() => onToggle(player.id)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1 text-xs uppercase tracking-wider transition-all",
            isSelected
              ? "border-accent bg-accent/20 text-white"
              : "border-white/20 text-white/60 hover:border-accent hover:text-white",
            disabled && !isSelected && "opacity-40",
          )}
        >
          {isSelected ? "Selecionado" : "Selecionar"}
        </button>
      </div>

      <Link
        href={playerProfilePath(player.id)}
        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[11px] uppercase tracking-wide text-white/65 transition hover:border-primary/40 hover:text-primary"
      >
        <UserRound className="h-3.5 w-3.5" />
        Ver perfil
      </Link>
    </motion.div>
  );
}
