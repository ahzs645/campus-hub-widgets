'use client';
import { useState, useEffect, useCallback } from 'react';
import { WidgetComponentProps, registerWidget } from '@firstform/campus-hub-widget-sdk';
import {
  buildCacheKey,
  buildProxyUrl,
  fetchJsonWithCache,
  fetchTextWithCache,
  normalizeSourcePayload,
  resolveSourceAdapter,
} from '@firstform/campus-hub-widget-sdk';
import { useAdaptiveFitScale, ThemedContainer, IconText } from '@firstform/campus-hub-widget-sdk';
import { AppIcon } from '@firstform/campus-hub-widget-sdk';
import type { IconName, NormalizedWeatherObservation } from '@firstform/campus-hub-widget-sdk';
import WeatherOptions from './WeatherOptions';

type WeatherIconKey =
  | 'sunny'
  | 'cloudy'
  | 'partly-cloudy'
  | 'rainy'
  | 'stormy'
  | 'snowy'
  | 'foggy'
  | 'windy'
  | 'default';

interface WeatherData {
  temp: number;
  condition: string;
  icon: WeatherIconKey;
  humidity: number;
  wind: number;
  location: string;
  pressure?: number;
  dewPoint?: number;
  windDir?: number;
  windGust?: number;
  precip?: number;
}

type DisplayMode = 'full' | 'temperature-only' | 'wind-only' | 'minimal' | 'custom';
type WeatherAppearance = 'default' | 'dashboard-macos';

interface DisplayItems {
  location?: boolean;
  icon?: boolean;
  temperature?: boolean;
  condition?: boolean;
  humidity?: boolean;
  wind?: boolean;
  pressure?: boolean;
  dewPoint?: boolean;
  windGust?: boolean;
  precipitation?: boolean;
  lastUpdated?: boolean;
}

interface WeatherConfig {
  location?: string;
  units?: 'celsius' | 'fahrenheit';
  apiKey?: string;
  apiUrl?: string;
  showDetails?: boolean; // legacy, ignored if displayMode is set
  displayMode?: DisplayMode;
  displayItems?: DisplayItems;
  dataSource?: 'openweathermap' | 'source' | 'unbc-rooftop' | 'msc-geomet';
  sourceAdapter?: string;
  refreshInterval?: number; // minutes
  useCorsProxy?: boolean;
  appearance?: WeatherAppearance;
}

const DISPLAY_MODE_PRESETS: Record<Exclude<DisplayMode, 'custom'>, DisplayItems> = {
  full: {
    location: true, icon: true, temperature: true, condition: true,
    humidity: true, wind: true, pressure: true, dewPoint: false,
    windGust: false, precipitation: false, lastUpdated: true,
  },
  'temperature-only': {
    location: true, icon: true, temperature: true, condition: true,
    humidity: false, wind: false, pressure: false, dewPoint: false,
    windGust: false, precipitation: false, lastUpdated: false,
  },
  'wind-only': {
    location: true, icon: false, temperature: false, condition: false,
    humidity: false, wind: true, pressure: false, dewPoint: false,
    windGust: true, precipitation: false, lastUpdated: false,
  },
  minimal: {
    location: false, icon: true, temperature: true, condition: false,
    humidity: false, wind: false, pressure: false, dewPoint: false,
    windGust: false, precipitation: false, lastUpdated: false,
  },
};

const resolveDisplayItems = (config: WeatherConfig | undefined): DisplayItems => {
  const mode = config?.displayMode ?? 'full';
  if (mode === 'custom') {
    return config?.displayItems ?? DISPLAY_MODE_PRESETS.full;
  }
  return DISPLAY_MODE_PRESETS[mode];
};

interface OpenWeatherResponse {
  weather?: Array<{
    main?: string;
    description?: string;
  }>;
  wind?: {
    speed?: number;
  };
  main?: {
    temp?: number;
    humidity?: number;
  };
}

const WEATHER_ICONS: Record<WeatherIconKey, IconName> = {
  sunny: 'sun',
  cloudy: 'cloud',
  'partly-cloudy': 'cloudSun',
  rainy: 'cloudRain',
  stormy: 'cloudLightning',
  snowy: 'snowflake',
  foggy: 'cloudFog',
  windy: 'wind',
  default: 'weather',
};

