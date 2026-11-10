import { unstable_cache } from "next/cache";

type ChampionJson = {
  data: Record<
    string,
    {
      key: string;
      id: string;
      name: string;
      image: { full: string };
    }
  >;
};

export type ChampionMeta = {
  name: string;
  icon: string;
};

async function fetchLatestVersion(): Promise<string> {
  const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json", {
    next: { revalidate: 86_400 },
  });
  if (!res.ok) {
    throw new Error("Não foi possível obter a versão do Data Dragon.");
  }
  const versions = (await res.json()) as string[];
  const latest = versions[0];
  if (!latest) {
    throw new Error("Lista de versões do Data Dragon vazia.");
  }
  return latest;
}

/**
 * Retorna Record serializável — `unstable_cache` JSON-ifica o resultado e
 * um `Map` vira objeto plano (daí o `.get is not a function` em produção).
 */
async function fetchChampionIdRecord(): Promise<Record<string, ChampionMeta>> {
  const version = await fetchLatestVersion();
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/pt_BR/champion.json`,
    { next: { revalidate: 86_400 } },
  );
  if (!res.ok) {
    throw new Error("Não foi possível carregar campeões do Data Dragon.");
  }
  const json = (await res.json()) as ChampionJson;
  const record: Record<string, ChampionMeta> = {};
  for (const champ of Object.values(json.data)) {
    record[String(Number(champ.key))] = {
      name: champ.name,
      icon: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`,
    };
  }
  return record;
}

const getChampionIdRecord = unstable_cache(
  fetchChampionIdRecord,
  ["ddragon-champion-id-record-ptbr"],
  { revalidate: 86_400 },
);

export async function getChampionIdMap(): Promise<
  Map<number, ChampionMeta>
> {
  const record = await getChampionIdRecord();
  const map = new Map<number, ChampionMeta>();
  for (const [id, meta] of Object.entries(record)) {
    map.set(Number(id), meta);
  }
  return map;
}
