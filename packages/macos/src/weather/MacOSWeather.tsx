'use client';
import { useWidgetPreview } from '@firstform/campus-hub-widget-sdk';

import { useEffect, useMemo, useState } from 'react';
import { buildCacheKey, buildProxyUrl, fetchJsonWithCache, type WidgetComponentProps } from '@firstform/campus-hub-widget-sdk';
import { SourceUnavailable } from '@firstform/campus-hub-widgets-shared';
import { MACOS_UI_FONT, MacOSDashboardSurface } from '../shared/ui';

/**
 * Open-Meteo daily dates are calendar days ("2026-11-02") in the location's
 * timezone. `new Date('2026-11-02')` is UTC midnight, which is the previous
 * day west of UTC, so read the parts as a local date instead.
 */
function parseCalendarDay(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
}

interface WeatherConfig {
  apiUrl?: string;
  location?: string;
  units?: 'metric' | 'imperial';
  showForecast?: boolean;
  useSampleData?: boolean;
}

interface GeoResult {
  results?: Array<{
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
  }>;
}

interface ForecastResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
    is_day: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

const SAMPLE_WEATHER_DATA: ForecastResponse = {
  current: {
    temperature_2m: 18,
    weather_code: 2,
    wind_speed_10m: 11,
    relative_humidity_2m: 62,
    is_day: 1,
  },
  daily: {
    time: [
      '2026-04-08',
      '2026-04-09',
      '2026-04-10',
      '2026-04-11',
      '2026-04-12',
      '2026-04-13',
      '2026-04-14',
    ],
    temperature_2m_max: [19, 18, 16, 17, 20, 21, 19],
    temperature_2m_min: [11, 10, 9, 8, 10, 11, 9],
    weather_code: [2, 3, 61, 1, 0, 2, 45],
  },
};

function getWeatherEmoji(code: number, isDay: boolean) {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code <= 3) return isDay ? '⛅' : '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  if (code <= 99) return '⛈️';
  return isDay ? '🌤️' : '☁️';
}

function getWeatherGradient(code: number, isDay: boolean) {
  if (!isDay) {
    if (code === 0) {
      return 'linear-gradient(180deg, #0B1A2E 0%, #1A2D4A 40%, #2A3F5C 100%)';
    }
    if (code <= 3) {
      return 'linear-gradient(180deg, #0F1F35 0%, #1E3250 40%, #2E4462 100%)';
    }
    if (code <= 48) {
      return 'linear-gradient(180deg, #1A1E25 0%, #2A303A 40%, #3A424D 100%)';
    }
    if (code <= 67) {
      return 'linear-gradient(180deg, #0E151E 0%, #1C2630 40%, #2A3540 100%)';
    }
    if (code <= 77) {
      return 'linear-gradient(180deg, #151C28 0%, #252F3E 40%, #354050 100%)';
    }
    if (code <= 86) {
      return 'linear-gradient(180deg, #121922 0%, #222C38 40%, #323E4A 100%)';
    }
    if (code <= 99) {
      return 'linear-gradient(180deg, #0A0F15 0%, #181E28 40%, #252D38 100%)';
    }
    return 'linear-gradient(180deg, #0B1A2E 0%, #1A2D4A 40%, #2A3F5C 100%)';
  }

  if (code === 0) {
    return 'linear-gradient(180deg, #4A90C4 0%, #7AB4D8 40%, #A8CBE0 100%)';
  }
  if (code <= 3) {
    return 'linear-gradient(180deg, #5A8AAF 0%, #8BAFC5 40%, #B0C8D8 100%)';
  }
  if (code <= 48) {
    return 'linear-gradient(180deg, #6B7B8D 0%, #8A96A3 40%, #A5AEB8 100%)';
  }
  if (code <= 67) {
    return 'linear-gradient(180deg, #4A5A6A 0%, #6A7A8A 40%, #8A95A0 100%)';
  }
  if (code <= 77) {
    return 'linear-gradient(180deg, #7A8A9A 0%, #9AABB8 40%, #C0CDD5 100%)';
  }
  if (code <= 86) {
    return 'linear-gradient(180deg, #6A7A8A 0%, #8A9AAA 40%, #B0BCC5 100%)';
  }
  if (code <= 99) {
    return 'linear-gradient(180deg, #3A4550 0%, #505E6A 40%, #6A7880 100%)';
  }
  return 'linear-gradient(180deg, #4A90C4 0%, #7AB4D8 40%, #A8CBE0 100%)';
}

