/** Dados de campeões com rota (Meraki Analytics, derivado do jogo). */

import { unstable_cache } from "next/cache";

export const MERAKI_CHAMPIONS_URL =
  "https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions.json";

export type MerakiLane =
  | "TOP"
  | "JUNGLE"
  | "MIDDLE"
  | "BOTTOM"
  | "SUPPORT";

/** Ordem das lanes por time (igual ao card: topo → sup). */
export const LANE_ORDER: MerakiLane[] = [
  "TOP",
  "JUNGLE",
  "MIDDLE",
  "BOTTOM",
  "SUPPORT",
];

export type ChampionPick = { key: string; name: string };

export type ChampionCatalogEntry = {
  key: string;
  name: string;
  positions: MerakiLane[];
  /** URL do splash/quadrado do campeão (Meraki → Data Dragon). */
  icon: string | null;
};

export function normalizeChampionIconUrl(raw: string | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith("http://")) {
    return `https://${t.slice("http://".length)}`;
  }
  return t;
}

function biasedRandomIndex(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const maxValid = Math.floor(0xffffffff / max) * max;
  let v = buf[0]!;
  while (v >= maxValid) {
    crypto.getRandomValues(buf);
    v = buf[0]!;
  }
  return v % max;
}

/**
 * O JSON da Meraki passa de 2MB; o Next.js não permite cachear respostas `fetch`
 * acima desse limite. Buscamos sem cache de `fetch` e aplicamos `unstable_cache`
 * só no objeto já filtrado (bem menor), com revalidação de 24h.
 */
async function buildChampionCatalog(): Promise<
  Record<string, ChampionCatalogEntry>
> {
  const res = await fetch(MERAKI_CHAMPIONS_URL, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Falha ao carregar campeões (Meraki): ${res.status} ${res.statusText}`,
    );
  }

  const raw = (await res.json()) as Record<
    string,
    { name?: string; positions?: string[]; icon?: string }
  >;

  const out: Record<string, ChampionCatalogEntry> = {};

  for (const [key, v] of Object.entries(raw)) {
    const positions = (v.positions ?? []).filter((p): p is MerakiLane =>
      ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "SUPPORT"].includes(p),
    );
    if (positions.length === 0) {
      continue;
    }
    out[key] = {
      key,
      name: v.name ?? key,
      positions,
      icon: normalizeChampionIconUrl(v.icon),
    };
  }

  return out;
}

const getCachedChampionCatalog = unstable_cache(
  buildChampionCatalog,
  ["meraki-champion-catalog"],
  { revalidate: 86400 },
);

export async function fetchChampionCatalog(): Promise<
  Record<string, ChampionCatalogEntry>
> {
  return getCachedChampionCatalog();
}

/**
 * Dez campeões únicos, um por lane por time (TOP→SUP duas vezes).
 * Se esgotar o pool com unicidade, permite repetir na mesma rota.
 */
export function pickRandomChampionsForMatch(
  catalog: Record<string, ChampionCatalogEntry>,
): ChampionPick[] {
  const lanes: MerakiLane[] = [...LANE_ORDER, ...LANE_ORDER];
  const usedKeys = new Set<string>();
  const picks: ChampionPick[] = [];

  for (const lane of lanes) {
    const withLane = Object.values(catalog).filter((c) =>
      c.positions.includes(lane),
    );

    const unused = withLane.filter((c) => !usedKeys.has(c.key));
    const pool = unused.length > 0 ? unused : withLane;

    if (pool.length === 0) {
      throw new Error(`Nenhum campeão disponível para a rota ${lane}.`);
    }

    const choice = pool[biasedRandomIndex(pool.length)]!;
    usedKeys.add(choice.key);
    picks.push({ key: choice.key, name: choice.name });
  }

  return picks;
}

/** Sorteia 1 campeão compatível com a rota, evitando `usedKeys` quando possível. */
export function pickRandomChampionForLane(
  catalog: Record<string, ChampionCatalogEntry>,
  lane: MerakiLane,
  usedKeys: ReadonlySet<string>,
): ChampionPick {
  const withLane = Object.values(catalog).filter((c) =>
    c.positions.includes(lane),
  );

  const unused = withLane.filter((c) => !usedKeys.has(c.key));
  const pool = unused.length > 0 ? unused : withLane;

  if (pool.length === 0) {
    throw new Error(`Nenhum campeão disponível para a rota ${lane}.`);
  }

  const choice = pool[biasedRandomIndex(pool.length)]!;
  return { key: choice.key, name: choice.name };
}

/**
 * Atribui campeões às posições Bravura (índice 0–9 = lane por ordem do card).
 * Respeita campeões já definidos (ex.: regra global) para unicidade.
 */
export function assignBravuraChampionsBySlotIndex(
  catalog: Record<string, ChampionCatalogEntry>,
  bravuraSlotIndexes: number[],
  existingKeysBySlot: ReadonlyArray<string | null | undefined>,
): Map<number, ChampionPick> {
  const usedKeys = new Set<string>();
  for (const key of existingKeysBySlot) {
    if (key) usedKeys.add(key);
  }

  const lanes: MerakiLane[] = [...LANE_ORDER, ...LANE_ORDER];
  const result = new Map<number, ChampionPick>();

  for (const slotIndex of bravuraSlotIndexes) {
    if (slotIndex < 0 || slotIndex > 9) continue;
    const lane = lanes[slotIndex]!;
    const pick = pickRandomChampionForLane(catalog, lane, usedKeys);
    usedKeys.add(pick.key);
    result.set(slotIndex, pick);
  }

  return result;
}
