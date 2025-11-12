"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Player } from "@/lib/db/schema";

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
        <div className="flex flex-1 flex-col">
          <span className="font-semibold uppercase tracking-wide text-white/80 break-words">
            {player.name}
          </span>
          <span className="text-xs text-white/50">
            Pontuação:{" "}
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
            "rounded-full border px-4 py-1 text-xs uppercase tracking-wider transition-all",
            isSelected
              ? "border-accent bg-accent/20 text-white"
              : "border-white/20 text-white/60 hover:border-accent hover:text-white",
            disabled && !isSelected && "opacity-40",
          )}
        >
          {isSelected ? "Selecionado" : "Selecionar"}
        </button>
      </div>
    </motion.div>
  );
}

