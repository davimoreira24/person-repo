import { getPlayers } from "@/lib/queries/players";
import { isRandomOnlyLobbyPeriod } from "@/lib/random-only-lobby-window";
import {
  PlayerSelection,
  type PlayerSelectionMode,
} from "./_components/player-selection";

export const dynamic = "force-dynamic";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: { mode?: string };
}) {
  const players = await getPlayers();
  const requested = searchParams.mode;
  // O legado `mode=random` agora cai em "clássico" (a regra de campeões mora em Condições).
  const playMode: PlayerSelectionMode =
    requested === "draft" ? "draft" : "classic";
  const randomOnlyWeekend = isRandomOnlyLobbyPeriod();

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
