export function getRiotApiKey(): string {
  const key = process.env.RIOT_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "RIOT_API_KEY não configurada. Coloque a production key no .env.local (só no servidor).",
    );
  }
  return key;
}

/** Plataforma do summoner — default BR. */
export function getRiotPlatform(): string {
  return (process.env.RIOT_PLATFORM ?? "br1").trim().toLowerCase();
}

/** Cluster regional (account/match) — BR/NA/LAN/LAS → americas. */
export function getRiotRegion(): string {
  return (process.env.RIOT_REGION ?? "americas").trim().toLowerCase();
}
