"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";

export type LobbyConditionsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balanceTeams: boolean;
  onBalanceTeamsChange: (value: boolean) => void;
  improvedLanes: boolean;
  onImprovedLanesChange: (value: boolean) => void;
};

export function LobbyConditionsModal({
  open,
  onOpenChange,
  balanceTeams,
  onBalanceTeamsChange,
  improvedLanes,
  onImprovedLanesChange,
}: LobbyConditionsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lobby-conditions-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0d1422] shadow-[0_0_48px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                <h2
                  id="lobby-conditions-title"
                  className="font-display text-lg text-white"
                >
                  Condições da partida
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 px-6 py-5">
              <p className="text-sm text-white/55">
                Ajustes opcionais antes de sortear os times. Novas opções
                entrarão aqui no futuro.
              </p>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-primary/35 hover:bg-white/[0.06]">
                <input
                  type="checkbox"
                  checked={balanceTeams}
                  onChange={(e) => onBalanceTeamsChange(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-black/40 text-primary focus:ring-primary"
                />
                <span className="flex flex-col gap-1">
                  <span className="font-medium text-white">
                    Matchmaking balanceado
                  </span>
                  <span className="text-xs leading-relaxed text-white/50">
                    Usa a pontuação (PDLs) no banco de dados para formar dois
                    times de 5 que minimizam a diferença de soma entre os
                    lados. A ordem das rotas dentro de cada time continua
                    aleatória.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-accent/35 hover:bg-white/[0.06]">
                <input
                  type="checkbox"
                  checked={improvedLanes}
                  onChange={(e) => onImprovedLanesChange(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-black/40 text-accent focus:ring-accent"
                />
                <span className="flex flex-col gap-1">
                  <span className="font-medium text-white">
                    Lanes melhoradas
                  </span>
                  <span className="text-xs leading-relaxed text-white/50">
                    Com base na última partida encerrada de cada jogador, evita
                    que ele caia na mesma rota duas vezes seguidas (mesmo índice:
                    topo, selva, meio, atirador, sup). Se não houver histórico,
                    a rota é livre. Se for impossível satisfazer todos, o sorteio
                    volta ao aleatório comum.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex justify-end border-t border-white/10 px-6 py-4">
              <Button type="button" onClick={() => onOpenChange(false)}>
                Pronto
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
