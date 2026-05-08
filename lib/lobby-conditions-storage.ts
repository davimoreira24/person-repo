const STORAGE_KEY = "lol-team-picker:lobby-conditions";

export type PersistedLobbyConditions = {
  balanceTeams: boolean;
  improvedLanes: boolean;
  cartasAtivas: boolean;
  /** Regra: sorteia 1 campeão por rota (Meraki). Combina com clássico ou draft. */
  championsRandom: boolean;
};

const DEFAULTS: PersistedLobbyConditions = {
  balanceTeams: false,
  improvedLanes: false,
  cartasAtivas: false,
  championsRandom: false,
};

export function readLobbyConditionsFromStorage(): PersistedLobbyConditions {
  if (typeof window === "undefined") {
    return { ...DEFAULTS };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULTS };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedLobbyConditions>;
    return {
      balanceTeams: parsed.balanceTeams === true,
      improvedLanes: parsed.improvedLanes === true,
      cartasAtivas: parsed.cartasAtivas === true,
      championsRandom: parsed.championsRandom === true,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeLobbyConditionsToStorage(
  conditions: PersistedLobbyConditions,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conditions));
  } catch {
    /* ignore quota / private mode */
  }
}
