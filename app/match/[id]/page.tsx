import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonStyles } from "@/components/ui/button";
import { buildPoopRoastByPlayerId } from "@/lib/match/poop-roast";
import {
  getCurrentWinAndLossStreakByPlayerIds,
  getMatchById,
  getPlayers,
  type MatchWithTeams,
} from "@/lib/queries/players";
import { TeamDisplay } from "./_components/team-display";
import { CompleteMatchDialog } from "./_components/complete-match-dialog";
import { ReplayMatchButton } from "./_components/replay-match-button";
import { RankingSection } from "./_components/ranking-section";

interface MatchPageProps {
  params: { id: string };
}

const formatDateTime = (date: Date | null) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default async function MatchPage({ params }: MatchPageProps) {
  const { id } = params;
  const matchId = Number(id);

  if (Number.isNaN(matchId)) {
    notFound();
  }

  const match = await getMatchById(matchId);

  if (!match) {
    notFound();
  }

  const streakIds = [
    ...match.teams[1].map((p) => p.playerId),
    ...match.teams[2].map((p) => p.playerId),
  ];
  const { wins: winStreakMap, losses: lossStreakMap } =
    await getCurrentWinAndLossStreakByPlayerIds(streakIds);

  const matchForView: MatchWithTeams = {
    ...match,
    teams: {
      1: match.teams[1].map((p) => ({
        ...p,
        winStreak: winStreakMap.get(p.playerId) ?? 0,
        lossStreak: lossStreakMap.get(p.playerId) ?? 0,
      })),
      2: match.teams[2].map((p) => ({
        ...p,
        winStreak: winStreakMap.get(p.playerId) ?? 0,
        lossStreak: lossStreakMap.get(p.playerId) ?? 0,
      })),
    },
  };

  const poopRoastByPlayerId = buildPoopRoastByPlayerId(
    matchForView.id,
    matchForView,
  );

  const allPlayers = await getPlayers();

  const winnerPlayers = matchForView.winnerTeam
    ? matchForView.teams[matchForView.winnerTeam]
    : [];
  const loserTeam = matchForView.winnerTeam
    ? (matchForView.winnerTeam === 1 ? 2 : 1)
    : null;
  const loserPlayers = loserTeam ? matchForView.teams[loserTeam] : [];
  const mvpName = matchForView.awards.mvpPlayerId
    ? winnerPlayers.find(
        (player) => player.playerId === matchForView.awards.mvpPlayerId,
      )?.name
    : null;
  const dudName = matchForView.awards.dudPlayerId
    ? loserPlayers.find(
        (player) => player.playerId === matchForView.awards.dudPlayerId,
      )?.name
    : null;

  const ranking = allPlayers
    .slice()
    .sort((a, b) => {
      if (b.score === a.score) {
        return a.name.localeCompare(b.name);
      }
      return b.score - a.score;
    })
    .slice(0, 10);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20 pt-28">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/players"
            className={buttonStyles({
              variant: "ghost",
              size: "sm",
              className: "w-fit",
            })}
          >
            Voltar
          </Link>
          {matchForView.winnerTeam ? null : (
            <CompleteMatchDialog match={matchForView} />
          )}
        </div>
        <div>
          <span className="text-xs uppercase tracking-[0.35em] text-white/50">
            Partida #{matchForView.id}
          </span>
          <h1 className="font-display text-4xl text-white">
            Resultado dos times
          </h1>
          <p className="text-sm text-white/60">
            Criada em {formatDateTime(matchForView.createdAt)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {matchForView.gameMode === "draft" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/15 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                Draft
              </span>
            )}
            {matchForView.championsRandom && (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/45 bg-accent/15 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                Campeões aleatórios
              </span>
            )}
          </div>
          {matchForView.championsRandom && (
            <p className="text-sm text-primary/90">
              Um campeão compatível com cada rota foi sorteado automaticamente.
            </p>
          )}
          {matchForView.gameMode === "draft" && (
            <p className="text-sm text-primary/90">
              Times escolhidos por capitães; lanes sorteadas dentro de cada
              time.
            </p>
          )}
        </div>
        {matchForView.winnerTeam ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <span>
              Time vencedor:{" "}
              <span className="text-primary font-medium">
                Time {matchForView.winnerTeam}
              </span>
            </span>
            {mvpName && (
              <span>
                MVP: <span className="text-primary font-medium">{mvpName}</span>{" "}
                (+35 PDLs ao todo)
              </span>
            )}
            {dudName && (
              <span>
                Pior da partida:{" "}
                <span className="text-red-300 font-medium">{dudName}</span> (-35
                PDLs ao todo)
              </span>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {matchForView.gameMode === "draft" ? (
                <span className="text-xs text-white/55">
                  Para jogar de novo, monte uma nova lobby de Draft.
                </span>
              ) : (
                <ReplayMatchButton matchId={matchForView.id} />
              )}
              <Link
                href={
                  matchForView.gameMode === "draft"
                    ? "/players?mode=draft"
                    : "/players"
                }
                className={buttonStyles({ variant: "ghost" })}
              >
                Voltar pro lobby
              </Link>
            </div>
          </div>
        ) : (
          <CompleteMatchDialog match={matchForView} />
        )}
      </header>

      <TeamDisplay
        match={matchForView}
        poopRoastByPlayerId={poopRoastByPlayerId}
      />

      {matchForView.winnerTeam && (
        <RankingSection
          matchId={matchForView.id}
          ranking={ranking}
          mvpId={matchForView.awards.mvpPlayerId}
          dudId={matchForView.awards.dudPlayerId}
        />
      )}
    </section>
  );
}