function getDashboardWeatherEmoji(icon: WeatherIconKey, isDay: boolean) {
  switch (icon) {
    case 'sunny':
      return isDay ? '☀️' : '🌙';
    case 'partly-cloudy':
      return isDay ? '⛅' : '☁️';
    case 'cloudy':
      return '☁️';
    case 'rainy':
      return '🌧️';
    case 'stormy':
      return '⛈️';
    case 'snowy':
      return '🌨️';
    case 'foggy':
      return '🌫️';
    case 'windy':
      return '💨';
    default:
      return isDay ? '🌤️' : '☁️';
  }
}

function getDashboardWeatherGradient(icon: WeatherIconKey, isDay: boolean) {
  if (!isDay) {
    switch (icon) {
      case 'sunny':
        return 'linear-gradient(180deg, #0B1A2E 0%, #1A2D4A 40%, #2A3F5C 100%)';
      case 'partly-cloudy':
      case 'cloudy':
        return 'linear-gradient(180deg, #0F1F35 0%, #1E3250 40%, #2E4462 100%)';
      case 'foggy':
        return 'linear-gradient(180deg, #1A1E25 0%, #2A303A 40%, #3A424D 100%)';
      case 'rainy':
      case 'stormy':
        return 'linear-gradient(180deg, #0E151E 0%, #1C2630 40%, #2A3540 100%)';
      case 'snowy':
        return 'linear-gradient(180deg, #151C28 0%, #252F3E 40%, #354050 100%)';
      default:
        return 'linear-gradient(180deg, #121922 0%, #222C38 40%, #323E4A 100%)';
    }
  }

  switch (icon) {
    case 'sunny':
      return 'linear-gradient(180deg, #4A90C4 0%, #7AB4D8 40%, #A8CBE0 100%)';
    case 'partly-cloudy':
      return 'linear-gradient(180deg, #5A8AAF 0%, #8BAFC5 40%, #B0C8D8 100%)';
    case 'cloudy':
    case 'foggy':
      return 'linear-gradient(180deg, #6B7B8D 0%, #8A96A3 40%, #A5AEB8 100%)';
    case 'rainy':
      return 'linear-gradient(180deg, #4A5A6A 0%, #6A7A8A 40%, #8A95A0 100%)';
    case 'snowy':
      return 'linear-gradient(180deg, #7A8A9A 0%, #9AABB8 40%, #C0CDD5 100%)';
    case 'stormy':
      return 'linear-gradient(180deg, #3A4550 0%, #505E6A 40%, #6A7880 100%)';
    default:
      return 'linear-gradient(180deg, #4A90C4 0%, #7AB4D8 40%, #A8CBE0 100%)';
  }
}

// Mock weather data for demo
const MOCK_WEATHER: WeatherData = {
  temp: 72,
  condition: 'partly-cloudy',
  icon: 'partly-cloudy',
  humidity: 45,
  wind: 8,
  location: 'Campus',
};

const mapWeatherIcon = (condition: string): WeatherIconKey => {
  const key = condition.toLowerCase();
  if (
    key.includes('partly') ||
    key.includes('few clouds') ||
    key.includes('mix of sun and cloud')
  ) {
    return 'partly-cloudy';
  }
  if (key.includes('clear') || key.includes('sunny')) return 'sunny';
  if (key.includes('cloud')) return 'cloudy';
  if (key.includes('rain')) return 'rainy';
  if (key.includes('storm') || key.includes('thunder')) return 'stormy';
  if (key.includes('snow')) return 'snowy';
  if (key.includes('fog') || key.includes('mist') || key.includes('haze')) return 'foggy';
  if (key.includes('wind')) return 'windy';
  return 'default';
};

const GEOMET_PRINCE_GEORGE_URL = 'https://api.weather.gc.ca/collections/citypageweather-realtime/items/bc-79?f=json&lang=en';


