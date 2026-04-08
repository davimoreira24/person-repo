import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonStyles } from "@/components/ui/button-styles";
import { fetchChampionCatalog } from "@/lib/lol/meraki-champions";
import {
  getChampionPlayerLeaderboards,
  getChampionWinRates,
} from "@/lib/queries/champion-analytics";
import { CampeoesAnalyticsClient } from "./_components/campeoes-analytics-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CampeoesAnalyticsPage() {
  const [catalog, leaderboards, overallRows] = await Promise.all([
    fetchChampionCatalog(),
    getChampionPlayerLeaderboards(),
    getChampionWinRates(),
  ]);

  const champions = Object.values(catalog)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
    .map((c) => ({
      key: c.key,
      name: c.name,
      icon: c.icon,
      positions: [...c.positions],
    }));

  const overallByKey = Object.fromEntries(
    overallRows.map((r) => [
      r.championKey,
      { wins: r.wins, games: r.games, winRate: r.winRate },
    ]),
  );

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-24 pt-28">
      <header className="flex flex-col gap-6">
        <Link
          href="/players"
          className={buttonStyles({ variant: "ghost", className: "w-fit" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Lobby
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
            Campeões
          </h1>
          <p className="max-w-2xl text-white/60">
            Catálogo do snapshot Meraki (rotas oficiais). Toque em um campeão
            para ver o ranking de jogadores por win rate com ele — apenas
            partidas modo aleatório encerradas contam.
          </p>
        </div>
      </header>

      <CampeoesAnalyticsClient
        champions={champions}
        leaderboards={leaderboards}
        overallByKey={overallByKey}
      />
    </section>
  );
}
