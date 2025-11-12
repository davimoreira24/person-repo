"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { completeMatchAction } from "@/app/actions/player-actions";
import { Button } from "@/components/ui/button";
import type { MatchWithTeams } from "@/lib/queries/players";

type Step = "winner" | "mvp" | "dud" | "summary";

interface CompleteMatchDialogProps {
  match: MatchWithTeams;
}

export function CompleteMatchDialog({ match }: CompleteMatchDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("winner");
  const [winnerTeam, setWinnerTeam] = useState<1 | 2 | null>(null);
  const [mvpPlayerId, setMvpPlayerId] = useState<number | null>(null);
  const [dudPlayerId, setDudPlayerId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const winnerPlayers = useMemo(
    () => (winnerTeam ? match.teams[winnerTeam] : []),
    [match.teams, winnerTeam]
  );
  const loserTeam = winnerTeam ? (winnerTeam === 1 ? 2 : 1) : null;
  const loserPlayers = useMemo(
    () => (loserTeam ? match.teams[loserTeam] : []),
    [match.teams, loserTeam]
  );

  const resetState = () => {
    setStep("winner");
    setWinnerTeam(null);
    setMvpPlayerId(null);
    setDudPlayerId(null);
    setErrorMessage(null);
  };

  const closeDialog = () => {
    if (isPending) return;
    setOpen(false);
    resetState();
  };

  const openDialog = () => {
    resetState();
    setOpen(true);
  };

  const handleWinnerSelect = (team: 1 | 2) => {
    setWinnerTeam(team);
    setStep("mvp");
    setErrorMessage(null);
  };

  const handleMvpSelect = (playerId: number) => {
    setMvpPlayerId(playerId);
    setStep("dud");
    setErrorMessage(null);
  };

  const handleDudSelect = (playerId: number) => {
    setDudPlayerId(playerId);
    setStep("summary");
    setErrorMessage(null);
  };

  const handleBack = () => {
    if (step === "summary") {
      setStep("dud");
      return;
    }
    if (step === "dud") {
      setDudPlayerId(null);
      setStep("mvp");
      return;
    }
    if (step === "mvp") {
      setMvpPlayerId(null);
      setWinnerTeam(null);
      setStep("winner");
      return;
    }
    closeDialog();
  };

  const handleConfirm = () => {
    if (!winnerTeam || !mvpPlayerId || !dudPlayerId) {
      setErrorMessage("Selecione todas as opções antes de confirmar.");
      return;
    }

    startTransition(async () => {
      try {
        setErrorMessage(null);
        await completeMatchAction({
          matchId: match.id,
          winnerTeam,
          mvpPlayerId,
          dudPlayerId,
        });
        closeDialog();
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível encerrar a partida."
        );
      }
    });
  };

  const stepTitle: Record<Step, string> = {
    winner: "Selecione o time vencedor",
    mvp: "Escolha o MVP do time vencedor",
    dud: "Escolha o pior do time perdedor",
    summary: "Confirme o resultado",
  };

  const StepBadge = ({ label, active }: { label: string; active: boolean }) => (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.35em] ${
        active
          ? "border-primary/80 bg-primary/20 text-primary"
          : "border-white/15 bg-white/5 text-white/40"
      }`}
    >
      {label}
    </span>
  );

  return (
    <>
      <Button
        variant="primary"
        className="w-fit bg-gradient-to-r from-[#ff4d4f] via-[#d9363e] to-[#a61d24] text-white shadow-[0_0_38px_rgba(217,54,62,0.55)] hover:shadow-[0_0_48px_rgba(255,77,79,0.6)]"
        onClick={openDialog}
        disabled={isPending}
      >
        Encerrar partida
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-neutral/95 p-6 shadow-[0_0_60px_rgba(9,14,24,0.65)]"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <button
                type="button"
                onClick={closeDialog}
                className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:border-white/40 hover:text-white/90"
              >
                ✕
              </button>
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.45em] text-white/40">
                    Encerrar partida #{match.id}
                  </span>
                  <h3 className="font-display text-2xl text-white">
                    {stepTitle[step]}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <StepBadge label="Vencedor" active={step !== "winner"} />
                  <StepBadge
                    label="MVP"
                    active={step === "dud" || step === "summary"}
                  />
                  <StepBadge label="Pior" active={step === "summary"} />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {step === "winner" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map((team) => (
                      <motion.button
                        key={team}
                        type="button"
                        onClick={() => handleWinnerSelect(team as 1 | 2)}
                        className={`flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/5 p-5 text-left transition-all hover:border-primary/70 ${
                          winnerTeam === team
                            ? "border-primary shadow-glow"
                            : ""
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-xl text-white">
                            Time {team}
                          </span>
                          <span className="text-xs uppercase tracking-[0.35em] text-white/40">
                            {match.teams[team as 1 | 2].length} jogadores
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-white/70">
                          {match.teams[team as 1 | 2].map((player) => (
                            <span key={player.playerId} className="truncate">
                              {player.name}
                            </span>
                          ))}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {step === "mvp" && winnerTeam && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-white/70">
                      Selecione quem brilhou no time vencedor.
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {winnerPlayers.map((player) => (
                        <motion.button
                          key={player.playerId}
                          type="button"
                          onClick={() => handleMvpSelect(player.playerId)}
                          className={`flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 text-left transition-all hover:border-primary/60 ${
                            mvpPlayerId === player.playerId
                              ? "border-primary shadow-glow"
                              : ""
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {player.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={player.photoUrl}
                                alt={player.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              player.name
                                .split(" ")
                                .map((word) => word[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-white">
                              {player.name}
                            </span>
                            <span className="text-xs text-white/50">
                              PDLs atuais: {player.score}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {step === "dud" && loserTeam && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-white/70">
                      Quem deixou a desejar no time perdedor?
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {loserPlayers.map((player) => (
                        <motion.button
                          key={player.playerId}
                          type="button"
                          onClick={() => handleDudSelect(player.playerId)}
                          className={`flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-3 text-left transition-all hover:border-red-400/60 ${
                            dudPlayerId === player.playerId
                              ? "border-red-400 shadow-[0_0_30px_rgba(255,120,120,0.45)]"
                              : ""
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-sm font-semibold text-red-300">
                            {player.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={player.photoUrl}
                                alt={player.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              player.name
                                .split(" ")
                                .map((word) => word[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-white">
                              {player.name}
                            </span>
                            <span className="text-xs text-white/50">
                              PDLs atuais: {player.score}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {step === "summary" &&
                  winnerTeam &&
                  loserTeam &&
                  mvpPlayerId &&
                  dudPlayerId && (
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                      <p>
                        <strong className="text-white">Resumo:</strong>
                      </p>
                      <ul className="space-y-2">
                        <li>
                          Time vencedor:{" "}
                          <span className="text-primary">
                            Time {winnerTeam}
                          </span>{" "}
                          (cada jogador +25 PDLs)
                        </li>
                        <li>
                          MVP:{" "}
                          <span className="text-primary">
                            {
                              winnerPlayers.find(
                                (player) => player.playerId === mvpPlayerId
                              )?.name
                            }
                          </span>{" "}
                          (+10 PDLs adicionais)
                        </li>
                        <li>
                          Pior jogador:{" "}
                          <span className="text-red-300">
                            {
                              loserPlayers.find(
                                (player) => player.playerId === dudPlayerId
                              )?.name
                            }
                          </span>{" "}
                          (-10 PDLs adicionais)
                        </li>
                      </ul>
                    </div>
                  )}

                {errorMessage && (
                  <div className="rounded-2xl border border-red-400/50 bg-red-500/15 px-4 py-3 text-sm text-red-100">
                    {errorMessage}
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={isPending}
                >
                  Voltar
                </Button>
                {step === "summary" ? (
                  <Button onClick={handleConfirm} disabled={isPending}>
                    {isPending ? "Finalizando..." : "Confirmar resultado"}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (step === "winner" && !winnerTeam) {
                        setErrorMessage("Selecione um time para continuar.");
                      } else if (step === "mvp" && !mvpPlayerId) {
                        setErrorMessage("Escolha o MVP antes de avançar.");
                      } else if (step === "dud" && !dudPlayerId) {
                        setErrorMessage(
                          "Selecione o pior jogador para continuar."
                        );
                      } else {
                        setErrorMessage(null);
                        if (step === "winner") setStep("mvp");
                        if (step === "mvp") setStep("dud");
                        if (step === "dud") setStep("summary");
                      }
                    }}
                  >
                    Continuar
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
