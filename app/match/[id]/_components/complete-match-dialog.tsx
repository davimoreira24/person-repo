"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { completeMatchAction } from "@/app/actions/player-actions";
import { createVotingSessionAction } from "@/app/actions/voting-actions";
import { Button } from "@/components/ui/button";
import type { MatchWithTeams } from "@/lib/queries/players";
import { Users, Vote } from "lucide-react";

type Step = "mode" | "winner" | "mvp" | "dud" | "summary";
type CompletionMode = "normal" | "voting" | null;

interface CompleteMatchDialogProps {
  match: MatchWithTeams;
}

export function CompleteMatchDialog({ match }: CompleteMatchDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<CompletionMode>(null);
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
    setStep("mode");
    setMode(null);
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

  const handleModeSelect = (selectedMode: "normal" | "voting") => {
    setMode(selectedMode);
    if (selectedMode === "normal") {
      setStep("winner");
    } else {
      setStep("winner"); // For voting mode, we also need to select winner first
    }
    setErrorMessage(null);
  };

  const handleWinnerSelect = (team: 1 | 2) => {
    setWinnerTeam(team);
    
    if (mode === "voting") {
      // Create voting session and show link
      startTransition(async () => {
        try {
          const result = await createVotingSessionAction({
            matchId: match.id,
            winnerTeam: team,
          });
          
          const votingUrl = `${window.location.origin}/voting/${result.sessionId}`;
          
          // Show voting link in a new step
          setStep("summary");
          setErrorMessage(null);
          
          // Store voting URL temporarily
          (window as any).votingUrl = votingUrl;
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Erro ao criar sessão de votação"
          );
        }
      });
    } else {
      setStep("mvp");
    }
    
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
    if (step === "summary" && mode === "normal") {
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
    if (step === "winner") {
      setWinnerTeam(null);
      setStep("mode");
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
    mode: "Escolha o modo de finalização",
    winner: "Selecione o time vencedor",
    mvp: "Escolha o MVP do time vencedor",
    dud: "Escolha o pior do time perdedor",
    summary: mode === "voting" ? "Link de votação gerado!" : "Confirme o resultado",
  };

  const copyVotingLink = () => {
    const url = (window as any).votingUrl;
    if (url) {
      navigator.clipboard.writeText(url);
      alert("Link copiado para a área de transferência!");
    }
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
                {step === "mode" && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <motion.button
                      type="button"
                      onClick={() => handleModeSelect("normal")}
                      className="group flex flex-col gap-4 rounded-2xl border border-white/15 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 text-left transition-all hover:border-primary/70 hover:shadow-glow"
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-all group-hover:bg-primary/20">
                        <Users className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className="font-display text-lg font-semibold text-white">
                          Modo Normal
                        </h4>
                        <p className="text-sm leading-relaxed text-white/60">
                          Você escolhe o vencedor, MVP e pior jogador imediatamente.
                          A partida é finalizada na hora.
                        </p>
                      </div>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => handleModeSelect("voting")}
                      className="group flex flex-col gap-4 rounded-2xl border border-white/15 bg-gradient-to-br from-purple-500/5 to-blue-500/5 p-6 text-left transition-all hover:border-purple-400/70 hover:shadow-[0_0_35px_rgba(168,85,247,0.4)]"
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10 transition-all group-hover:bg-purple-500/20">
                        <Vote className="h-7 w-7 text-purple-400" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className="font-display text-lg font-semibold text-white">
                          Modo Votação
                        </h4>
                        <p className="text-sm leading-relaxed text-white/60">
                          Gera um link de votação anônima. Todos os jogadores
                          votam no MVP e pior jogador em tempo real.
                        </p>
                      </div>
                    </motion.button>
                  </div>
                )}

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

                {step === "summary" && mode === "voting" && winnerTeam && (
                  <div className="space-y-4 rounded-2xl border border-purple-400/30 bg-purple-500/10 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                        <Vote className="h-6 w-6 text-purple-400" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-semibold text-white">
                          Votação ativa!
                        </h4>
                        <p className="text-sm text-white/60">
                          Time {winnerTeam} venceu
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-white/70">
                        Compartilhe este link com os jogadores para votarem no MVP e pior jogador:
                      </p>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={(window as any).votingUrl || "Gerando..."}
                          className="flex-1 rounded-lg border border-white/20 bg-black/30 px-4 py-2 text-sm text-white"
                        />
                        <Button
                          onClick={copyVotingLink}
                          variant="secondary"
                          className="shrink-0"
                        >
                          Copiar
                        </Button>
                      </div>

                      <p className="text-xs text-white/50">
                        Os votos aparecerão em tempo real. Você pode finalizar a votação
                        manualmente na página de votação.
                      </p>
                    </div>
                  </div>
                )}

                {step === "summary" &&
                  mode === "normal" &&
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
                {step !== "summary" || mode === "normal" ? (
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={isPending}
                  >
                    Voltar
                  </Button>
                ) : null}

                {step === "summary" && mode === "voting" ? (
                  <Button
                    onClick={closeDialog}
                    className="ml-auto"
                  >
                    Fechar
                  </Button>
                ) : step === "summary" && mode === "normal" ? (
                  <Button onClick={handleConfirm} disabled={isPending}>
                    {isPending ? "Finalizando..." : "Confirmar resultado"}
                  </Button>
                ) : step !== "mode" ? (
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
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
