"use client";

import Image from "next/image";
import {
  getPlayerRiotIdLabel,
  getPlayerSoloRankLabel,
  getPlayerSoloWinrateLabel,
  type PlayerRiotDisplay,
} from "@/lib/riot/display";

type PlayerRiotStatsProps = {
  player: PlayerRiotDisplay;
  compact?: boolean;
};

export function PlayerRiotStats({ player, compact = false }: PlayerRiotStatsProps) {
  const riotId = getPlayerRiotIdLabel(player);
  const soloRank = getPlayerSoloRankLabel(player);
  const winrate = getPlayerSoloWinrateLabel(player);
  const champs = player.riotTopChampions ?? [];

  if (!riotId) {
    return (
      <p className="text-[11px] text-white/35">Riot ID não vinculado</p>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-0.5 text-[11px] text-white/50">
        <span className="truncate text-white/65">{riotId}</span>
        {soloRank ? <span className="text-primary/90">{soloRank}</span> : null}
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
      <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-white/45">
        Conta Riot
      </p>
      <div className="flex flex-col items-center gap-2 text-sm">
        <span className="font-medium text-white/90">{riotId}</span>
        {soloRank ? (
          <span className="text-primary">{soloRank}</span>
        ) : (
          <span className="text-white/40">Sem elo Solo/Duo</span>
        )}
        {winrate ? (
          <span className="text-xs text-white/55">
            Winrate Solo/Duo: {winrate}
          </span>
        ) : null}
      </div>

      {champs.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-center text-[10px] uppercase tracking-wide text-white/40">
            Top mastery
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {champs.map((c) => (
              <div
                key={c.championId}
                className="flex w-[56px] flex-col items-center gap-1"
                title={`${c.name} · Nv.${c.level}`}
              >
                {c.icon ? (
                  <Image
                    src={c.icon}
                    alt={c.name}
                    width={40}
                    height={40}
                    className="rounded-lg border border-white/15"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-[10px] text-white/50">
                    ?
                  </div>
                )}
                <span className="truncate text-[9px] text-white/55">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
