/** Campos usados do statsJson dentro do .rofl */
export type RoflPlayerStats = {
  /** Nome para exibição (NAME legado ou RIOT_ID_GAME_NAME). */
  NAME: string;
  /** Riot ID game name (campo atual do ROFL2). */
  RIOT_ID_GAME_NAME: string;
  RIOT_ID_TAG_LINE: string;
  TEAM: string;
  WIN: string;
  SKIN: string;
  CHAMPIONS_KILLED: string;
  NUM_DEATHS: string;
  ASSISTS: string;
  TOTAL_DAMAGE_DEALT_TO_CHAMPIONS?: string;
};

export type ParsedRofl = {
  gameVersion: string | null;
  gameLengthMs: number | null;
  players: RoflPlayerStats[];
};

export type MatchRosterPlayer = {
  playerId: number;
  name: string;
  team: 1 | 2;
  riotGameName: string | null;
  photoUrl?: string | null;
};

export type RoflPlayerLink = {
  roflIndex: number;
  stats: RoflPlayerStats;
  playerId: number | null;
  /** true se veio do auto-match por riotGameName */
  autoMatched: boolean;
};

export type RoflImportPlayerStat = {
  playerId: number;
  kills: number;
  deaths: number;
  assists: number;
  championKey: string | null;
  championName: string | null;
  damageToChampions: number;
  roflTeam: "100" | "200";
  won: boolean;
};

export type RoflImportResult = {
  gameVersion: string | null;
  gameLengthMs: number | null;
  winnerTeam: 1 | 2;
  suggestedMvpPlayerId: number;
  suggestedDudPlayerId: number;
  playerStats: RoflImportPlayerStat[];
};
