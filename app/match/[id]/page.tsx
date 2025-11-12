import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonStyles } from "@/components/ui/button";
import { getMatchById } from "@/lib/queries/players";
import { TeamDisplay } from "./_components/team-display";
import { CompleteMatchDialog } from "./_components/complete-match-dialog";

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

  const winnerPlayers = match.winnerTeam ? match.teams[match.winnerTeam] : [];
  const loserTeam = match.winnerTeam ? (match.winnerTeam === 1 ? 2 : 1) : null;
  const loserPlayers = loserTeam ? match.teams[loserTeam] : [];
  const mvpName = match.awards.mvpPlayerId
    ? winnerPlayers.find(
        (player) => player.playerId === match.awards.mvpPlayerId
      )?.name
    : null;
  const dudName = match.awards.dudPlayerId
    ? loserPlayers.find(
        (player) => player.playerId === match.awards.dudPlayerId
      )?.name
    : null;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20 pt-28">
      <header className="flex flex-col gap-4">
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
        <div>
          <span className="text-xs uppercase tracking-[0.35em] text-white/50">
            Partida #{match.id}
          </span>
          <h1 className="font-display text-4xl text-white">
            Resultado dos times
          </h1>
          <p className="text-sm text-white/60">
            Criada em {formatDateTime(match.createdAt)}
          </p>
        </div>
        {!match.winnerTeam ? (
          <CompleteMatchDialog match={match} />
        ) : (
          <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <span>
              Time vencedor:{" "}
              <span className="text-primary font-medium">
                Time {match.winnerTeam}
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
          </div>
        )}
      </header>

      <TeamDisplay match={match} />
    </section>
  );
}