/** Derive a display condition from normalized sensor observations. */
const deriveConditionFromObservation = (
  temp: number,
  rh: number,
  windSpeed: number,
  precip: number,
  kdownTot: number,
): WeatherIconKey => {
  if (precip > 0 && temp <= 0) return 'snowy';
  if (precip > 0) return 'rainy';
  if (windSpeed > 10) return 'windy';
  if (rh > 95) return 'foggy';
  if (kdownTot > 300) return 'sunny';
  if (kdownTot > 100) return 'partly-cloudy';
  if (kdownTot > 20) return 'cloudy';
  return 'cloudy';
};

const weatherFromObservation = (
  observation: NormalizedWeatherObservation,
  units: 'celsius' | 'fahrenheit',
  location: string,
): WeatherData => {
  const windSpeed = observation.windSpeedMps ?? 0;
  const precipitation = observation.precipitationMm ?? 0;
  const humidity = observation.humidityPercent ?? 0;
  const icon = observation.condition
    ? mapWeatherIcon(observation.condition)
    : deriveConditionFromObservation(
        observation.temperatureC,
        humidity,
        windSpeed,
        precipitation,
        observation.solarRadiationWm2 ?? 0,
      );
  const convertTemp = (value: number | undefined) => value === undefined
    ? undefined
    : units === 'fahrenheit'
      ? Math.round(value * 9 / 5 + 32)
      : Math.round(value * 10) / 10;
  const convertWind = (value: number | undefined) => value === undefined
    ? undefined
    : units === 'fahrenheit'
      ? Math.round(value * 2.23694)
      : Math.round(value * 10) / 10;

  return {
    temp: convertTemp(observation.temperatureC) ?? 0,
    condition: observation.condition ?? icon.replace(/-/g, ' '),
    icon,
    humidity: Math.round(humidity),
    wind: convertWind(observation.windSpeedMps) ?? 0,
    location: observation.location ?? location,
    pressure: observation.pressureHpa === undefined
      ? undefined
      : Math.round(observation.pressureHpa * 10) / 10,
    dewPoint: convertTemp(observation.dewPointC),
    windDir: observation.windDirectionDegrees === undefined
      ? undefined
      : Math.round(observation.windDirectionDegrees),
    windGust: convertWind(observation.windGustMps),
    precip: observation.precipitationMm,
  };
};

