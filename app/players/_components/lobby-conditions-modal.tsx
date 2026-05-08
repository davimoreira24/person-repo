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
  cartasAtivas: boolean;
  onCartasAtivasChange: (value: boolean) => void;
  championsRandom: boolean;
  onChampionsRandomChange: (value: boolean) => void;
  /** Lobby em modo Draft? (afeta visibilidade de "Matchmaking balanceado"). */
  isDraftMode?: boolean;
};

export function LobbyConditionsModal({
  open,
  onOpenChange,
  balanceTeams,
  onBalanceTeamsChange,
  improvedLanes,
  onImprovedLanesChange,
  cartasAtivas,
  onCartasAtivasChange,
  championsRandom,
  onChampionsRandomChange,
  isDraftMode = false,
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
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/15 bg-[#0d1422] shadow-[0_0_48px_rgba(0,0,0,0.45)]"
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
                Ajustes opcionais antes de sortear/draftar os times.
              </p>

              {!isDraftMode ? (
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
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-xs leading-relaxed text-white/45">
                  <span className="block font-medium text-white/70">
                    Matchmaking balanceado
                  </span>
                  Indisponível no modo Draft — os capitães escolhem os times.
                </div>
              )}

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
                    topo, selva, meio, atirador, sup). Vale também depois do
                    draft, quando as lanes são sorteadas dentro de cada time.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-primary/35 hover:bg-white/[0.06]">
                <input
                  type="checkbox"
                  checked={championsRandom}
                  onChange={(e) => onChampionsRandomChange(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-black/40 text-primary focus:ring-primary"
                />
                <span className="flex flex-col gap-1">
                  <span className="font-medium text-white">
                    Campeões aleatórios
                  </span>
                  <span className="text-xs leading-relaxed text-white/50">
                    Sorteia 1 campeão compatível por rota (dados Meraki), sem
                    repetir campeão na partida quando possível. Funciona junto
                    com qualquer modo (clássico ou draft).
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-primary/35 hover:bg-white/[0.06]">
                <input
                  type="checkbox"
                  checked={cartasAtivas}
                  onChange={(e) => onCartasAtivasChange(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-black/40 text-primary focus:ring-primary"
                />
                <span className="flex flex-col gap-1">
                  <span className="font-medium text-white">
                    Cartas ativas
                  </span>
                  <span className="text-xs leading-relaxed text-white/50">
                    Ao iniciar ou re-jogar, sorteia uma cartinha de regra da tabela
                    <code className="mx-1 rounded bg-white/10 px-1 py-0.5 text-[10px]">
                      game_cards
                    </code>
                    (Supabase) com animação. Cadastre, edite ou desative cartas
                    por lá — o app só lê as ativas.
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
