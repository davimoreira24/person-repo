"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { Player } from "@/lib/db/schema";
import {
  createMatchAction,
  updatePlayerScoreAction,
} from "@/app/actions/player-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayerCard } from "./player-card";
import { PlayerForm } from "./player-form";

interface PlayerSelectionProps {
  players: Player[];
}

export function PlayerSelection({ players }: PlayerSelectionProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<number[]>([]);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [scoreDraft, setScoreDraft] = useState<string>("0");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

  const onSubmitMatch = () => {
    setErrorMessage(null);
    if (selected.length !== 10) {
      setErrorMessage("Selecione exatamente 10 jogadores antes de iniciar.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await createMatchAction({ playerIds: selected });
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

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-[0.35em] text-white/60">
            Seleção de jogadores
          </span>
          <h2 className="font-display text-3xl text-white">Monte sua lobby</h2>
          <p className="text-sm text-white/65">
            Escolha dez jogadores para formar dois times balanceados. O sorteio
            será feito automaticamente com efeitos cinematográficos.
          </p>
          {!hasPlayers && (
            <p className="text-sm text-white/50">
              Ainda não há jogadores cadastrados. Adicione novos invocadores para começar.
            </p>
          )}
        </div>
        <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar jogador..."
            className="bg-white/5 text-sm text-white placeholder:text-white/40"
          />
          <Button
            type="button"
            variant="secondary"
            className="whitespace-nowrap"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Novo jogador
          </Button>
        </div>
      </header>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <span className="text-sm uppercase tracking-[0.25em] text-primary">
              {selected.length} / 10 jogadores
            </span>
            <span className="text-xs text-white/50">
              Selecione exatamente dez jogadores para habilitar o sorteio.
            </span>
          </div>
          <Button
            type="button"
            onClick={onSubmitMatch}
            disabled={isPending || selected.length !== 10}
            className="w-full max-w-[180px]"
          >
            {isPending ? "Sorteando..." : "Jogar"}
          </Button>
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
              <p className="text-sm text-white/60">
                {editingPlayer.name}
              </p>
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

