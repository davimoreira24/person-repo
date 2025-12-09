import { getPlayers } from "@/lib/queries/players";
import { RankingList } from "./_components/ranking-list";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button-styles";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RankingPage() {
  const allPlayers = await getPlayers();

  const ranking = allPlayers.slice().sort((a, b) => b.score - a.score);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-20 pt-28">
      <header className="flex flex-col gap-6">
        <Link
          href="/"
          className={buttonStyles({ variant: "ghost", className: "w-fit" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="flex flex-col gap-3">
          <h1 className="font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Ranking de Jogadores
          </h1>
          <p className="text-lg text-white/60">
            Confira os melhores jogadores ordenados por PDLs
          </p>
        </div>
      </header>

      <RankingList players={ranking} />
    </section>
  );
}
