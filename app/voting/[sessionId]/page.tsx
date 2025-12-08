import { getVotingSessionAction } from "@/app/actions/voting-actions";
import { VotingInterface } from "./_components/voting-interface";
import { notFound } from "next/navigation";

interface VotingPageProps {
  params: { sessionId: string };
}

export default async function VotingPage({ params }: VotingPageProps) {
  const data = await getVotingSessionAction(params.sessionId);

  if (!data) {
    notFound();
  }

  const { session, match, voteCount, mvpCounts, dudCounts } = data;

  // Separate players by team
  const winnerTeam = session.winnerTeam as 1 | 2;
  const loserTeam = winnerTeam === 1 ? 2 : 1;

  const matchPlayers: any[] = match?.matchPlayers || [];
  const winnerPlayers = matchPlayers
    .filter((mp) => mp.team === winnerTeam)
    .map((mp) => mp.player);

  const loserPlayers = matchPlayers
    .filter((mp) => mp.team === loserTeam)
    .map((mp) => mp.player);

  return (
    <VotingInterface
      session={session}
      matchId={match.id}
      winnerPlayers={winnerPlayers}
      loserPlayers={loserPlayers}
      initialVoteCount={voteCount}
      initialMvpCounts={mvpCounts}
      initialDudCounts={dudCounts}
    />
  );
}

