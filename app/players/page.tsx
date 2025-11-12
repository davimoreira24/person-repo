import { getPlayers } from "@/lib/queries/players";
import { PlayerForm } from "./_components/player-form";
import { PlayerSelection } from "./_components/player-selection";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const players = await getPlayers();
  const hasPlayers = players.length > 0;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-28">
      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="flex flex-col gap-6">
          {hasPlayers ? (
            <PlayerSelection players={players} />
          ) : (
            <div className="glass-panel p-10 text-center text-white/70">
              <h2 className="font-display text-2xl text-white">
                Cadastre jogadores para começar
              </h2>
              <p className="mt-2 text-sm">
                Assim que adicionar pelo menos 10 jogadores você poderá iniciar
                sorteios automáticos de equipes.
              </p>
            </div>
          )}
        </div>
        <PlayerForm />
      </div>
    </section>
  );
}

