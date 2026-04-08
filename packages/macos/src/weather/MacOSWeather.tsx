'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildCacheKey,
  buildProxyUrl,
  fetchJsonWithCache,
  registerWidget,
  type WidgetComponentProps,
} from '@firstform/campus-hub-widget-sdk';
import MacOSWeatherOptions from './MacOSWeatherOptions';
import { MACOS_UI_FONT } from '../shared/ui';

interface WeatherConfig {
  location?: string;
  units?: 'metric' | 'imperial';
  showForecast?: boolean;
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

export default function MacOSWeather({ config }: WidgetComponentProps) {
  const weatherConfig = (config ?? {}) as WeatherConfig;
  const location = weatherConfig.location?.trim() || 'San Francisco';
  const units = weatherConfig.units ?? 'metric';
  const showForecast = weatherConfig.showForecast ?? true;

  const [label, setLabel] = useState(location);
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
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
          setData(forecast);
          setLabel(nextLabel);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error ? nextError.message : 'Weather unavailable',
          );
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();
    const refresh = window.setInterval(run, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(refresh);
    };
  }, [location, units]);

  const gradient = useMemo(() => {
    if (!data) return 'linear-gradient(180deg, #5A8AAF 0%, #8BAFC5 40%, #B0C8D8 100%)';
    return getWeatherGradient(data.current.weather_code, data.current.is_day === 1);
  }, [data]);

  const forecast = useMemo(
    () =>
      data
        ? data.daily.time.slice(1, 7).map((dateValue, index) => ({
            dayLabel: new Date(dateValue)
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
      <div
        className="flex h-full min-h-0 items-center justify-center rounded-[20px] px-4 text-center"
        style={{
          background:
            'linear-gradient(180deg, rgba(50,50,50,0.8) 0%, rgba(25,25,25,0.85) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow:
            '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.72)',
          fontFamily: MACOS_UI_FONT,
          fontSize: 12,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px]"
      style={{
        background:
          'linear-gradient(180deg, rgba(50,50,50,0.8) 0%, rgba(25,25,25,0.85) 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow:
          '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="relative flex flex-1 px-3 py-3"
        style={{ background: gradient }}
      >
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
        <div>
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
    </div>
  );
}

registerWidget({
  type: 'macos-weather',
  name: 'Dashboard Weather',
  description: 'Classic dashboard weather forecast',
  icon: 'weather',
  minW: 2,
  minH: 2,
  defaultW: 3,
  defaultH: 3,
  component: MacOSWeather,
  OptionsComponent: MacOSWeatherOptions,
  tags: ['retro', 'environment'],
  defaultProps: {
    location: 'San Francisco',
    units: 'metric',
    showForecast: true,
  },
});
