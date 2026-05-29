"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ElectricBorder } from "@/components/electric-border";
import { PoopStreakBorder } from "@/components/poop-streak-border";
import { cn } from "@/lib/utils";
import type { MatchTeamPlayer, MatchWithTeams } from "@/lib/queries/players";

/** Vitórias seguidas mínimas para ativar a borda elétrica (dourada). */
const WIN_STREAK_FOR_ELECTRIC_BORDER = 3;

/** Derrotas seguidas mínimas para a “borda cocô”. */
const LOSS_STREAK_FOR_POOP_BORDER = 3;

/**
 * `NEXT_PUBLIC_WIN_STREAK_BORDER_DEMO=1` — força a borda no 1.º jogador do time azul (topo), para testar o efeito sem precisar de sequência real.
 */
function showElectricWinStreakBorder(
  player: MatchTeamPlayer,
  team: 1 | 2,
  index: number,
): boolean {
  const demoForced =
    process.env.NEXT_PUBLIC_WIN_STREAK_BORDER_DEMO === "1";
  if (demoForced && team === 1 && index === 0) {
    return true;
  }
  return player.winStreak >= WIN_STREAK_FOR_ELECTRIC_BORDER;
}

/**
 * Borda cocô: perdedor em série. Vitória elétrica tem prioridade se empate impossível na prática.
 * `NEXT_PUBLIC_LOSS_STREAK_BORDER_DEMO=1` — força no 1.º jogador do time vermelho (topo).
 */
function showPoopLossStreakBorder(
  player: MatchTeamPlayer,
  team: 1 | 2,
  index: number,
  hasElectricBorder: boolean,
): boolean {
  if (hasElectricBorder) {
    return false;
  }
  const demoForced =
    process.env.NEXT_PUBLIC_LOSS_STREAK_BORDER_DEMO === "1";
  if (demoForced && team === 2 && index === 0) {
    return true;
  }
  return player.lossStreak >= LOSS_STREAK_FOR_POOP_BORDER;
}

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
  poopRoastWord?: string;
}

