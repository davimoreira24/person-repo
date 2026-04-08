const STORAGE_KEY = "lol-team-picker:lobby-conditions";

export type PersistedLobbyConditions = {
  balanceTeams: boolean;
  improvedLanes: boolean;
  cartasAtivas: boolean;
};

export function readLobbyConditionsFromStorage(): PersistedLobbyConditions {
  if (typeof window === "undefined") {
    return {
      balanceTeams: false,
      improvedLanes: false,
      cartasAtivas: false,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        balanceTeams: false,
        improvedLanes: false,
        cartasAtivas: false,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedLobbyConditions>;
    return {
      balanceTeams: parsed.balanceTeams === true,
      improvedLanes: parsed.improvedLanes === true,
      cartasAtivas: parsed.cartasAtivas === true,
    };
  } catch {
    return {
      balanceTeams: false,
      improvedLanes: false,
      cartasAtivas: false,
    };
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
