"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { submitVoteAction, finalizeVotingAction } from "@/app/actions/voting-actions";
import type { Player, VotingSession } from "@/lib/db/schema";
import { Trophy, ThumbsDown, Users, CheckCircle2 } from "lucide-react";
import { supabaseAnon } from "@/lib/supabase/client";

interface VotingInterfaceProps {
  session: VotingSession;
  matchId: number;
  winnerPlayers: Player[];
  loserPlayers: Player[];
  initialVoteCount: number;
  initialMvpCounts: Record<number, number>;
  initialDudCounts: Record<number, number>;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function VotingInterface({
  session,
  matchId,
  winnerPlayers,
  loserPlayers,
  initialVoteCount,
  initialMvpCounts,
  initialDudCounts,
}: VotingInterfaceProps) {
  const router = useRouter();
  const [mvpPlayerId, setMvpPlayerId] = useState<number | null>(null);
  const [dudPlayerId, setDudPlayerId] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Realtime state
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [mvpCounts, setMvpCounts] = useState(initialMvpCounts);
  const [dudCounts, setDudCounts] = useState(initialDudCounts);

  // Get or create voter token
  useEffect(() => {
    const existingToken = localStorage.getItem(`voter-${session.id}`);
    if (existingToken) {
      setHasVoted(true);
    }
  }, [session.id]);

  // Setup Realtime subscription
  useEffect(() => {
    const channel = supabaseAnon
      .channel(`voting-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `voting_session_id=eq.${session.id}`,
        },
        () => {
          // Refresh vote counts
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabaseAnon.removeChannel(channel);
    };
  }, [session.id, router]);

  const handleSubmitVote = () => {
    if (!mvpPlayerId || !dudPlayerId) {
      setErrorMessage("Selecione MVP e pior jogador antes de votar.");
      return;
    }

    if (mvpPlayerId === dudPlayerId) {
      setErrorMessage("MVP e pior jogador devem ser diferentes.");
      return;
    }

    startTransition(async () => {
      try {
        setErrorMessage(null);
        
        // Get or create voter token
        let voterToken = localStorage.getItem(`voter-${session.id}`);
        if (!voterToken) {
          voterToken = crypto.randomUUID();
          localStorage.setItem(`voter-${session.id}`, voterToken);
        }

        await submitVoteAction({
          votingSessionId: session.id,
          voterToken,
          mvpPlayerId,
          dudPlayerId,
        });

        setHasVoted(true);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro ao enviar voto."
        );
      }
    });
  };

  const handleFinalize = () => {
    startTransition(async () => {
      try {
        await finalizeVotingAction(session.id);
        router.push(`/match/${matchId}`);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erro ao finalizar votação."
        );
      }
    });
  };

  const winnerTeam = session.winnerTeam as 1 | 2;
  const isCompleted = session.status === "completed";

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 pb-20 pt-28">
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/10">
            <Users className="h-7 w-7 text-purple-400" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-display text-3xl font-bold text-white">
              Votação da Partida #{matchId}
            </h1>
            <p className="text-white/60">
              {isCompleted ? "Votação encerrada" : `Time ${winnerTeam} venceu • ${voteCount} votos`}
            </p>
          </div>
        </div>

        {isCompleted && (
          <div className="rounded-2xl border border-green-400/30 bg-green-500/10 p-4 text-sm text-green-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Esta votação já foi finalizada.</span>
            </div>
          </div>
        )}

        {!isCompleted && hasVoted && (
          <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Seu voto foi registrado! Você pode alterá-lo votando novamente.</span>
            </div>
          </div>
        )}
      </header>

      {!isCompleted && (
        <div className="grid gap-8 md:grid-cols-2">
          {/* MVP Selection */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-white">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <h2 className="font-display text-xl font-semibold">
                Vote no MVP
              </h2>
            </div>
            <p className="text-sm text-white/60">
              Quem foi o melhor jogador do time vencedor?
            </p>

            <div className="flex flex-col gap-3">
              {winnerPlayers.map((player) => (
                <motion.button
                  key={player.id}
                  type="button"
                  onClick={() => setMvpPlayerId(player.id)}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition-all ${
                    mvpPlayerId === player.id
                      ? "border-primary bg-primary/10 shadow-glow"
                      : "border-white/15 bg-white/5 hover:border-primary/50"
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {player.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={player.photoUrl}
                          alt={player.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(player.name)
                      )}
                    </div>
                    <span className="font-medium text-white">{player.name}</span>
                  </div>
                  {mvpCounts[player.id] > 0 && (
                    <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                      {mvpCounts[player.id]} {mvpCounts[player.id] === 1 ? "voto" : "votos"}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* DUD Selection */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-white">
              <ThumbsDown className="h-5 w-5 text-red-400" />
              <h2 className="font-display text-xl font-semibold">
                Vote no Pior
              </h2>
            </div>
            <p className="text-sm text-white/60">
              Quem foi o pior jogador do time perdedor?
            </p>

            <div className="flex flex-col gap-3">
              {loserPlayers.map((player) => (
                <motion.button
                  key={player.id}
                  type="button"
                  onClick={() => setDudPlayerId(player.id)}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition-all ${
                    dudPlayerId === player.id
                      ? "border-red-400 bg-red-500/10 shadow-[0_0_30px_rgba(255,120,120,0.45)]"
                      : "border-white/15 bg-white/5 hover:border-red-400/50"
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-sm font-semibold text-red-300">
                      {player.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={player.photoUrl}
                          alt={player.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        getInitials(player.name)
                      )}
                    </div>
                    <span className="font-medium text-white">{player.name}</span>
                  </div>
                  {dudCounts[player.id] > 0 && (
                    <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300">
                      {dudCounts[player.id]} {dudCounts[player.id] === 1 ? "voto" : "votos"}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-400/50 bg-red-500/15 px-4 py-3 text-sm text-red-100">
          {errorMessage}
        </div>
      )}

      {!isCompleted && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            onClick={handleSubmitVote}
            disabled={isPending || !mvpPlayerId || !dudPlayerId}
            className="sm:order-2"
          >
            {isPending ? "Enviando..." : hasVoted ? "Atualizar voto" : "Enviar voto"}
          </Button>

          <Button
            variant="outline"
            onClick={handleFinalize}
            disabled={isPending || voteCount === 0}
            className="sm:order-1 border-red-400/50 text-red-300 hover:border-red-400 hover:bg-red-500/10"
          >
            {isPending ? "Finalizando..." : "Finalizar votação"}
          </Button>
        </div>
      )}

      {isCompleted && (
        <Button
          onClick={() => router.push(`/match/${matchId}`)}
          className="w-fit"
        >
          Ver resultado da partida
        </Button>
      )}
    </section>
  );
}