function LolPlayerCard({
  player,
  team,
  index,
  poopRoastWord,
}: LolPlayerCardProps) {
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

  const electricBorder = showElectricWinStreakBorder(player, team, index);
  const poopBorder = showPoopLossStreakBorder(player, team, index, electricBorder);

  const cardSurfaceClass = cn(
    "group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border-2 bg-gradient-to-b",
    sideGradient,
    electricBorder || poopBorder
      ? "border-transparent shadow-none"
      : cn(borderColor, glowColor),
    "transition-transform duration-300 hover:-translate-y-1",
  );

  const cardBody = (
    <>
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
        {player.bravura && !player.isMvp && !player.isDud ? (
          <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-100 shadow-[0_0_12px_rgba(230,195,87,0.4)]">
            Bravura
          </div>
        ) : null}
        {player.bravura && (player.isMvp || player.isDud) ? (
          <div className="absolute left-3 top-10 z-20 flex items-center gap-1 rounded-full border border-amber-400/45 bg-amber-500/12 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-100/90">
            Bravura
          </div>
        ) : null}
        {electricBorder && player.winStreak >= WIN_STREAK_FOR_ELECTRIC_BORDER ? (
          <div className="absolute bottom-3 left-3 z-20 max-w-[calc(100%-1.5rem)] rounded-full border border-primary/50 bg-black/55 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-primary shadow-[0_0_14px_rgba(230,195,87,0.35)]">
            {player.winStreak} vitórias seguidas
          </div>
        ) : null}
        {electricBorder &&
        process.env.NEXT_PUBLIC_WIN_STREAK_BORDER_DEMO === "1" &&
        team === 1 &&
        index === 0 &&
        player.winStreak < WIN_STREAK_FOR_ELECTRIC_BORDER ? (
          <div className="absolute bottom-3 left-3 z-20 rounded-full border border-accent/45 bg-black/55 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-accent">
            Preview borda (demo)
          </div>
        ) : null}
        {poopBorder && player.lossStreak >= LOSS_STREAK_FOR_POOP_BORDER ? (
          <div className="absolute bottom-3 left-3 z-20 max-w-[calc(100%-1.5rem)] rounded-lg border border-[#6b8f3a]/40 bg-black/70 px-2 py-1 text-[8px] leading-tight text-[#c4d4a8] shadow-[0_0_12px_rgba(45,55,20,0.6)]">
            <span className="font-semibold tracking-wide text-[#d4c4a0]">
              💩 {player.lossStreak} derrotas seguidas
            </span>
            <span className="mt-0.5 block text-[7px] leading-snug text-[#8a9a6e]">
              Amuleto Confirmado ·{" "}
              <span className="font-medium text-[#d8ccb0]">
                {poopRoastWord ?? "—"}
              </span>
            </span>
          </div>
        ) : null}
        {poopBorder &&
        process.env.NEXT_PUBLIC_LOSS_STREAK_BORDER_DEMO === "1" &&
        team === 2 &&
        index === 0 &&
        player.lossStreak < LOSS_STREAK_FOR_POOP_BORDER ? (
          <div className="absolute bottom-3 left-3 z-20 max-w-[calc(100%-1.5rem)] rounded-lg border border-[#6b8f3a]/35 bg-black/65 px-2 py-1 text-[8px] text-[#b8c898]">
            Preview cocô (demo) — borda de derrota
          </div>
        ) : null}
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
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-sm tracking-wide text-white drop-shadow-md">
            {player.name}
          </span>
          <span className="shrink-0 text-[10px] uppercase tracking-[0.3em] text-white/60">
            {isBlueSide ? "Blue" : "Red"}
          </span>
        </div>
        {player.championName ? (
          <p className="line-clamp-2 text-[11px] font-medium leading-snug text-primary">
            {player.championName}
          </p>
        ) : null}
        <div className="flex items-center justify-between text-[11px] text-white/70">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-[0.35em] text-white/40">
              PDLs
            </span>
            <span className="text-xs font-semibold text-white">
              {player.score}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <motion.div
      layout
      custom={isBlueSide ? "top" : "bottom"}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      transition={{ delay: index * 0.06 }}
      className="h-[280px] w-[168px] shrink-0"
    >
      {electricBorder ? (
        <ElectricBorder
          color="#E6C357"
          speed={1.12}
          chaos={0.13}
          borderRadius={16}
          className="h-full w-full"
        >
          <div className={cardSurfaceClass}>{cardBody}</div>
        </ElectricBorder>
      ) : poopBorder ? (
        <PoopStreakBorder className="h-full w-full">
          <div className={cardSurfaceClass}>{cardBody}</div>
        </PoopStreakBorder>
      ) : (
        <div className={cardSurfaceClass}>{cardBody}</div>
      )}
    </motion.div>
  );
}

interface TeamDisplayProps {
  match: MatchWithTeams;
  /** Palavra “amuleto” por jogador (só quem tem 3+ derrotas seguidas). */
  poopRoastByPlayerId: Record<number, string>;
}

export function TeamDisplay({
  match,
  poopRoastByPlayerId,
}: TeamDisplayProps) {
  return (
    <div className="relative flex flex-col gap-8 rounded-3xl border border-white/10 bg-gradient-to-b from-[#04070F]/95 via-[#060A13]/92 to-[#090E18]/95 p-6">
      {match.selectedCard ? (
        <div className="overflow-hidden rounded-2xl border border-primary/35 bg-gradient-to-r from-primary/10 via-[#1a1510]/90 to-primary/10 shadow-[0_0_30px_rgba(230,195,87,0.12)]">
          {match.selectedCard.imageUrl ? (
            <div className="relative aspect-[21/9] max-h-40 w-full overflow-hidden bg-black/30 sm:max-h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={match.selectedCard.imageUrl}
                alt={match.selectedCard.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1218] via-transparent to-transparent" />
            </div>
          ) : null}
          <div className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">
              Cartinha da partida
            </p>
            <h3 className="mt-1 font-display text-xl text-white">
              {match.selectedCard.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              {match.selectedCard.description}
            </p>
          </div>
        </div>
      ) : null}
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="text-xs uppercase tracking-[0.45em] text-white/50">
          Campos da Justiça
        </span>
        <h2 className="font-display text-4xl text-white drop-shadow-[0_0_35px_rgba(79,114,255,0.35)]">
          Summoner&apos;s Rift
        </h2>
        {match.championsRandom && (
          <span className="mt-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Campeões aleatórios por rota
          </span>
        )}
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
              poopRoastWord={poopRoastByPlayerId[player.playerId]}
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
              poopRoastWord={poopRoastByPlayerId[player.playerId]}
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
