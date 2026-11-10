import type {
  MatchRosterPlayer,
  ParsedRofl,
  RoflImportPlayerStat,
  RoflImportResult,
  RoflPlayerLink,
  RoflPlayerStats,
} from "./types";

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export function parseIntStat(value: string | undefined): number {
  const n = Number.parseInt(value ?? "0", 10);
  return Number.isFinite(n) ? n : 0;
}

export function kdaScore(kills: number, deaths: number, assists: number) {
  return (kills + assists) / Math.max(1, deaths);
}

export function championFromSkin(skin: string): {
  championKey: string | null;
  championName: string | null;
} {
  const trimmed = skin.trim();
  if (!trimmed) {
    return { championKey: null, championName: null };
  }
  // SKIN costuma ser o id interno (ex.: "MonkeyKing") ou nome do campeão.
  return { championKey: trimmed.slice(0, 48), championName: trimmed.slice(0, 80) };
}

/**
 * Casa statsJson.NAME com riotGameName (case-insensitive).
 * Retorna links; playerId null = precisa pareamento manual.
 */
export function autoLinkRoflPlayers(
  roflPlayers: RoflPlayerStats[],
  roster: MatchRosterPlayer[],
): RoflPlayerLink[] {
  const usedPlayerIds = new Set<number>();
  const byRiotName = new Map<string, MatchRosterPlayer>();

  for (const player of roster) {
    if (!player.riotGameName?.trim()) continue;
    byRiotName.set(normalizeName(player.riotGameName), player);
  }

  return roflPlayers.map((stats, roflIndex) => {
    const hit = byRiotName.get(normalizeName(stats.NAME));
    if (hit && !usedPlayerIds.has(hit.playerId)) {
      usedPlayerIds.add(hit.playerId);
      return {
        roflIndex,
        stats,
        playerId: hit.playerId,
        autoMatched: true,
      };
    }
    return {
      roflIndex,
      stats,
      playerId: null,
      autoMatched: false,
    };
  });
}

export function applyManualLink(
  links: RoflPlayerLink[],
  roflIndex: number,
  playerId: number | null,
): RoflPlayerLink[] {
  return links.map((link) => {
    if (link.roflIndex === roflIndex) {
      return { ...link, playerId, autoMatched: false };
    }
    // Impede o mesmo Person player em dois slots
    if (playerId != null && link.playerId === playerId) {
      return { ...link, playerId: null, autoMatched: false };
    }
    return link;
  });
}

function mapRoflTeamToPersonTeam(
  links: RoflPlayerLink[],
  rosterById: Map<number, MatchRosterPlayer>,
): Map<"100" | "200", 1 | 2> {
  const votes: Record<"100" | "200", { 1: number; 2: number }> = {
    "100": { 1: 0, 2: 0 },
    "200": { 1: 0, 2: 0 },
  };

  for (const link of links) {
    if (link.playerId == null) continue;
    const roster = rosterById.get(link.playerId);
    if (!roster) continue;
    const roflTeam = link.stats.TEAM === "200" ? "200" : "100";
    votes[roflTeam][roster.team] += 1;
  }

  const map = new Map<"100" | "200", 1 | 2>();
  for (const side of ["100", "200"] as const) {
    map.set(side, votes[side][1] >= votes[side][2] ? 1 : 2);
  }

  // Garante lados distintos quando possível
  if (map.get("100") === map.get("200")) {
    map.set("100", 1);
    map.set("200", 2);
  }

  return map;
}

/**
 * Constrói o resultado do import a partir dos links completos (10/10).
 */
export function buildRoflImportResult(
  parsed: ParsedRofl,
  links: RoflPlayerLink[],
  roster: MatchRosterPlayer[],
): RoflImportResult {
  if (links.length !== 10) {
    throw new Error("O replay precisa ter exatamente 10 jogadores.");
  }
  if (links.some((link) => link.playerId == null)) {
    throw new Error("Pareie todos os jogadores antes de continuar.");
  }

  const rosterById = new Map(roster.map((p) => [p.playerId, p]));
  const linkedIds = new Set(links.map((l) => l.playerId!));
  if (linkedIds.size !== 10) {
    throw new Error("Cada jogador da Person precisa aparecer uma vez no replay.");
  }
  for (const player of roster) {
    if (!linkedIds.has(player.playerId)) {
      throw new Error(`Falta parear o jogador ${player.name}.`);
    }
  }

  const sideMap = mapRoflTeamToPersonTeam(links, rosterById);

  const playerStats: RoflImportPlayerStat[] = links.map((link) => {
    const kills = parseIntStat(link.stats.CHAMPIONS_KILLED);
    const deaths = parseIntStat(link.stats.NUM_DEATHS);
    const assists = parseIntStat(link.stats.ASSISTS);
    const damageToChampions = parseIntStat(
      link.stats.TOTAL_DAMAGE_DEALT_TO_CHAMPIONS,
    );
    const champ = championFromSkin(link.stats.SKIN);
    const roflTeam = link.stats.TEAM === "200" ? "200" : "100";
    const won = link.stats.WIN.toLowerCase() === "win";

    return {
      playerId: link.playerId!,
      kills,
      deaths,
      assists,
      championKey: champ.championKey,
      championName: champ.championName,
      damageToChampions,
      roflTeam,
      won,
    };
  });

  const winningRoflSide = playerStats.find((p) => p.won)?.roflTeam ?? "100";
  const winnerTeam = sideMap.get(winningRoflSide) ?? 1;
  const loserTeam = winnerTeam === 1 ? 2 : 1;

  const winners = playerStats.filter((p) => {
    const personTeam = rosterById.get(p.playerId)?.team;
    return personTeam === winnerTeam;
  });
  const losers = playerStats.filter((p) => {
    const personTeam = rosterById.get(p.playerId)?.team;
    return personTeam === loserTeam;
  });

  if (winners.length === 0 || losers.length === 0) {
    throw new Error(
      "Não foi possível mapear times do replay para os times da Person.",
    );
  }

  const rankDesc = (a: RoflImportPlayerStat, b: RoflImportPlayerStat) => {
    const scoreA = kdaScore(a.kills, a.deaths, a.assists);
    const scoreB = kdaScore(b.kills, b.deaths, b.assists);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.damageToChampions - a.damageToChampions;
  };

  const sortedWinners = [...winners].sort(rankDesc);
  const sortedLosers = [...losers].sort(rankDesc);

  return {
    gameVersion: parsed.gameVersion,
    gameLengthMs: parsed.gameLengthMs,
    winnerTeam,
    suggestedMvpPlayerId: sortedWinners[0]!.playerId,
    suggestedDudPlayerId: sortedLosers[sortedLosers.length - 1]!.playerId,
    playerStats,
  };
}
