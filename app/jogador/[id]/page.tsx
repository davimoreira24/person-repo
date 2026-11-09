import { notFound } from "next/navigation";
import { getPlayerProfile } from "@/lib/queries/player-profile";
import { PlayerProfileView } from "./_components/player-profile-view";

export const dynamic = "force-dynamic";

interface PlayerProfilePageProps {
  params: { id: string };
}

export default async function PlayerProfilePage({
  params,
}: PlayerProfilePageProps) {
  const playerId = Number(params.id);
  if (Number.isNaN(playerId)) {
    notFound();
  }

  const profile = await getPlayerProfile(playerId);
  if (!profile) {
    notFound();
  }

  return <PlayerProfileView profile={profile} />;
}
