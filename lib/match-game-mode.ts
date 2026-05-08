export const MATCH_GAME_CLASSIC = "classic" as const;
export const MATCH_GAME_DRAFT = "draft" as const;
/** Legado — antes da regra "championsRandom" existir como coluna. Mantido só para leitura. */
export const MATCH_GAME_RANDOM_CHAMPIONS = "random_champions" as const;

export type MatchGameMode =
  | typeof MATCH_GAME_CLASSIC
  | typeof MATCH_GAME_DRAFT
  | typeof MATCH_GAME_RANDOM_CHAMPIONS;

/**
 * Considera a regra `champions_random` (nova) e o legado `game_mode='random_champions'`
 * como equivalentes para fins de exibição/analytics.
 */
export function hasRandomChampions(input: {
  gameMode?: string | null;
  championsRandom?: boolean | null;
}): boolean {
  if (input.championsRandom) return true;
  return input.gameMode === MATCH_GAME_RANDOM_CHAMPIONS;
}
