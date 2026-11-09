import {
  formatRiotId,
  formatSoloRank,
  soloWinrate,
} from "@/lib/riot/client";

export type PlayerRiotDisplay = {
  riotGameName: string | null;
  riotTagLine: string | null;
  riotSoloTier: string | null;
  riotSoloRank: string | null;
  riotSoloLp: number | null;
  riotSoloWins: number | null;
  riotSoloLosses: number | null;
  riotTopChampions: Array<{
    championId: number;
    name: string;
    level: number;
    points: number;
    icon: string | null;
  }> | null;
  riotStatsSyncedAt: Date | null;
};

export function getPlayerRiotIdLabel(player: PlayerRiotDisplay): string | null {
  if (!player.riotGameName || !player.riotTagLine) return null;
  return formatRiotId(player.riotGameName, player.riotTagLine);
}

export function getPlayerSoloRankLabel(player: PlayerRiotDisplay): string | null {
  return formatSoloRank(
    player.riotSoloTier,
    player.riotSoloRank,
    player.riotSoloLp,
  );
}

export function getPlayerSoloWinrateLabel(
  player: PlayerRiotDisplay,
): string | null {
  const wr = soloWinrate(player.riotSoloWins, player.riotSoloLosses);
  if (wr == null || player.riotSoloWins == null || player.riotSoloLosses == null) {
    return null;
  }
  return `${wr}% (${player.riotSoloWins}V / ${player.riotSoloLosses}D)`;
}
