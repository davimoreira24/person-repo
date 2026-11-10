import type { ParsedRofl, RoflPlayerStats } from "./types";

const ROFL_SIGNATURE = [0x52, 0x49, 0x4f, 0x54, 0x00, 0x00]; // RIOT\x00\x00
const ROFL2_SIGNATURE = [0x52, 0x49, 0x4f, 0x54, 0x02, 0x00]; // RIOT\x02\x00

function bytesEqual(a: Uint8Array, b: number[]) {
  if (a.length < b.length) return false;
  return b.every((v, i) => a[i] === v);
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes);
}

function readU32LE(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

function asStatString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function pickStat(
  raw: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const value = asStatString(raw[key]);
    if (value) return value;
  }
  // fallback case-insensitive (alguns dumps variam casing)
  const lowerMap = new Map(
    Object.entries(raw).map(([k, v]) => [k.toLowerCase(), v]),
  );
  for (const key of keys) {
    const value = asStatString(lowerMap.get(key.toLowerCase()));
    if (value) return value;
  }
  return "";
}

function normalizePlayer(raw: Record<string, unknown>): RoflPlayerStats {
  const riotGameName = pickStat(raw, "RIOT_ID_GAME_NAME");
  const riotTagLine = pickStat(raw, "RIOT_ID_TAG_LINE");
  // No ROFL2 o NAME costuma vir vazio; o nick real está em RIOT_ID_GAME_NAME.
  const name = pickStat(raw, "NAME", "RIOT_ID_GAME_NAME");

  return {
    NAME: name,
    RIOT_ID_GAME_NAME: riotGameName || name,
    RIOT_ID_TAG_LINE: riotTagLine,
    TEAM: pickStat(raw, "TEAM"),
    WIN: pickStat(raw, "WIN"),
    SKIN: pickStat(raw, "SKIN"),
    CHAMPIONS_KILLED: pickStat(raw, "CHAMPIONS_KILLED"),
    NUM_DEATHS: pickStat(raw, "NUM_DEATHS"),
    ASSISTS: pickStat(raw, "ASSISTS"),
    TOTAL_DAMAGE_DEALT_TO_CHAMPIONS: pickStat(
      raw,
      "TOTAL_DAMAGE_DEALT_TO_CHAMPIONS",
    ),
  };
}

function parseStatsJson(statsJson: unknown): RoflPlayerStats[] {
  const parsed =
    typeof statsJson === "string" ? (JSON.parse(statsJson) as unknown) : statsJson;

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(
      "O replay não tem stats dos jogadores (a partida pode não ter terminado).",
    );
  }

  return parsed.map((row) =>
    normalizePlayer((row ?? {}) as Record<string, unknown>),
  );
}

function getStatsJsonPayload(metadata: Record<string, unknown>): unknown {
  if (metadata.statsJson != null) return metadata.statsJson;
  if (metadata.statsjson != null) return metadata.statsjson;
  const hit = Object.entries(metadata).find(
    ([key]) => key.toLowerCase() === "statsjson",
  );
  return hit?.[1];
}

function parseLegacyMetadata(buffer: ArrayBuffer): {
  metadata: Record<string, unknown>;
  gameVersion: string | null;
} {
  const view = new DataView(buffer);
  // lengths block starts at offset 262 (after 256-byte pad + 6-byte signature area quirks)
  // metaOffset @ 268, metaLength @ 272 (little-endian u32)
  const metaOffset = readU32LE(view, 268);
  const metaLength = readU32LE(view, 272);

  if (
    metaOffset <= 0 ||
    metaLength <= 0 ||
    metaOffset + metaLength > buffer.byteLength
  ) {
    throw new Error("Metadata inválida no arquivo .rofl.");
  }

  const metaBytes = new Uint8Array(buffer, metaOffset, metaLength);
  const metadata = JSON.parse(decodeUtf8(metaBytes)) as Record<string, unknown>;
  return {
    metadata,
    gameVersion:
      typeof metadata.gameVersion === "string" ? metadata.gameVersion : null,
  };
}

function parseRofl2Metadata(buffer: ArrayBuffer): {
  metadata: Record<string, unknown>;
  gameVersion: string | null;
} {
  const view = new DataView(buffer);
  if (buffer.byteLength < 20) {
    throw new Error("Arquivo .rofl incompleto.");
  }

  const metadataLength = readU32LE(view, buffer.byteLength - 4);
  if (
    metadataLength <= 0 ||
    metadataLength + 4 > buffer.byteLength
  ) {
    throw new Error("Metadata ROFL2 inválida.");
  }

  const metaStart = buffer.byteLength - 4 - metadataLength;
  const metaBytes = new Uint8Array(buffer, metaStart, metadataLength);
  const metadata = JSON.parse(decodeUtf8(metaBytes)) as Record<string, unknown>;

  // game version sits near the start of ROFL2 files
  const versionBytes = new Uint8Array(buffer, 15, 14);
  const gameVersion =
    decodeUtf8(versionBytes).replace(/\0/g, "").trim() ||
    (typeof metadata.gameVersion === "string" ? metadata.gameVersion : null);

  return { metadata, gameVersion };
}

/**
 * Extrai statsJson de um .rofl (legado ou ROFL2 ≥14.11).
 * Roda no browser — não envia o arquivo ao servidor.
 */
export async function parseRoflFile(file: Blob): Promise<ParsedRofl> {
  const buffer = await file.arrayBuffer();
  const header = new Uint8Array(buffer, 0, Math.min(6, buffer.byteLength));

  let metadata: Record<string, unknown>;
  let gameVersion: string | null;

  if (bytesEqual(header, ROFL2_SIGNATURE)) {
    ({ metadata, gameVersion } = parseRofl2Metadata(buffer));
  } else if (bytesEqual(header, ROFL_SIGNATURE)) {
    ({ metadata, gameVersion } = parseLegacyMetadata(buffer));
  } else {
    throw new Error("Arquivo não parece um replay .rofl da Riot.");
  }

  const players = parseStatsJson(getStatsJsonPayload(metadata));
  const gameLengthRaw = metadata.gameLength;
  const gameLengthMs =
    typeof gameLengthRaw === "number"
      ? gameLengthRaw
      : typeof gameLengthRaw === "string"
        ? Number(gameLengthRaw)
        : null;

  return {
    gameVersion,
    gameLengthMs:
      gameLengthMs != null && Number.isFinite(gameLengthMs)
        ? gameLengthMs
        : null,
    players,
  };
}
