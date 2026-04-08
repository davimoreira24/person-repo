import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { gameCards } from "@/lib/db/schema";
import {
  ROULETTE_LAND_INDEX,
  type CardRevealPayload,
  type GameCardPublic,
  type RouletteSlot,
} from "@/lib/match/game-card-types";

export type { CardRevealPayload, GameCardPublic, RouletteSlot } from "@/lib/match/game-card-types";
export { ROULETTE_LAND_INDEX } from "@/lib/match/game-card-types";

export type GameCardRow = typeof gameCards.$inferSelect;

type PoolEntry = {
  slug: string;
  imageUrl: string | null;
};

function toPoolEntry(row: GameCardRow): PoolEntry {
  return {
    slug: row.slug,
    imageUrl: row.imageUrl ?? null,
  };
}

export function toGameCardPublic(row: GameCardRow): GameCardPublic {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl ?? null,
  };
}

export async function getActiveGameCards(): Promise<GameCardRow[]> {
  return db
    .select()
    .from(gameCards)
    .where(eq(gameCards.active, true))
    .orderBy(asc(gameCards.sortOrder), asc(gameCards.id));
}

/** Sorteia uma carta ativa (RNG criptográfico). */
export async function pickRandomActiveGameCard(): Promise<GameCardRow | null> {
  const rows = await getActiveGameCards();
  if (rows.length === 0) {
    return null;
  }
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const idx = buf[0]! % rows.length;
  return rows[idx] ?? null;
}

/**
 * Frames da roleta: fotos das cartas (pool = cartas ativas). Sem texto de nome/regra na strip.
 */
export function buildRouletteCardStrip(
  pool: PoolEntry[],
  winner: PoolEntry,
  options?: { total?: number; landIndex?: number },
): RouletteSlot[] {
  const TOTAL = options?.total ?? 56;
  const LAND_INDEX = options?.landIndex ?? ROULETTE_LAND_INDEX;

  if (pool.length === 0) {
    return Array.from({ length: TOTAL }, (_, i) => ({
      key: `fallback-${i}`,
      imageUrl: winner.imageUrl,
    }));
  }

  const strip: RouletteSlot[] = [];
  const buf = new Uint32Array(1);
  for (let i = 0; i < TOTAL; i++) {
    if (i === LAND_INDEX) {
      strip.push({
        key: `land-${winner.slug}-${i}`,
        imageUrl: winner.imageUrl,
      });
      continue;
    }
    crypto.getRandomValues(buf);
    const pick = pool[buf[0]! % pool.length]!;
    strip.push({
      key: `r-${i}-${pick.slug}-${(buf[0]! + i).toString(36)}`,
      imageUrl: pick.imageUrl,
    });
  }
  return strip;
}

export async function buildCardRevealPayload(
  winner: GameCardRow,
): Promise<CardRevealPayload> {
  const active = await getActiveGameCards();
  const pool = active.map(toPoolEntry);
  const w = toPoolEntry(winner);
  return {
    card: toGameCardPublic(winner),
    rouletteSlots: buildRouletteCardStrip(pool, w),
  };
}
