/**
 * Tipos e constantes partilhados — sem `lib/db` (seguro para importar em Client Components).
 */

export type GameCardPublic = {
  id: number;
  slug: string;
  title: string;
  description: string;
  /** Arte opcional (URL pública). */
  imageUrl: string | null;
};

/** Um frame da roleta (só arte; texto da carta fica na fase final / partida). */
export type RouletteSlot = {
  key: string;
  imageUrl: string | null;
};

export type CardRevealPayload = {
  card: GameCardPublic;
  rouletteSlots: RouletteSlot[];
};

/** Índice onde a carta vencedora fica na strip (sincronizar com `game-card-reveal-overlay`). */
export const ROULETTE_LAND_INDEX = 47;
