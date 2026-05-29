import { getChallengeRevealForMatch } from "@/lib/queries/challenge";
import { Swords } from "lucide-react";

type ChallengeRevealSectionProps = {
  matchId: number;
  winnerTeam: 1 | 2;
};

export async function ChallengeRevealSection({
  matchId,
  winnerTeam,
}: ChallengeRevealSectionProps) {
  const entries = await getChallengeRevealForMatch(matchId, winnerTeam);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4 text-sm text-white/75">
      <div className="mb-3 flex items-center gap-2 text-violet-200">
        <Swords className="h-4 w-4" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">
          Desafio PDL — revelação
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li
            key={entry.playerId}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
          >
            <span className="font-medium text-white">{entry.name}</span>
            <span
              className={
                entry.pdlDelta > 0 ? "text-primary" : "text-red-300"
              }
            >
              {entry.isWinner ? "Venceu" : "Perdeu"} com desafio (
              {entry.pdlDelta > 0 ? "+" : ""}
              {entry.pdlDelta} PDL do time)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
