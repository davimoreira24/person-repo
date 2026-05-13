"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { createDraftMatchAction } from "@/app/actions/player-actions";
import { GameCardRevealOverlay } from "@/components/game-card-reveal-overlay";
import { DraftOverlay, type DraftResult } from "@/app/players/_components/draft-overlay";
import { readLobbyConditionsFromStorage } from "@/lib/lobby-conditions-storage";
import type { CardRevealPayload } from "@/lib/match/game-card-types";
import type { Player } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";

interface ReplayDraftButtonProps {
  /** Os 10 jogadores da partida original — manterão a composição da lobby. */
  players: Player[];
  disabled?: boolean;
}

export function ReplayDraftButton({ players, disabled }: ReplayDraftButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draftOpen, setDraftOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingReveal, setPendingReveal] = useState<{
    matchId: number;
    payload: CardRevealPayload;
  } | null>(null);

  const onConfirmDraft = (result: DraftResult) => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const { improvedLanes, cartasAtivas, championsRandom } =
          readLobbyConditionsFromStorage();
        const created = await createDraftMatchAction({
          ...result,
          improvedLanes,
          cartasAtivas,
          championsRandom,
        });
        setDraftOpen(false);
        if (created.cardReveal) {
          setPendingReveal({
            matchId: created.matchId,
            payload: created.cardReveal,
          });
          return;
        }
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

  const canReplay = players.length === 10;

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          setErrorMessage(null);
          setDraftOpen(true);
        }}
        disabled={disabled || isPending || draftOpen || !canReplay}
        title={
          canReplay
            ? "Re-draftar com os mesmos 10 jogadores"
            : "Faltam jogadores na partida original."
        }
      >
        {isPending ? "Iniciando..." : "Jogar novamente (re-draft)"}
      </Button>

      {errorMessage ? (
        <span className="text-xs text-red-300">{errorMessage}</span>
      ) : null}

      <AnimatePresence>
        {draftOpen ? (
          <DraftOverlay
            key="replay-draft-overlay"
            players={players}
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
        {pendingReveal ? (
          <GameCardRevealOverlay
            key="replay-draft-card-reveal"
            payload={pendingReveal.payload}
            onContinue={() => {
              const id = pendingReveal.matchId;
              setPendingReveal(null);
              router.push(`/match/${id}`);
            }}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