/** A linked forecast URL still honors the widget's own units setting. */
function withForecastUnits(apiUrl: string, units: 'metric' | 'imperial'): string {
  try {
    const url = new URL(apiUrl);
    url.searchParams.set('temperature_unit', units === 'imperial' ? 'fahrenheit' : 'celsius');
    url.searchParams.set('wind_speed_unit', units === 'imperial' ? 'mph' : 'kmh');
    return url.toString();
  } catch {
    return apiUrl;
  }
}

export default function MacOSWeather({ config }: WidgetComponentProps) {
  const weatherConfig = (config ?? {}) as WeatherConfig;
  const location = weatherConfig.location?.trim() || '';
  const apiUrl = weatherConfig.apiUrl?.trim() || '';
  const preview = useWidgetPreview();
  const units = weatherConfig.units ?? 'metric';
  const showForecast = weatherConfig.showForecast ?? true;
  const useSampleData = preview || (!apiUrl && !location) || (weatherConfig.useSampleData ?? false);

  const requestKey = `${apiUrl}:${location}:${units}`;
  // Last-good live forecast keyed by the location/units it came from: a
  // failed refresh keeps it, and a config change never shows another
  // location's weather while refetching.
  const [live, setLive] = useState<{ key: string; label: string; data: ForecastResponse } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (useSampleData) {
      setError(null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        if (apiUrl) {
          const sourceUrl = withForecastUnits(apiUrl, units);
          const { data: forecast } = await fetchJsonWithCache<ForecastResponse>(buildProxyUrl(sourceUrl), {
            cacheKey: buildCacheKey('macos-weather-source', sourceUrl), ttlMs: 30 * 60 * 1000,
          });
          if (!forecast?.current || !Array.isArray(forecast.daily?.time)) throw new Error('The source is not an Open-Meteo forecast');
          if (!cancelled) { setLive({ key: requestKey, label: location || 'Weather', data: forecast }); setError(null); }
          return;
        }
        const geoUrl = buildProxyUrl(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            location,
          )}&count=1&language=en&format=json`,
        );
        const { data: geo } = await fetchJsonWithCache<GeoResult>(geoUrl, {
          cacheKey: buildCacheKey('macos-weather-geo', location),
          ttlMs: 12 * 60 * 60 * 1000,
        });
        const match = geo.results?.[0];

        if (!match) {
          throw new Error('Location not found');
        }

        const nextLabel = [match.name, match.country].filter(Boolean).join(', ');
        const forecastUrl = buildProxyUrl(
          `https://api.open-meteo.com/v1/forecast?latitude=${match.latitude}&longitude=${match.longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,is_day&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=${
            units === 'imperial' ? 'fahrenheit' : 'celsius'
          }&wind_speed_unit=${units === 'imperial' ? 'mph' : 'kmh'}&forecast_days=7&timezone=auto`,
        );
        const { data: forecast } = await fetchJsonWithCache<ForecastResponse>(
          forecastUrl,
          {
            cacheKey: buildCacheKey(
              'macos-weather-forecast',
              `${location}:${units}`,
            ),
            ttlMs: 30 * 60 * 1000,
          },
        );

        if (!cancelled) {
          setLive({ key: requestKey, label: nextLabel, data: forecast });
          setError(null);
        }
      } catch (nextError) {
        // Keep the last-good forecast; only the error line changes.
        if (!cancelled) {
          setError(
            nextError instanceof Error ? nextError.message : 'Weather unavailable',
          );
        }
      }
    };

    void run();
    const refresh = window.setInterval(run, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(refresh);
    };
  }, [apiUrl, location, units, requestKey, useSampleData]);

  const current = !useSampleData && live?.key === requestKey ? live : null;
  const data: ForecastResponse | null = useSampleData ? SAMPLE_WEATHER_DATA : current?.data ?? null;
  const label = useSampleData ? 'Sample City' : current?.label ?? location;
  const loading = !useSampleData && current === null && error === null;

  const gradient = useMemo(() => {
    if (!data) return 'linear-gradient(180deg, #5A8AAF 0%, #8BAFC5 40%, #B0C8D8 100%)';
    return getWeatherGradient(data.current.weather_code, data.current.is_day === 1);
  }, [data]);

  const forecast = useMemo(
    () =>
      data
        ? data.daily.time.slice(1, 7).map((dateValue, index) => ({
            dayLabel: parseCalendarDay(dateValue)
              .toLocaleDateString([], { weekday: 'short' })
              .toUpperCase(),
            weatherCode: data.daily.weather_code[index + 1],
            tempHigh: Math.round(data.daily.temperature_2m_max[index + 1]),
          }))
        : [],
    [data],
  );

  const textShadow = '0 1px 3px rgba(0,0,0,0.4)';

  if (!data && !loading && error) {
    return (
      <MacOSDashboardSurface>
        <div className="relative z-[1] flex h-full min-h-0 flex-1">
          <SourceUnavailable label="Weather" detail={error} compact />
        </div>
      </MacOSDashboardSurface>
    );
  }

  return (
    <MacOSDashboardSurface>
      <div
        className="relative z-[1] flex flex-1 px-3 py-3"
        style={{ background: gradient }}
      >
        {useSampleData && (
          <span
            className="pointer-events-none absolute right-2 top-2 z-[2] rounded-full px-2 py-0.5 font-semibold uppercase"
            style={{
              fontSize: 9,
              letterSpacing: '0.06em',
              color: '#FFF',
              background: 'rgba(0,0,0,0.3)',
              fontFamily: MACOS_UI_FONT,
            }}
          >
            Demo
          </span>
        )}
        {loading ? (
          <div
            className="flex w-full items-center justify-center rounded-[inherit]"
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontFamily: MACOS_UI_FONT,
              fontSize: 12,
            }}
          >
            Loading weather...
          </div>
        ) : data ? (
          <>
            <div
              className="flex min-w-0 flex-1 flex-col justify-center"
              style={{ zIndex: 1, marginTop: -8 }}
            >
              <div
                className="font-medium"
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.8)',
                  textShadow,
                  fontFamily: MACOS_UI_FONT,
                }}
              >
                H: {Math.round(data.daily.temperature_2m_max[0])}°
              </div>
              <span
                className="truncate font-bold"
                style={{
                  fontSize: 14,
                  color: '#FFF',
                  maxWidth: 180,
                  textShadow,
                  fontFamily: MACOS_UI_FONT,
                }}
              >
                {label}
              </span>
              <div
                className="font-medium"
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.8)',
                  textShadow,
                  fontFamily: MACOS_UI_FONT,
                }}
              >
                L: {Math.round(data.daily.temperature_2m_min[0])}°
              </div>
            </div>

            <div className="flex shrink-0 items-center" style={{ marginTop: -8 }}>
              <span
                className="font-light leading-none"
                style={{
                  fontSize: 64,
                  letterSpacing: '-0.04em',
                  color: '#FFF',
                  textShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  fontFamily: MACOS_UI_FONT,
                }}
              >
                {Math.round(data.current.temperature_2m)}°
              </span>
            </div>
          </>
        ) : null}
      </div>

      {showForecast && forecast.length > 0 ? (
        <div className="relative z-[1]">
          <div
            className="flex"
            style={{
              background:
                data?.current.is_day === 1
                  ? 'linear-gradient(180deg, rgba(100,140,180,0.7) 0%, rgba(80,120,160,0.6) 100%)'
                  : 'linear-gradient(180deg, rgba(30,45,65,0.8) 0%, rgba(20,35,55,0.7) 100%)',
              borderTop: '1px solid rgba(255,255,255,0.15)',
              borderBottom: '1px solid rgba(0,0,0,0.15)',
            }}
          >
            {forecast.map((day) => (
              <div key={day.dayLabel} className="flex-1 py-1 text-center">
                <span
                  className="font-bold tracking-wide"
                  style={{
                    fontSize: 11,
                    color: '#FFF',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    fontFamily: MACOS_UI_FONT,
                  }}
                >
                  {day.dayLabel}
                </span>
              </div>
            ))}
          </div>

          <div
            className="flex"
            style={{
              background:
                data?.current.is_day === 1
                  ? 'linear-gradient(180deg, rgba(50,60,75,0.85) 0%, rgba(35,45,55,0.9) 100%)'
                  : 'linear-gradient(180deg, rgba(15,22,35,0.9) 0%, rgba(10,16,28,0.95) 100%)',
            }}
          >
            {forecast.map((day) => (
              <div
                key={`${day.dayLabel}-${day.tempHigh}`}
                className="flex flex-1 flex-col items-center gap-1 py-2"
              >
                <span style={{ fontSize: 24, lineHeight: 1 }}>
                  {getWeatherEmoji(day.weatherCode, true)}
                </span>
                <span
                  className="font-semibold"
                  style={{
                    fontSize: 16,
                    color: 'rgba(255,255,255,0.85)',
                    fontFamily: MACOS_UI_FONT,
                  }}
                >
                  {day.tempHigh}°
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </MacOSDashboardSurface>
  );
}

