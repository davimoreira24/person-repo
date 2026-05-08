"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Crown, Loader2, Shield, Sparkles, Swords, X } from "lucide-react";
import type { Player } from "@/lib/db/schema";

/** Pega N índices distintos com `crypto.getRandomValues` (sem repetir). */
function pickDistinctIndexes(total: number, count: number): number[] {
  const out = new Set<number>();
  const buf = new Uint32Array(1);
  while (out.size < count && out.size < total) {
    crypto.getRandomValues(buf);
    out.add(buf[0]! % total);
  }
  return Array.from(out);
}

function pickRandomIndex(total: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! % total;
}

type Phase = "captains" | "first-picker" | "drafting" | "ready";

export type DraftResult = {
  teamOneIds: number[];
  teamTwoIds: number[];
  captainOneId: number;
  captainTwoId: number;
};

type DraftOverlayProps = {
  players: Player[];
  onCancel: () => void;
  onConfirm: (result: DraftResult) => void;
  isSubmitting?: boolean;
};

export function DraftOverlay({
  players,
  onCancel,
  onConfirm,
  isSubmitting = false,
}: DraftOverlayProps) {
  const [phase, setPhase] = useState<Phase>("captains");
  const [captainOneId, setCaptainOneId] = useState<number | null>(null);
  const [captainTwoId, setCaptainTwoId] = useState<number | null>(null);
  const [currentPicker, setCurrentPicker] = useState<1 | 2>(1);
  const [team1Ids, setTeam1Ids] = useState<number[]>([]);
  const [team2Ids, setTeam2Ids] = useState<number[]>([]);

  const playersById = useMemo(() => {
    const m = new Map<number, Player>();
    for (const p of players) m.set(p.id, p);
    return m;
  }, [players]);

  // Sorteia capitães (após pequena animação suspense).
  useEffect(() => {
    if (players.length !== 10) return;
    const t = window.setTimeout(() => {
      const [i1, i2] = pickDistinctIndexes(players.length, 2);
      const c1 = players[i1!]!;
      const c2 = players[i2!]!;
      setCaptainOneId(c1.id);
      setCaptainTwoId(c2.id);
      setTeam1Ids([c1.id]);
      setTeam2Ids([c2.id]);
      const t2 = window.setTimeout(() => setPhase("first-picker"), 1900);
      return () => clearTimeout(t2);
    }, 700);
    return () => clearTimeout(t);
  }, [players]);

  // Após capitães prontos, sorteia quem começa.
  useEffect(() => {
    if (phase !== "first-picker") return;
    const t = window.setTimeout(() => {
      const first = pickRandomIndex(2) === 0 ? 1 : 2;
      setCurrentPicker(first as 1 | 2);
      const t2 = window.setTimeout(() => setPhase("drafting"), 1700);
      return () => clearTimeout(t2);
    }, 600);
    return () => clearTimeout(t);
  }, [phase]);

  const captainOne = captainOneId ? playersById.get(captainOneId) ?? null : null;
  const captainTwo = captainTwoId ? playersById.get(captainTwoId) ?? null : null;

  const pickedSet = useMemo(
    () => new Set([...team1Ids, ...team2Ids]),
    [team1Ids, team2Ids],
  );
  const remaining = useMemo(
    () => players.filter((p) => !pickedSet.has(p.id)),
    [players, pickedSet],
  );

  const onPickPlayer = (playerId: number) => {
    if (phase !== "drafting") return;
    if (pickedSet.has(playerId)) return;
    if (currentPicker === 1) {
      setTeam1Ids((prev) => [...prev, playerId]);
    } else {
      setTeam2Ids((prev) => [...prev, playerId]);
    }
  };

  // Detecta fim do draft.
  useEffect(() => {
    if (phase !== "drafting") return;
    if (team1Ids.length === 5 && team2Ids.length === 5) {
      setPhase("ready");
      return;
    }
    if (team1Ids.length + team2Ids.length === 0) return;
    // Alterna o picker: o time com menos jogadores escolhe a seguir.
    // (Capitães já contam: time 1 começa em 1, time 2 em 1.)
    if (team1Ids.length < team2Ids.length) {
      setCurrentPicker(1);
    } else if (team2Ids.length < team1Ids.length) {
      setCurrentPicker(2);
    } else {
      // Empate em tamanho: alterna em relação ao último escolhido.
      setCurrentPicker((prev) => (prev === 1 ? 2 : 1));
    }
  }, [team1Ids, team2Ids, phase]);

  const handleConfirm = () => {
    if (!captainOneId || !captainTwoId) return;
    if (team1Ids.length !== 5 || team2Ids.length !== 5) return;
    onConfirm({
      teamOneIds: team1Ids,
      teamTwoIds: team2Ids,
      captainOneId,
      captainTwoId,
    });
  };

  return (
    <motion.div
      key="draft-root"
      className="fixed inset-0 z-[90] flex flex-col bg-[#04070f]/96 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-0 h-[120%] w-px bg-gradient-to-b from-transparent via-primary/25 to-transparent" />
        <div className="absolute right-1/4 top-0 h-[120%] w-px bg-gradient-to-b from-transparent via-accent/25 to-transparent" />
      </div>

      <header className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          <span className="font-display text-lg tracking-wide text-white">
            Modo Draft
          </span>
          {phase === "drafting" ? (
            <span className="ml-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {team1Ids.length + team2Ids.length} / 10
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
          aria-label="Cancelar draft"
          disabled={isSubmitting}
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="relative flex flex-1 flex-col overflow-y-auto">
        <AnimatePresence mode="wait">
          {phase === "captains" || phase === "first-picker" ? (
            <CaptainsReveal
              key="captains"
              phase={phase}
              players={players}
              captainOne={captainOne}
              captainTwo={captainTwo}
              firstPicker={currentPicker}
            />
          ) : null}

          {phase === "drafting" || phase === "ready" ? (
            <motion.div
              key="drafting"
              className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <TeamColumn
                  label="Time 1"
                  accent="primary"
                  captainId={captainOneId}
                  ids={team1Ids}
                  playersById={playersById}
                  isActive={phase === "drafting" && currentPicker === 1}
                />
                <TeamColumn
                  label="Time 2"
                  accent="accent"
                  captainId={captainTwoId}
                  ids={team2Ids}
                  playersById={playersById}
                  isActive={phase === "drafting" && currentPicker === 2}
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="font-display text-base text-white/90">
                    {phase === "drafting" ? (
                      <>
                        Vez do{" "}
                        <span
                          className={
                            currentPicker === 1 ? "text-primary" : "text-accent"
                          }
                        >
                          {currentPicker === 1
                            ? captainOne?.name
                            : captainTwo?.name}
                        </span>{" "}
                        — escolha 1 jogador
                      </>
                    ) : (
                      <>Times completos. Confirme para iniciar a partida.</>
                    )}
                  </h3>
                  <span className="text-xs text-white/45">
                    Restantes: {remaining.length}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {remaining.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onPickPlayer(p.id)}
                      disabled={phase !== "drafting" || isSubmitting}
                      className={`group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-primary/45 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <Avatar
                        src={p.photoUrl ?? undefined}
                        alt={p.name}
                        size="md"
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium text-white">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-white/45">
                          Score {p.score}
                        </span>
                      </div>
                    </button>
                  ))}
                  {remaining.length === 0 ? (
                    <div className="col-span-full text-center text-xs text-white/50">
                      Sem jogadores restantes.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col items-stretch justify-end gap-3 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={
                    phase !== "ready" ||
                    isSubmitting ||
                    team1Ids.length !== 5 ||
                    team2Ids.length !== 5
                  }
                  className="min-w-[200px]"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Finalizando…
                    </span>
                  ) : (
                    "Confirmar e iniciar"
                  )}
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

type TeamColumnProps = {
  label: string;
  accent: "primary" | "accent";
  captainId: number | null;
  ids: number[];
  playersById: Map<number, Player>;
  isActive: boolean;
};

function TeamColumn({
  label,
  accent,
  captainId,
  ids,
  playersById,
  isActive,
}: TeamColumnProps) {
  const accentBorder =
    accent === "primary" ? "border-primary/35" : "border-accent/35";
  const accentBg = accent === "primary" ? "bg-primary/[0.05]" : "bg-accent/[0.05]";
  const accentText = accent === "primary" ? "text-primary" : "text-accent";
  const slots = Array.from({ length: 5 }, (_, i) => ids[i] ?? null);

  return (
    <motion.div
      animate={{
        scale: isActive ? 1.01 : 1,
        boxShadow: isActive
          ? "0 0 0 1px rgba(230,195,87,0.35), 0 0 32px rgba(230,195,87,0.18)"
          : "0 0 0 0 rgba(0,0,0,0)",
      }}
      transition={{ duration: 0.35 }}
      className={`rounded-3xl border ${accentBorder} ${accentBg} p-4 sm:p-5`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`font-display text-base uppercase tracking-[0.25em] ${accentText}`}
        >
          {label}
        </span>
        {isActive ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-3 w-3" /> Vez deste time
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        {slots.map((id, idx) => {
          const player = id ? playersById.get(id) ?? null : null;
          const isCaptain = id !== null && id === captainId;
          return (
            <div
              key={`${label}-slot-${idx}`}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition ${
                player
                  ? `border-white/12 bg-black/35`
                  : `border-dashed border-white/10 bg-black/15`
              }`}
            >
              <span className="w-6 shrink-0 text-center text-[11px] text-white/35">
                {idx + 1}
              </span>
              {player ? (
                <>
                  <Avatar
                    src={player.photoUrl ?? undefined}
                    alt={player.name}
                    size="sm"
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-white">
                      {player.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-white/40">
                      {isCaptain ? "Capitão" : `Score ${player.score}`}
                    </span>
                  </div>
                  {isCaptain ? (
                    <Crown className="ml-auto h-4 w-4 text-primary" />
                  ) : null}
                </>
              ) : (
                <span className="text-xs text-white/30">Aguardando…</span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

type CaptainsRevealProps = {
  phase: Extract<Phase, "captains" | "first-picker">;
  players: Player[];
  captainOne: Player | null;
  captainTwo: Player | null;
  firstPicker: 1 | 2;
};

function CaptainsReveal({
  phase,
  players,
  captainOne,
  captainTwo,
  firstPicker,
}: CaptainsRevealProps) {
  return (
    <motion.div
      key="captains-reveal"
      className="flex flex-1 items-center justify-center px-6 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex w-full max-w-3xl flex-col items-center gap-8">
        <p className="text-xs uppercase tracking-[0.4em] text-white/55">
          {phase === "captains"
            ? "Sorteando capitães…"
            : "Quem começa o draft?"}
        </p>

        <div className="grid w-full grid-cols-2 gap-4 sm:gap-6">
          <CaptainSlot
            slot={1}
            player={captainOne}
            phase={phase}
            poolSample={players.map((p) => p.name)}
            isFirstPicker={phase === "first-picker" && firstPicker === 1}
            accent="primary"
          />
          <CaptainSlot
            slot={2}
            player={captainTwo}
            phase={phase}
            poolSample={players.map((p) => p.name)}
            isFirstPicker={phase === "first-picker" && firstPicker === 2}
            accent="accent"
          />
        </div>

        <p className="text-center text-xs text-white/45">
          {phase === "captains"
            ? "Escolhendo aleatoriamente entre os 10 jogadores selecionados."
            : "O capitão sorteado escolhe primeiro. Depois alternam até completar 5x5."}
        </p>
      </div>
    </motion.div>
  );
}

type CaptainSlotProps = {
  slot: 1 | 2;
  player: Player | null;
  phase: Extract<Phase, "captains" | "first-picker">;
  poolSample: string[];
  isFirstPicker: boolean;
  accent: "primary" | "accent";
};

function CaptainSlot({
  slot,
  player,
  phase,
  poolSample,
  isFirstPicker,
  accent,
}: CaptainSlotProps) {
  const accentText = accent === "primary" ? "text-primary" : "text-accent";
  const accentBorder =
    accent === "primary" ? "border-primary/45" : "border-accent/45";
  const accentGlow =
    accent === "primary"
      ? "shadow-[0_0_42px_rgba(230,195,87,0.25)]"
      : "shadow-[0_0_42px_rgba(42,148,244,0.25)]";

  return (
    <motion.div
      className={`relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-3xl border-2 ${accentBorder} bg-gradient-to-br from-[#0a1018] via-[#0a0e16] to-black p-4 ${accentGlow}`}
      animate={{
        scale: isFirstPicker ? 1.04 : 1,
      }}
      transition={{ type: "spring", damping: 16, stiffness: 240 }}
    >
      <div
        className={`absolute left-3 top-3 flex items-center gap-1 rounded-full border ${accentBorder} bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${accentText}`}
      >
        <Shield className="h-3 w-3" /> Time {slot}
      </div>

      {phase === "captains" || !player ? (
        <CaptainScrollerSpin names={poolSample} />
      ) : (
        <CaptainCard player={player} accent={accent} />
      )}

      {isFirstPicker ? (
        <motion.div
          className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-primary/55 bg-primary/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 260 }}
        >
          <Sparkles className="h-3 w-3" /> Começa o draft
        </motion.div>
      ) : null}
    </motion.div>
  );
}

function CaptainScrollerSpin({ names }: { names: string[] }) {
  const repeated = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < 6; i++) out.push(...names);
    return out;
  }, [names]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/50">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-black to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-black to-transparent" />
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-20 h-[2px] -translate-y-1/2 bg-primary/70" />
        <motion.ul
          className="flex flex-col items-center gap-0"
          initial={{ y: 0 }}
          animate={{ y: -560 }}
          transition={{
            duration: 1.6,
            ease: [0.12, 0.85, 0.22, 1],
          }}
        >
          {repeated.map((n, i) => (
            <li
              key={`${n}-${i}`}
              className="flex h-11 w-full items-center justify-center text-sm uppercase tracking-wide text-white/85"
            >
              {n}
            </li>
          ))}
        </motion.ul>
      </div>
      <span className="mt-3 text-[10px] uppercase tracking-[0.35em] text-white/40">
        Sorteando…
      </span>
    </div>
  );
}

function CaptainCard({
  player,
  accent,
}: {
  player: Player;
  accent: "primary" | "accent";
}) {
  const ringColor =
    accent === "primary" ? "ring-primary/55" : "ring-accent/55";
  return (
    <motion.div
      className="flex w-full flex-col items-center gap-3 px-4 text-center"
      initial={{ scale: 0.6, opacity: 0, y: 24 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 14, stiffness: 240 }}
    >
      <div className={`rounded-full ring-4 ${ringColor}`}>
        <Avatar
          src={player.photoUrl ?? undefined}
          alt={player.name}
          size="lg"
        />
      </div>
      <div className="flex flex-col items-center gap-1">
        <Crown className="h-5 w-5 text-primary" />
        <span className="font-display text-xl text-white">{player.name}</span>
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/45">
          Capitão
        </span>
      </div>
    </motion.div>
  );
}
