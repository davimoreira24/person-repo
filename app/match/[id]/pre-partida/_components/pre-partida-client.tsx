"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  finalizePreMatchLoadoutAction,
  type BravuraRevealRow,
} from "@/app/actions/pre-match-actions";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BRAVURA_WIN_BONUS } from "@/lib/match/bravura";
import type { PreMatchLoadout } from "@/lib/queries/pre-match";
import type { ChallengeStatus } from "@/lib/queries/challenge";
import { PrePartidaChallengePanel } from "./pre-partida-challenge-panel";
import { Loader2, Shield, Sparkles, Swords, Zap } from "lucide-react";

const LANE_ICONS: Record<number, string> = {
  0: "/top.png",
  1: "/jungle.png",
  2: "/mid.png",
  3: "/adc.png",
  4: "/sup.png",
};

type PrePartidaClientProps = {
  loadout: PreMatchLoadout;
  challengeStatus: ChallengeStatus;
};

export function PrePartidaClient({
  loadout,
  challengeStatus,
}: PrePartidaClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bravuraIds, setBravuraIds] = useState<Set<number>>(() => new Set());
  const [revealPhase, setRevealPhase] = useState<"idle" | "spinning" | "done">(
    "idle",
  );
  const [revealed, setRevealed] = useState<BravuraRevealRow[]>([]);

  const bravuraAvailable = !loadout.championsRandom;
  const bravuraCount = bravuraIds.size;

  const toggleBravura = (playerId: number) => {
    if (!bravuraAvailable || isPending) return;
    setBravuraIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const result = await finalizePreMatchLoadoutAction({
          matchId: loadout.matchId,
          bravuraPlayerIds: bravuraAvailable ? [...bravuraIds] : [],
        });

        if (result.revealed.length > 0) {
          setRevealed(result.revealed);
          setRevealPhase("spinning");
          window.setTimeout(() => setRevealPhase("done"), 2200);
          window.setTimeout(() => {
            router.push(`/match/${loadout.matchId}`);
          }, 4200);
          return;
        }

        router.push(`/match/${loadout.matchId}`);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível confirmar a pré-partida.",
        );
      }
    });
  };

  return (
    <div className="relative min-h-[80vh] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a1220] via-[#060a12] to-[#04070f] shadow-[0_0_80px_rgba(79,114,255,0.12)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {revealPhase !== "idle" ? (
          <BravuraRevealScreen
            key="reveal"
            phase={revealPhase}
            rows={revealed}
          />
        ) : (
          <motion.div
            key="loadout"
            className="relative flex flex-col gap-8 p-6 sm:p-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <header className="flex flex-col items-center gap-3 text-center">
              <motion.div
                className="flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.35em] text-primary"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Pré-partida
              </motion.div>
              <h1 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
                Bravura dos crias
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-white/55">
                Marque quem aceita a{" "}
                <span className="text-primary">Carta de Bravura</span>: campeão
                aleatório na rota dele (Meraki). Quem vencer ganha{" "}
                <span className="text-primary">+{BRAVURA_WIN_BONUS} PDL</span>{" "}
                extra além do time.
              </p>
              {loadout.gameMode === "draft" ? (
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wide text-white/50">
                  Modo Draft
                </span>
              ) : null}
              {loadout.championsRandom ? (
                <div className="mt-1 max-w-lg rounded-2xl border border-accent/35 bg-accent/10 px-4 py-3 text-xs leading-relaxed text-accent/95">
                  A lobby já tem <strong>Campeões aleatórios</strong> para todos
                  — Bravura fica indisponível nesta partida. Confirme para ir ao
                  campo.
                </div>
              ) : null}
              {loadout.selectedCard ? (
                <div className="mt-2 flex max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left">
                  {loadout.selectedCard.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={loadout.selectedCard.imageUrl}
                      alt=""
                      className="h-14 w-20 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                      <Swords className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-white/40">
                      Carta da partida
                    </p>
                    <p className="truncate font-medium text-white">
                      {loadout.selectedCard.title}
                    </p>
                  </div>
                </div>
              ) : null}
            </header>

            <PrePartidaChallengePanel
              matchId={loadout.matchId}
              initialStatus={challengeStatus}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <TeamLoadoutColumn
                label="Time 1"
                accent="primary"
                players={loadout.teams[1]}
                bravuraIds={bravuraIds}
                bravuraAvailable={bravuraAvailable}
                onToggle={toggleBravura}
                disabled={isPending}
              />
              <TeamLoadoutColumn
                label="Time 2"
                accent="accent"
                players={loadout.teams[2]}
                bravuraIds={bravuraIds}
                bravuraAvailable={bravuraAvailable}
                onToggle={toggleBravura}
                disabled={isPending}
              />
            </div>

            {errorMessage ? (
              <div className="rounded-xl border border-red-400/45 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            ) : null}

            <footer className="flex flex-col items-center gap-4 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
              <div className="text-center text-xs text-white/45 sm:text-left">
                {bravuraAvailable ? (
                  <>
                    <span className="text-white/70">{bravuraCount}</span>{" "}
                    {bravuraCount === 1
                      ? "jogador com Bravura"
                      : "jogadores com Bravura"}
                    {bravuraCount > 0 ? (
                      <span className="mt-1 block text-primary/80">
                        Ao confirmar, sorteamos o campeão de cada um na rota.
                      </span>
                    ) : (
                      <span className="mt-1 block">
                        Ninguém com Bravura? Pode confirmar direto.
                      </span>
                    )}
                  </>
                ) : (
                  <>Todos já têm campeão sorteado pela regra da lobby.</>
                )}
              </div>
              <Button
                type="button"
                size="lg"
                onClick={handleConfirm}
                disabled={isPending}
                className="min-w-[240px] gap-2 shadow-[0_0_32px_rgba(230,195,87,0.2)]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {bravuraCount > 0 && bravuraAvailable
                      ? "Sorteando…"
                      : "Confirmando…"}
                  </>
                ) : bravuraCount > 0 && bravuraAvailable ? (
                  <>
                    <Zap className="h-4 w-4" />
                    Sortear Bravuras e iniciar
                  </>
                ) : (
                  "Ir para a partida"
                )}
              </Button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TeamLoadoutColumn({
  label,
  accent,
  players,
  bravuraIds,
  bravuraAvailable,
  onToggle,
  disabled,
}: {
  label: string;
  accent: "primary" | "accent";
  players: PreMatchLoadout["teams"][1];
  bravuraIds: Set<number>;
  bravuraAvailable: boolean;
  onToggle: (id: number) => void;
  disabled: boolean;
}) {
  const border =
    accent === "primary" ? "border-primary/30" : "border-accent/30";
  const titleColor = accent === "primary" ? "text-primary" : "text-accent";

  return (
    <div
      className={`rounded-3xl border ${border} bg-black/25 p-4 backdrop-blur-sm sm:p-5`}
    >
      <h2
        className={`mb-4 font-display text-sm uppercase tracking-[0.3em] ${titleColor}`}
      >
        {label}
      </h2>
      <div className="flex flex-col gap-3">
        {players.map((player) => (
          <PlayerLoadoutRow
            key={player.playerId}
            player={player}
            active={bravuraIds.has(player.playerId)}
            bravuraAvailable={bravuraAvailable}
            onToggle={() => onToggle(player.playerId)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerLoadoutRow({
  player,
  active,
  bravuraAvailable,
  onToggle,
  disabled,
}: {
  player: PreMatchLoadout["teams"][1][number];
  active: boolean;
  bravuraAvailable: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const laneIcon = LANE_ICONS[player.laneIndex] ?? "/mid.png";

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      disabled={!bravuraAvailable || disabled}
      whileTap={bravuraAvailable ? { scale: 0.98 } : undefined}
      className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
        active
          ? "border-primary/55 bg-gradient-to-r from-primary/15 to-primary/5 shadow-[0_0_24px_rgba(230,195,87,0.15)]"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
      } ${!bravuraAvailable ? "cursor-default opacity-80" : ""}`}
    >
      <Avatar src={player.photoUrl ?? undefined} alt={player.name} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Image
            src={laneIcon}
            alt={player.laneLabel}
            width={16}
            height={16}
            className="h-4 w-4 object-contain opacity-80"
          />
          <span className="truncate font-medium text-white">{player.name}</span>
        </div>
        <span className="text-[11px] text-white/45">{player.laneLabel}</span>
        {player.championName && !bravuraAvailable ? (
          <span className="mt-0.5 block text-[11px] text-primary/90">
            {player.championName}
          </span>
        ) : null}
      </div>
      {bravuraAvailable ? (
        <div
          className={`flex shrink-0 flex-col items-center gap-1 rounded-xl border px-2.5 py-2 transition ${
            active
              ? "border-primary/50 bg-primary/20 text-primary"
              : "border-white/10 bg-black/30 text-white/35 group-hover:border-primary/30 group-hover:text-white/55"
          }`}
        >
          <Shield className="h-4 w-4" />
          <span className="text-[9px] font-semibold uppercase tracking-wide">
            Bravura
          </span>
        </div>
      ) : null}
    </motion.button>
  );
}

function BravuraRevealScreen({
  phase,
  rows,
}: {
  phase: "spinning" | "done";
  rows: BravuraRevealRow[];
}) {
  return (
    <motion.div
      className="relative flex min-h-[60vh] flex-col items-center justify-center gap-8 p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="flex items-center gap-2 text-primary"
        animate={{ scale: phase === "done" ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 0.5 }}
      >
        <Shield className="h-8 w-8" />
        <span className="font-display text-2xl tracking-wide text-white">
          {phase === "spinning" ? "Sorteando Bravuras…" : "Destinos selados"}
        </span>
      </motion.div>

      <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {rows.map((row, i) => (
          <motion.div
            key={row.playerId}
            initial={{ opacity: 0, y: 20, rotateX: -20 }}
            animate={{
              opacity: phase === "done" ? 1 : 0.4,
              y: phase === "done" ? 0 : 8,
              rotateX: 0,
            }}
            transition={{
              delay: phase === "done" ? i * 0.12 : 0,
              type: "spring",
              damping: 18,
            }}
            className="rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 to-black/50 p-4"
          >
            <p className="text-[10px] uppercase tracking-widest text-white/45">
              {row.playerName}
            </p>
            <p className="mt-1 font-display text-xl text-primary">
              {phase === "done" ? row.championName : "…"}
            </p>
          </motion.div>
        ))}
      </div>

      {phase === "done" ? (
        <p className="text-xs text-white/40">Indo para o campo…</p>
      ) : null}
    </motion.div>
  );
}
