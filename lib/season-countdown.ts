/** Fuso da Person (Brasília). */
export const SEASON_TIME_ZONE = "America/Sao_Paulo";

/** 28/05/2026 23:59:59,999 — fim da Person (Brasília, UTC−3). */
export const SEASON_END_MS = Date.parse("2026-05-28T23:59:59.999-03:00");

export type SeasonCountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
};

export function getSeasonCountdownParts(
  nowMs: number = Date.now(),
): SeasonCountdownParts {
  const remainingMs = SEASON_END_MS - nowMs;
  if (remainingMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  }

  const totalSec = Math.floor(remainingMs / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    ended: false,
  };
}

export const SEASON_END_LABEL = "28 de maio de 2026, 23h59 (Horário de Brasília)";
