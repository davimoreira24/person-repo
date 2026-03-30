import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonStyles } from "@/components/ui/button-styles";
import { ResetSeasonForm } from "./_components/reset-season-form";

export const dynamic = "force-dynamic";

export default function ReiniciarSeasonPage() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-20 pt-28">
      <Link
        href="/"
        className={buttonStyles({ variant: "ghost", className: "w-fit" })}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl font-bold tracking-tight text-white">
          Reiniciar season
        </h1>
        <p className="text-white/65">
          Apaga todo o histórico de partidas (incluindo votos e sessões de
          votação), remove prêmios registrados e zera os PDLs de todos os
          jogadores. Nomes, fotos e IDs dos jogadores são mantidos.
        </p>
        <p className="text-sm text-amber-200/90">
          Ação irreversível. Em produção, defina{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-white/80">
            SEASON_RESET_SECRET
          </code>{" "}
          no ambiente e use o campo token abaixo para evitar resets acidentais.
        </p>
      </header>

      <ResetSeasonForm />
    </section>
  );
}
