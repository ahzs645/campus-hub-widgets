export interface RadioNowPlaying {
  title?: string;
  artist?: string;
  album?: string;
  showName?: string;
  description?: string;
  artworkUrl?: string;
  timestamp?: string;
  raw: unknown;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function coerceString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function coerceUrl(value: unknown, baseUrl?: string): string | undefined {
  const raw = coerceString(value);
  if (!raw) return undefined;

  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function walkValues(
  value: unknown,
  visit: (entry: { key?: string; value: unknown }) => string | undefined,
  depth = 0
): string | undefined {
  if (depth > 5 || value == null) return undefined;

  const direct = visit({ value });
  if (direct) return direct;

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = walkValues(entry, visit, depth + 1);
      if (found) return found;
    }
    return undefined;
  }

  if (!isRecord(value)) return undefined;

  for (const [key, child] of Object.entries(value)) {
    const foundAtKey = visit({ key, value: child });
    if (foundAtKey) return foundAtKey;

    const nested = walkValues(child, visit, depth + 1);
    if (nested) return nested;
  }

  return undefined;
}

function findStringByKeys(value: unknown, keys: string[]): string | undefined {
  const normalizedKeys = new Set(keys.map((key) => key.toLowerCase()));
  return walkValues(value, ({ key, value: candidate }) => {
    if (!key || !normalizedKeys.has(key.toLowerCase())) return undefined;
    return coerceString(candidate);
  });
}

function findUrlByKeys(value: unknown, keys: string[], baseUrl?: string): string | undefined {
  const normalizedKeys = new Set(keys.map((key) => key.toLowerCase()));
  return walkValues(value, ({ key, value: candidate }) => {
    if (!key || !normalizedKeys.has(key.toLowerCase())) return undefined;

    if (isRecord(candidate)) {
      return (
        coerceUrl(candidate.url, baseUrl) ||
        coerceUrl(candidate.src, baseUrl) ||
        coerceUrl(candidate.href, baseUrl)
      );
    }

    return coerceUrl(candidate, baseUrl);
  });
}

function findArtistList(value: unknown): string | undefined {
  return walkValues(value, ({ key, value: candidate }) => {
    if (!key) return undefined;
    const normalized = key.toLowerCase();
    if (normalized !== 'artists' && normalized !== 'artistnames') return undefined;

    if (Array.isArray(candidate)) {
      const names = candidate
        .map((entry) => {
          if (typeof entry === 'string') return entry.trim();
          if (isRecord(entry)) {
            return (
              coerceString(entry.name) ||
              coerceString(entry.title) ||
              coerceString(entry.artistName)
            );
          }
          return undefined;
        })
        .filter((name): name is string => Boolean(name));

      return names.length > 0 ? names.join(', ') : undefined;
    }

    return coerceString(candidate);
  });
}

export function extractRadioNowPlaying(
  payload: unknown,
  baseUrl?: string
): RadioNowPlaying | null {
  if (!payload) return null;

  const title =
    findStringByKeys(payload, ['trackTitle', 'songTitle', 'trackName', 'songName']) ||
    findStringByKeys(payload, ['title']) ||
    findStringByKeys(payload, ['name']) ||
    findStringByKeys(payload, ['track']) ||
    undefined;

  const artist =
    findStringByKeys(payload, ['artistName']) ||
    findArtistList(payload) ||
    findStringByKeys(payload, ['artist', 'subtitle', 'performer', 'band']) ||
    undefined;

  const album =
    findStringByKeys(payload, ['albumName']) ||
    findStringByKeys(payload, ['album', 'collection']) ||
    undefined;

  const showName =
    findStringByKeys(payload, ['showName', 'programName', 'program']) ||
    findStringByKeys(payload, ['show', 'episodeTitle']) ||
    undefined;

  const description =
    findStringByKeys(payload, ['description', 'summary', 'teaser']) ||
    undefined;

  const artworkUrl =
    findUrlByKeys(payload, ['imagePath', 'imageUrl', 'artworkUrl', 'coverUrl'], baseUrl) ||
    findUrlByKeys(payload, ['image', 'artwork', 'cover', 'thumbnailUrl', 'logo'], baseUrl) ||
    undefined;

  const timestamp =
    findStringByKeys(payload, ['timestamp', 'updatedAt', 'startTime', 'startedAt']) ||
    undefined;

  if (!title && !artist && !album && !showName && !description && !artworkUrl) {
    return null;
  }

  return {
    title,
    artist,
    album,
    showName,
    description,
    artworkUrl,
    timestamp,
    raw: payload,
  };
}
