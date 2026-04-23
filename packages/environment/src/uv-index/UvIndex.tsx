'use client';
import { useState, useEffect, useCallback } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import { buildCacheKey, buildProxyUrl, fetchJsonWithCache, fetchTextWithCache, getCorsProxyUrl } from '@firstform/campus-hub-widget-sdk';
import { useAdaptiveFitScale, ThemedContainer } from '@firstform/campus-hub-widget-sdk';
import UvIndexOptions from './UvIndexOptions';

interface UvIndexConfig {
  dataSource?: 'openuv' | 'waqi' | 'weather-network';
  openUvApiKey?: string;
  locationMode?: 'city' | 'coordinates';
  city?: string;
  latitude?: number;
  longitude?: number;
  waqiToken?: string;
  waqiCity?: string;
  weatherNetworkUrl?: string;
  refreshInterval?: number;
}

interface UvData {
  value: number;
  label: string;
  color: string;
  textColor: string;
  advice: string;
  maxUv?: number;
  maxUvTime?: string;
  location?: string;
}

// OpenUV API response
interface OpenUvResponse {
  result?: {
    uv?: number;
    uv_time?: string;
    uv_max?: number;
    uv_max_time?: string;
  };
}

// WAQI response (reused pattern)
interface WaqiUvResponse {
  status?: string;
  data?: {
    aqi?: number;
    iaqi?: Record<string, { v?: number }>;
    city?: { name?: string };
    time?: { s?: string; iso?: string; v?: number };
  };
}

interface OpenMeteoGeocodingResponse {
  results?: OpenMeteoLocation[];
}

interface OpenMeteoLocation {
  name?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  population?: number;
  feature_code?: string;
}

interface ResolvedUvLocation {
  latitude: number;
  longitude: number;
  label: string;
}

const DEFAULT_CITY = 'Prince George, BC, Canada';
const DEFAULT_LATITUDE = 53.9171;
const DEFAULT_LONGITUDE = -122.7497;
const DEFAULT_WEATHER_NETWORK_URL = 'https://www.theweathernetwork.com/en/city/ca/british-columbia/prince-george/uv';
const DEFAULT_REFRESH_MINUTES = 30;
const MIN_REFRESH_MINUTES = 10;
const MAX_REFRESH_MINUTES = 120;
const GEOCODING_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const LOCATION_TOKEN_ALIASES: Record<string, string[]> = {
  bc: ['british columbia'],
  'b.c': ['british columbia'],
  'b.c.': ['british columbia'],
  ab: ['alberta'],
  alta: ['alberta'],
  sk: ['saskatchewan'],
  mb: ['manitoba'],
  on: ['ontario'],
  qc: ['quebec'],
  pq: ['quebec'],
  nb: ['new brunswick'],
  ns: ['nova scotia'],
  pe: ['prince edward island'],
  pei: ['prince edward island'],
  nl: ['newfoundland and labrador'],
  yt: ['yukon'],
  nt: ['northwest territories'],
  nu: ['nunavut'],
};

const clampRefreshInterval = (value: number | undefined): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_REFRESH_MINUTES;
  return Math.min(MAX_REFRESH_MINUTES, Math.max(MIN_REFRESH_MINUTES, value));
};

const parseSourceDate = (value: string | number | undefined): Date | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value < 10_000_000_000 ? value * 1000 : value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (typeof value === 'string' && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
};

