"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Player } from "@/lib/db/schema";
import {
  createDraftMatchAction,
  createMatchAction,
  updatePlayerScoreAction,
} from "@/app/actions/player-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayerCard } from "./player-card";
import { PlayerForm } from "./player-form";
import { LobbyConditionsModal } from "./lobby-conditions-modal";
import {
  readLobbyConditionsFromStorage,
  writeLobbyConditionsToStorage,
} from "@/lib/lobby-conditions-storage";
import type { CardRevealPayload } from "@/lib/match/game-card-types";
import { GameCardRevealOverlay } from "@/components/game-card-reveal-overlay";
import { DraftOverlay, type DraftResult } from "./draft-overlay";
import { Search, SlidersHorizontal, Swords, Trophy } from "lucide-react";

export type PlayerSelectionMode = "classic" | "draft";

interface PlayerSelectionProps {
  players: Player[];
  playMode?: PlayerSelectionMode;
  /** 10–12 abr 2026 (Lisboa): clássico exige a regra "Campeões aleatórios". */
  randomOnlyWeekend?: boolean;
}

export function PlayerSelection({
  players,
  playMode = "classic",
  randomOnlyWeekend = false,
}: PlayerSelectionProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [scoreDraft, setScoreDraft] = useState<string>("0");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [conditionsOpen, setConditionsOpen] = useState(false);
  const [balanceTeams, setBalanceTeams] = useState(false);
  const [improvedLanes, setImprovedLanes] = useState(false);
  const [cartasAtivas, setCartasAtivas] = useState(false);
  const [championsRandom, setChampionsRandom] = useState(false);
  const [conditionsHydrated, setConditionsHydrated] = useState(false);
  const [pendingCardReveal, setPendingCardReveal] = useState<{
    matchId: number;
    payload: CardRevealPayload;
  } | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);

  useEffect(() => {
    const saved = readLobbyConditionsFromStorage();
    setBalanceTeams(saved.balanceTeams);
    setImprovedLanes(saved.improvedLanes);
    setCartasAtivas(saved.cartasAtivas);
    setChampionsRandom(saved.championsRandom);
    setConditionsHydrated(true);
  }, []);

  useEffect(() => {
    if (!conditionsHydrated) return;
    writeLobbyConditionsToStorage({
      balanceTeams,
      improvedLanes,
      cartasAtivas,
      championsRandom,
    });
  }, [
    balanceTeams,
    improvedLanes,
    cartasAtivas,
    championsRandom,
    conditionsHydrated,
  ]);

  const isDraftMode = playMode === "draft";
  const canSelectMore = selected.length < 10;
  const hasPlayers = players.length > 0;

  const handleToggle = (playerId: number) => {
    setErrorMessage(null);
    setSelected((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      }
      if (prev.length >= 10) {
        return prev;
      }
      return [...prev, playerId];
    });
  };

  const selectedPlayers = useMemo(
    () => players.filter((player) => selected.includes(player.id)),
    [players, selected],
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredPlayers = useMemo(() => {
    if (!normalizedSearch) {
      return players;
    }
    return players.filter((player) =>
      player.name.toLowerCase().includes(normalizedSearch),
    );
  }, [players, normalizedSearch]);

  const classicLockedByWeekend =
    randomOnlyWeekend && !isDraftMode && !championsRandom;

  const onSubmitMatch = () => {
    setErrorMessage(null);
    if (selected.length !== 10) {
      setErrorMessage("Selecione exatamente 10 jogadores antes de iniciar.");
      return;
    }
    if (isDraftMode) {
      setDraftOpen(true);
      return;
    }
    if (classicLockedByWeekend) {
      setErrorMessage(
        "Neste fim de semana o clássico só roda com a regra 'Campeões aleatórios'. Ligue a regra em Condições ou use o modo Draft.",
      );
      return;
    }
    startTransition(async () => {
      try {
        const result = await createMatchAction({
          playerIds: selected,
          balanceTeams,
          improvedLanes,
          cartasAtivas,
          championsRandom,
        });
        if (result.cardReveal) {
          setPendingCardReveal({
            matchId: result.matchId,
            payload: result.cardReveal,
          });
          return;
        }
        setSelected([]);
        router.push(`/match/${result.matchId}`);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível criar a partida.",
        );
      }
    });
  };

  const onConfirmDraft = (result: DraftResult) => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const created = await createDraftMatchAction({
          ...result,
          improvedLanes,
          cartasAtivas,
          championsRandom,
        });
        setDraftOpen(false);
        if (created.cardReveal) {
          setPendingCardReveal({
            matchId: created.matchId,
            payload: created.cardReveal,
          });
          return;
        }
        setSelected([]);
        router.push(`/match/${created.matchId}`);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível finalizar o draft.",
        );
      }
    });
  };

  const openScoreEditor = (player: Player) => {
    setEditingPlayer(player);
    setScoreDraft(String(player.score ?? 0));
  };

  const onSubmitScore = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPlayer) return;
    const scoreValue = Number(scoreDraft);
    if (Number.isNaN(scoreValue) || scoreValue < 0) {
      setErrorMessage("Informe uma pontuação válida (>= 0).");
      return;
    }
    startTransition(async () => {
      try {
        await updatePlayerScoreAction({
          playerId: editingPlayer.id,
          score: scoreValue,
        });
        setEditingPlayer(null);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Falha ao atualizar a pontuação.",
        );
      }
    });
  };

  const primaryButtonLabel = isPending
    ? isDraftMode
      ? "Finalizando…"
      : "Sorteando..."
    : isDraftMode
      ? "Iniciar Draft"
      : championsRandom
        ? "Jogar (com campeões)"
        : "Jogar";

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.35em] text-white/55">
            Seleção de jogadores
          </span>
          <h2 className="font-display text-3xl tracking-tight text-white md:text-[2rem]">
            Monte sua lobby
          </h2>
          {isDraftMode ? (
            <p className="text-sm leading-relaxed text-white/70">
              Modo <span className="text-primary">Draft</span>: depois de
              escolher 10 jogadores, dois capitães serão sorteados e vão
              <em className="not-italic"> escolher seus times</em> alternando
              picks. As lanes são sorteadas dentro de cada time depois disso.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-white/70">
              Modo <span className="text-primary">Clássico</span>: escolha dez
              jogadores e o app sorteia os dois times de 5 automaticamente.
              Ative regras em <span className="text-white/85">Condições</span>{" "}
              (campeões aleatórios, balanceamento, lanes melhoradas, cartas).
            </p>
          )}
          <p className="text-xs text-white/50">
            {isDraftMode ? (
              <>
                Prefere sorteio direto?{" "}
                <Link
                  href="/players"
                  className="text-accent underline-offset-2 transition hover:text-accent/90 hover:underline"
                >
                  Voltar pro Modo Clássico
                </Link>
              </>
            ) : (
              <>
                Quer escolher os times à mão?{" "}
                <Link
                  href="/players?mode=draft"
                  className="text-primary underline-offset-2 transition hover:text-primary/90 hover:underline"
                >
                  Modo Draft
                </Link>
              </>
            )}
          </p>
          {randomOnlyWeekend ? (
            <p className="rounded-xl border border-primary/35 bg-primary/10 px-3 py-2 text-xs leading-relaxed text-primary/95">
              <span className="font-medium">Fim de semana especial</span> (10–12
              abr, até dom 23h59 — Lisboa): o clássico puro está em pausa. Para
              jogar clássico nesse período, ligue a regra{" "}
              <span className="text-primary">Campeões aleatórios</span> em
              Condições. O <span className="text-primary">Modo Draft</span> está
              liberado normalmente.
            </p>
          ) : null}
          {!hasPlayers && (
            <p className="text-sm text-white/50">
              Ainda não há jogadores cadastrados. Adicione novos invocadores
              para começar.
            </p>
          )}
        </div>

        <div
          className="rounded-2xl border border-white/[0.12] bg-[rgba(6,10,18,0.65)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl sm:p-4"
          role="search"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-0">
            <div className="min-w-0 flex-1 lg:pr-5">
              <label
                htmlFor="lobby-player-search"
                className="mb-2 block text-[10px] font-medium uppercase tracking-[0.22em] text-white/40"
              >
                Buscar na lista
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                  aria-hidden
                />
                <Input
                  id="lobby-player-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Nome do invocador…"
                  autoComplete="off"
                  className="h-11 rounded-xl border-white/18 bg-black/35 pl-10 pr-4 text-sm text-white placeholder:text-white/38 focus:border-primary/45 focus:ring-primary/25"
                />
              </div>
            </div>

            <div
              className="hidden h-14 w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-white/12 to-transparent lg:block"
              aria-hidden
            />

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent lg:hidden" />

            <div className="flex flex-col gap-3 lg:shrink-0 lg:pl-5">
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/40 lg:text-right">
                Atalhos
              </span>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
                <nav
                  className="flex flex-wrap items-center gap-2"
                  aria-label="Atalhos da lobby"
                >
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-white/[0.18] text-white/90 hover:border-primary/45 hover:bg-white/[0.06]"
                    asChild
                  >
                    <Link href="/ranking" className="gap-1.5">
                      <Trophy className="h-3.5 w-3.5 opacity-90" />
                      Ranking
                    </Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-white/[0.18] text-white/90 hover:border-primary/45 hover:bg-white/[0.06]"
                    asChild
                  >
                    <Link href="/historico">Histórico</Link>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="relative border-white/[0.18] text-white/90 hover:border-primary/45 hover:bg-white/[0.06]"
                    onClick={() => setConditionsOpen(true)}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 opacity-90" />
                    Condições
                    {(isDraftMode ? false : balanceTeams) ||
                    improvedLanes ||
                    cartasAtivas ||
                    championsRandom ? (
                      <span
                        className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(230,195,87,0.8)]"
                        aria-hidden
                      />
                    ) : null}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-white/[0.18] text-white/90 hover:border-primary/45 hover:bg-white/[0.06]"
                    asChild
                  >
                    <Link href="/analytics/campeoes">Campeões</Link>
                  </Button>
                </nav>

                <div className="hidden h-8 w-px shrink-0 bg-white/10 sm:mx-1 sm:block lg:hidden" />

                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="w-full border border-white/10 sm:w-auto"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Novo jogador
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-white/[0.12] bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <span className="text-sm uppercase tracking-[0.25em] text-primary">
              {selected.length} / 10 jogadores
            </span>
            <span className="text-xs text-white/50">
              {isDraftMode
                ? "Selecione 10 jogadores; capitães e times virão a seguir."
                : "Selecione exatamente dez jogadores para habilitar o sorteio."}
              {!isDraftMode && balanceTeams ? (
                <span className="mt-1 block text-primary/90">
                  Matchmaking balanceado por PDL ativo (Condições).
                </span>
              ) : null}
              {improvedLanes ? (
                <span className="mt-1 block text-accent/90">
                  Lanes melhoradas: sem repetir a mesma rota da última partida
                  encerrada (Condições).
                </span>
              ) : null}
              {championsRandom ? (
                <span className="mt-1 block text-primary/90">
                  Campeões aleatórios: 1 campeão por rota será sorteado
                  (Condições).
                </span>
              ) : null}
              {cartasAtivas ? (
                <span className="mt-1 block text-primary/90">
                  Cartas ativas: uma cartinha de regra será sorteada ao iniciar
                  (Condições).
                </span>
              ) : null}
              {classicLockedByWeekend ? (
                <span className="mt-1 block text-amber-300/95">
                  Clássico em pausa este fim de semana — ligue “Campeões
                  aleatórios” em Condições para liberar.
                </span>
              ) : null}
            </span>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              onClick={onSubmitMatch}
              disabled={
                isPending ||
                selected.length !== 10 ||
                classicLockedByWeekend ||
                draftOpen
              }
              className="w-full max-w-[220px] sm:shrink-0"
            >
              {isDraftMode ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Swords className="h-4 w-4" />
                  {primaryButtonLabel}
                </span>
              ) : (
                primaryButtonLabel
              )}
            </Button>
          </div>
        </div>
        {selectedPlayers.length > 0 && (
          <div className="mt-4 grid gap-2 text-xs text-white/60 md:grid-cols-2">
            {selectedPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2"
              >
                <span>{player.name}</span>
                <span className="text-white/40">Score {player.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-red-400/50 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <motion.div
        layout
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        transition={{ layout: { duration: 0.35, ease: "easeInOut" } }}
      >
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isSelected={selected.includes(player.id)}
              disabled={!selected.includes(player.id) && !canSelectMore}
              onToggle={handleToggle}
              onEditScore={openScoreEditor}
            />
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-white/10 bg-black/30 p-6 text-center text-sm text-white/50">
            Nenhum jogador encontrado para &ldquo;{searchTerm}&rdquo;.
          </div>
        )}
      </motion.div>

      <LobbyConditionsModal
        open={conditionsOpen}
        onOpenChange={setConditionsOpen}
        balanceTeams={balanceTeams}
        onBalanceTeamsChange={setBalanceTeams}
        improvedLanes={improvedLanes}
        onImprovedLanesChange={setImprovedLanes}
        cartasAtivas={cartasAtivas}
        onCartasAtivasChange={setCartasAtivas}
        championsRandom={championsRandom}
        onChampionsRandomChange={setChampionsRandom}
        isDraftMode={isDraftMode}
      />

      <AnimatePresence>
        {draftOpen ? (
          <DraftOverlay
            key="draft-overlay"
            players={selectedPlayers}
            onCancel={() => {
              if (isPending) return;
              setDraftOpen(false);
            }}
            onConfirm={onConfirmDraft}
            isSubmitting={isPending}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {pendingCardReveal ? (
          <GameCardRevealOverlay
            key="card-reveal"
            payload={pendingCardReveal.payload}
            onContinue={() => {
              const id = pendingCardReveal.matchId;
              setPendingCardReveal(null);
              setSelected([]);
              router.push(`/match/${id}`);
            }}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {editingPlayer && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-neutral/90 p-6"
            >
              <h3 className="font-display text-xl text-white">
                Atualizar pontuação
              </h3>
              <p className="text-sm text-white/60">{editingPlayer.name}</p>
              <form className="mt-4 flex flex-col gap-4" onSubmit={onSubmitScore}>
                <Input
                  autoFocus
                  type="number"
                  min={0}
                  value={scoreDraft}
                  onChange={(event) => setScoreDraft(event.target.value)}
                />
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingPlayer(null)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-neutral/95 p-8 shadow-[0_0_60px_rgba(9,14,24,0.65)]"
            >
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/10 p-2 text-white/60 transition hover:border-white/40 hover:text-white/90"
                aria-label="Fechar modal de novo jogador"
              >
                ✕
              </button>
              <PlayerForm
                layout="modal"
                onCancel={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                  setIsCreateModalOpen(false);
                  router.refresh();
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
