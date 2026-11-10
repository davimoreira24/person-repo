"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  linkPlayerRiotIdAction,
  refreshPlayerRiotStatsAction,
} from "@/app/actions/player-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, RefreshCw } from "lucide-react";

type ProfileRiotActionsProps = {
  playerId: number;
  hasRiotId: boolean;
};

export function ProfileRiotActions({
  playerId,
  hasRiotId,
}: ProfileRiotActionsProps) {
  const router = useRouter();
  const [showLink, setShowLink] = useState(false);
  const [riotIdInput, setRiotIdInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLink = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await linkPlayerRiotIdAction({
          playerId,
          riotId: riotIdInput.trim(),
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setShowLink(false);
        setRiotIdInput("");
        router.refresh();
      } catch {
        setError(
          "Falha ao vincular Riot ID. Confira RIOT_API_KEY na Vercel e o SQL supabase-riot-players.sql.",
        );
      }
    });
  };

  const handleRefresh = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await refreshPlayerRiotStatsAction(playerId);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
      } catch {
        setError("Falha ao atualizar stats Riot.");
      }
    });
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        {hasRiotId ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleRefresh}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
            Atualizar stats Riot
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setShowLink((v) => !v)}
            className="gap-1.5"
          >
            <Link2 className="h-3.5 w-3.5" />
            Vincular Riot ID
          </Button>
        )}
      </div>

      {showLink ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/35 p-3">
          <Input
            placeholder="Nome#TAG"
            value={riotIdInput}
            onChange={(e) => setRiotIdInput(e.target.value)}
            disabled={isPending}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLink(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleLink}
              disabled={isPending || riotIdInput.trim().length < 5}
            >
              {isPending ? "Buscando..." : "Salvar"}
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-center text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