const formatCoordinateLocation = (latitude: number, longitude: number): string =>
  `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

const formatGeocodedLocation = (result: OpenMeteoLocation): string =>
  [result.name, result.admin1, result.country_code].filter(Boolean).join(', ');

const searchParts = (rawCity: string): { query: string; qualifiers: string[] } => {
  const parts = rawCity.split(',').map((part) => part.trim()).filter(Boolean);
  const [query = rawCity.trim(), ...qualifiers] = parts;
  return { query, qualifiers: qualifiers.map((part) => part.toLowerCase()) };
};

const tokenMatchesLocation = (token: string, haystack: string): boolean => {
  if (haystack.includes(token)) return true;
  const aliases = LOCATION_TOKEN_ALIASES[token] ?? [];
  return aliases.some((alias) => haystack.includes(alias));
};

const scoreGeocodingResult = (
  result: OpenMeteoLocation,
  query: string,
  qualifiers: string[],
): number => {
  const haystack = [
    result.name,
    result.admin1,
    result.admin2,
    result.country,
    result.country_code,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let score = 0;
  if (result.name?.toLowerCase() === query.toLowerCase()) score += 10;
  if (result.feature_code?.startsWith('PPL')) score += 4;
  if (typeof result.population === 'number') score += Math.min(8, Math.log10(Math.max(result.population, 1)));

  for (const qualifier of qualifiers) {
    const tokens = qualifier.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      score += tokenMatchesLocation(token, haystack) ? 8 : -2;
    }
  }

  return score;
};

const pickBestGeocodingResult = (
  results: OpenMeteoLocation[] | undefined,
  query: string,
  qualifiers: string[],
): OpenMeteoLocation | undefined =>
  results
    ?.filter((result) => (
      typeof result.latitude === 'number' &&
      typeof result.longitude === 'number' &&
      Number.isFinite(result.latitude) &&
      Number.isFinite(result.longitude)
    ))
    .sort((a, b) => scoreGeocodingResult(b, query, qualifiers) - scoreGeocodingResult(a, query, qualifiers))[0];

const normalizeWeatherNetworkUrl = (value: string): string => {
  const raw = value.trim() || DEFAULT_WEATHER_NETWORK_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Enter a valid The Weather Network UV URL');
  }

  if (url.protocol !== 'https:' || url.hostname !== 'www.theweathernetwork.com' || !url.pathname.endsWith('/uv')) {
    throw new Error('Use a theweathernetwork.com city UV URL');
  }

  return url.toString();
};

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCharCode(Number.parseInt(code, 10)));

const htmlToTokens = (html: string): string[] =>
  decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n'),
  )
    .split(/\n+/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

const parseNumberToken = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseWeatherNetworkUpdatedAt = (value: string | undefined): Date | undefined => {
  const match = value?.match(/^Updated on (?:[A-Za-z]+,\s*)?([A-Za-z]+ \d{1,2}),\s*([\d:]+\s*[ap]m)$/i);
  if (!match) return undefined;

  const now = new Date();
  const parsed = new Date(`${match[1]}, ${now.getFullYear()} ${match[2]}`);
  if (Number.isNaN(parsed.getTime())) return undefined;

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (parsed.getTime() - now.getTime() > thirtyDaysMs) {
    parsed.setFullYear(parsed.getFullYear() - 1);
  }

  return parsed;
};

const normalizeWeatherNetworkTime = (value: string | undefined): string | undefined =>
  value?.replace(/\s*([ap]m)$/i, ' $1').toUpperCase();

const parseWeatherNetworkUv = (html: string): { data: UvData; observedAt?: Date } | null => {
  const tokens = htmlToTokens(html);
  const currentIndex = tokens.findIndex((token) => /^Current UV$/i.test(token));
  const maxIndex = tokens.findIndex((token) => /^Daily Max(?: at .+)?$/i.test(token));

  const uv = parseNumberToken(tokens[currentIndex + 1]);
  if (currentIndex === -1 || uv == null) return null;

  const currentLabel = tokens[currentIndex + 2];
  const level = uvLevel(uv);
  const maxUv = maxIndex === -1 ? undefined : parseNumberToken(tokens[maxIndex + 1]) ?? undefined;
  const maxUvTime = normalizeWeatherNetworkTime(tokens[maxIndex]?.match(/^Daily Max at\s*(.+)$/i)?.[1]);
  const title = tokens.find((token) => / UV Index Today$/i.test(token));
  const location = title?.replace(/ UV Index Today$/i, '');
  const updatedAt = parseWeatherNetworkUpdatedAt(tokens.find((token) => /^Updated on /i.test(token)));

  return {
    data: {
      value: uv,
      ...level,
      label: currentLabel || level.label,
      maxUv,
      maxUvTime,
      location: location ? `${location} - The Weather Network` : 'The Weather Network',
    },
    observedAt: updatedAt,
  };
};

const uvLevel = (val: number): { label: string; color: string; textColor: string; advice: string } => {
  if (val <= 2) return { label: 'Low', color: '#4ade80', textColor: '#052e16', advice: 'No protection needed' };
  if (val <= 5) return { label: 'Moderate', color: '#facc15', textColor: '#422006', advice: 'Wear sunscreen' };
  if (val <= 7) return { label: 'High', color: '#fb923c', textColor: '#431407', advice: 'Seek shade midday' };
  if (val <= 10) return { label: 'Very High', color: '#ef4444', textColor: '#fff', advice: 'Avoid sun exposure' };
  return { label: 'Extreme', color: '#a855f7', textColor: '#fff', advice: 'Stay indoors' };
};

const MOCK_DATA: UvData = {
  value: 3,
  label: 'Moderate',
  color: '#facc15',
  textColor: '#422006',
  advice: 'Wear sunscreen',
  maxUv: 6,
  maxUvTime: '12:30 PM',
  location: 'Demo data',
};

const UV_SCALE_STOPS = [
  { color: '#4ade80', from: 0 },
  { color: '#facc15', from: 3 },
  { color: '#fb923c', from: 6 },
  { color: '#ef4444', from: 8 },
  { color: '#a855f7', from: 11 },
];

export default function UvIndex({ config, theme }: WidgetComponentProps) {
  const cfg = config as UvIndexConfig | undefined;
  const dataSource = cfg?.dataSource ?? 'openuv';
  const openUvApiKey = cfg?.openUvApiKey?.trim();
  const hasLegacyCoordinates = cfg?.locationMode == null && (
    typeof cfg?.latitude === 'number' ||
    typeof cfg?.longitude === 'number'
  );
  const locationMode = cfg?.locationMode ?? (hasLegacyCoordinates ? 'coordinates' : 'city');
  const city = cfg?.city?.trim() || DEFAULT_CITY;
  const latitude = cfg?.latitude ?? DEFAULT_LATITUDE;
  const longitude = cfg?.longitude ?? DEFAULT_LONGITUDE;
  const waqiToken = cfg?.waqiToken?.trim();
  const waqiCity = cfg?.waqiCity?.trim() || 'prince-george';
  const weatherNetworkUrl = cfg?.weatherNetworkUrl?.trim() || DEFAULT_WEATHER_NETWORK_URL;
  const refreshInterval = clampRefreshInterval(cfg?.refreshInterval);

  const [data, setData] = useState<UvData>(MOCK_DATA);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refreshMs = refreshInterval * 60 * 1000;

  const resolveCityLocation = useCallback(async (): Promise<ResolvedUvLocation> => {
    const { query, qualifiers } = searchParts(city);
    if (!query) {
      throw new Error('Enter a city name');
    }

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
    const { data: resp } = await fetchJsonWithCache<OpenMeteoGeocodingResponse>(url, {
      cacheKey: buildCacheKey('uv-geocode', city.toLowerCase()),
      ttlMs: GEOCODING_TTL_MS,
    });
    const match = pickBestGeocodingResult(resp.results, query, qualifiers);
    if (!match || typeof match.latitude !== 'number' || typeof match.longitude !== 'number') {
      throw new Error(`City not found: ${city}`);
    }

    return {
      latitude: match.latitude,
      longitude: match.longitude,
      label: formatGeocodedLocation(match) || city,
    };
  }, [city]);

  const resolveUvLocation = useCallback(async (): Promise<ResolvedUvLocation> => {
    if (locationMode === 'city') return resolveCityLocation();
    return {
      latitude,
      longitude,
      label: formatCoordinateLocation(latitude, longitude),
    };
  }, [latitude, locationMode, longitude, resolveCityLocation]);

  const fetchOpenUv = useCallback(async () => {
    const location = await resolveUvLocation();

    if (!openUvApiKey) {
      setError(null);
      setWarning('Add an OpenUV API key to show live UV data');
      setLastUpdated(null);
      setData({ ...MOCK_DATA, location: location.label });
      return;
    }
    try {
      setError(null);
      setWarning(null);
      const url = `https://api.openuv.io/api/v1/uv?lat=${location.latitude}&lng=${location.longitude}`;
      const { data: resp, stale } = await fetchJsonWithCache<OpenUvResponse>(url, {
        cacheKey: buildCacheKey('uv-openuv', `${location.latitude},${location.longitude}`),
        ttlMs: refreshMs,
        fetchInit: {
          headers: { 'x-access-token': openUvApiKey },
        },
      });

      if (!resp?.result) {
        setError('Invalid API response');
        return;
      }

      const uv = Math.round((resp.result.uv ?? 0) * 10) / 10;
      const level = uvLevel(uv);
      const maxUv = resp.result.uv_max != null ? Math.round(resp.result.uv_max * 10) / 10 : undefined;
      const maxUvTime = resp.result.uv_max_time
        ? new Date(resp.result.uv_max_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : undefined;

      setData({ value: uv, ...level, maxUv, maxUvTime, location: location.label });
      setLastUpdated(parseSourceDate(resp.result.uv_time) ?? new Date());
      setWarning(stale ? 'Showing cached UV data' : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [openUvApiKey, refreshMs, resolveUvLocation]);

  const fetchWaqiUv = useCallback(async () => {
    if (!waqiToken) {
      setError(null);
      setWarning('Add a WAQI token to show live UV data');
      setLastUpdated(null);
      setData({ ...MOCK_DATA, location: waqiCity });
      return;
    }
    try {
      setError(null);
      setWarning(null);
      const url = `https://api.waqi.info/feed/${encodeURIComponent(waqiCity)}/?token=${encodeURIComponent(waqiToken)}`;
      const { data: resp, stale } = await fetchJsonWithCache<WaqiUvResponse>(url, {
        cacheKey: buildCacheKey('uv-waqi', waqiCity),
        ttlMs: refreshMs,
      });

      if (resp?.status !== 'ok' || !resp.data?.iaqi) {
        setError('No UV data available from this station');
        return;
      }

      // WAQI sometimes reports UV under various keys
      const uvVal = resp.data.iaqi.uvi?.v ?? resp.data.iaqi.uv?.v;
      if (uvVal == null) {
        setError('No UV data available from this station');
        return;
      }

      const uv = Math.round(uvVal * 10) / 10;
      const level = uvLevel(uv);
      setData({ value: uv, ...level, location: resp.data.city?.name ?? waqiCity });
      setLastUpdated(
        parseSourceDate(resp.data.time?.iso) ??
        parseSourceDate(resp.data.time?.s) ??
        parseSourceDate(resp.data.time?.v) ??
        new Date(),
      );
      setWarning(stale ? 'Showing cached UV data' : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [waqiToken, waqiCity, refreshMs]);

  const fetchWeatherNetworkUv = useCallback(async () => {
    try {
      setError(null);
      setWarning(null);

      if (!getCorsProxyUrl()) {
        setError('The Weather Network source requires the CORS proxy');
        return;
      }

      const targetUrl = normalizeWeatherNetworkUrl(weatherNetworkUrl);
      const fetchUrl = buildProxyUrl(targetUrl);
      const { text, stale } = await fetchTextWithCache(fetchUrl, {
        cacheKey: buildCacheKey('uv-weather-network', targetUrl),
        ttlMs: refreshMs,
      });
      const parsed = parseWeatherNetworkUv(text);
      if (!parsed) {
        setError('Failed to parse The Weather Network UV data');
        return;
      }

      setData(parsed.data);
      setLastUpdated(parsed.observedAt ?? new Date());
      setWarning(stale ? 'Showing cached UV data' : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [refreshMs, weatherNetworkUrl]);

  useEffect(() => {
    let isMounted = true;
    const doFetch = async () => {
      if (!isMounted) return;
      if (dataSource === 'waqi') {
        await fetchWaqiUv();
      } else if (dataSource === 'weather-network') {
        await fetchWeatherNetworkUv();
      } else {
        await fetchOpenUv();
      }
    };
    doFetch();
    const interval = setInterval(doFetch, refreshMs);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [dataSource, fetchOpenUv, fetchWaqiUv, fetchWeatherNetworkUv, refreshMs]);

  const { containerRef, scale, designWidth: DESIGN_W, designHeight: DESIGN_H, isLandscape } = useAdaptiveFitScale({
    landscape: { w: 340, h: 260 },
    portrait: { w: 240, h: 360 },
  });

  // Position marker on UV scale (0-14 range)
  const markerPercent = Math.min(100, (data.value / 14) * 100);

  return (
    <ThemedContainer
      ref={containerRef}
      theme={theme}
      color="primary"
      opacity="20"
      className="flex items-center justify-center"
    >
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className={`flex flex-col p-6 ${!isLandscape ? 'items-center' : ''}`}
      >
        {/* Header */}
        <div className={`mb-3 ${!isLandscape ? 'text-center' : ''}`}>
          <div className="text-sm font-medium opacity-70" style={{ color: theme.accent }}>
            UV Index
          </div>
          {data.location && (
            <div className="mt-1 max-w-[260px] truncate text-sm text-white/45">
              {data.location}
            </div>
          )}
        </div>

        {/* Main UV display */}
        <div className={`flex ${isLandscape ? 'items-center gap-5' : 'flex-col items-center gap-3'} mb-4`}>
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: data.color }}
          >
            <span className="text-3xl font-bold" style={{ color: data.textColor }}>
              {data.value}
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-white leading-tight">{data.label}</div>
            <div className="text-sm text-white/50 mt-0.5">
              {data.advice}
            </div>
          </div>
        </div>

        {/* UV scale bar */}
        <div className="mb-4">
          <div className="h-2 rounded-full overflow-hidden flex">
            {UV_SCALE_STOPS.map((stop, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: stop.color }} />
            ))}
          </div>
          <div
            className="relative -mt-1"
            style={{
              left: `${markerPercent}%`,
              transform: 'translateX(-50%)',
              width: 0,
            }}
          >
            <div className="w-3 h-3 bg-white rounded-full border-2 border-gray-800 mx-auto" />
          </div>
        </div>

        {/* Max UV info */}
        {data.maxUv != null && (
          <div className="flex items-center gap-4 text-sm text-white/60 mb-2">
            <div className="flex items-center gap-1">
              <span className="font-medium text-white/40">Peak UV</span>
              <span>{data.maxUv}</span>
            </div>
            {data.maxUvTime && (
              <div className="flex items-center gap-1">
                <span className="font-medium text-white/40">at</span>
                <span>{data.maxUvTime}</span>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-2 text-sm text-red-400 truncate">{error}</div>
        )}
        {warning && !error && (
          <div className="mt-2 text-sm text-amber-300 truncate">{warning}</div>
        )}

        {/* Last updated */}
        {lastUpdated && (
          <div className="mt-auto text-sm text-white/40">
            Observed {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </ThemedContainer>
  );
}

registerWidget({
  type: 'uv-index',
  name: 'UV Index',
  description: 'Display current UV index with sun protection advice',
  icon: 'sun',
  minW: 2,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  component: UvIndex,
  OptionsComponent: UvIndexOptions,
  defaultProps: {
    dataSource: 'openuv',
    openUvApiKey: '',
    locationMode: 'city',
    city: DEFAULT_CITY,
    latitude: DEFAULT_LATITUDE,
    longitude: DEFAULT_LONGITUDE,
    waqiToken: '',
    waqiCity: 'prince-george',
    weatherNetworkUrl: DEFAULT_WEATHER_NETWORK_URL,
    refreshInterval: DEFAULT_REFRESH_MINUTES,
  },
});
