"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  buildDiscordChallengeMessageAction,
  getChallengeStatusAction,
} from "@/app/actions/challenge-actions";
import { Button } from "@/components/ui/button";
import type { ChallengeStatus } from "@/lib/queries/challenge";
import { Check, Copy, Loader2, Swords } from "lucide-react";

type PrePartidaChallengePanelProps = {
  matchId: number;
  initialStatus: ChallengeStatus;
};

export function PrePartidaChallengePanel({
  matchId,
  initialStatus,
}: PrePartidaChallengePanelProps) {
  const [status, setStatus] = useState(initialStatus);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    const next = await getChallengeStatusAction(matchId);
    if (next) setStatus(next);
  }, [matchId]);

  useEffect(() => {
    if (status.locked) return;
    const id = window.setInterval(() => {
      void refresh();
    }, 2500);
    return () => window.clearInterval(id);
  }, [refresh, status.locked]);

  const handleCopy = () => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const { message } = await buildDiscordChallengeMessageAction({
          matchId,
          origin: window.location.origin,
        });
        await navigator.clipboard.writeText(message);
        setCopyState("copied");
        window.setTimeout(() => setCopyState("idle"), 2500);
      } catch (error) {
        setCopyState("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível copiar a mensagem.",
        );
      }
    });
  };

  return (
    <motion.div
      className="rounded-3xl border border-violet-400/25 bg-gradient-to-br from-violet-500/10 via-black/20 to-black/40 p-5 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-violet-200">
            <Swords className="h-4 w-4" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.35em]">
              Desafio PDL
            </span>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-white/60">
            Cada jogador ativa pelo link no Discord. No stream aparece só o
            contador —{" "}
            <span className="text-white/80">
              quem entrou no desafio só se revela ao encerrar a partida.
            </span>
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-4xl text-violet-100">
              {status.activeCount}
            </span>
            <span className="text-sm text-white/45">
              / {status.total} desafios ativos
            </span>
          </div>
          {status.locked ? (
            <p className="text-xs text-white/40">Desafios confirmados.</p>
          ) : (
            <p className="text-xs text-white/40">
              Atualiza sozinho enquanto os links forem usados.
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isPending || status.locked}
          onClick={handleCopy}
          className="shrink-0 gap-2 border-violet-400/35 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : copyState === "copied" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copyState === "copied"
            ? "Copiado!"
            : "Copiar mensagem Discord"}
        </Button>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-red-400/45 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}
    </motion.div>
  );
}
