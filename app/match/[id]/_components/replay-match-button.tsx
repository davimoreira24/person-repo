"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { replayMatchAction } from "@/app/actions/player-actions";
import { Button } from "@/components/ui/button";

interface ReplayMatchButtonProps {
  matchId: number;
  disabled?: boolean;
}

export function ReplayMatchButton({ matchId, disabled }: ReplayMatchButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleReplay = () => {
    startTransition(async () => {
      try {
        const result = await replayMatchAction(matchId);
        router.push(`/match/${result.matchId}`);
      } catch (error) {
        console.error(error);
      }
    });
  };

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={handleReplay}
      disabled={disabled || isPending}
    >
      {isPending ? "Sorteando..." : "Jogar novamente"}
    </Button>
  );
}
