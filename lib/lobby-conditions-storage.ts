const STORAGE_KEY = "lol-team-picker:lobby-conditions";

export type PersistedLobbyConditions = {
  balanceTeams: boolean;
  improvedLanes: boolean;
};

export function readLobbyConditionsFromStorage(): PersistedLobbyConditions {
  if (typeof window === "undefined") {
    return { balanceTeams: false, improvedLanes: false };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { balanceTeams: false, improvedLanes: false };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedLobbyConditions>;
    return {
      balanceTeams: parsed.balanceTeams === true,
      improvedLanes: parsed.improvedLanes === true,
    };
  } catch {
    return { balanceTeams: false, improvedLanes: false };
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
