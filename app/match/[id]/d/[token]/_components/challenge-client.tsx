"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { setChallengeAction } from "@/app/actions/challenge-actions";
import { Button } from "@/components/ui/button";
import { TEAM_LOSS_PDL, TEAM_WIN_PDL } from "@/lib/match/challenge";
import type { ChallengeByToken } from "@/lib/queries/challenge";
import { Check, Loader2, ShieldOff, Swords } from "lucide-react";

type ChallengeClientProps = {
  token: string;
  challenge: ChallengeByToken;
};

export function ChallengeClient({ token, challenge: initial }: ChallengeClientProps) {
  const [active, setActive] = useState(initial.challengeActive);
  const [locked] = useState(initial.locked);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const apply = (next: boolean) => {
    if (locked || isPending) return;
    setErrorMessage(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const result = await setChallengeAction({
          token,
          active: next,
        });
        setActive(result.challengeActive);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2000);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível salvar sua escolha.",
        );
      }
    });
  };

  return (
    <motion.div
      className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a1220] via-[#060a12] to-[#04070f] p-6 shadow-[0_0_60px_rgba(79,114,255,0.15)] sm:p-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
          <Swords className="h-3.5 w-3.5" />
          Desafio PDL
        </div>
        <h1 className="font-display text-2xl text-white">{initial.playerName}</h1>
        <p className="text-sm leading-relaxed text-white/55">
          Partida #{initial.matchId}. Sua escolha fica{" "}
          <span className="text-white/75">anônima</span> até encerrar — ninguém
          no stream vê quem ativou.
        </p>
      </div>

      {locked ? (
        <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center text-sm text-white/60">
          Desafios já foram confirmados para esta partida.
          {active ? (
            <span className="mt-1 block text-primary">
              Você entrou no desafio.
            </span>
          ) : (
            <span className="mt-1 block">Você ficou no PDL normal.</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            size="lg"
            disabled={isPending}
            onClick={() => apply(true)}
            className={`gap-2 ${
              active
                ? "shadow-[0_0_28px_rgba(230,195,87,0.25)]"
                : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
            variant={active ? "primary" : "outline"}
          >
            {isPending && active ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Swords className="h-4 w-4" />
            )}
            Ativar desafio (+{TEAM_WIN_PDL * 2} / −{TEAM_LOSS_PDL * 2})
          </Button>
          <Button
            type="button"
            size="lg"
            variant={!active ? "primary" : "outline"}
            disabled={isPending}
            onClick={() => apply(false)}
            className={`gap-2 ${
              !active
                ? ""
                : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            {isPending && !active ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldOff className="h-4 w-4" />
            )}
            Ficar no normal (+{TEAM_WIN_PDL} / −{TEAM_LOSS_PDL})
          </Button>
        </div>
      )}

      {!locked && active ? (
        <p className="text-center text-xs text-primary/85">
          Desafio ativo — pode mudar até o admin confirmar a pré-partida.
        </p>
      ) : null}

      {saved ? (
        <p className="flex items-center justify-center gap-1.5 text-xs text-emerald-300/90">
          <Check className="h-3.5 w-3.5" />
          Escolha salva
        </p>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-red-400/45 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      ) : null}
    </motion.div>
  );
}
