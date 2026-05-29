import { notFound } from "next/navigation";
import { getChallengeByToken } from "@/lib/queries/challenge";
import { ChallengeClient } from "./_components/challenge-client";

export const dynamic = "force-dynamic";

interface ChallengePageProps {
  params: { id: string; token: string };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const matchId = Number(params.id);
  if (Number.isNaN(matchId)) {
    notFound();
  }

  const challenge = await getChallengeByToken(params.token);
  if (!challenge || challenge.matchId !== matchId) {
    notFound();
  }

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-6 pb-20 pt-28">
      <ChallengeClient challenge={challenge} token={params.token} />
    </section>
  );
}
