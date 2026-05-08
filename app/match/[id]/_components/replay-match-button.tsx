"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { replayMatchAction } from "@/app/actions/player-actions";
import { GameCardRevealOverlay } from "@/components/game-card-reveal-overlay";
import { readLobbyConditionsFromStorage } from "@/lib/lobby-conditions-storage";
import type { CardRevealPayload } from "@/lib/match/game-card-types";
import { Button } from "@/components/ui/button";

interface ReplayMatchButtonProps {
  matchId: number;
  disabled?: boolean;
}

export function ReplayMatchButton({ matchId, disabled }: ReplayMatchButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingReveal, setPendingReveal] = useState<{
    matchId: number;
    payload: CardRevealPayload;
  } | null>(null);

  const handleReplay = () => {
    startTransition(async () => {
      try {
        const {
          balanceTeams,
          improvedLanes,
          cartasAtivas,
          championsRandom,
        } = readLobbyConditionsFromStorage();
        const result = await replayMatchAction({
          matchId,
          balanceTeams,
          improvedLanes,
          cartasAtivas,
          championsRandom,
        });
        if (result.cardReveal) {
          setPendingReveal({
            matchId: result.matchId,
            payload: result.cardReveal,
          });
          return;
        }
        router.push(`/match/${result.matchId}`);
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={handleReplay}
        disabled={disabled || isPending}
      >
        {isPending ? "Sorteando..." : "Jogar novamente"}
      </Button>
      <AnimatePresence>
        {pendingReveal ? (
          <GameCardRevealOverlay
            key="replay-card-reveal"
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
