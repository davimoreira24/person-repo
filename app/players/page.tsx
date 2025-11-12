import { getPlayers } from "@/lib/queries/players";
import { PlayerSelection } from "./_components/player-selection";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await getPlayers();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-28">
      <PlayerSelection players={players} />
    </section>
  );
}

