/**
 * Promo temporária: fim de semana 10–12 abr 2026 (sexta–domingo), até 23:59:59 em
 * Europe/Lisboa. O modo clássico **puro** fica em pausa nesse período: para jogar
 * clássico, é obrigatório ligar a regra "Campeões aleatórios". O modo Draft fica
 * livre, com ou sem a regra.
 */
const TIME_ZONE = "Europe/Lisbon";

function lisbonCalendarParts(date: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const n = (type: Intl.DateTimeFormatPart["type"]) =>
    Number(parts.find((p) => p.type === type)?.value ?? NaN);

  return {
    year: n("year"),
    month: n("month"),
    day: n("day"),
    hour: n("hour"),
    minute: n("minute"),
    second: n("second"),
  };
}

export function isRandomOnlyLobbyPeriod(date: Date = new Date()): boolean {
  const { year, month, day, hour, minute, second } = lisbonCalendarParts(date);

  if (year !== 2026 || month !== 4) {
    return false;
  }
  if (day < 10 || day > 12) {
    return false;
  }

  if (day === 12) {
    if (hour > 23) {
      return false;
    }
    if (hour === 23 && minute > 59) {
      return false;
    }
    if (hour === 23 && minute === 59 && second > 59) {
      return false;
    }
  }

  return true;
}
