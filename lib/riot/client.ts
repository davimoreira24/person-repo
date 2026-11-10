import { getRiotApiKey, getRiotPlatform, getRiotRegion } from "@/lib/riot/config";
import { getChampionIdMap } from "@/lib/riot/ddragon";

export type RiotTopChampion = {
  championId: number;
  name: string;
  level: number;
  points: number;
  icon: string | null;
};

export type RiotPlayerSnapshot = {
  gameName: string;
  tagLine: string;
  puuid: string;
  platform: string;
  region: string;
  soloTier: string | null;
  soloRank: string | null;
  soloLp: number | null;
  soloWins: number | null;
  soloLosses: number | null;
  topChampions: RiotTopChampion[];
};

type AccountDto = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

type LeagueEntryDto = {
  queueType: string;
  tier?: string;
  rank?: string;
  leaguePoints?: number;
  wins?: number;
  losses?: number;
};

type MasteryDto = {
  championId: number;
  championLevel: number;
  championPoints: number;
};

async function riotFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "X-Riot-Token": getRiotApiKey(),
    },
    cache: "no-store",
  });

  if (res.status === 404) {
    throw new Error("Conta Riot não encontrada. Confira Nome#TAG e a região.");
  }
  if (res.status === 429) {
    throw new Error("Limite da API Riot atingido. Tente de novo em instantes.");
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "API key Riot inválida ou sem permissão. Confira RIOT_API_KEY no servidor.",
    );
  }
  if (!res.ok) {
    throw new Error(`Erro Riot API (${res.status}). Tente novamente.`);
  }

  return (await res.json()) as T;
}

export function parseRiotIdInput(raw: string): {
  gameName: string;
  tagLine: string;
} {
  const trimmed = raw.trim();
  const hash = trimmed.lastIndexOf("#");
  if (hash <= 0 || hash === trimmed.length - 1) {
    throw new Error("Informe o Riot ID no formato Nome#TAG (ex.: Faker#KR1).");
  }
  const gameName = trimmed.slice(0, hash).trim();
  const tagLine = trimmed.slice(hash + 1).trim();
  if (gameName.length < 3 || tagLine.length < 2) {
    throw new Error("Riot ID inválido. Use Nome#TAG.");
  }
  return { gameName, tagLine };
}

export function formatRiotId(gameName: string, tagLine: string): string {
  return `${gameName}#${tagLine}`;
}

const TIER_PT: Record<string, string> = {
  IRON: "Ferro",
  BRONZE: "Bronze",
  SILVER: "Prata",
  GOLD: "Ouro",
  PLATINUM: "Platina",
  EMERALD: "Esmeralda",
  DIAMOND: "Diamante",
  MASTER: "Mestre",
  GRANDMASTER: "Grão-Mestre",
  CHALLENGER: "Desafiante",
};

/** League-v4 devolve tier/rank em inglês; traduzimos só na UI. */
export function formatSoloRank(
  tier: string | null | undefined,
  rank: string | null | undefined,
  lp: number | null | undefined,
): string | null {
  if (!tier) return null;
  const tierPt = TIER_PT[tier.toUpperCase()] ?? tier;
  const apex =
    tier === "MASTER" || tier === "GRANDMASTER" || tier === "CHALLENGER";
  if (apex) {
    return lp != null ? `${tierPt} · ${lp} LP` : tierPt;
  }
  if (!rank) return tierPt;
  return lp != null ? `${tierPt} ${rank} · ${lp} LP` : `${tierPt} ${rank}`;
}

export function soloWinrate(wins: number | null, losses: number | null): number | null {
  if (wins == null || losses == null) return null;
  const total = wins + losses;
  if (total <= 0) return null;
  return Math.round((wins / total) * 1000) / 10;
}

async function softFetch<T>(label: string, url: string): Promise<T | null> {
  try {
    return await riotFetch<T>(url);
  } catch (error) {
    console.error(`[riot] ${label} falhou:`, error);
    return null;
  }
}

/** Busca conta + elo Solo/Duo + top masteries. Conta é obrigatória; resto é best-effort. */
export async function fetchRiotPlayerSnapshot(input: {
  gameName: string;
  tagLine: string;
  platform?: string;
  region?: string;
}): Promise<RiotPlayerSnapshot> {
  const platform = (input.platform ?? getRiotPlatform()).toLowerCase();
  const region = (input.region ?? getRiotRegion()).toLowerCase();
  const gameName = encodeURIComponent(input.gameName);
  const tagLine = encodeURIComponent(input.tagLine);

  const account = await riotFetch<AccountDto>(
    `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
  );

  const [entries, masteries, champMap] = await Promise.all([
    softFetch<LeagueEntryDto[]>(
      "league-v4",
      `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${account.puuid}`,
    ),
    softFetch<MasteryDto[]>(
      "champion-mastery-v4",
      `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${account.puuid}/top?count=5`,
    ),
    getChampionIdMap().catch((error) => {
      console.error("[riot] ddragon falhou:", error);
      return new Map<number, { name: string; icon: string }>();
    }),
  ]);

  const solo =
    entries?.find((e) => e.queueType === "RANKED_SOLO_5x5") ?? null;

  const topChampions: RiotTopChampion[] = (masteries ?? []).map((m) => {
    const meta = champMap.get(m.championId);
    return {
      championId: m.championId,
      name: meta?.name ?? `Champ ${m.championId}`,
      level: m.championLevel,
      points: m.championPoints,
      icon: meta?.icon ?? null,
    };
  });

  return {
    gameName: account.gameName,
    tagLine: account.tagLine,
    puuid: account.puuid,
    platform,
    region,
    soloTier: solo?.tier ?? null,
    soloRank: solo?.rank ?? null,
    soloLp: solo?.leaguePoints ?? null,
    soloWins: solo?.wins ?? null,
    soloLosses: solo?.losses ?? null,
    topChampions,
  };
}