export default function Weather({ config, theme }: WidgetComponentProps) {
  const weatherConfig = config as WeatherConfig | undefined;
  const units = weatherConfig?.units ?? 'fahrenheit';
  const location = weatherConfig?.location ?? 'Campus';
  const apiUrl = weatherConfig?.apiUrl?.trim() || GEOMET_PRINCE_GEORGE_URL;
  const appearance = weatherConfig?.appearance ?? 'default';
  const show = resolveDisplayItems(weatherConfig);
  const apiKey = weatherConfig?.apiKey?.trim();
  const configuredDataSource = weatherConfig?.dataSource ?? 'openweathermap';
  const dataSource = configuredDataSource === 'unbc-rooftop' ? 'source' : configuredDataSource;
  const sourceAdapterId = weatherConfig?.sourceAdapter
    ?? (configuredDataSource === 'unbc-rooftop' ? 'unbc-rooftop-weather' : undefined);
  const sourceAdapter = resolveSourceAdapter({ adapterId: sourceAdapterId, url: apiUrl });
  const sourceUrl = sourceAdapter?.matches({ url: apiUrl })
    ? apiUrl
    : sourceAdapter?.defaultUrl;
  const refreshInterval = weatherConfig?.refreshInterval ?? 10; // minutes
  const useCorsProxy = weatherConfig?.useCorsProxy ?? true;

  const [weather, setWeather] = useState<WeatherData>({
    ...MOCK_WEATHER,
    location,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshMs = refreshInterval * 60 * 1000;

  const fetchAdaptedSource = useCallback(async () => {
    if (!sourceAdapter || !sourceUrl) return;
    try {
      setError(null);
      const fetchUrl = useCorsProxy ? buildProxyUrl(sourceUrl) : sourceUrl;
      const { text } = await fetchTextWithCache(fetchUrl, {
        cacheKey: buildCacheKey(`source-adapter:${sourceAdapter.id}`, sourceUrl),
        ttlMs: refreshMs,
      });
      const normalized = normalizeSourcePayload({
        adapterId: sourceAdapter.id,
        url: sourceUrl,
        rawText: text,
      });
      const observation = normalized?.data as NormalizedWeatherObservation | null | undefined;
      if (observation?.kind === 'weather-observation') {
        setWeather(weatherFromObservation(observation, units, location));
        setLastUpdated(new Date(observation.observedAt));
      } else {
        setError('Failed to parse weather data');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  }, [location, refreshMs, sourceAdapter, sourceUrl, units, useCorsProxy]);

  const fetchGeoMet = useCallback(async () => {
    try {
      setError(null);
      const fetchUrl = useCorsProxy ? buildProxyUrl(apiUrl) : apiUrl;
      const { data } = await fetchJsonWithCache<unknown>(fetchUrl, {
        cacheKey: buildCacheKey('weather-geomet', apiUrl),
        ttlMs: refreshMs,
      });
      const normalized = normalizeSourcePayload({
        adapterId: 'msc-geomet-weather',
        url: apiUrl,
        payload: data,
      });
      const observation = normalized?.data as NormalizedWeatherObservation | null | undefined;
      if (observation) {
        setWeather(weatherFromObservation(observation, units, location));
        setLastUpdated(observation.observedAt ? new Date(observation.observedAt) : new Date());
      } else {
        setError('Failed to parse GeoMet weather data');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  }, [apiUrl, location, refreshMs, units, useCorsProxy]);

  // OpenWeatherMap data source
  const fetchOWM = useCallback(async () => {
    if (!apiKey) {
      const temp = units === 'celsius'
        ? Math.round((MOCK_WEATHER.temp - 32) * 5 / 9)
        : MOCK_WEATHER.temp;
      setWeather({ ...MOCK_WEATHER, temp, location });
      return;
    }
    try {
      const unitParam = units === 'celsius' ? 'metric' : 'imperial';
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        location
      )}&units=${unitParam}&appid=${apiKey}`;
      const { data } = await fetchJsonWithCache<OpenWeatherResponse>(url, {
        cacheKey: buildCacheKey('weather', `${location}:${unitParam}`),
        ttlMs: refreshMs,
      });

      const condition = data?.weather?.[0]?.main ?? 'Clear';
      const description = data?.weather?.[0]?.description ?? condition;
      const windSpeed = typeof data?.wind?.speed === 'number' ? data.wind.speed : MOCK_WEATHER.wind;
      const windMph = units === 'celsius' ? Math.round(windSpeed * 2.23694) : Math.round(windSpeed);

      setWeather({
        temp: Math.round(data?.main?.temp ?? MOCK_WEATHER.temp),
        condition: description,
        icon: mapWeatherIcon(condition),
        humidity: Math.round(data?.main?.humidity ?? MOCK_WEATHER.humidity),
        wind: windMph,
        location,
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    }
  }, [apiKey, location, units, refreshMs]);

  useEffect(() => {
    let isMounted = true;
    const fetchWeather = async () => {
      if (!isMounted) return;
      if (dataSource === 'source') {
        await fetchAdaptedSource();
      } else if (dataSource === 'msc-geomet') {
        await fetchGeoMet();
      } else {
        await fetchOWM();
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, refreshMs);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [dataSource, fetchAdaptedSource, fetchGeoMet, fetchOWM, refreshMs]);

  const displayTemp = weather.temp;
  const tempUnit = units === 'celsius' ? '°C' : '°F';
  const windUnit = units === 'celsius' ? 'm/s' : 'mph';

  // Adaptive design dimensions: landscape uses wide layout, portrait stacks vertically
  const { containerRef, scale, designWidth, designHeight, isLandscape } = useAdaptiveFitScale({
    landscape: { w: 340, h: 208 },
    portrait: { w: 240, h: 360 },
  });

  if (appearance === 'dashboard-macos') {
    const isDay = (() => {
      const sourceDate = lastUpdated ?? new Date();
      const hour = sourceDate.getHours();
      return hour >= 6 && hour < 19;
    })();
    const gradient = getDashboardWeatherGradient(weather.icon, isDay);
    const tempValue = Math.round(displayTemp);
    const textShadow = '0 1px 3px rgba(0,0,0,0.4)';

    return (
      <div
        className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[20px]"
        style={{
          background:
            'linear-gradient(180deg, rgba(50,50,50,0.8) 0%, rgba(25,25,25,0.85) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow:
            '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="relative z-[1] flex flex-1 items-center px-3 py-3"
          style={{ background: gradient }}
        >
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div
              className="font-medium"
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.8)',
                textShadow,
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {weather.condition.replace(/-/g, ' ')}
            </div>
            <span
              className="truncate font-bold"
              style={{
                fontSize: 14,
                color: '#FFF',
                maxWidth: 180,
                textShadow,
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {weather.location}
            </span>
            <div
              className="font-medium"
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.8)',
                textShadow,
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {show.wind ? `${weather.wind} ${windUnit}` : `${weather.humidity}% humidity`}
            </div>
          </div>

          <div className="ml-3 flex shrink-0 items-center gap-3">
            <span style={{ fontSize: 34, lineHeight: 1 }}>
              {getDashboardWeatherEmoji(weather.icon, isDay)}
            </span>
            <span
              className="font-light leading-none"
              style={{
                fontSize: 64,
                letterSpacing: '-0.04em',
                color: '#FFF',
                textShadow: '0 2px 8px rgba(0,0,0,0.25)',
                fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              }}
            >
              {tempValue}°
            </span>
          </div>
        </div>

        <div
          className="relative z-[1] flex justify-between px-3 py-2 text-[11px]"
          style={{
            background:
              isDay
                ? 'linear-gradient(180deg, rgba(50,60,75,0.85) 0%, rgba(35,45,55,0.9) 100%)'
                : 'linear-gradient(180deg, rgba(15,22,35,0.9) 0%, rgba(10,16,28,0.95) 100%)',
            color: 'rgba(255,255,255,0.82)',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
          }}
        >
          <span>{show.humidity ? `Humidity ${weather.humidity}%` : weather.condition}</span>
          <span>{lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : location}</span>
        </div>

        <div
          className="pointer-events-none absolute top-[2px] left-1/2 z-10"
          style={{
            transform: 'translateX(-50%)',
            width: 'calc(100% - 6px)',
            height: '35%',
            maxHeight: 50,
            borderRadius: '18px 18px 50% 50%',
            background: 'linear-gradient(rgba(255,255,255,0.3), rgba(255,255,255,0))',
          }}
        />
        <div
          className="pointer-events-none absolute bottom-[2px] left-1/2 z-10"
          style={{
            transform: 'translateX(-50%)',
            width: 'calc(100% - 10px)',
            height: '20%',
            maxHeight: 30,
            borderRadius: '50% 50% 16px 16px',
            background: 'linear-gradient(rgba(255,255,255,0), rgba(255,255,255,0.08))',
            filter: 'blur(1px)',
          }}
        />
      </div>
    );
  }

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
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
        className={`flex flex-col ${isLandscape ? 'justify-center' : 'items-center justify-center'} p-6`}
      >
        {/* Location */}
        {show.location && (
          <div className={`text-lg font-medium opacity-70 mb-1 ${!isLandscape ? 'text-center' : ''}`} style={{ color: theme.accent }}>
            {weather.location}
          </div>
        )}

        {/* Main weather display */}
        {(show.icon || show.temperature || show.condition) && (
          <div className={`flex ${isLandscape ? 'items-center gap-4' : 'flex-col items-center gap-2'}`}>
            {show.icon && (
              <AppIcon name={WEATHER_ICONS[weather.icon]} className={`${isLandscape ? 'w-20 h-20' : 'w-24 h-24'} text-white`} />
            )}
            <div className={!isLandscape ? 'text-center' : ''}>
              {show.temperature && (
                <div className="text-6xl font-bold text-white leading-tight">
                  {displayTemp}{tempUnit}
                </div>
              )}
              {show.condition && (
                <div className="text-lg text-white/70 capitalize">
                  {weather.condition.replace(/-/g, ' ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wind-only hero display (when wind is shown but not temperature) */}
        {show.wind && !show.temperature && (
          <div className={`flex ${isLandscape ? 'items-center gap-4 mt-2' : 'flex-col items-center gap-2 mt-2'}`}>
            <AppIcon name="wind" className="w-16 h-16 text-white" />
            <div className={!isLandscape ? 'text-center' : ''}>
              <div className="text-5xl font-bold text-white leading-tight">
                {weather.wind} <span className="text-2xl font-normal text-white/70">{windUnit}</span>
              </div>
              {weather.windDir != null && (
                <div className="text-lg text-white/70">
                  Direction: {weather.windDir}°
                </div>
              )}
              {show.windGust && weather.windGust != null && (
                <div className="text-base text-white/50">
                  Gusts: {weather.windGust} {windUnit}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detail items */}
        {(show.humidity || (show.wind && show.temperature) || show.pressure || show.dewPoint || show.precipitation) && (
          <div className={`mt-4 flex flex-wrap gap-x-5 gap-y-1 text-base text-white/60 ${!isLandscape ? 'justify-center' : ''}`}>
            {show.humidity && (
              <IconText icon={<AppIcon name="droplets" className="w-4 h-4" />} gap="1.5">
                <span>{weather.humidity}%</span>
              </IconText>
            )}
            {show.wind && show.temperature && (
              <IconText icon={<AppIcon name="wind" className="w-4 h-4" />} gap="1.5">
                <span>{weather.wind} {windUnit}</span>
                {show.windGust && weather.windGust != null && (
                  <span className="text-white/40">(gust {weather.windGust})</span>
                )}
              </IconText>
            )}
            {show.pressure && weather.pressure != null && (
              <IconText icon={<AppIcon name="gauge" className="w-4 h-4" />} gap="1.5">
                <span>{weather.pressure} hPa</span>
              </IconText>
            )}
            {show.dewPoint && weather.dewPoint != null && (
              <IconText icon={<AppIcon name="droplets" className="w-4 h-4" />} gap="1.5">
                <span>Dew {weather.dewPoint}{tempUnit}</span>
              </IconText>
            )}
            {show.precipitation && weather.precip != null && (
              <IconText icon={<AppIcon name="cloudRain" className="w-4 h-4" />} gap="1.5">
                <span>{weather.precip} mm</span>
              </IconText>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-2 text-sm text-red-400 truncate">
            {error}
          </div>
        )}

        {/* Last updated */}
        {show.lastUpdated && lastUpdated && !error && (
          <div className={`mt-2 text-sm text-white/40 ${!isLandscape ? 'text-center' : ''}`}>
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </ThemedContainer>
  );
}

// Register the widget
registerWidget({
  type: 'weather',
  name: 'Weather',
  description: 'Display current weather conditions',
  icon: 'weather',
  minW: 2,
  minH: 2,
  maxW: 6,
  maxH: 5,
  defaultW: 3,
  defaultH: 2,
  component: Weather,
  OptionsComponent: WeatherOptions,
  defaultProps: {
    location: 'Campus',
    units: 'fahrenheit',
    showDetails: true,
    displayMode: 'full',
    displayItems: DISPLAY_MODE_PRESETS.full,
    apiKey: '',
    apiUrl: GEOMET_PRINCE_GEORGE_URL,
    dataSource: 'openweathermap',
    refreshInterval: 10,
    useCorsProxy: true,
    appearance: 'default',
  },
  acceptsSources: [{
    propName: 'apiUrl',
    types: ['api'],
    matchSource: (source) => {
      const adapter = resolveSourceAdapter({ url: source.url, presetId: source.presetId });
      return adapter?.id === 'unbc-rooftop-weather'
        || adapter?.id === 'msc-geomet-weather';
    },
    applySource: (source, currentData) => {
      const candidate = resolveSourceAdapter({ url: source.url, presetId: source.presetId });
      return {
        apiUrl: source.url,
        dataSource: candidate ? 'source' : 'msc-geomet',
        sourceAdapter: candidate?.id,
        location: source.name,
        useCorsProxy: source.url.includes('api.weather.gc.ca')
          ? false
          : (currentData.useCorsProxy as boolean | undefined) ?? true,
      };
    },
  }],
});
