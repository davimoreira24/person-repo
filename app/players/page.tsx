import { getPlayers } from "@/lib/queries/players";
import { isRandomOnlyLobbyPeriod } from "@/lib/random-only-lobby-window";
import { PlayerSelection } from "./_components/player-selection";

export const dynamic = "force-dynamic";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const players = await getPlayers();
  const randomOnlyWeekend = isRandomOnlyLobbyPeriod();
  const requestedMode = searchParams.mode === "random" ? "random" : "classic";
  const playMode = randomOnlyWeekend ? "random" : requestedMode;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-28">
      <PlayerSelection
        players={players}
        playMode={playMode}
        randomOnlyWeekend={randomOnlyWeekend}
      />
    </section>
  );
}

