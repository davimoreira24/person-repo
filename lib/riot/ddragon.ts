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

async function fetchChampionIdMap(): Promise<
  Map<number, { name: string; icon: string }>
> {
  const version = await fetchLatestVersion();
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/pt_BR/champion.json`,
    { next: { revalidate: 86_400 } },
  );
  if (!res.ok) {
    throw new Error("Não foi possível carregar campeões do Data Dragon.");
  }
  const json = (await res.json()) as ChampionJson;
  const map = new Map<number, { name: string; icon: string }>();
  for (const champ of Object.values(json.data)) {
    const id = Number(champ.key);
    map.set(id, {
      name: champ.name,
      icon: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`,
    });
  }
  return map;
}

export const getChampionIdMap = unstable_cache(
  fetchChampionIdMap,
  ["ddragon-champion-id-map-ptbr"],
  { revalidate: 86_400 },
);
