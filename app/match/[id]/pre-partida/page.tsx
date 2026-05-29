import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonStyles } from "@/components/ui/button-styles";
import { getPreMatchLoadout } from "@/lib/queries/pre-match";
import { getChallengeStatus } from "@/lib/queries/challenge";
import { PrePartidaClient } from "./_components/pre-partida-client";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface PrePartidaPageProps {
  params: { id: string };
}

export default async function PrePartidaPage({ params }: PrePartidaPageProps) {
  const matchId = Number(params.id);
  if (Number.isNaN(matchId)) {
    notFound();
  }

  const loadout = await getPreMatchLoadout(matchId);
  if (!loadout) {
    notFound();
  }

  if (loadout.loadoutCompletedAt) {
    redirect(`/match/${matchId}`);
  }

  const challengeStatus = await getChallengeStatus(matchId);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pb-20 pt-28">
      <Link
        href="/players"
        className={buttonStyles({ variant: "ghost", className: "w-fit gap-2" })}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao lobby
      </Link>
      <PrePartidaClient
        loadout={loadout}
        challengeStatus={
          challengeStatus ?? { activeCount: 0, total: 10, locked: false }
        }
      />
    </section>
  );
}
