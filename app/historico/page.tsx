import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { buttonStyles } from "@/components/ui/button-styles";
import { getCompletedMatchesHistory } from "@/lib/queries/players";
import { MatchHistoryList } from "./_components/match-history-list";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HistoricoPage() {
  const entries = await getCompletedMatchesHistory();

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-20 pt-28">
      <header className="flex flex-col gap-6">
        <Link
          href="/"
          className={buttonStyles({ variant: "ghost", className: "w-fit" })}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <History className="h-10 w-10 text-accent/90 sm:h-12 sm:w-12" />
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Histórico de partidas
            </h1>
          </div>
          <p className="text-lg text-white/60">
            Partidas encerradas, times, MVP e pior da partida — da mais recente
            para a mais antiga.
          </p>
        </div>
      </header>

      <MatchHistoryList entries={entries} />
    </section>
  );
}
