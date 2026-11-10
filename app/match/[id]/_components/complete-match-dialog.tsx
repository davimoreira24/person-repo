"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { completeMatchAction } from "@/app/actions/player-actions";
import { createVotingSessionAction } from "@/app/actions/voting-actions";
import { Button } from "@/components/ui/button";
import type { MatchWithTeams } from "@/lib/queries/players";
import {
  applyManualLink,
  autoLinkRoflPlayers,
  buildRoflImportResult,
  kdaScore,
} from "@/lib/rofl/match-players";
import { parseRoflFile } from "@/lib/rofl/parse-rofl";
import type {
  ParsedRofl,
  RoflImportResult,
  RoflPlayerLink,
} from "@/lib/rofl/types";
import { FileUp, Users, Vote } from "lucide-react";

type Step =
  | "mode"
  | "rofl-upload"
  | "rofl-pair"
  | "rofl-preview"
  | "winner"
  | "mvp"
  | "dud"
  | "summary";
type CompletionMode = "normal" | "voting" | "rofl" | null;

interface CompleteMatchDialogProps {
  match: MatchWithTeams;
}

function PlayerAvatar({
  name,
  photoUrl,
  tone = "primary",
}: {
  name: string;
  photoUrl: string | null;
  tone?: "primary" | "danger";
}) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const toneClass =
    tone === "danger"
      ? "bg-red-500/10 text-red-300"
      : "bg-primary/10 text-primary";

  return (
    <div
      className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full text-sm font-semibold ${toneClass}`}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
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
  const [isParsingRofl, setIsParsingRofl] = useState(false);

  const [parsedRofl, setParsedRofl] = useState<ParsedRofl | null>(null);
  const [roflLinks, setRoflLinks] = useState<RoflPlayerLink[]>([]);
  const [roflImport, setRoflImport] = useState<RoflImportResult | null>(null);

  const roster = useMemo(
    () =>
      [...match.teams[1], ...match.teams[2]].map((p) => ({
        playerId: p.playerId,
        name: p.name,
        team: p.team,
        riotGameName: p.riotGameName,
        photoUrl: p.photoUrl,
      })),
    [match.teams],
  );

  const rosterById = useMemo(
    () => new Map(roster.map((p) => [p.playerId, p])),
    [roster],
  );

  const winnerPlayers = useMemo(
    () => (winnerTeam ? match.teams[winnerTeam] : []),
    [match.teams, winnerTeam],
  );
  const loserTeam = winnerTeam ? (winnerTeam === 1 ? 2 : 1) : null;
  const loserPlayers = useMemo(
    () => (loserTeam ? match.teams[loserTeam] : []),
    [match.teams, loserTeam],
  );

  const unmatchedLinks = useMemo(
    () => roflLinks.filter((link) => link.playerId == null),
    [roflLinks],
  );

  const usedPlayerIds = useMemo(
    () =>
      new Set(
        roflLinks
          .map((link) => link.playerId)
          .filter((id): id is number => id != null),
      ),
    [roflLinks],
  );

  const availableRoster = useMemo(
    () => roster.filter((p) => !usedPlayerIds.has(p.playerId)),
    [roster, usedPlayerIds],
  );

  const resetState = () => {
    setStep("mode");
    setMode(null);
    setWinnerTeam(null);
    setMvpPlayerId(null);
    setDudPlayerId(null);
    setErrorMessage(null);
    setParsedRofl(null);
    setRoflLinks([]);
    setRoflImport(null);
    setIsParsingRofl(false);
  };

  const closeDialog = () => {
    if (isPending || isParsingRofl) return;
    setOpen(false);
    resetState();
  };

  const openDialog = () => {
    resetState();
    setOpen(true);
  };

  const handleModeSelect = (selectedMode: "normal" | "voting" | "rofl") => {
    setMode(selectedMode);
    setErrorMessage(null);
    if (selectedMode === "rofl") {
      setStep("rofl-upload");
      return;
    }
    setStep("winner");
  };

  const handleRoflFile = async (file: File | null) => {
    if (!file) return;
    setIsParsingRofl(true);
    setErrorMessage(null);
    try {
      const parsed = await parseRoflFile(file);
      const links = autoLinkRoflPlayers(parsed.players, roster);
      setParsedRofl(parsed);
      setRoflLinks(links);
      if (links.some((link) => link.playerId == null)) {
        setStep("rofl-pair");
      } else {
        const result = buildRoflImportResult(parsed, links, roster);
        applyRoflResult(result);
        setStep("rofl-preview");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível ler o arquivo .rofl.",
      );
    } finally {
      setIsParsingRofl(false);
    }
  };

  const applyRoflResult = (result: RoflImportResult) => {
    setRoflImport(result);
    setWinnerTeam(result.winnerTeam);
    setMvpPlayerId(result.suggestedMvpPlayerId);
    setDudPlayerId(result.suggestedDudPlayerId);
  };

  const handleFinishPairing = () => {
    if (!parsedRofl) return;
    try {
      setErrorMessage(null);
      const result = buildRoflImportResult(parsedRofl, roflLinks, roster);
      applyRoflResult(result);
      setStep("rofl-preview");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Pareie todos os jogadores para continuar.",
      );
    }
  };

  const handleWinnerSelect = (team: 1 | 2) => {
    setWinnerTeam(team);
    setMvpPlayerId(null);
    setDudPlayerId(null);

    if (mode === "voting") {
      startTransition(async () => {
        try {
          const result = await createVotingSessionAction({
            matchId: match.id,
            winnerTeam: team,
          });
          const votingUrl = `${window.location.origin}/voting/${result.sessionId}`;
          setStep("summary");
          setErrorMessage(null);
          (window as unknown as { votingUrl?: string }).votingUrl = votingUrl;
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Erro ao criar sessão de votação",
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
    if (step === "summary" && (mode === "normal" || mode === "rofl")) {
      setStep("dud");
      return;
    }
    if (step === "dud") {
      setStep("mvp");
      return;
    }
    if (step === "mvp") {
      if (mode === "rofl") {
        setStep("rofl-preview");
        return;
      }
      setMvpPlayerId(null);
      setWinnerTeam(null);
      setStep("winner");
      return;
    }
    if (step === "rofl-preview") {
      setStep(
        roflLinks.some((l) => !l.autoMatched) ? "rofl-pair" : "rofl-upload",
      );
      return;
    }
    if (step === "rofl-pair") {
      setStep("rofl-upload");
      return;
    }
    if (step === "rofl-upload" || step === "winner") {
      setWinnerTeam(null);
      setRoflImport(null);
      setParsedRofl(null);
      setRoflLinks([]);
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
          ...(roflImport
            ? {
                roflImported: true,
                gameLengthMs: roflImport.gameLengthMs,
                playerStats: roflImport.playerStats.map((stat) => ({
                  playerId: stat.playerId,
                  kills: stat.kills,
                  deaths: stat.deaths,
                  assists: stat.assists,
                  championKey: stat.championKey,
                  championName: stat.championName,
                })),
              }
            : {}),
        });
        closeDialog();
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível encerrar a partida.",
        );
      }
    });
  };

  const stepTitle: Record<Step, string> = {
    mode: "Escolha o modo de finalização",
    "rofl-upload": "Importe o replay (.rofl)",
    "rofl-pair": "Pareie os jogadores não encontrados",
    "rofl-preview": "Confira o que o replay preencheu",
    winner: "Selecione o time vencedor",
    mvp: "Escolha o MVP do time vencedor",
    dud: "Escolha o pior do time perdedor",
    summary:
      mode === "voting" ? "Link de votação gerado!" : "Confirme o resultado",
  };

  const copyVotingLink = () => {
    const url = (window as unknown as { votingUrl?: string }).votingUrl;
    if (url) {
      navigator.clipboard.writeText(url);
      alert("Link copiado para a área de transferência!");
    }
  };

  const kdaForPlayer = (playerId: number) => {
    const stat = roflImport?.playerStats.find((s) => s.playerId === playerId);
    if (!stat) return null;
    return `${stat.kills}/${stat.deaths}/${stat.assists}`;
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
              className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-neutral/95 p-6 shadow-[0_0_60px_rgba(9,14,24,0.65)]"
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
              <div className="flex items-center justify-between gap-4 pr-10">
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-[0.45em] text-white/40">
                    Encerrar partida #{match.id}
                  </span>
                  <h3 className="font-display text-2xl text-white">
                    {stepTitle[step]}
                  </h3>
                </div>
                <div className="hidden flex-wrap justify-end gap-2 sm:flex">
                  <StepBadge
                    label="Vencedor"
                    active={Boolean(winnerTeam) || step === "mvp" || step === "dud" || step === "summary"}
                  />
                  <StepBadge
                    label="MVP"
                    active={step === "dud" || step === "summary"}
                  />
                  <StepBadge label="Pior" active={step === "summary"} />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {step === "mode" && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <motion.button
                      type="button"
                      onClick={() => handleModeSelect("normal")}
                      className="group flex flex-col gap-4 rounded-2xl border border-white/15 bg-gradient-to-br from-white/5 to-white/[0.02] p-5 text-left transition-all hover:border-primary/70 hover:shadow-glow"
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-all group-hover:bg-primary/20">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className="font-display text-lg font-semibold text-white">
                          Modo Normal
                        </h4>
                        <p className="text-sm leading-relaxed text-white/60">
                          Você escolhe vencedor, MVP e pior na hora.
                        </p>
                      </div>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => handleModeSelect("rofl")}
                      className="group flex flex-col gap-4 rounded-2xl border border-white/15 bg-gradient-to-br from-[#E6C357]/10 to-white/[0.02] p-5 text-left transition-all hover:border-[#E6C357]/70 hover:shadow-[0_0_35px_rgba(230,195,87,0.35)]"
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6C357]/15 transition-all group-hover:bg-[#E6C357]/25">
                        <FileUp className="h-6 w-6 text-[#E6C357]" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className="font-display text-lg font-semibold text-white">
                          Importar replay
                        </h4>
                        <p className="text-sm leading-relaxed text-white/60">
                          Lê o `.rofl`, preenche campeões/KDA/vencedor e sugere
                          MVP/dud.
                        </p>
                      </div>
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => handleModeSelect("voting")}
                      className="group flex flex-col gap-4 rounded-2xl border border-white/15 bg-gradient-to-br from-purple-500/5 to-blue-500/5 p-5 text-left transition-all hover:border-purple-400/70 hover:shadow-[0_0_35px_rgba(168,85,247,0.4)]"
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 transition-all group-hover:bg-purple-500/20">
                        <Vote className="h-6 w-6 text-purple-400" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <h4 className="font-display text-lg font-semibold text-white">
                          Modo Votação
                        </h4>
                        <p className="text-sm leading-relaxed text-white/60">
                          Link anônimo para todos votarem MVP e pior.
                        </p>
                      </div>
                    </motion.button>
                  </div>
                )}

                {step === "rofl-upload" && (
                  <div className="space-y-4">
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/25 bg-white/5 px-6 py-12 text-center transition hover:border-[#E6C357]/60 hover:bg-[#E6C357]/5">
                      <FileUp className="h-8 w-8 text-[#E6C357]" />
                      <div>
                        <p className="font-medium text-white">
                          {isParsingRofl
                            ? "Lendo replay..."
                            : "Solte o .rofl ou clique para escolher"}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          O arquivo fica só no seu browser — enviamos apenas o
                          JSON extraído.
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".rofl,application/octet-stream"
                        className="hidden"
                        disabled={isParsingRofl}
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          void handleRoflFile(file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <p className="text-xs text-white/40">
                      Casamos automaticamente pelo Riot ID (`Nome`). Quem não
                      bater aparece na próxima tela pra parear na mão.
                    </p>
                  </div>
                )}

                {step === "rofl-pair" && (
                  <div className="space-y-4">
                    <p className="text-sm text-white/65">
                      {unmatchedLinks.length > 0
                        ? `${unmatchedLinks.length} nick(s) do replay não bateram com Riot ID. Pareie com o jogador Person.`
                        : "Revise o pareamento e continue."}
                    </p>
                    <div className="space-y-3">
                      {roflLinks.map((link) => {
                        const person = link.playerId
                          ? rosterById.get(link.playerId)
                          : null;
                        return (
                          <div
                            key={link.roflIndex}
                            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">
                                {link.stats.NAME || "(sem nome)"}
                              </p>
                              <p className="text-xs text-white/45">
                                {link.stats.SKIN || "?"} ·{" "}
                                {link.stats.CHAMPIONS_KILLED}/
                                {link.stats.NUM_DEATHS}/{link.stats.ASSISTS} ·
                                time {link.stats.TEAM}
                                {link.autoMatched ? " · auto" : ""}
                              </p>
                            </div>
                            <select
                              className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white sm:max-w-[220px]"
                              value={link.playerId ?? ""}
                              onChange={(event) => {
                                const value = event.target.value;
                                setRoflLinks((prev) =>
                                  applyManualLink(
                                    prev,
                                    link.roflIndex,
                                    value ? Number(value) : null,
                                  ),
                                );
                              }}
                            >
                              <option value="">Selecionar jogador…</option>
                              {person ? (
                                <option value={person.playerId}>
                                  {person.name}
                                  {person.riotGameName
                                    ? ` (${person.riotGameName})`
                                    : ""}
                                </option>
                              ) : null}
                              {availableRoster.map((player) => (
                                <option
                                  key={player.playerId}
                                  value={player.playerId}
                                >
                                  {player.name}
                                  {player.riotGameName
                                    ? ` (${player.riotGameName})`
                                    : " — sem Riot ID"}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      onClick={handleFinishPairing}
                      disabled={roflLinks.some((l) => l.playerId == null)}
                    >
                      Continuar com pareamento
                    </Button>
                  </div>
                )}

                {step === "rofl-preview" && roflImport && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[#E6C357]/30 bg-[#E6C357]/10 px-4 py-3 text-sm text-[#FFE9A8]">
                      Importado do replay
                      {roflImport.gameVersion
                        ? ` · patch ${roflImport.gameVersion}`
                        : ""}
                      {roflImport.gameLengthMs
                        ? ` · ${Math.round(roflImport.gameLengthMs / 60000)} min`
                        : ""}
                      . Time {roflImport.winnerTeam} venceu. MVP/dud sugeridos —
                      você confirma nas próximas telas.
                    </div>
                    <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                      {roflImport.playerStats.map((stat) => {
                        const person = rosterById.get(stat.playerId);
                        return (
                          <div
                            key={stat.playerId}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                          >
                            <p className="font-medium text-white">
                              {person?.name ?? `#${stat.playerId}`}
                            </p>
                            <p className="text-xs text-white/50">
                              {stat.championName ?? "?"} · {stat.kills}/
                              {stat.deaths}/{stat.assists} · KDA{" "}
                              {kdaScore(
                                stat.kills,
                                stat.deaths,
                                stat.assists,
                              ).toFixed(2)}
                              {stat.playerId ===
                              roflImport.suggestedMvpPlayerId
                                ? " · sug. MVP"
                                : ""}
                              {stat.playerId ===
                              roflImport.suggestedDudPlayerId
                                ? " · sug. dud"
                                : ""}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <Button
                      onClick={() => {
                        setStep("mvp");
                        setErrorMessage(null);
                      }}
                    >
                      Seguir para confirmar MVP
                    </Button>
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
                      {roflImport ? " Sugestão vem do KDA do replay." : ""}
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
                          <PlayerAvatar
                            name={player.name}
                            photoUrl={player.photoUrl}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-white">
                              {player.name}
                              {roflImport?.suggestedMvpPlayerId ===
                              player.playerId
                                ? " · sugerido"
                                : ""}
                            </span>
                            <span className="text-xs text-white/50">
                              {kdaForPlayer(player.playerId)
                                ? `KDA ${kdaForPlayer(player.playerId)}`
                                : `PDLs atuais: ${player.score}`}
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
                      {roflImport ? " Sugestão vem do KDA do replay." : ""}
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
                          <PlayerAvatar
                            name={player.name}
                            photoUrl={player.photoUrl}
                            tone="danger"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-white">
                              {player.name}
                              {roflImport?.suggestedDudPlayerId ===
                              player.playerId
                                ? " · sugerido"
                                : ""}
                            </span>
                            <span className="text-xs text-white/50">
                              {kdaForPlayer(player.playerId)
                                ? `KDA ${kdaForPlayer(player.playerId)}`
                                : `PDLs atuais: ${player.score}`}
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
                        Compartilhe este link com os jogadores para votarem no
                        MVP e pior jogador:
                      </p>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={
                            (window as unknown as { votingUrl?: string })
                              .votingUrl || "Gerando..."
                          }
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
                    </div>
                  </div>
                )}

                {step === "summary" &&
                  (mode === "normal" || mode === "rofl") &&
                  winnerTeam &&
                  loserTeam &&
                  mvpPlayerId &&
                  dudPlayerId && (
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                      {roflImport ? (
                        <p className="rounded-xl border border-[#E6C357]/25 bg-[#E6C357]/10 px-3 py-2 text-[#FFE9A8]">
                          Importado do replay — campeões e KDA serão salvos.
                        </p>
                      ) : null}
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
                                (player) => player.playerId === mvpPlayerId,
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
                                (player) => player.playerId === dudPlayerId,
                              )?.name
                            }
                          </span>{" "}
                          (−10 PDLs adicionais)
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
                {step !== "summary" || mode === "normal" || mode === "rofl" ? (
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={isPending || isParsingRofl}
                  >
                    Voltar
                  </Button>
                ) : (
                  <span />
                )}

                {step === "summary" && mode === "voting" ? (
                  <Button onClick={closeDialog} className="ml-auto">
                    Fechar
                  </Button>
                ) : step === "summary" &&
                  (mode === "normal" || mode === "rofl") ? (
                  <Button onClick={handleConfirm} disabled={isPending}>
                    {isPending ? "Finalizando..." : "Confirmar resultado"}
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
